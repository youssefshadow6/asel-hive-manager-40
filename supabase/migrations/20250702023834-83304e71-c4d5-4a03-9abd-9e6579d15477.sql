
-- Create a table to store Bill of Materials (BOM) for each product
CREATE TABLE public.product_bom (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES public.raw_materials(id) NOT NULL,
  quantity_per_unit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, material_id)
);

-- Enable RLS on the new table
ALTER TABLE public.product_bom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on product_bom" ON public.product_bom FOR ALL USING (true) WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_product_bom_product_id ON public.product_bom(product_id);
CREATE INDEX idx_product_bom_material_id ON public.product_bom(material_id);

-- Update sales_records to allow custom sale dates (already exists but ensuring it's flexible)
-- No changes needed to sales_records as it already has sale_date field

-- Add some sample BOM data for existing products
INSERT INTO public.product_bom (product_id, material_id, quantity_per_unit) 
SELECT 
  p.id as product_id,
  rm.id as material_id,
  CASE 
    WHEN p.name = 'Honey Jar 500g' AND rm.name = 'Raw Honey' THEN 0.5
    WHEN p.name = 'Honey Jar 500g' AND rm.name = 'Glass Jars 500g' THEN 1
    WHEN p.name = 'Honey Jar 500g' AND rm.name = 'Lids' THEN 1
    WHEN p.name = 'Sage Tea Blend' AND rm.name = 'Sage Herbs' THEN 0.1
    ELSE 0
  END as quantity_per_unit
FROM public.products p
CROSS JOIN public.raw_materials rm
WHERE (p.name = 'Honey Jar 500g' AND rm.name IN ('Raw Honey', 'Glass Jars 500g', 'Lids'))
   OR (p.name = 'Sage Tea Blend' AND rm.name = 'Sage Herbs')
   AND NOT EXISTS (
     SELECT 1 FROM public.product_bom pb 
     WHERE pb.product_id = p.id AND pb.material_id = rm.id
   );
