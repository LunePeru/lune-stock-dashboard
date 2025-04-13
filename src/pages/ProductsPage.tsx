import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description?: string;
  totalStock: number;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface Size {
  id: string;
  name: string;
}

interface Color {
  id: string;
  name: string;
  hex: string;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '' });
  
  const [sizes] = useState<Size[]>([
    { id: 's1', name: 'S' },
    { id: 's2', name: 'M' },
    { id: 's3', name: 'L' },
    { id: 's4', name: 'XL' },
  ]);
  
  const [colors] = useState<Color[]>([
    { id: 'c1', name: 'Negro', hex: '#000000' },
    { id: 'c2', name: 'Blanco', hex: '#FFFFFF' },
    { id: 'c3', name: 'Azul', hex: '#0000FF' },
    { id: 'c4', name: 'Rojo', hex: '#FF0000' },
    { id: 'c5', name: 'Cream', hex: '#FFFDD0' },
    { id: 'c6', name: 'Dark Green', hex: '#006400' },
    { id: 'c7', name: 'Brown', hex: '#A52A2A' },
  ]);
  
  const [newVariant, setNewVariant] = useState({ 
    productId: '', 
    size: '', 
    color: '', 
    stock: 0 
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');
        
        if (productsError) throw productsError;

        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('*');
        
        if (variantsError) throw variantsError;

        const formattedProducts = productsData.map(product => {
          const productVariants = variantsData
            .filter(variant => variant.product_id === product.id)
            .map(variant => ({
              id: variant.id,
              size: variant.size,
              color: variant.color,
              stock: variant.stock
            }));
          
          const totalStock = productVariants.reduce((sum, variant) => sum + variant.stock, 0);
          
          return {
            id: product.id,
            name: product.name,
            description: product.description || 'Sin descripción',
            totalStock,
            variants: productVariants
          };
        });
        
        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ name: newProduct.name, description: newProduct.description }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newProductWithId = {
        id: data.id,
        name: data.name,
        description: data.description || 'Sin descripción',
        totalStock: 0,
        variants: []
      };
      
      setProducts([...products, newProductWithId]);
      setNewProduct({ name: '', description: '' });
      setIsAddDialogOpen(false);
      toast.success('Producto agregado con éxito');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error al agregar el producto');
    }
  };

  const handleEditProduct = async () => {
    if (!currentProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ name: currentProduct.name, description: currentProduct.description })
        .eq('id', currentProduct.id);
      
      if (error) throw error;
      
      const updatedProducts = products.map(product => 
        product.id === currentProduct.id ? currentProduct : product
      );
      
      setProducts(updatedProducts);
      setIsEditDialogOpen(false);
      toast.success('Producto actualizado con éxito');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleAddVariant = async () => {
    if (!currentProduct) return;
    
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert([{
          product_id: currentProduct.id,
          size: newVariant.size,
          color: newVariant.color,
          stock: newVariant.stock
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newVariantWithId = {
        id: data.id,
        size: data.size,
        color: data.color,
        stock: data.stock
      };
      
      const updatedProduct = {
        ...currentProduct,
        variants: [...currentProduct.variants, newVariantWithId],
        totalStock: currentProduct.totalStock + newVariant.stock
      };
      
      const updatedProducts = products.map(product => 
        product.id === currentProduct.id ? updatedProduct : product
      );
      
      setProducts(updatedProducts);
      setCurrentProduct(updatedProduct);
      setNewVariant({ productId: '', size: '', color: '', stock: 0 });
      setIsVariantDialogOpen(false);
      toast.success('Variante agregada con éxito');
    } catch (error) {
      console.error('Error adding variant:', error);
      toast.error('Error al agregar la variante');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-gray-500">Gestiona tus productos y variantes</p>
        </div>
        
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-luneblue hover:bg-luneblue-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar productos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Stock Total</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.totalStock}</TableCell>
                    <TableCell>{product.variants.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setCurrentProduct(product);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-luneblue border-luneblue hover:bg-luneblue hover:text-white"
                          onClick={() => {
                            setCurrentProduct(product);
                            setNewVariant({ 
                              productId: product.id, 
                              size: '', 
                              color: '', 
                              stock: 0 
                            });
                            setIsVariantDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Variante</span>
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
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Ej: Polo Básico"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Ej: Polo de algodón 100%, corte regular"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddProduct}
              disabled={!newProduct.name}
              className="bg-luneblue hover:bg-luneblue-dark"
            >
              Guardar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          {currentProduct && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre del Producto</Label>
                <Input
                  id="edit-name"
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={currentProduct.description}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditProduct}
              className="bg-luneblue hover:bg-luneblue-dark"
            >
              Actualizar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Variante</DialogTitle>
          </DialogHeader>
          {currentProduct && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-500">
                Producto: <span className="font-medium">{currentProduct.name}</span>
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="variant-size">Talla</Label>
                <Select
                  value={newVariant.size}
                  onValueChange={(value) => setNewVariant({ ...newVariant, size: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar talla" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size.id} value={size.name}>
                        {size.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="variant-color">Color</Label>
                <Select
                  value={newVariant.color}
                  onValueChange={(value) => setNewVariant({ ...newVariant, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.id} value={color.name}>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2 border border-gray-200" 
                            style={{ backgroundColor: color.hex }}
                          ></div>
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="variant-stock">Cantidad en Stock</Label>
                <Input
                  id="variant-stock"
                  type="number"
                  min="0"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddVariant}
              disabled={!newVariant.size || !newVariant.color || newVariant.stock <= 0}
              className="bg-luneblue hover:bg-luneblue-dark"
            >
              Agregar Variante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage;
