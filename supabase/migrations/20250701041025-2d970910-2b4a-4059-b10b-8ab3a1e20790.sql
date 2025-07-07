
-- Create enum types for better data consistency
CREATE TYPE product_size AS ENUM ('100g', '250g', '500g', '1kg', '2kg');
CREATE TYPE material_unit AS ENUM ('kg', 'pieces', 'sacks', 'liters', 'grams');

-- Raw Materials table
CREATE TABLE public.raw_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  unit material_unit NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  supplier TEXT,
  last_received TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Finished Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  size product_size NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  production_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Production Records table
CREATE TABLE public.production_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  production_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Production Materials (junction table for tracking which materials were used)
CREATE TABLE public.production_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_record_id UUID REFERENCES public.production_records(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.raw_materials(id) NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  cost_at_time DECIMAL(10,2) DEFAULT 0
);

-- Sales Records table
CREATE TABLE public.sales_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock Movements table (for audit trail)
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.raw_materials(id),
  product_id UUID REFERENCES public.products(id),
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
  quantity DECIMAL(10,2) NOT NULL,
  reference_type TEXT, -- 'purchase', 'production', 'sale', 'adjustment'
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - we'll refine for multi-user later)
CREATE POLICY "Allow all operations on raw_materials" ON public.raw_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on production_records" ON public.production_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on production_materials" ON public.production_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sales_records" ON public.sales_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_movements" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_raw_materials_name ON public.raw_materials(name);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_production_records_date ON public.production_records(production_date);
CREATE INDEX idx_sales_records_date ON public.sales_records(sale_date);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(created_at);

-- Insert initial data to match your current system
INSERT INTO public.raw_materials (name, name_ar, unit, current_stock, min_threshold) VALUES
('Raw Honey', 'عسل خام', 'kg', 50, 10),
('Sage Herbs', 'أعشاب المرمية', 'sacks', 8, 2),
('Glass Jars 500g', 'برطمانات زجاج ٥٠٠ جم', 'pieces', 120, 20),
('Lids', 'أغطية', 'pieces', 100, 20),
('Labels', 'ملصقات', 'pieces', 80, 15);

INSERT INTO public.products (name, name_ar, size, current_stock, min_threshold, selling_price) VALUES
('Honey Jar 500g', 'برطمان عسل ٥٠٠ جم', '500g', 25, 5, 25.00),
('Sage Tea Blend', 'خليط شاي المرمية', '100g', 15, 3, 12.00);

-- Create function to automatically update stock movements
CREATE OR REPLACE FUNCTION public.log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'raw_materials' THEN
    IF OLD.current_stock != NEW.current_stock THEN
      INSERT INTO public.stock_movements (
        material_id, 
        movement_type, 
        quantity, 
        reference_type, 
        notes
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.current_stock > OLD.current_stock THEN 'in' ELSE 'out' END,
        ABS(NEW.current_stock - OLD.current_stock),
        'adjustment',
        'Stock level changed from ' || OLD.current_stock || ' to ' || NEW.current_stock
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'products' THEN
    IF OLD.current_stock != NEW.current_stock THEN
      INSERT INTO public.stock_movements (
        product_id, 
        movement_type, 
        quantity, 
        reference_type, 
        notes
      ) VALUES (
        NEW.id,
        CASE WHEN NEW.current_stock > OLD.current_stock THEN 'in' ELSE 'out' END,
        ABS(NEW.current_stock - OLD.current_stock),
        'adjustment',
        'Stock level changed from ' || OLD.current_stock || ' to ' || NEW.current_stock
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stock movement logging
CREATE TRIGGER raw_materials_stock_movement_trigger
  AFTER UPDATE ON public.raw_materials
  FOR EACH ROW EXECUTE FUNCTION public.log_stock_movement();

CREATE TRIGGER products_stock_movement_trigger
  AFTER UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_stock_movement();
