-- Fix the reset password function to use the correct password
CREATE OR REPLACE FUNCTION public.reset_user_data(admin_password TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  correct_password TEXT := 'sarah2013'; -- Exact password without any extra characters
  user_uuid UUID;
BEGIN
  -- Verify password (case-sensitive, exact match)
  IF admin_password != correct_password THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Invalid password. Data reset aborted. Please check the password and try again.'
    );
  END IF;
  
  -- Get current user ID
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'User not authenticated. Please log in and try again.'
    );
  END IF;
  
  -- Delete all user data in correct order (respecting foreign key constraints)
  -- This preserves system structure but removes all user-entered data
  
  -- Delete production materials first (depends on production_records)
  DELETE FROM public.production_materials WHERE production_record_id IN (
    SELECT id FROM public.production_records WHERE user_id = user_uuid
  );
  
  -- Delete product BOM entries
  DELETE FROM public.product_bom WHERE user_id = user_uuid;
  
  -- Delete stock movements
  DELETE FROM public.stock_movements WHERE user_id = user_uuid;
  
  -- Delete sales records
  DELETE FROM public.sales_records WHERE user_id = user_uuid;
  
  -- Delete production records
  DELETE FROM public.production_records WHERE user_id = user_uuid;
  
  -- Delete customer transactions
  DELETE FROM public.customer_transactions WHERE customer_id IN (
    SELECT id FROM public.customers WHERE user_id = user_uuid
  );
  
  -- Delete supplier transactions
  DELETE FROM public.supplier_transactions WHERE supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = user_uuid
  );
  
  -- Delete customers
  DELETE FROM public.customers WHERE user_id = user_uuid;
  
  -- Delete suppliers
  DELETE FROM public.suppliers WHERE user_id = user_uuid;
  
  -- Delete products
  DELETE FROM public.products WHERE user_id = user_uuid;
  
  -- Delete raw materials
  DELETE FROM public.raw_materials WHERE user_id = user_uuid;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'All data has been reset successfully. Your system structure and features remain intact.'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Error occurred during data reset: ' || SQLERRM
    );
END;
$$;