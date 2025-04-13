
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { ShoppingBag, Package, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  recentSales: number;
  lowStockItems: number;
}

interface SalesData {
  date: string;
  value: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalStock: 0,
    recentSales: 0,
    lowStockItems: 0
  });
  
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // These would be actual API endpoints in your Spring Boot backend
        const statsData = await apiClient.get('/dashboard/stats');
        const salesChartData = await apiClient.get('/dashboard/sales-chart');
        
        setStats(statsData);
        setSalesData(salesChartData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // For demo purposes, set mock data
        setStats({
          totalProducts: 24,
          totalStock: 487,
          recentSales: 28,
          lowStockItems: 5
        });
        
        setSalesData([
          { date: 'Lun', value: 12 },
          { date: 'Mar', value: 19 },
          { date: 'Mie', value: 15 },
          { date: 'Jue', value: 22 },
          { date: 'Vie', value: 30 },
          { date: 'Sab', value: 18 },
          { date: 'Dom', value: 10 },
        ]);
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
                <p className="text-sm font-medium text-gray-500">Productos</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalProducts}</h3>
              </div>
              <div className="bg-luneblue-light bg-opacity-20 p-3 rounded-full">
                <ShoppingBag className="h-5 w-5 text-luneblue" />
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
