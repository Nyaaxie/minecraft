-- 1. Secure Purchase RPC Function
CREATE OR REPLACE FUNCTION purchase_shop_item(
    p_item_id UUID,
    p_buyer_id UUID,
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS to manage stock and transactions safely
AS $$
DECLARE
    v_item RECORD;
    v_transaction_id UUID;
    v_total_price NUMERIC;
BEGIN
    -- 1. Lock and fetch item details
    SELECT i.*, s.owner_id INTO v_item
    FROM shop_items i
    JOIN player_shops s ON i.shop_id = s.id
    WHERE i.id = p_item_id
    FOR UPDATE;

    -- 2. Validate
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    IF v_item.quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock';
    END IF;

    IF v_item.owner_id = p_buyer_id THEN
        RAISE EXCEPTION 'You cannot buy from your own shop';
    END IF;

    -- 3. Calculate price
    v_total_price := v_item.price * p_quantity;

    -- 4. Decrement stock
    UPDATE shop_items
    SET quantity = quantity - p_quantity
    WHERE id = p_item_id;

    -- 5. Create transaction record
    INSERT INTO shop_transactions (
        shop_item_id, buyer_id, seller_id, price, currency, quantity
    )
    VALUES (
        p_item_id, p_buyer_id, v_item.owner_id, v_total_price, v_item.currency, p_quantity
    )
    RETURNING id INTO v_transaction_id;

    -- 6. Notify seller
    INSERT INTO notifications (
        profile_id, title, message, type, link
    )
    VALUES (
        v_item.owner_id,
        'Item Sold!',
        'You sold ' || p_quantity || 'x ' || v_item.item_name || ' for ' || v_total_price || ' ' || v_item.currency || '.',
        'system',
        '/shops/' || v_item.shop_id || '/orders'
    );

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'new_quantity', v_item.quantity - p_quantity
    );
END;
$$;

-- 2. Update RLS for shop_transactions
DROP POLICY IF EXISTS "Buyers can view their own transactions" ON shop_transactions;
DROP POLICY IF EXISTS "Sellers can view their own transactions" ON shop_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON shop_transactions;
DROP POLICY IF EXISTS "view_own_transactions" ON shop_transactions;

CREATE POLICY "view_own_transactions" ON shop_transactions 
FOR SELECT USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
