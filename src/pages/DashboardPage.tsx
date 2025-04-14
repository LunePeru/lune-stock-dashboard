import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, Package, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface DashboardStats {
  totalRevenue: number;
  totalStock: number;
  recentSales: number;
  lowStockItems: number;
}

interface SalesData {
  date: string;
  value: number;
}

interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
}

interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  variant_id: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  total: number;
  date: string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalStock: 0,
    recentSales: 0,
    lowStockItems: 0
  });
  
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products data
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*');
        
        if (productsError) throw productsError;
        
        // Fetch variants data
        const { data: variants, error: variantsError } = await supabase
          .from('product_variants')
          .select('*');
        
        if (variantsError) throw variantsError;
        
        // Get sales data if table exists
        let sales: Sale[] = [];
        try {
          const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('*');
          
          if (!salesError && salesData) {
            sales = salesData;
          }
        } catch (error) {
          console.log('Sales table may not exist yet:', error);
        }
        
        // Calculate total revenue from all sales
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
        
        // Count recent sales (last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7);
        const recentSales = sales.filter(sale => 
          new Date(sale.date) >= sevenDaysAgo
        ).length;
        
        // Count low stock items (less than 5 in stock)
        const lowStockItems = variants.filter(variant => variant.stock < 5).length;
        
        // Prepare weekly sales chart data
        const weekDays = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), i);
          return {
            date: format(date, 'E'), // 'E' gives abbreviated weekday name
            fullDate: date,
            value: 0
          };
        }).reverse();
        
        // Count sales for each day
        if (sales.length > 0) {
          sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            
            weekDays.forEach(day => {
              // Check if the sale date falls within this day
              if (isWithinInterval(saleDate, {
                start: startOfDay(day.fullDate),
                end: endOfDay(day.fullDate)
              })) {
                day.value += 1;
              }
            });
          });
        }
        
        // Format the data for the chart
        const formattedSalesData = weekDays.map(({ date, value }) => ({ date, value }));
        
        setStats({
          totalRevenue,
          totalStock,
          recentSales,
          lowStockItems
        });
        
        setSalesData(formattedSalesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to empty data
        setStats({
          totalRevenue: 0,
          totalStock: 0,
          recentSales: 0,
          lowStockItems: 0
        });
        
        // Generate empty week data
        const emptyWeekData = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          return {
            date: format(date, 'E'),
            value: 0
          };
        });
        
        setSalesData(emptyWeekData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luneblue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Resumen de actividad y estadísticas</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">${stats.totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total en Stock</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalStock}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ventas Recientes</p>
                <h3 className="text-2xl font-bold mt-1">{stats.recentSales}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                <h3 className="text-2xl font-bold mt-1">{stats.lowStockItems}</h3>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Ventas Semanales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} ventas`, 'Cantidad']}
                  labelFormatter={(label) => `Día: ${label}`}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
