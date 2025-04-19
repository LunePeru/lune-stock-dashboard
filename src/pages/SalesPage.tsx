import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { Plus, Search, Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  
  const [isEditSaleDialogOpen, setIsEditSaleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Create a sales table if it doesn't exist
  const checkAndCreateSalesTable = async () => {
    try {
      const { data: salesTableExists } = await supabase
        .from('sales')
        .select('*')
        .limit(1);
      
      if (salesTableExists === null) {
        console.log('Sales table might not exist. Consider running SQL migration to create it.');
      }
    } catch (error) {
      console.error('Error checking sales table:', error);
    }
  };

  useEffect(() => {
    checkAndCreateSalesTable();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch products from Supabase
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');
        
        if (productsError) throw productsError;

        // Fetch variants
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('*');
        
        if (variantsError) throw variantsError;
        
        // Fetch sales if the table exists
        let salesData: any[] = [];
        try {
          const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('date', { ascending: false });
          
          if (data) salesData = data;
          if (error && error.code !== 'PGRST116') throw error; // PGRST116: Table not found
        } catch (salesError) {
          console.log('Sales table may not exist yet:', salesError);
        }

        // Organize products data
        const formattedProducts = productsData.map(product => {
          const productVariants = variantsData
            .filter(variant => variant.product_id === product.id)
            .map(variant => ({
              id: variant.id,
              size: variant.size,
              color: variant.color,
              stock: variant.stock
            }));
          
          return {
            id: product.id,
            name: product.name,
            variants: productVariants
          };
        });
        
        // Format sales data if available
        const formattedSales = salesData.map(sale => ({
          id: sale.id,
          productName: sale.product_name,
          size: sale.size,
          color: sale.color,
          quantity: sale.quantity,
          date: sale.date,
          total: sale.total
        }));
        
        setProducts(formattedProducts);
        setSales(formattedSales);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos');
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

  const handleAddSale = async () => {
    if (!selectedProduct || !newSale.variantId) return;
    
    const variant = filteredVariants.find(v => v.id === newSale.variantId);
    if (!variant) return;
    
    if (variant.stock < newSale.quantity) {
      toast.error(`Stock insuficiente. Solo hay ${variant.stock} unidades disponibles.`);
      return;
    }
    
    try {
      const total = newSale.price * newSale.quantity;
      const now = new Date().toISOString();
      
      // First, create the sales table if it doesn't exist yet
      try {
        await supabase.rpc('create_sales_table_if_not_exists');
      } catch (error) {
        console.log('Sales table might already exist or RPC not available.');
      }
      
      // Insert the sale into Supabase
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          product_name: selectedProduct.name,
          product_id: selectedProduct.id,
          variant_id: variant.id,
          size: variant.size,
          color: variant.color,
          quantity: newSale.quantity,
          price: newSale.price,
          total: total,
          date: now
        }])
        .select()
        .single();
      
      if (saleError) {
        if (saleError.code === 'PGRST116') { // Table not found
          toast.error('La tabla de ventas no existe. Por favor, crea la tabla primero.');
          return;
        }
        throw saleError;
      }
      
      // Update the variant stock in Supabase
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: variant.stock - newSale.quantity })
        .eq('id', variant.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      const newSaleRecord = {
        id: saleData.id,
        productName: selectedProduct.name,
        size: variant.size,
        color: variant.color,
        quantity: newSale.quantity,
        date: now,
        total
      };
      
      setSales([newSaleRecord, ...sales]);
      
      // Update product stock in local state
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
    } catch (error) {
      console.error('Error registering sale:', error);
      toast.error('Error al registrar la venta');
    }
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

  const handleEditSale = async () => {
    if (!selectedSale || !newSale.productId || !newSale.variantId) return;
    
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          product_name: selectedProduct?.name,
          product_id: newSale.productId,
          variant_id: newSale.variantId,
          quantity: newSale.quantity,
          price: newSale.price,
          total: newSale.price * newSale.quantity,
          size: filteredVariants.find(v => v.id === newSale.variantId)?.size || '',
          color: filteredVariants.find(v => v.id === newSale.variantId)?.color || ''
        })
        .eq('id', selectedSale.id);

      if (error) throw error;

      // Update local state
      const updatedSales = sales.map(sale => 
        sale.id === selectedSale.id 
          ? {
              ...sale,
              productName: selectedProduct?.name || sale.productName,
              quantity: newSale.quantity,
              total: newSale.price * newSale.quantity,
              size: filteredVariants.find(v => v.id === newSale.variantId)?.size || sale.size,
              color: filteredVariants.find(v => v.id === newSale.variantId)?.color || sale.color
            }
          : sale
      );
      
      setSales(updatedSales);
      setIsEditSaleDialogOpen(false);
      setSelectedSale(null);
      toast.success('Venta actualizada con éxito');
    } catch (error) {
      console.error('Error updating sale:', error);
      toast.error('Error al actualizar la venta');
    }
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;
    
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', selectedSale.id);

      if (error) throw error;

      setSales(sales.filter(sale => sale.id !== selectedSale.id));
      setIsDeleteDialogOpen(false);
      setSelectedSale(null);
      toast.success('Venta eliminada con éxito');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Error al eliminar la venta');
    }
  };

  const openEditDialog = (sale: Sale) => {
    setSelectedSale(sale);
    setNewSale({
      productId: sale.id,
      variantId: '',
      quantity: sale.quantity,
      price: 39.9
    });
    setIsEditSaleDialogOpen(true);
  };

  const openDeleteDialog = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };

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
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(sale)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Sale Dialog */}
      <Dialog open={isEditSaleDialogOpen} onOpenChange={setIsEditSaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Venta</DialogTitle>
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
            <Button variant="outline" onClick={() => setIsEditSaleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSale} className="bg-luneblue hover:bg-luneblue-dark">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la venta del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSale}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
