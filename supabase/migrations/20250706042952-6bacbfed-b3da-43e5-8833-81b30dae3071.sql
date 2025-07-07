
-- Add a function to securely reset all user data with password protection
CREATE OR REPLACE FUNCTION public.reset_user_data(admin_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  correct_password TEXT := 'admin123'; -- This should be moved to Supabase secrets in production
  user_uuid UUID;
BEGIN
  -- Verify password
  IF admin_password != correct_password THEN
    RETURN json_build_object('success', false, 'message', 'Invalid password. Data reset aborted.');
  END IF;
  
  -- Get current user ID
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated.');
  END IF;
  
  -- Delete all user data in correct order (respecting foreign key constraints)
  DELETE FROM public.production_materials WHERE production_record_id IN (
    SELECT id FROM public.production_records WHERE user_id = user_uuid
  );
  
  DELETE FROM public.product_bom WHERE user_id = user_uuid;
  DELETE FROM public.stock_movements WHERE user_id = user_uuid;
  DELETE FROM public.sales_records WHERE user_id = user_uuid;
  DELETE FROM public.production_records WHERE user_id = user_uuid;
  DELETE FROM public.customer_transactions WHERE customer_id IN (
    SELECT id FROM public.customers WHERE user_id = user_uuid
  );
  DELETE FROM public.supplier_transactions WHERE supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = user_uuid
  );
  DELETE FROM public.customers WHERE user_id = user_uuid;
  DELETE FROM public.suppliers WHERE user_id = user_uuid;
  DELETE FROM public.products WHERE user_id = user_uuid;
  DELETE FROM public.raw_materials WHERE user_id = user_uuid;
  
  RETURN json_build_object('success', true, 'message', 'All data has been reset successfully.');
END;
$$;

-- Add a function to get customer purchase analytics
CREATE OR REPLACE FUNCTION public.get_customer_analytics(customer_uuid UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  analytics_data json;
  most_active_days text[];
  most_purchased_products json[];
  next_order_prediction json;
  total_purchases numeric;
  avg_days_between_orders numeric;
  last_order_date date;
BEGIN
  -- Get current user ID
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated.');
  END IF;
  
  -- Verify customer belongs to user
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = customer_uuid AND user_id = user_uuid) THEN
    RETURN json_build_object('error', 'Customer not found or access denied.');
  END IF;
  
  -- Get most active purchase days (day of week)
  SELECT array_agg(day_name ORDER BY purchase_count DESC)
  INTO most_active_days
  FROM (
    SELECT 
      to_char(sale_date, 'Day') as day_name,
      COUNT(*) as purchase_count
    FROM public.sales_records 
    WHERE customer_id = customer_uuid AND user_id = user_uuid
    GROUP BY to_char(sale_date, 'Day'), EXTRACT(DOW FROM sale_date)
    ORDER BY purchase_count DESC
    LIMIT 3
  ) days;
  
  -- Get most frequently purchased products
  SELECT array_agg(
    json_build_object(
      'product_name', p.name,
      'product_name_ar', p.name_ar,
      'total_quantity', prod_stats.total_qty,
      'total_amount', prod_stats.total_amount,
      'purchase_count', prod_stats.purchase_count
    ) ORDER BY prod_stats.total_qty DESC
  )
  INTO most_purchased_products
  FROM (
    SELECT 
      sr.product_id,
      SUM(sr.quantity) as total_qty,
      SUM(sr.total_amount) as total_amount,
      COUNT(*) as purchase_count
    FROM public.sales_records sr
    WHERE sr.customer_id = customer_uuid AND sr.user_id = user_uuid
    GROUP BY sr.product_id
    ORDER BY total_qty DESC
    LIMIT 5
  ) prod_stats
  JOIN public.products p ON p.id = prod_stats.product_id;
  
  -- Calculate prediction for next order
  SELECT 
    COUNT(*) as total_orders,
    AVG(EXTRACT(EPOCH FROM (sale_date - LAG(sale_date) OVER (ORDER BY sale_date))) / 86400) as avg_days,
    MAX(sale_date) as last_order
  INTO total_purchases, avg_days_between_orders, last_order_date
  FROM public.sales_records
  WHERE customer_id = customer_uuid AND user_id = user_uuid;
  
  -- Build next order prediction
  IF avg_days_between_orders IS NOT NULL AND last_order_date IS NOT NULL THEN
    next_order_prediction := json_build_object(
      'predicted_date', last_order_date + INTERVAL '1 day' * COALESCE(avg_days_between_orders, 30),
      'confidence', CASE 
        WHEN total_purchases >= 5 THEN 'High'
        WHEN total_purchases >= 3 THEN 'Medium' 
        ELSE 'Low'
      END,
      'avg_days_between_orders', ROUND(avg_days_between_orders, 1)
    );
  ELSE
    next_order_prediction := json_build_object(
      'predicted_date', null,
      'confidence', 'Insufficient data',
      'avg_days_between_orders', null
    );
  END IF;
  
  -- Build final analytics
  analytics_data := json_build_object(
    'most_active_days', COALESCE(most_active_days, ARRAY[]::text[]),
    'most_purchased_products', COALESCE(most_purchased_products, ARRAY[]::json[]),
    'next_order_prediction', next_order_prediction,
    'total_purchases', COALESCE(total_purchases, 0),
    'total_spent', (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM public.sales_records 
      WHERE customer_id = customer_uuid AND user_id = user_uuid
    )
  );
  
  RETURN analytics_data;
END;
$$;
