-- Create material receipts table for purchase history and dynamic pricing
CREATE TABLE public.material_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  quantity_received NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  shipping_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC NOT NULL,
  received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own material receipts"
ON public.material_receipts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger to set user_id automatically
CREATE TRIGGER set_user_id_material_receipts
  BEFORE INSERT ON public.material_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- Create index for better performance
CREATE INDEX idx_material_receipts_material_id ON public.material_receipts(material_id);
CREATE INDEX idx_material_receipts_received_date ON public.material_receipts(received_date);