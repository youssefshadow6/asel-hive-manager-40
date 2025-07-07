-- Update RLS policies for multi-account data isolation
-- All tables should only allow users to access their own data

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on raw_materials" ON public.raw_materials;
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all operations on customer_transactions" ON public.customer_transactions;
DROP POLICY IF EXISTS "Allow all operations on supplier_transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Allow all operations on sales_records" ON public.sales_records;
DROP POLICY IF EXISTS "Allow all operations on production_records" ON public.production_records;
DROP POLICY IF EXISTS "Allow all operations on production_materials" ON public.production_materials;
DROP POLICY IF EXISTS "Allow all operations on product_bom" ON public.product_bom;
DROP POLICY IF EXISTS "Allow all operations on stock_movements" ON public.stock_movements;

-- Add user_id column to tables that don't have it
ALTER TABLE public.raw_materials ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.sales_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.production_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.product_bom ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Get the first profile ID to assign existing data to (demo purposes)
DO $$
DECLARE
    first_profile_id UUID;
BEGIN
    SELECT id INTO first_profile_id FROM public.profiles LIMIT 1;
    
    IF first_profile_id IS NOT NULL THEN
        -- Update existing data to assign to first profile
        UPDATE public.raw_materials SET user_id = first_profile_id WHERE user_id IS NULL;
        UPDATE public.products SET user_id = first_profile_id WHERE user_id IS NULL;
        UPDATE public.customers SET user_id = first_profile_id WHERE user_id IS NULL;
        UPDATE public.suppliers SET user_id = first_profile_id WHERE user_id IS NULL;
        UPDATE public.sales_records SET user_id = first_profile_id WHERE user_id IS NULL;
        UPDATE public.production_records SET user_id = first_profile_id WHERE user_id IS NULL;
        UPDATE public.product_bom SET user_id = first_profile_id WHERE user_id IS NULL;
        UPDATE public.stock_movements SET user_id = first_profile_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Make user_id NOT NULL after updating existing data
ALTER TABLE public.raw_materials ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.customers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.suppliers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sales_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.production_records ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.product_bom ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.stock_movements ALTER COLUMN user_id SET NOT NULL;

-- Create new RLS policies that restrict access to user's own data
-- Raw Materials
CREATE POLICY "Users can manage their own raw materials" ON public.raw_materials
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products
CREATE POLICY "Users can manage their own products" ON public.products
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Customers
CREATE POLICY "Users can manage their own customers" ON public.customers
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Suppliers
CREATE POLICY "Users can manage their own suppliers" ON public.suppliers
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Customer Transactions
CREATE POLICY "Users can manage their own customer transactions" ON public.customer_transactions
FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.customers WHERE id = customer_id)
) WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.customers WHERE id = customer_id)
);

-- Supplier Transactions
CREATE POLICY "Users can manage their own supplier transactions" ON public.supplier_transactions
FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.suppliers WHERE id = supplier_id)
) WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.suppliers WHERE id = supplier_id)
);

-- Sales Records
CREATE POLICY "Users can manage their own sales records" ON public.sales_records
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Production Records
CREATE POLICY "Users can manage their own production records" ON public.production_records
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Production Materials
CREATE POLICY "Users can manage their own production materials" ON public.production_materials
FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.production_records WHERE id = production_record_id)
) WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.production_records WHERE id = production_record_id)
);

-- Product BOM
CREATE POLICY "Users can manage their own product BOM" ON public.product_bom
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stock Movements
CREATE POLICY "Users can manage their own stock movements" ON public.stock_movements
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id
CREATE TRIGGER set_user_id_raw_materials
  BEFORE INSERT ON public.raw_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_user_id_products
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_user_id_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_user_id_suppliers
  BEFORE INSERT ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_user_id_sales_records
  BEFORE INSERT ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_user_id_production_records
  BEFORE INSERT ON public.production_records
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_user_id_product_bom
  BEFORE INSERT ON public.product_bom
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE TRIGGER set_user_id_stock_movements
  BEFORE INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();