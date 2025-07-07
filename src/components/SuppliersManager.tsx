import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Plus, DollarSign, Trash2, Download } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatCurrency } from "@/utils/currency";
import { formatGregorianDate } from "@/utils/dateUtils";
import * as XLSX from 'xlsx';

interface SuppliersManagerProps {
  language: 'en' | 'ar';
}

export const SuppliersManager = ({ language }: SuppliersManagerProps) => {
  const { suppliers, loading, addSupplier, deleteSupplier, recordPayment } = useSuppliers();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; supplier: any }>({ open: false, supplier: null });
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_info: '' });
  const [paymentAmount, setPaymentAmount] = useState('');

  const translations = {
    en: {
      suppliers: "Suppliers",
      addSupplier: "Add Supplier",
      supplierName: "Supplier Name",
      contactInfo: "Contact Info",
      currentBalance: "Current Balance",
      actions: "Actions",
      recordPayment: "Record Payment",
      paymentAmount: "Payment Amount",
      save: "Save",
      cancel: "Cancel",
      pay: "Pay",
      delete: "Delete",
      search: "Search suppliers...",
      export: "Export",
      confirmDelete: "Are you sure you want to delete this supplier?",
      deleteWarning: "This will permanently remove the supplier and all related data."
    },
    ar: {
      suppliers: "الموردين",
      addSupplier: "إضافة مورد",
      supplierName: "اسم المورد",
      contactInfo: "معلومات الاتصال",
      currentBalance: "الرصيد الحالي",
      actions: "الإجراءات",
      recordPayment: "تسجيل دفعة",
      paymentAmount: "مبلغ الدفعة",
      save: "حفظ",
      cancel: "إلغاء",
      pay: "دفع",
      delete: "حذف",
      search: "البحث عن الموردين...",
      export: "تصدير",
      confirmDelete: "هل أنت متأكد من حذف هذا المورد؟",
      deleteWarning: "سيؤدي هذا إلى إزالة المورد نهائياً وجميع البيانات المرتبطة به."
    }
  };

  const t = translations[language];

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplier = async () => {
    if (!newSupplier.name) return;
    
    try {
      await addSupplier(newSupplier);
      setNewSupplier({ name: '', contact_info: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedSupplier || !paymentAmount) return;
    
    try {
      await recordPayment(selectedSupplier.id, parseFloat(paymentAmount));
      setPaymentAmount('');
      setShowPaymentDialog(false);
      setSelectedSupplier(null);
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteDialog.supplier) return;
    
    try {
      await deleteSupplier(deleteDialog.supplier.id);
      setDeleteDialog({ open: false, supplier: null });
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const exportToExcel = () => {
    const data = filteredSuppliers.map(supplier => ({
      [t.supplierName]: supplier.name,
      [t.contactInfo]: supplier.contact_info || '',
      [t.currentBalance]: supplier.current_balance,
      'Created': formatGregorianDate(supplier.created_at, language)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    XLSX.writeFile(wb, `suppliers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {t.suppliers}
            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t.export}
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t.addSupplier}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.addSupplier}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">{t.supplierName}</Label>
                      <Input
                        id="name"
                        value={newSupplier.name}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact">{t.contactInfo}</Label>
                      <Input
                        id="contact"
                        value={newSupplier.contact_info}
                        onChange={(e) => setNewSupplier(prev => ({ ...prev, contact_info: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        {t.cancel}
                      </Button>
                      <Button onClick={handleAddSupplier}>
                        {t.save}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.supplierName}</TableHead>
                <TableHead>{t.contactInfo}</TableHead>
                <TableHead>{t.currentBalance}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_info || '-'}</TableCell>
                  <TableCell>
                    <span className={supplier.current_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(supplier.current_balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setShowPaymentDialog(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        {t.pay}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ open: true, supplier })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.recordPayment} - {selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment">{t.paymentAmount}</Label>
              <Input
                id="payment"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleRecordPayment}>
                {t.pay}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, supplier: null })}
        onConfirm={handleDeleteSupplier}
        title={deleteDialog.supplier?.name || ''}
        description={t.deleteWarning}
        language={language}
      />
    </div>
  );
};