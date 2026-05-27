-- Drop orders table if it exists
DROP TABLE IF EXISTS public.orders CASCADE;

-- Drop secure_purchase related table if exists (assuming a name based on the order system)
DROP TABLE IF EXISTS public.purchase_requests CASCADE;
