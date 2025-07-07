
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, ShoppingCart, Users, CreditCard, Banknote, Clock, Award } from "lucide-react";
import { useCustomerAnalytics, CustomerAnalytics } from "@/hooks/useCustomerAnalytics";
import { formatCurrency } from "@/utils/currency";
import { formatGregorianDate } from "@/utils/dateUtils";

interface CustomerAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: { id: string; name: string } | null;
  language: 'en' | 'ar';
}

export const CustomerAnalyticsDialog = ({
  open,
  onOpenChange,
  customer,
  language
}: CustomerAnalyticsDialogProps) => {
  const { analytics, loading, refetch } = useCustomerAnalytics(customer?.id);

  const translations = {
    en: {
      customerAnalytics: "Customer Analytics",
      loading: "Loading analytics...",
      mostActiveDays: "Most Active Purchase Days",
      topProducts: "Most Purchased Products",
      nextOrderPrediction: "Next Order Prediction",
      paymentBehavior: "Payment Behavior Analysis",
      totalPurchases: "Total Purchases",
      totalSpent: "Total Spent",
      quantity: "Qty",
      amount: "Amount",
      purchases: "purchases",
      predictedDate: "Predicted Date",
      confidence: "Confidence",
      avgDaysBetween: "Avg Days Between Orders",
      noData: "No data available",
      days: "days",
      cashSalesPercentage: "Cash Sales",
      creditSalesPercentage: "Credit Sales",
      onTimePaymentPercentage: "On-Time Payments",
      avgPaymentDelay: "Avg Payment Delay",
      paymentReliability: "Payment Reliability",
      preferredPaymentMethod: "Preferred Payment Method"
    },
    ar: {
      customerAnalytics: "تحليل العميل",
      loading: "جاري تحميل التحليل...",
      mostActiveDays: "أكثر أيام الشراء نشاطاً",
      topProducts: "المنتجات الأكثر شراءً",
      nextOrderPrediction: "توقع الطلب التالي",
      paymentBehavior: "تحليل سلوك الدفع",
      totalPurchases: "إجمالي المشتريات",
      totalSpent: "إجمالي المبلغ",
      quantity: "الكمية",
      amount: "المبلغ",
      purchases: "مشتريات",
      predictedDate: "التاريخ المتوقع",
      confidence: "مستوى الثقة",
      avgDaysBetween: "متوسط الأيام بين الطلبات",
      noData: "لا توجد بيانات متاحة",
      days: "يوم",
      cashSalesPercentage: "المبيعات النقدية",
      creditSalesPercentage: "المبيعات الآجلة",
      onTimePaymentPercentage: "الدفعات في الوقت المحدد",
      avgPaymentDelay: "متوسط تأخير الدفع",
      paymentReliability: "موثوقية الدفع",
      preferredPaymentMethod: "طريقة الدفع المفضلة"
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (customer && open) {
      refetch();
    }
  }, [customer, open, refetch]);

  if (!customer) return null;

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.customerAnalytics} - {customer.name}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <p>{t.loading}</p>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    {t.totalPurchases}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalPurchases}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t.totalSpent}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.totalAmount)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Behavior Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t.paymentBehavior}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Banknote className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t.cashSalesPercentage}</p>
                      <p className="text-lg font-semibold">{analytics.paymentBehavior.cashPercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <CreditCard className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t.creditSalesPercentage}</p>
                      <p className="text-lg font-semibold">{analytics.paymentBehavior.creditPercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t.avgPaymentDelay}</p>
                      <p className="text-lg font-semibold">{analytics.paymentBehavior.avgPaymentDelay} {t.days}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Award className="h-8 w-8 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t.paymentReliability}</p>
                      <p className="text-lg font-semibold">
                        {analytics.paymentBehavior.creditPercentage > 50 ? 'Credit Preferred' : 'Cash Preferred'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Most Active Days */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t.mostActiveDays}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.weeklyPurchasePattern.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analytics.weeklyPurchasePattern
                      .filter(day => day.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3)
                      .map((day, index) => (
                      <Badge key={index} variant="secondary">
                        {day.day} ({day.count} {t.purchases})
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t.noData}</p>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.topProducts}</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.mostPurchasedProducts.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.mostPurchasedProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.percentage.toFixed(1)}% of total purchases
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{t.quantity}: {product.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{t.noData}</p>
                )}
              </CardContent>
            </Card>

            {/* Next Order Prediction */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.nextOrderPrediction}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{t.predictedDate}:</span>
                    <span>
                      {analytics.predictedNextPurchase.date 
                        ? formatGregorianDate(analytics.predictedNextPurchase.date, language)
                        : t.noData}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">{t.confidence}:</span>
                    <Badge variant={
                      analytics.predictedNextPurchase.confidence > 70 ? 'default' :
                      analytics.predictedNextPurchase.confidence > 40 ? 'secondary' : 'outline'
                    }>
                      {analytics.predictedNextPurchase.confidence}%
                    </Badge>
                  </div>
                  {analytics.predictedNextPurchase.recommendedProducts.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Recommended Products:</p>
                      <div className="flex flex-wrap gap-2">
                        {analytics.predictedNextPurchase.recommendedProducts.map((product, index) => (
                          <Badge key={index} variant="outline">{product}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex justify-center p-8">
            <p>{t.noData}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
