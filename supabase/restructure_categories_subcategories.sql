1 -- 1. Drop existing constraints first to allow data modification
2
ALTER TABLE shop_items
DROP CONSTRAINT IF EXISTS shop_items_category_id_fkey;

3
ALTER TABLE shop_items
DROP CONSTRAINT IF EXISTS shop_items_sub_category_id_fkey;

4 5 -- 2. Create new tables
6
CREATE TABLE IF NOT EXISTS categories (
    7 id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    8 name TEXT NOT NULL UNIQUE,
    9 description TEXT,
    10 display_order INTEGER DEFAULT 0,
    11 created_at TIMESTAMPTZ DEFAULT now(),
    12 updated_at TIMESTAMPTZ DEFAULT now() 13
);

14 15
CREATE TABLE IF NOT EXISTS sub_categories (
    16 id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    17 category_id UUID REFERENCES categories (id) ON DELETE CASCADE NOT NULL,
    18 name TEXT NOT NULL,
    19 description TEXT,
    20 display_order INTEGER DEFAULT 0,
    21 created_at TIMESTAMPTZ DEFAULT now(),
    22 updated_at TIMESTAMPTZ DEFAULT now(),
    23 UNIQUE (category_id, name) 24
);

25 26 -- 3. Ensure columns exist on shop_items
27
ALTER TABLE shop_items
ADD COLUMN IF NOT EXISTS sub_category_id UUID;

28 29 -- 4. Migrate Data from shop_categories to categories
30
INSERT INTO
    categories (
        name,
        description,
        created_at,
        updated_at
    ) 31
SELECT
    name,
    description,
    created_at,
    updated_at 32
FROM
    shop_categories 33 ON CONFLICT (name) DO NOTHING;

34 35 -- 5. Update existing shop_items to point to new categories
36 -- We match by name to ensure IDs are correctly mapped
37
UPDATE shop_items si 38
SET
    category_id = c.id 39
FROM
    categories c 40
    JOIN shop_categories sc ON sc.name = c.name 41
WHERE
    si.category_id = sc.id;

42 43 -- 6. Now add the new foreign key constraints safely
44
ALTER TABLE shop_items 45
ADD CONSTRAINT shop_items_category_id_fkey 46 FOREIGN KEY (category_id) 47 REFERENCES categories (id) 48 ON DELETE SET NULL;

49 50
ALTER TABLE shop_items 51
ADD CONSTRAINT shop_items_sub_category_id_fkey 52 FOREIGN KEY (sub_category_id) 53 REFERENCES sub_categories (id) 54 ON DELETE SET NULL;

55 56 -- 7. Security and Policies
57
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

58 ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

59 60
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;

61 CREATE POLICY "Categories are viewable by everyone" ON categories FOR
SELECT USING (true);

62 63
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

64 CREATE POLICY "Admins can manage categories" ON categories FOR ALL 65 USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

66 67
DROP POLICY IF EXISTS "Sub-categories are viewable by everyone" ON sub_categories;

68 CREATE POLICY "Sub-categories are viewable by everyone" ON sub_categories FOR
SELECT USING (true);

69 70
DROP POLICY IF EXISTS "Admins can manage sub-categories" ON sub_categories;

71 CREATE POLICY "Admins can manage sub-categories" ON sub_categories FOR ALL 72 USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);