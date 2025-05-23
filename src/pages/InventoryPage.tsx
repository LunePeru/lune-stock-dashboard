
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, PackageOpen, AlertTriangle, Edit, Plus, Minus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ProductVariant {
  id: string;
  productName: string;
  size: string;
  color: string;
  stock: number;
}

const InventoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('_all');
  const [sizeFilter, setSizeFilter] = useState('_all');
  const [colorFilter, setColorFilter] = useState('_all');
  
  const [isAdjustStockDialogOpen, setIsAdjustStockDialogOpen] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [stockOperation, setStockOperation] = useState<'add' | 'subtract'>('add');
  
  const [uniqueProducts, setUniqueProducts] = useState<string[]>([]);
  const [uniqueSizes, setUniqueSizes] = useState<string[]>([]);
  const [uniqueColors, setUniqueColors] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch inventory data from Supabase
  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        size,
        color,
        stock,
        products (
          name
        )
      `);
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Transform the data to match our ProductVariant interface
    const variants: ProductVariant[] = data.map(item => ({
      id: item.id,
      productName: item.products.name,
      size: item.size,
      color: item.color,
      stock: item.stock
    }));
    
    return variants;
  };
  
  // Use React Query to fetch and cache the data
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory
  });

  // Mutation for updating stock
  const updateStockMutation = useMutation({
    mutationFn: async ({ variantId, newStock }: { variantId: string, newStock: number }) => {
      const { error } = await supabase
        .from('product_variants')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', variantId);
      
      if (error) throw new Error(error.message);
      return { variantId, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAdjustStockDialogOpen(false);
      toast.success(`Stock ${stockOperation === 'add' ? 'aumentado' : 'reducido'} con éxito`);
    },
    onError: (error) => {
      toast.error(`Error al ajustar stock: ${error.message}`);
    }
  });

  // Extract unique values for filters
  useEffect(() => {
    if (variants.length > 0) {
      const products = [...new Set(variants.map(v => v.productName))];
      const sizes = [...new Set(variants.map(v => v.size))];
      const colors = [...new Set(variants.map(v => v.color))];
      
      setUniqueProducts(products);
      setUniqueSizes(sizes);
      setUniqueColors(colors);
    }
  }, [variants]);

  const handleAdjustStock = () => {
    if (!currentVariant) return;
    
    const newStock = stockOperation === 'add' 
      ? currentVariant.stock + stockAdjustment
      : Math.max(0, currentVariant.stock - stockAdjustment);
    
    updateStockMutation.mutate({ 
      variantId: currentVariant.id, 
      newStock 
    });
  };

  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = productFilter === '_all' ? true : variant.productName === productFilter;
    const matchesSize = sizeFilter === '_all' ? true : variant.size === sizeFilter;
    const matchesColor = colorFilter === '_all' ? true : variant.color === colorFilter;
    
    return matchesSearch && matchesProduct && matchesSize && matchesColor;
  });

  // Prepare data for the stock chart
  const stockChartData = uniqueProducts.map(product => {
    const productVariants = variants.filter(v => v.productName === product);
    const totalStock = productVariants.reduce((sum, v) => sum + v.stock, 0);
    
    return {
      name: product,
      stock: totalStock
    };
  });

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
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="text-gray-500">Control detallado del stock por producto y variante</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribución de Stock por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} unidades`, 'Stock']}
                    labelFormatter={(label) => `Producto: ${label}`}
                  />
                  <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar en inventario..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos los productos</SelectItem>
            {uniqueProducts.map((product) => (
              <SelectItem key={product} value={product}>
                {product}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="grid grid-cols-2 gap-2">
          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Talla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas las tallas</SelectItem>
              {uniqueSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={colorFilter} onValueChange={setColorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los colores</SelectItem>
              {uniqueColors.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Detalle de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVariants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No se encontraron variantes con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                filteredVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.productName}</TableCell>
                    <TableCell>{variant.size}</TableCell>
                    <TableCell>{variant.color}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <PackageOpen className="h-4 w-4 text-gray-500" />
                        <span>{variant.stock}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {variant.stock <= 5 ? (
                        <div className="flex items-center space-x-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Stock bajo</span>
                        </div>
                      ) : (
                        <span className="text-green-600">Disponible</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setCurrentVariant(variant);
                          setStockAdjustment(0);
                          setStockOperation('add');
                          setIsAdjustStockDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Ajustar Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustStockDialogOpen} onOpenChange={setIsAdjustStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
          </DialogHeader>
          {currentVariant && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="font-medium">{currentVariant.productName}</p>
                <p className="text-sm text-gray-500">
                  Talla: {currentVariant.size}, Color: {currentVariant.color}
                </p>
                <p className="text-sm font-medium">
                  Stock actual: <span className="text-luneblue">{currentVariant.stock}</span> unidades
                </p>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button
                  type="button"
                  variant={stockOperation === 'add' ? 'default' : 'outline'}
                  className={stockOperation === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setStockOperation('add')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
                <Button
                  type="button"
                  variant={stockOperation === 'subtract' ? 'default' : 'outline'}
                  className={stockOperation === 'subtract' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  onClick={() => setStockOperation('subtract')}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Reducir
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock-adjustment">Cantidad a {stockOperation === 'add' ? 'agregar' : 'reducir'}</Label>
                <Input
                  id="stock-adjustment"
                  type="number"
                  min="1"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Nuevo stock:</span>
                  <span className="text-lg font-bold">
                    {stockOperation === 'add' 
                      ? currentVariant.stock + stockAdjustment 
                      : Math.max(0, currentVariant.stock - stockAdjustment)} unidades
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustStockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAdjustStock}
              disabled={stockAdjustment <= 0 || updateStockMutation.isPending}
              className={stockOperation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
            >
              {updateStockMutation.isPending ? 'Procesando...' : stockOperation === 'add' ? 'Aumentar' : 'Reducir'} Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
