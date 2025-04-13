
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Product {
  id: string;
  name: string;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface Sale {
  id: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  date: string;
  total: number;
}

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    productId: '',
    variantId: '',
    quantity: 1,
    price: 39.9 // Default price for demo
  });
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filteredVariants, setFilteredVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // These would be your actual API endpoints
        const productsData = await apiClient.get('/products');
        const salesData = await apiClient.get('/sales');
        
        setProducts(productsData);
        setSales(salesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Mock data for demo
        setProducts([
          {
            id: '1',
            name: 'Polo Básico',
            variants: [
              { id: 'v1', size: 'S', color: 'Negro', stock: 15 },
              { id: 'v2', size: 'M', color: 'Negro', stock: 10 },
              { id: 'v3', size: 'L', color: 'Negro', stock: 20 },
            ]
          },
          {
            id: '2',
            name: 'Polo Estampado',
            variants: [
              { id: 'v4', size: 'S', color: 'Blanco', stock: 10 },
              { id: 'v5', size: 'M', color: 'Blanco', stock: 10 },
              { id: 'v6', size: 'L', color: 'Blanco', stock: 10 },
            ]
          }
        ]);
        
        setSales([
          {
            id: 's1',
            productName: 'Polo Básico',
            size: 'M',
            color: 'Negro',
            quantity: 2,
            date: '2023-04-10T15:30:00',
            total: 79.8
          },
          {
            id: 's2',
            productName: 'Polo Estampado',
            size: 'L',
            color: 'Blanco',
            quantity: 1,
            date: '2023-04-09T11:45:00',
            total: 39.9
          },
          {
            id: 's3',
            productName: 'Polo Básico',
            size: 'S',
            color: 'Negro',
            quantity: 3,
            date: '2023-04-08T14:20:00',
            total: 119.7
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (newSale.productId) {
      const product = products.find(p => p.id === newSale.productId) || null;
      setSelectedProduct(product);
      setFilteredVariants(product?.variants || []);
      setNewSale({ ...newSale, variantId: '' }); // Reset variant selection when product changes
    } else {
      setSelectedProduct(null);
      setFilteredVariants([]);
    }
  }, [newSale.productId, products]);

  const handleAddSale = () => {
    if (!selectedProduct || !newSale.variantId) return;
    
    const variant = filteredVariants.find(v => v.id === newSale.variantId);
    if (!variant) return;
    
    if (variant.stock < newSale.quantity) {
      toast.error(`Stock insuficiente. Solo hay ${variant.stock} unidades disponibles.`);
      return;
    }
    
    // In a real app, this would make an API call to register the sale
    const total = newSale.price * newSale.quantity;
    
    const newSaleRecord = {
      id: `s${sales.length + 1}`,
      productName: selectedProduct.name,
      size: variant.size,
      color: variant.color,
      quantity: newSale.quantity,
      date: new Date().toISOString(),
      total
    };
    
    setSales([newSaleRecord, ...sales]);
    
    // Update stock
    const updatedProducts = products.map(product => {
      if (product.id === selectedProduct.id) {
        const updatedVariants = product.variants.map(v => {
          if (v.id === variant.id) {
            return { ...v, stock: v.stock - newSale.quantity };
          }
          return v;
        });
        return { ...product, variants: updatedVariants };
      }
      return product;
    });
    
    setProducts(updatedProducts);
    setIsNewSaleDialogOpen(false);
    setNewSale({
      productId: '',
      variantId: '',
      quantity: 1,
      price: 39.9
    });
    
    toast.success('Venta registrada con éxito');
  };

  const filteredSales = sales.filter(sale => 
    sale.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy - HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-luneblue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="text-gray-500">Registra y visualiza el historial de ventas</p>
        </div>
        
        <Button 
          onClick={() => setIsNewSaleDialogOpen(true)}
          className="bg-luneblue hover:bg-luneblue-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Venta
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar en el historial de ventas..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No se encontraron ventas
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell>{sale.size}</TableCell>
                    <TableCell>{sale.color}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {formatDate(sale.date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">S/ {sale.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Register Sale Dialog */}
      <Dialog open={isNewSaleDialogOpen} onOpenChange={setIsNewSaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nueva Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto</Label>
              <Select
                value={newSale.productId}
                onValueChange={(value) => setNewSale({ ...newSale, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="variant">Variante (Talla/Color)</Label>
              <Select
                value={newSale.variantId}
                onValueChange={(value) => setNewSale({ ...newSale, variantId: value })}
                disabled={!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar variante" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.size} / {variant.color} ({variant.stock} disponibles)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={newSale.quantity}
                  onChange={(e) => setNewSale({ ...newSale, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Precio Unitario (S/)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.1"
                  min="0"
                  value={newSale.price}
                  onChange={(e) => setNewSale({ ...newSale, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-bold">
                  S/ {(newSale.price * newSale.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSaleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSale}
              disabled={!newSale.productId || !newSale.variantId || newSale.quantity < 1}
              className="bg-luneblue hover:bg-luneblue-dark"
            >
              Confirmar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;
