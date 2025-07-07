
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import { RawMaterial } from "@/hooks/useRawMaterials";
import { Product } from "@/hooks/useProducts";

interface StockAlertsPanelProps {
  lowStockMaterials: RawMaterial[];
  lowStockProducts: Product[];
  language: 'en' | 'ar';
}

export const StockAlertsPanel = ({ 
  lowStockMaterials, 
  lowStockProducts, 
  language 
}: StockAlertsPanelProps) => {
  const translations = {
    en: {
      lowStockAlerts: "Low Stock Alerts",
      rawMaterials: "Raw Materials",
      products: "Products",
      currentStock: "Current Stock",
      threshold: "Threshold",
      noAlerts: "No low stock alerts"
    },
    ar: {
      lowStockAlerts: "تنبيهات نقص المخزون",
      rawMaterials: "المواد الخام",
      products: "المنتجات",
      currentStock: "المخزون الحالي",
      threshold: "الحد الأدنى",
      noAlerts: "لا توجد تنبيهات نقص مخزون"
    }
  };

  const t = translations[language];

  if (lowStockMaterials.length === 0 && lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-300 text-lg">
          <AlertTriangle className="w-5 h-5" />
          <span>{t.lowStockAlerts}</span>
          <Badge variant="destructive" className="ml-2">
            {lowStockMaterials.length + lowStockProducts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Low Stock Raw Materials */}
        {lowStockMaterials.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center text-sm">
              <Package className="w-4 h-4 mr-1" />
              {t.rawMaterials} ({lowStockMaterials.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockMaterials.map((material) => (
                <div key={material.id} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate block">
                        {language === 'en' ? material.name : material.name_ar}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({material.unit})</span>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs">
                        <span className="text-red-600 dark:text-red-400 font-semibold">{material.current_stock}</span>
                        <span className="text-gray-500 dark:text-gray-400">/{material.min_threshold}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Products */}
        {lowStockProducts.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center text-sm">
              <Package className="w-4 h-4 mr-1" />
              {t.products} ({lowStockProducts.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate block">
                        {language === 'en' ? product.name : product.name_ar}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({product.size})</span>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs">
                        <span className="text-red-600 dark:text-red-400 font-semibold">{product.current_stock}</span>
                        <span className="text-gray-500 dark:text-gray-400">/{product.min_threshold}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
