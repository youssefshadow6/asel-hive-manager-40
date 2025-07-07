
-- Change product size from ENUM to TEXT to allow flexible custom sizes
ALTER TABLE public.products 
ALTER COLUMN size TYPE TEXT;

-- Drop the enum type since we no longer need it
DROP TYPE IF EXISTS product_size;

-- Add a check to ensure size is not empty
ALTER TABLE public.products 
ADD CONSTRAINT check_size_not_empty CHECK (size IS NOT NULL AND trim(size) != '');
