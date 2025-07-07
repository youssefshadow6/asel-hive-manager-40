
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/hooks/useCustomers";

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded?: (customer: any) => void;
  language: 'en' | 'ar';
}

export const AddCustomerDialog = ({ 
  open, 
  onOpenChange, 
  onCustomerAdded,
  language 
}: AddCustomerDialogProps) => {
  const { addCustomer } = useCustomers();
  const [newCustomer, setNewCustomer] = useState({ name: '', contact_info: '' });
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      addCustomer: "Add New Customer",
      customerName: "Customer Name",
      contactInfo: "Contact Info",
      save: "Save",
      cancel: "Cancel"
    },
    ar: {
      addCustomer: "إضافة عميل جديد",
      customerName: "اسم العميل",
      contactInfo: "معلومات الاتصال",
      save: "حفظ",
      cancel: "إلغاء"
    }
  };

  const t = translations[language];

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    
    setLoading(true);
    try {
      const customer = await addCustomer(newCustomer);
      setNewCustomer({ name: '', contact_info: '' });
      onOpenChange(false);
      onCustomerAdded?.(customer);
    } catch (error) {
      console.error('Error adding customer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.addCustomer}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t.customerName}</Label>
            <Input
              id="name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t.customerName}
            />
          </div>
          <div>
            <Label htmlFor="contact">{t.contactInfo}</Label>
            <Input
              id="contact"
              value={newCustomer.contact_info}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, contact_info: e.target.value }))}
              placeholder={t.contactInfo}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t.cancel}
            </Button>
            <Button 
              onClick={handleAddCustomer}
              disabled={loading || !newCustomer.name.trim()}
            >
              {loading ? 'Saving...' : t.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
