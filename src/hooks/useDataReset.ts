
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DataResetResponse {
  success: boolean;
  message: string;
}

export const useDataReset = () => {
  const [loading, setLoading] = useState(false);

  const resetAllData = async (password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('reset_user_data', {
        admin_password: password
      });

      if (error) throw error;

      // Type-cast the Json response to our expected interface
      const response = data as unknown as DataResetResponse;

      if (response?.success) {
        toast({
          title: 'Success',
          description: response.message
        });
        return { success: true, message: response.message };
      } else {
        toast({
          title: 'Error',
          description: response?.message || 'Failed to reset data',
          variant: 'destructive'
        });
        return { success: false, message: response?.message || 'Failed to reset data' };
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset data',
        variant: 'destructive'
      });
      return { success: false, message: 'Failed to reset data' };
    } finally {
      setLoading(false);
    }
  };

  return {
    resetAllData,
    loading
  };
};
