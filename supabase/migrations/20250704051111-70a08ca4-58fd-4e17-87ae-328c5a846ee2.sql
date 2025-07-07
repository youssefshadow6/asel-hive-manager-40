-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info TEXT,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier transactions table
CREATE TABLE public.supplier_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'purchase', 'payment'
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference raw material purchases or other records
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer transactions table
CREATE TABLE public.customer_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'sale', 'payment'
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference sales records
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add supplier_id to raw_materials table
ALTER TABLE public.raw_materials ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);

-- Add customer_id and payment_status to sales_records table
ALTER TABLE public.sales_records ADD COLUMN customer_id UUID REFERENCES public.customers(id);
ALTER TABLE public.sales_records ADD COLUMN payment_status TEXT DEFAULT 'paid';
ALTER TABLE public.sales_records ADD COLUMN amount_paid NUMERIC DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Allow all operations on suppliers" 
ON public.suppliers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for customers
CREATE POLICY "Allow all operations on customers" 
ON public.customers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for supplier transactions
CREATE POLICY "Allow all operations on supplier_transactions" 
ON public.supplier_transactions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for customer transactions
CREATE POLICY "Allow all operations on customer_transactions" 
ON public.customer_transactions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_supplier_transactions_supplier_id ON public.supplier_transactions(supplier_id);
CREATE INDEX idx_customer_transactions_customer_id ON public.customer_transactions(customer_id);
CREATE INDEX idx_sales_records_customer_id ON public.sales_records(customer_id);
CREATE INDEX idx_raw_materials_supplier_id ON public.raw_materials(supplier_id);

-- Create function to update supplier balance
CREATE OR REPLACE FUNCTION public.update_supplier_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.suppliers 
    SET current_balance = current_balance + CASE 
      WHEN NEW.transaction_type = 'purchase' THEN NEW.amount 
      WHEN NEW.transaction_type = 'payment' THEN -NEW.amount 
      ELSE 0 
    END,
    updated_at = now()
    WHERE id = NEW.supplier_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update customer balance
CREATE OR REPLACE FUNCTION public.update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.customers 
    SET current_balance = current_balance + CASE 
      WHEN NEW.transaction_type = 'sale' THEN NEW.amount 
      WHEN NEW.transaction_type = 'payment' THEN -NEW.amount 
      ELSE 0 
    END,
    updated_at = now()
    WHERE id = NEW.customer_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic balance updates
CREATE TRIGGER update_supplier_balance_trigger
  AFTER INSERT ON public.supplier_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_balance();

CREATE TRIGGER update_customer_balance_trigger
  AFTER INSERT ON public.customer_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_customer_balance();