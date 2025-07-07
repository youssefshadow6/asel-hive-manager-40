import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useRawMaterials } from "@/hooks/useRawMaterials";
import { useSuppliers } from "@/hooks/useSuppliers";
import { toast } from "@/hooks/use-toast";
import type { Database } from '@/integrations/supabase/types';
import { formatCurrency } from "@/utils/currency";

interface RawMaterialsManagerProps {
  language: 'en' | 'ar';
}

type MaterialUnit = Database['public']['Enums']['material_unit'];
const materialUnits: MaterialUnit[] = ['kg', 'pieces', 'sacks', 'liters', 'grams'];

export const RawMaterialsManager = ({ language }: RawMaterialsManagerProps) => {
  const { materials, loading, addMaterial, receiveMaterial, updateMaterial, deleteMaterial } = useRawMaterials();
  const { suppliers, addSupplier } = useSuppliers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    name_ar: '',
    unit: 'kg' as MaterialUnit,
    min_threshold: 0,
    current_stock: 0,
    cost_per_unit: 0,
    shipping_cost: 0,
    total_cost: 0,
    supplier: '',
    supplier_id: ''
  });
  const [receiveQuantity, setReceiveQuantity] = useState(0);
  const [receiveTotalCost, setReceiveTotalCost] = useState(0);
  const [receiveShippingCost, setReceiveShippingCost] = useState(0);
  const [receiveUnitCost, setReceiveUnitCost] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; material: any }>({ open: false, material: null });

  const translations = {
    en: {
      rawMaterials: "Raw Materials",
      addMaterial: "Add New Material",
      receiveMaterial: "Receive Material",
      materialName: "Material Name (English)",
      materialNameAr: "Material Name (Arabic)",
      unit: "Unit",
      minThreshold: "Minimum Threshold",
      currentStock: "Current Stock",
      costPerUnit: "Cost per Unit (EGP)",
      supplier: "Supplier",
      lastReceived: "Last Received",
      lowStock: "Low Stock",
      actions: "Actions",
      receive: "Receive",
      add: "Add",
      cancel: "Cancel",
      quantity: "Quantity",
      save: "Save",
      materialAdded: "Material added successfully",
      materialReceived: "Material received successfully",
      loading: "Loading...",
      receiveCost: "Cost per Unit for this batch",
      totalCost: "Total Cost (all units)",
      shippingCost: "Shipping Cost",
      unitCostCalculated: "Calculated Unit Cost",
      delete: "Delete",
      selectSupplier: "Select Supplier",
      newSupplier: "New Supplier",
      enterSupplierName: "Enter supplier name"
    },
    ar: {
      rawMaterials: "المواد الخام",
      addMaterial: "إضافة مادة جديدة",
      receiveMaterial: "استلام مادة",
      materialName: "اسم المادة (بالإنجليزية)",
      materialNameAr: "اسم المادة (بالعربية)",
      unit: "الوحدة",
      minThreshold: "الحد الأدنى",
      currentStock: "المخزون الحالي",
      costPerUnit: "التكلفة لكل وحدة (ج.م)",
      supplier: "المورد",
      lastReceived: "آخر استلام",
      lowStock: "مخزون منخفض",
      actions: "الإجراءات",
      receive: "استلام",
      add: "إضافة",
      cancel: "إلغاء",
      quantity: "الكمية",
      save: "حفظ",
      materialAdded: "تم إضافة المادة بنجاح",
      materialReceived: "تم استلام المادة بنجاح",
      loading: "جاري التحميل...",
      receiveCost: "التكلفة لكل وحدة لهذه الدفعة",
      totalCost: "إجمالي التكلفة (جميع الوحدات)",
      shippingCost: "تكلفة الشحن",
      unitCostCalculated: "التكلفة المحسوبة للوحدة",
      delete: "حذف",
      selectSupplier: "اختر المورد",
      newSupplier: "مورد جديد",
      enterSupplierName: "أدخل اسم المورد"
    }
  };

  const t = translations[language];

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.name_ar || !newMaterial.unit) {
      toast({
        title: language === 'en' ? "Error" : "خطأ",
        description: language === 'en' ? "Please fill all required fields" : "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      let supplierId = newMaterial.supplier_id;
      
      // If "New Supplier" is selected and supplier name is provided
      if (newMaterial.supplier_id === 'new' && newMaterial.supplier) {
        const supplier = await addSupplier({
          name: newMaterial.supplier,
          contact_info: null
        });
        supplierId = supplier.id;
      }

      await addMaterial({
        name: newMaterial.name,
        name_ar: newMaterial.name_ar,
        unit: newMaterial.unit,
        current_stock: newMaterial.current_stock,
        min_threshold: newMaterial.min_threshold,
        cost_per_unit: newMaterial.cost_per_unit || 0,
        shipping_cost: newMaterial.shipping_cost || 0,
        total_cost: newMaterial.total_cost || 0,
        supplier: newMaterial.supplier,
        supplier_id: supplierId || null
      });
      
      setNewMaterial({
        name: '',
        name_ar: '',
        unit: 'kg',
        min_threshold: 0,
        current_stock: 0,
        cost_per_unit: 0,
        shipping_cost: 0,
        total_cost: 0,
        supplier: '',
        supplier_id: ''
      });
      setIsAddDialogOpen(false);
      
      toast({
        title: language === 'en' ? "Success" : "نجح",
        description: t.materialAdded
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleReceiveMaterial = async () => {
    if (!selectedMaterialId || receiveQuantity <= 0) return;

    try {
      await receiveMaterial(
        selectedMaterialId, 
        receiveQuantity,
        undefined, // supplier_id will be handled separately if needed
        receiveUnitCost > 0 ? receiveUnitCost : undefined,
        receiveShippingCost > 0 ? receiveShippingCost : undefined,
        receiveTotalCost > 0 ? receiveTotalCost : undefined
      );
      
      setReceiveQuantity(0);
      setReceiveTotalCost(0);
      setReceiveShippingCost(0);
      setReceiveUnitCost(0);
      setSelectedMaterialId(null);
      setIsReceiveDialogOpen(false);
      
      toast({
        title: language === 'en' ? "Success" : "نجح",
        description: t.materialReceived
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-amber-900 font-medium">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-900">{t.rawMaterials}</h2>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t.addMaterial}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.addMaterial}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t.materialName}</Label>
                <Input
                  id="name"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                  placeholder="Raw Honey"
                />
              </div>
              <div>
                <Label htmlFor="nameAr">{t.materialNameAr}</Label>
                <Input
                  id="nameAr"
                  value={newMaterial.name_ar}
                  onChange={(e) => setNewMaterial({...newMaterial, name_ar: e.target.value})}
                  placeholder="عسل خام"
                />
              </div>
              <div>
                <Label htmlFor="unit">{t.unit}</Label>
                <Select value={newMaterial.unit} onValueChange={(value: MaterialUnit) => setNewMaterial({...newMaterial, unit: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialUnits.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minThreshold">{t.minThreshold}</Label>
                <Input
                  id="minThreshold"
                  type="number"
                  value={newMaterial.min_threshold}
                  onChange={(e) => setNewMaterial({...newMaterial, min_threshold: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="currentStock">{t.currentStock}</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={newMaterial.current_stock}
                  onChange={(e) => setNewMaterial({...newMaterial, current_stock: Number(e.target.value)})}
                />
              </div>
                <div>
                  <Label htmlFor="costPerUnit">{t.costPerUnit}</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    value={newMaterial.cost_per_unit}
                    onChange={(e) => setNewMaterial({...newMaterial, cost_per_unit: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingCost">{t.shippingCost}</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    value={newMaterial.shipping_cost}
                    onChange={(e) => setNewMaterial({...newMaterial, shipping_cost: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="totalCost">{t.totalCost}</Label>
                  <Input
                    id="totalCost"
                    type="number"
                    step="0.01"
                    value={newMaterial.total_cost}
                    onChange={(e) => setNewMaterial({...newMaterial, total_cost: Number(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                {newMaterial.current_stock > 0 && newMaterial.total_cost > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t.unitCostCalculated}:</div>
                    <div className="font-bold text-amber-700">
                      {formatCurrency((newMaterial.total_cost + newMaterial.shipping_cost) / newMaterial.current_stock, language)}
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="supplier">{t.selectSupplier}</Label>
                  <Select 
                    value={newMaterial.supplier_id} 
                    onValueChange={(value) => setNewMaterial({...newMaterial, supplier_id: value, supplier: value === 'new' ? '' : suppliers.find(s => s.id === value)?.name || ''})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectSupplier} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t.newSupplier}</SelectItem>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newMaterial.supplier_id === 'new' && (
                  <div>
                    <Label htmlFor="supplierName">{t.enterSupplierName}</Label>
                    <Input
                      id="supplierName"
                      value={newMaterial.supplier}
                      onChange={(e) => setNewMaterial({...newMaterial, supplier: e.target.value})}
                      placeholder={t.enterSupplierName}
                    />
                  </div>
                )}
              <div className="flex space-x-2">
                <Button onClick={handleAddMaterial} className="flex-1 bg-amber-600 hover:bg-amber-700">
                  {t.add}
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  {t.cancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <Card key={material.id} className="border-amber-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-amber-900">
                    {language === 'en' ? material.name : material.name_ar}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? material.name_ar : material.name}
                  </p>
                </div>
                {material.current_stock <= material.min_threshold && (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{t.lowStock}</span>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t.currentStock}:</span>
                  <span className="font-bold text-amber-700">
                    {material.current_stock} {material.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t.costPerUnit}:</span>
                  <span className="text-sm">
                    {formatCurrency(material.cost_per_unit || 0, language)}
                  </span>
                </div>
                {material.last_received && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t.lastReceived}:</span>
                    <span className="text-sm">
                      {new Date(material.last_received).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                )}
                
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      setSelectedMaterialId(material.id);
                      setIsReceiveDialogOpen(true);
                    }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {t.receive}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setDeleteDialog({ open: true, material });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receive Material Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t.receiveMaterial}
              {selectedMaterial && (
                <span className="block text-sm font-normal text-gray-600 mt-1">
                  {language === 'en' ? selectedMaterial.name : selectedMaterial.name_ar}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">{t.quantity} ({selectedMaterial?.unit})</Label>
              <Input
                id="quantity"
                type="number"
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="totalCost">{t.totalCost}</Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                value={receiveTotalCost}
                onChange={(e) => setReceiveTotalCost(Number(e.target.value))}
                placeholder="0.00"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="shippingCost">{t.shippingCost}</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={receiveShippingCost}
                onChange={(e) => setReceiveShippingCost(Number(e.target.value))}
                placeholder="0.00"
                min="0"
              />
            </div>
            {receiveQuantity > 0 && receiveTotalCost > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="text-sm text-gray-600">{t.unitCostCalculated}:</div>
                <div className="font-bold text-amber-700">
                  {formatCurrency((receiveTotalCost + receiveShippingCost) / receiveQuantity, language)}
                </div>
              </div>
            )}
            <div className="flex space-x-2">
              <Button onClick={handleReceiveMaterial} className="flex-1 bg-amber-600 hover:bg-amber-700">
                {t.save}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsReceiveDialogOpen(false)} 
                className="flex-1"
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, material: null })}
        onConfirm={async () => {
          if (deleteDialog.material) {
            await deleteMaterial(deleteDialog.material.id);
            setDeleteDialog({ open: false, material: null });
          }
        }}
        title={deleteDialog.material ? (language === 'en' ? deleteDialog.material.name : deleteDialog.material.name_ar) : ''}
        description={language === 'en' ? 'Are you sure you want to delete this raw material? This action cannot be undone.' : 'هل أنت متأكد من حذف هذه المادة الخام؟ لا يمكن التراجع عن هذا الإجراء.'}
        language={language}
      />
    </div>
  );
};
