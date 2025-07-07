
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Factory, Plus, Minus, Filter, Download, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRawMaterials } from "@/hooks/useRawMaterials";
import { useProducts } from "@/hooks/useProducts";
import { useProduction } from "@/hooks/useProduction";
import { useProductBOM } from "@/hooks/useProductBOM";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/currency";

interface ProductionManagerProps {
  language: 'en' | 'ar';
}

export const ProductionManager = ({ language }: ProductionManagerProps) => {
  const { materials: rawMaterials, refetch: refetchMaterials } = useRawMaterials();
  const { products, refetch: refetchProducts } = useProducts();
  const { productionRecords, recordProduction, deleteProductionRecord } = useProduction();
  const { fetchBOMByProduct } = useProductBOM();
  
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productionQuantity, setProductionQuantity] = useState(1);
  const [bomRequirements, setBomRequirements] = useState<any[]>([]);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [producedBy, setProducedBy] = useState('');
  const [productionNotes, setProductionNotes] = useState('');
  
  // Filtering states
  const [filterProduct, setFilterProduct] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'product' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const translations = {
    en: {
      production: "Production Management",
      recordProduction: "Record Production",
      selectProduct: "Select Product",
      quantity: "Quantity to Produce",
      productionDate: "Production Date",
      producedBy: "Produced By (Optional)",
      notes: "Notes (Optional)",
      materialsRequired: "Materials Required",
      currentStock: "Current Stock",
      required: "Required",
      available: "Available",
      insufficient: "Insufficient Stock",
      produce: "Produce",
      cancel: "Cancel",
      productionRecorded: "Production recorded successfully",
      insufficientMaterials: "Insufficient materials for production",
      productionHistory: "Production History",
      noProduction: "No production records yet",
      produced: "Produced",
      units: "units",
      noRecipeFound: "No recipe found for this product. Please set up the Bill of Materials in Product Catalog.",
      filterBy: "Filter by Product",
      dateFrom: "From",
      dateTo: "To",
      sortBy: "Sort by",
      date: "Date",
      product: "Product",
      clearFilters: "Clear Filters",
      totalCost: "Total Cost",
      exportHistory: "Export History",
      batchDetails: "Batch Details"
    },
    ar: {
      production: "إدارة الإنتاج",
      recordProduction: "تسجيل إنتاج",
      selectProduct: "اختر المنتج",
      quantity: "الكمية المراد إنتاجها",
      productionDate: "تاريخ الإنتاج",
      producedBy: "أنتج بواسطة (اختياري)",
      notes: "ملاحظات (اختيارية)",
      materialsRequired: "المواد المطلوبة",
      currentStock: "المخزون الحالي",
      required: "مطلوب",
      available: "متوفر",
      insufficient: "مخزون غير كاف",
      produce: "إنتاج",
      cancel: "إلغاء",
      productionRecorded: "تم تسجيل الإنتاج بنجاح",
      insufficientMaterials: "مواد غير كافية للإنتاج",
      productionHistory: "تاريخ الإنتاج",
      noProduction: "لا توجد سجلات إنتاج بعد",
      produced: "تم إنتاج",
      units: "وحدة",
      noRecipeFound: "لم يتم العثور على وصفة لهذا المنتج. يرجى إعداد مكونات المنتج في كتالوج المنتجات.",
      filterBy: "تصفية حسب المنتج",
      dateFrom: "من",
      dateTo: "إلى",
      sortBy: "ترتيب حسب",
      date: "التاريخ",
      product: "المنتج",
      clearFilters: "إزالة المرشحات",
      totalCost: "التكلفة الإجمالية",
      exportHistory: "تصدير التاريخ",
      batchDetails: "تفاصيل الدفعة"
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (selectedProductId) {
      loadProductBOM();
    }
  }, [selectedProductId]);

  const loadProductBOM = async () => {
    const bomData = await fetchBOMByProduct(selectedProductId);
    setBomRequirements(bomData);
  };

  const getRequiredMaterials = () => {
    return bomRequirements.map(bomItem => {
      const totalRequired = bomItem.quantity_per_unit * productionQuantity;
      const material = bomItem.raw_materials || rawMaterials.find(m => m.id === bomItem.material_id);
      
      return {
        material,
        quantityPerUnit: bomItem.quantity_per_unit,
        totalRequired,
        available: material?.current_stock || 0,
        sufficient: (material?.current_stock || 0) >= totalRequired
      };
    }).filter(req => req.material);
  };

  const canProduce = () => {
    const requirements = getRequiredMaterials();
    return requirements.length > 0 && requirements.every(req => req.sufficient);
  };

  const handleRecordProduction = async () => {
    if (!selectedProductId || !canProduce()) {
      toast({
        title: language === 'en' ? "Error" : "خطأ",
        description: bomRequirements.length === 0 ? t.noRecipeFound : t.insufficientMaterials,
        variant: "destructive"
      });
      return;
    }

    const requirements = getRequiredMaterials();
    const materials = requirements.map(req => ({
      material_id: req.material!.id,
      quantity_used: req.totalRequired,
      cost_at_time: req.material!.cost_per_unit || 0
    }));

    // Create enhanced notes with produced by info
    let enhancedNotes = productionNotes;
    if (producedBy.trim()) {
      enhancedNotes = `Produced by: ${producedBy}${productionNotes ? `\nNotes: ${productionNotes}` : ''}`;
    }

    try {
      await recordProduction(selectedProductId, productionQuantity, materials, productionDate, enhancedNotes);
      
      // Refresh data
      refetchMaterials();
      refetchProducts();
      
      // Reset form
      setSelectedProductId('');
      setProductionQuantity(1);
      setBomRequirements([]);
      setProductionDate(new Date().toISOString().split('T')[0]);
      setProducedBy('');
      setProductionNotes('');
      setIsProductionDialogOpen(false);

      toast({
        title: language === 'en' ? "Success" : "نجح",
        description: t.productionRecorded
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Filter and sort production records
  const getFilteredAndSortedRecords = () => {
    let filtered = [...productionRecords];

    // Apply filters
    if (filterProduct) {
      filtered = filtered.filter(record => record.product_id === filterProduct);
    }
    
    if (filterDateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.production_date) >= new Date(filterDateFrom)
      );
    }
    
    if (filterDateTo) {
      filtered = filtered.filter(record => 
        new Date(record.production_date) <= new Date(filterDateTo)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.production_date).getTime() - new Date(b.production_date).getTime();
          break;
        case 'product':
          const productA = products.find(p => p.id === a.product_id);
          const productB = products.find(p => p.id === b.product_id);
          const nameA = language === 'en' ? productA?.name || '' : productA?.name_ar || '';
          const nameB = language === 'en' ? productB?.name || '' : productB?.name_ar || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const clearFilters = () => {
    setFilterProduct('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">{t.production}</h2>
        
        <Dialog open={isProductionDialogOpen} onOpenChange={setIsProductionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <Factory className="w-4 h-4 mr-2" />
              {t.recordProduction}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.recordProduction}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Product Selection and Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.selectProduct}</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectValue placeholder={t.selectProduct} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.filter(product => product.id).map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {language === 'en' ? product.name : product.name_ar} ({product.size || 'No size'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.productionDate}</Label>
                  <Input
                    type="date"
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Quantity and Producer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.quantity}</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductionQuantity(Math.max(1, productionQuantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={productionQuantity}
                      onChange={(e) => setProductionQuantity(Math.max(1, Number(e.target.value)))}
                      className="text-center dark:bg-gray-700 dark:border-gray-600"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductionQuantity(productionQuantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>{t.producedBy}</Label>
                  <Input
                    value={producedBy}
                    onChange={(e) => setProducedBy(e.target.value)}
                    placeholder="John Smith"
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>{t.notes}</Label>
                <Input
                  value={productionNotes}
                  onChange={(e) => setProductionNotes(e.target.value)}
                  placeholder={language === 'en' ? "Additional production notes..." : "ملاحظات إضافية للإنتاج..."}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Material Requirements */}
              {selectedProductId && (
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">{t.materialsRequired}</h3>
                  
                  {bomRequirements.length === 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">{t.noRecipeFound}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getRequiredMaterials().map((req, index) => {
                        const sufficient = req.sufficient;
                        
                        return (
                          <div 
                            key={index}
                            className={`p-3 rounded-lg border ${
                              sufficient 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="font-medium">
                                  {language === 'en' ? req.material?.name : req.material?.name_ar}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                  ({req.material?.unit})
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t.required}: {req.totalRequired}</span>
                              <span className={sufficient ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                {t.available}: {req.available}
                              </span>
                            </div>
                            {!sufficient && (
                              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {t.insufficient}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={handleRecordProduction} 
                  disabled={!canProduce() || !selectedProductId || bomRequirements.length === 0}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300"
                >
                  {t.produce}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsProductionDialogOpen(false)} 
                  className="flex-1"
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Production History with Filters */}
      <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-amber-900 dark:text-amber-100">{t.productionHistory}</CardTitle>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div>
              <Label className="text-sm">{t.filterBy}</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="h-8 dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-products">All products</SelectItem>
                  {products.filter(product => product.id).map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {language === 'en' ? product.name : product.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm">{t.dateFrom}</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-8 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <Label className="text-sm">{t.dateTo}</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-8 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <Label className="text-sm">{t.sortBy}</Label>
              <div className="flex space-x-2">
                <Select value={sortBy} onValueChange={(value: 'date' | 'product' | 'quantity') => setSortBy(value)}>
                  <SelectTrigger className="h-8 dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t.date}</SelectItem>
                    <SelectItem value="product">{t.product}</SelectItem>
                    <SelectItem value="quantity">{t.quantity}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 px-2"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="w-4 h-4 mr-2" />
              {t.clearFilters}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {getFilteredAndSortedRecords().length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t.noProduction}</p>
          ) : (
            <div className="space-y-4">
              {getFilteredAndSortedRecords().map((record) => {
                const product = products.find(p => p.id === record.product_id);
                const productName = language === 'en' ? product?.name : product?.name_ar;
                
                // Extract produced by info from notes
                const notesLines = record.notes?.split('\n') || [];
                const producedByLine = notesLines.find(line => line.startsWith('Produced by:'));
                const producedByName = producedByLine ? producedByLine.replace('Produced by:', '').trim() : '';
                const otherNotes = notesLines.filter(line => !line.startsWith('Produced by:') && !line.startsWith('Notes:')).join('\n').trim();
                const additionalNotes = notesLines.find(line => line.startsWith('Notes:'))?.replace('Notes:', '').trim() || otherNotes;
                
                return (
                  <div key={record.id} className="p-4 bg-amber-50 dark:bg-gray-700 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-amber-900 dark:text-amber-100 text-lg">
                          {productName || 'Unknown Product'} ({product?.size || 'No size'})
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(record.production_date).toLocaleDateString('en-CA')} - 
                          {new Date(record.production_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {producedByName && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'en' ? 'Produced by' : 'أنتج بواسطة'}: {producedByName}
                          </div>
                        )}
                        {additionalNotes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {additionalNotes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full sm:w-auto mt-2 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-amber-700 dark:text-amber-300 text-lg">
                            {t.produced} {record.quantity} {t.units}
                          </div>
                          {record.total_cost && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t.totalCost}: {formatCurrency(record.total_cost, language)}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProductionRecord(record.id)}
                          className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">{language === 'en' ? 'Delete' : 'حذف'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
