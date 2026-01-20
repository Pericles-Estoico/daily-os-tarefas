import { useState, useMemo } from 'react';
import { useOps } from '@/contexts/OpsContext';
import { Product, ProductTypeStrategy } from '@/types/marketplace-ops';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Package, Star, Search } from 'lucide-react';
import { toast } from 'sonner';

export function Produtos() {
  const { state, updateState } = useOps();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [filterChampion, setFilterChampion] = useState<string>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTypeStrategy, setFormTypeStrategy] = useState<ProductTypeStrategy>('SINGLE');
  const [formIsChampion, setFormIsChampion] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(state.products.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [state.products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return state.products.filter(product => {
      const matchesSearch = 
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      const matchesStrategy = filterStrategy === 'all' || product.typeStrategy === filterStrategy;
      const matchesChampion = 
        filterChampion === 'all' || 
        (filterChampion === 'yes' && product.isChampion) ||
        (filterChampion === 'no' && !product.isChampion);
      
      return matchesSearch && matchesCategory && matchesStrategy && matchesChampion;
    });
  }, [state.products, searchTerm, filterCategory, filterStrategy, filterChampion]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: state.products.length,
      champions: state.products.filter(p => p.isChampion).length,
      single: state.products.filter(p => p.typeStrategy === 'SINGLE').length,
      kit: state.products.filter(p => p.typeStrategy === 'KIT').length,
      both: state.products.filter(p => p.typeStrategy === 'BOTH').length,
    };
  }, [state.products]);

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormName('');
    setFormCategory('');
    setFormTypeStrategy('SINGLE');
    setFormIsChampion(false);
    setFormNotes('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormSku(product.sku);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormTypeStrategy(product.typeStrategy);
    setFormIsChampion(product.isChampion);
    setFormNotes(product.notes);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formSku.trim() || !formName.trim()) {
      toast.error('SKU e Nome são obrigatórios');
      return;
    }

    const productData: Product = {
      sku: formSku.trim(),
      name: formName.trim(),
      category: formCategory.trim(),
      typeStrategy: formTypeStrategy,
      isChampion: formIsChampion,
      notes: formNotes.trim(),
    };

    updateState((prev) => {
      if (editingProduct) {
        // Edit existing
        const products = prev.products.map(p => 
          p.sku === editingProduct.sku ? productData : p
        );
        toast.success('Produto atualizado com sucesso!');
        return { ...prev, products };
      } else {
        // Create new
        if (prev.products.some(p => p.sku === productData.sku)) {
          toast.error('SKU já existe!');
          return prev;
        }
        toast.success('Produto criado com sucesso!');
        return { ...prev, products: [...prev.products, productData] };
      }
    });

    setIsDialogOpen(false);
  };

  const handleDelete = (sku: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    updateState((prev) => ({
      ...prev,
      products: prev.products.filter(p => p.sku !== sku),
    }));
    
    toast.success('Produto excluído com sucesso!');
  };

  const getStrategyBadge = (strategy: ProductTypeStrategy) => {
    const colors = {
      SINGLE: 'bg-blue-500',
      KIT: 'bg-purple-500',
      BOTH: 'bg-green-500',
    };
    return <Badge className={colors[strategy]}>{strategy}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Produtos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o catálogo de produtos (SKUs)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do produto (SKU)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="Ex: PROD-001"
                    disabled={!!editingProduct}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nome do produto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Eletrônicos"
                  />
                </div>
                <div>
                  <Label htmlFor="strategy">Estratégia de Tipo</Label>
                  <Select value={formTypeStrategy} onValueChange={(v) => setFormTypeStrategy(v as ProductTypeStrategy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">SINGLE (unitário)</SelectItem>
                      <SelectItem value="KIT">KIT (combo)</SelectItem>
                      <SelectItem value="BOTH">BOTH (ambos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="champion"
                  checked={formIsChampion}
                  onCheckedChange={(checked) => setFormIsChampion(!!checked)}
                />
                <Label htmlFor="champion" className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Produto Campeão
                </Label>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observações sobre o produto..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingProduct ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campeões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.champions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SINGLE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.single}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">KIT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.kit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">BOTH</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.both}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="SKU ou Nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filterCategory">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filterCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStrategy">Estratégia</Label>
              <Select value={filterStrategy} onValueChange={setFilterStrategy}>
                <SelectTrigger id="filterStrategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="SINGLE">SINGLE</SelectItem>
                  <SelectItem value="KIT">KIT</SelectItem>
                  <SelectItem value="BOTH">BOTH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterChampion">Campeão</Label>
              <Select value={filterChampion} onValueChange={setFilterChampion}>
                <SelectTrigger id="filterChampion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Lista de todos os produtos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estratégia</TableHead>
                  <TableHead>Campeão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.sku}>
                    <TableCell className="font-mono font-semibold">
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>{getStrategyBadge(product.typeStrategy)}</TableCell>
                    <TableCell>
                      {product.isChampion && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(product.sku)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
