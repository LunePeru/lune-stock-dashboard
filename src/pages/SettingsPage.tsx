import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface Size {
  id: string;
  name: string;
}

interface Color {
  id: string;
  name: string;
  hex: string;
}

const SettingsPage: React.FC = () => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddSizeDialogOpen, setIsAddSizeDialogOpen] = useState(false);
  const [isEditSizeDialogOpen, setIsEditSizeDialogOpen] = useState(false);
  const [currentSize, setCurrentSize] = useState<Size | null>(null);
  const [newSize, setNewSize] = useState('');
  
  const [isAddColorDialogOpen, setIsAddColorDialogOpen] = useState(false);
  const [isEditColorDialogOpen, setIsEditColorDialogOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState<Color | null>(null);
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: sizesData, error: sizesError } = await supabase
          .from('sizes')
          .select('*')
          .order('created_at');

        const { data: colorsData, error: colorsError } = await supabase
          .from('colors')
          .select('*')
          .order('created_at');

        if (sizesError) throw sizesError;
        if (colorsError) throw colorsError;

        setSizes(sizesData || []);
        setColors(colorsData || []);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('No se pudieron cargar las configuraciones');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleAddSize = async () => {
    if (!newSize.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('sizes')
        .insert({ name: newSize.trim() })
        .select();

      if (error) throw error;

      if (data) {
        setSizes([...sizes, data[0]]);
        setNewSize('');
        setIsAddSizeDialogOpen(false);
        toast.success('Talla agregada con éxito');
      }
    } catch (error) {
      console.error('Error adding size:', error);
      toast.error('No se pudo agregar la talla');
    }
  };

  const handleEditSize = async () => {
    if (!currentSize || !currentSize.name.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('sizes')
        .update({ name: currentSize.name })
        .eq('id', currentSize.id)
        .select();

      if (error) throw error;

      if (data) {
        const updatedSizes = sizes.map(size => 
          size.id === currentSize.id ? data[0] : size
        );
        
        setSizes(updatedSizes);
        setIsEditSizeDialogOpen(false);
        toast.success('Talla actualizada con éxito');
      }
    } catch (error) {
      console.error('Error editing size:', error);
      toast.error('No se pudo actualizar la talla');
    }
  };

  const handleDeleteSize = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sizes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedSizes = sizes.filter(size => size.id !== id);
      setSizes(updatedSizes);
      toast.success('Talla eliminada con éxito');
    } catch (error) {
      console.error('Error deleting size:', error);
      toast.error('No se pudo eliminar la talla');
    }
  };

  const handleAddColor = async () => {
    if (!newColor.name.trim() || !newColor.hex.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('colors')
        .insert({
          name: newColor.name.trim(),
          hex: newColor.hex.trim()
        })
        .select();

      if (error) throw error;

      if (data) {
        setColors([...colors, data[0]]);
        setNewColor({ name: '', hex: '#000000' });
        setIsAddColorDialogOpen(false);
        toast.success('Color agregado con éxito');
      }
    } catch (error) {
      console.error('Error adding color:', error);
      toast.error('No se pudo agregar el color');
    }
  };

  const handleEditColor = async () => {
    if (!currentColor || !currentColor.name.trim() || !currentColor.hex.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('colors')
        .update({
          name: currentColor.name,
          hex: currentColor.hex
        })
        .eq('id', currentColor.id)
        .select();

      if (error) throw error;

      if (data) {
        const updatedColors = colors.map(color => 
          color.id === currentColor.id ? data[0] : color
        );
        
        setColors(updatedColors);
        setIsEditColorDialogOpen(false);
        toast.success('Color actualizado con éxito');
      }
    } catch (error) {
      console.error('Error editing color:', error);
      toast.error('No se pudo actualizar el color');
    }
  };

  const handleDeleteColor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedColors = colors.filter(color => color.id !== id);
      setColors(updatedColors);
      toast.success('Color eliminado con éxito');
    } catch (error) {
      console.error('Error deleting color:', error);
      toast.error('No se pudo eliminar el color');
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
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-gray-500">Administra tallas, colores y otros ajustes del sistema</p>
      </div>
      
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sizes">Tallas</TabsTrigger>
          <TabsTrigger value="colors">Colores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="colors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Colores Disponibles</CardTitle>
              <Button 
                onClick={() => {
                  setNewColor({ name: '', hex: '#000000' });
                  setIsAddColorDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Color
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Código Hex</TableHead>
                    <TableHead>Muestra</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No hay colores configurados
                      </TableCell>
                    </TableRow>
                  ) : (
                    colors.map((color) => (
                      <TableRow key={color.id}>
                        <TableCell className="font-medium">{color.name}</TableCell>
                        <TableCell>{color.hex}</TableCell>
                        <TableCell>
                          <div 
                            className="w-8 h-8 rounded-full border border-gray-200" 
                            style={{ backgroundColor: color.hex }}
                          ></div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setCurrentColor(color);
                                setIsEditColorDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteColor(color.id)}
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
        </TabsContent>
        
        <TabsContent value="sizes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Tallas Disponibles</CardTitle>
              <Button 
                onClick={() => {
                  setNewSize('');
                  setIsAddSizeDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Talla
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talla</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                        No hay tallas configuradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    sizes.map((size) => (
                      <TableRow key={size.id}>
                        <TableCell className="font-medium">{size.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setCurrentSize(size);
                                setIsEditSizeDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteSize(size.id)}
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
        </TabsContent>
      </Tabs>
      
      <Dialog open={isAddSizeDialogOpen} onOpenChange={setIsAddSizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Talla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="size-name">Nombre de la Talla</Label>
              <Input
                id="size-name"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Ej: XL, XXL, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSizeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSize}
              disabled={!newSize.trim()}
            >
              Guardar Talla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditSizeDialogOpen} onOpenChange={setIsEditSizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Talla</DialogTitle>
          </DialogHeader>
          {currentSize && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-size-name">Nombre de la Talla</Label>
                <Input
                  id="edit-size-name"
                  value={currentSize.name}
                  onChange={(e) => setCurrentSize({ ...currentSize, name: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSizeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditSize}
              disabled={!currentSize?.name.trim()}
            >
              Actualizar Talla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddColorDialogOpen} onOpenChange={setIsAddColorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="color-name">Nombre del Color</Label>
              <Input
                id="color-name"
                value={newColor.name}
                onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                placeholder="Ej: Azul Marino, Verde Oliva, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color-hex">Código Hexadecimal</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="color-hex"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                  placeholder="#000000"
                />
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={newColor.hex}
                    onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">Vista previa:</span>
                <div 
                  className="w-8 h-8 rounded-full border border-gray-200" 
                  style={{ backgroundColor: newColor.hex }}
                ></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddColorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddColor}
              disabled={!newColor.name.trim() || !newColor.hex.trim()}
            >
              Guardar Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditColorDialogOpen} onOpenChange={setIsEditColorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Color</DialogTitle>
          </DialogHeader>
          {currentColor && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-color-name">Nombre del Color</Label>
                <Input
                  id="edit-color-name"
                  value={currentColor.name}
                  onChange={(e) => setCurrentColor({ ...currentColor, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color-hex">Código Hexadecimal</Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="edit-color-hex"
                    value={currentColor.hex}
                    onChange={(e) => setCurrentColor({ ...currentColor, hex: e.target.value })}
                  />
                  <div className="flex items-center space-x-2">
                    <Input
                      type="color"
                      value={currentColor.hex}
                      onChange={(e) => setCurrentColor({ ...currentColor, hex: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">Vista previa:</span>
                  <div 
                    className="w-8 h-8 rounded-full border border-gray-200" 
                    style={{ backgroundColor: currentColor.hex }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditColorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditColor}
              disabled={!currentColor?.name.trim() || !currentColor?.hex.trim()}
            >
              Actualizar Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
