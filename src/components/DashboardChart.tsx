
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { SaleRecord } from "@/hooks/useSales";
import { formatCurrency } from "@/utils/currency";
import { formatGregorianDate } from "@/utils/dateUtils";

interface DashboardChartProps {
  salesRecords: SaleRecord[];
  language: 'en' | 'ar';
}

export const DashboardChart = ({ salesRecords, language }: DashboardChartProps) => {
  const translations = {
    en: {
      salesOverTime: "Sales Over Time (Last 30 Days)",
      monthlySales: "Monthly Sales",
      amount: "Amount",
      date: "Date",
      month: "Month"
    },
    ar: {
      salesOverTime: "المبيعات عبر الوقت (آخر 30 يوم)",
      monthlySales: "المبيعات الشهرية",
      amount: "المبلغ",
      date: "التاريخ",
      month: "الشهر"
    }
  };

  const t = translations[language];

  // Process daily sales data for the last 30 days
  const getDailySalesData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayTotal = salesRecords
        .filter(sale => new Date(sale.sale_date).toISOString().split('T')[0] === date)
        .reduce((sum, sale) => sum + sale.total_amount, 0);

      return {
        date: formatGregorianDate(date, language),
        amount: dayTotal,
        fullDate: date
      };
    });
  };

  // Process monthly sales data for the last 12 months
  const getMonthlySalesData = () => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        year: date.getFullYear(),
        month: date.getMonth()
      };
    });

    return last12Months.map(({ year, month }) => {
      const monthTotal = salesRecords
        .filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate.getFullYear() === year && saleDate.getMonth() === month;
        })
        .reduce((sum, sale) => sum + sale.total_amount, 0);

      const monthNames = language === 'en' 
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

      return {
        month: monthNames[month],
        amount: monthTotal,
        year
      };
    });
  };

  const dailyData = getDailySalesData();
  const monthlyData = getMonthlySalesData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-amber-200 dark:border-amber-700 rounded-lg shadow-lg">
          <p className="text-amber-900 dark:text-amber-100 font-medium">{label}</p>
          <p className="text-amber-700 dark:text-amber-300">
            {t.amount}: {formatCurrency(payload[0].value, language)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Sales Chart */}
      <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">{t.salesOverTime}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f59e0b" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#92400e"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#92400e"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Sales Chart */}
      <Card className="border-amber-200 dark:border-amber-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">{t.monthlySales}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f59e0b" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#92400e"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#92400e"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
