import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, ShoppingCart, Factory, Bell, BarChart3, FileText, Trash2, Users, Truck } from "lucide-react";
import { RawMaterialsManager } from "@/components/RawMaterialsManager";
import { ProductCatalogManager } from "@/components/ProductCatalogManager";
import { ProductionManager } from "@/components/ProductionManager";
import { SalesManager } from "@/components/SalesManager";
import { StockAlertsPanel } from "@/components/StockAlertsPanel";
import { ReportsManager } from "@/components/ReportsManager";
import { SuppliersManager } from "@/components/SuppliersManager";
import { CustomersManager } from "@/components/CustomersManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardChart } from "@/components/DashboardChart";
import { useRawMaterials } from "@/hooks/useRawMaterials";
import { useProducts } from "@/hooks/useProducts";
import { useProduction } from "@/hooks/useProduction";
import { useSales } from "@/hooks/useSales";
import { formatCurrency } from "@/utils/currency";
import { formatGregorianDate } from "@/utils/dateUtils";

const Index = () => {
  const { user, loading } = useAuth();
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Use database hooks
  const { materials: rawMaterials, loading: materialsLoading } = useRawMaterials();
  const { products, loading: productsLoading } = useProducts();
  const { productionRecords } = useProduction();
  const { salesRecords } = useSales();

  // Get low stock items
  const lowStockMaterials = rawMaterials.filter(material => material.current_stock <= material.min_threshold);
  const lowStockProducts = products.filter(product => product.current_stock <= product.min_threshold);

  const handleNotificationClick = () => {
    setActiveTab('dashboard');
    // Scroll to alerts section if there are any
    if (lowStockMaterials.length > 0 || lowStockProducts.length > 0) {
      setTimeout(() => {
        const alertsElement = document.getElementById('stock-alerts');
        if (alertsElement) {
          alertsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const translations = {
    en: {
      title: "مدرار Business Manager",
      dashboard: "Dashboard",
      rawMaterials: "Raw Materials",
      productCatalog: "Product Catalog",
      production: "Production",
      sales: "Sales",
      reports: "Reports",
      suppliers: "Suppliers",
      customers: "Customers",
      currentStock: "Current Stock",
      lowStockAlerts: "Low Stock Alerts",
      totalValue: "Total Inventory Value",
      recentActivity: "Recent Activity",
      addMaterial: "Add Material",
      recordProduction: "Record Production",
      recordSale: "Record Sale",
      viewReports: "View Reports",
      loading: "Loading...",
      salesOverTime: "Sales Over Time"
    },
    ar: {
      title: "نظام إدارة أعمال مدرار",
      dashboard: "لوحة التحكم",
      rawMaterials: "المواد الخام",
      productCatalog: "كتالوج المنتجات",
      production: "الإنتاج",
      sales: "المبيعات",
      reports: "التقارير",
      suppliers: "الموردين",
      customers: "العملاء",
      currentStock: "المخزون الحالي",
      lowStockAlerts: "تنبيهات نقص المخزون",
      totalValue: "إجمالي قيمة المخزون",
      recentActivity: "النشاط الأخير",
      addMaterial: "إضافة مادة",
      recordProduction: "تسجيل إنتاج",
      recordSale: "تسجيل بيع",
      viewReports: "عرض التقارير",
      loading: "جاري التحميل...",
      salesOverTime: "المبيعات عبر الوقت"
    }
  };

  const t = translations[language];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage language={language} />;
  }

  if (materialsLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-sm">🍯</span>
          </div>
          <p className="text-amber-900 dark:text-amber-100 font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-amber-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🍯</span>
              </div>
              <h1 className="text-xl font-bold text-amber-900 dark:text-amber-100">{t.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotificationClick}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {(lowStockMaterials.length > 0 || lowStockProducts.length > 0) && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0">
                    {lowStockMaterials.length + lowStockProducts.length}
                  </Badge>
                )}
              </Button>
              
              <ThemeToggle />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-950"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-amber-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { key: 'dashboard', label: t.dashboard, icon: BarChart3 },
              { key: 'materials', label: t.rawMaterials, icon: Package },
              { key: 'catalog', label: t.productCatalog, icon: Factory },
              { key: 'production', label: t.production, icon: Factory },
              { key: 'sales', label: t.sales, icon: ShoppingCart },
              { key: 'suppliers', label: t.suppliers, icon: Truck },
              { key: 'customers', label: t.customers, icon: Users },
              { key: 'reports', label: t.reports, icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-3 border-b-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-amber-600 hover:border-amber-300 dark:text-gray-400 dark:hover:text-amber-400'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{label}</span>
                <span className="sm:hidden text-xs truncate">{label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stock Alerts */}
            {(lowStockMaterials.length > 0 || lowStockProducts.length > 0) && (
              <div id="stock-alerts">
                <StockAlertsPanel 
                  lowStockMaterials={lowStockMaterials}
                  lowStockProducts={lowStockProducts}
                  language={language}
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {t.rawMaterials}
                  </CardTitle>
                  <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{rawMaterials.length}</div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {lowStockMaterials.length} {language === 'en' ? 'low stock' : 'نقص مخزون'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {language === 'en' ? 'Products' : 'المنتجات'}
                  </CardTitle>
                  <Factory className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{products.length}</div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {products.reduce((sum, p) => sum + p.current_stock, 0)} {language === 'en' ? 'total units' : 'إجمالي الوحدات'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {language === 'en' ? 'Sales Today' : 'مبيعات اليوم'}
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {formatCurrency(
                      salesRecords
                        .filter(sale => {
                          const today = new Date();
                          const saleDate = new Date(sale.sale_date);
                          return saleDate.toDateString() === today.toDateString();
                        })
                        .reduce((sum, sale) => sum + sale.total_amount, 0),
                      language
                    )}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {salesRecords.filter(sale => {
                      const today = new Date();
                      const saleDate = new Date(sale.sale_date);
                      return saleDate.toDateString() === today.toDateString();
                    }).length} {language === 'en' ? 'transactions' : 'معاملة'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Chart */}
            <DashboardChart salesRecords={salesRecords} language={language} />

            {/* Current Stock Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-amber-900 dark:text-amber-100">{t.rawMaterials}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rawMaterials.slice(0, 5).map((material) => (
                      <div key={material.id} className="flex justify-between items-center p-2 bg-amber-50 dark:bg-gray-700 rounded">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {language === 'en' ? material.name : material.name_ar}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({material.unit})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-amber-700 dark:text-amber-300">{material.current_stock}</span>
                          {material.current_stock <= material.min_threshold && (
                            <Badge variant="destructive" className="text-xs">
                              {language === 'en' ? 'Low' : 'قليل'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-amber-900 dark:text-amber-100">
                    {language === 'en' ? 'Finished Products' : 'المنتجات الجاهزة'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div key={product.id} className="flex justify-between items-center p-2 bg-amber-50 dark:bg-gray-700 rounded">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {language === 'en' ? product.name : product.name_ar}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({product.size})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-amber-700 dark:text-amber-300">{product.current_stock}</span>
                          {product.current_stock <= product.min_threshold && (
                            <Badge variant="destructive" className="text-xs">
                              {language === 'en' ? 'Low' : 'قليل'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <RawMaterialsManager language={language} />
        )}

        {activeTab === 'catalog' && (
          <ProductCatalogManager language={language} />
        )}

        {activeTab === 'production' && (
          <ProductionManager language={language} />
        )}

        {activeTab === 'sales' && (
          <SalesManager language={language} />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersManager language={language} />
        )}

        {activeTab === 'customers' && (
          <CustomersManager language={language} />
        )}

        {activeTab === 'reports' && (
          <ReportsManager language={language} />
        )}
      </main>
    </div>
  );
};

export default Index;
