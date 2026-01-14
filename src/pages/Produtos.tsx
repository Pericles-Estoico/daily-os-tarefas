import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, Plus, Search, Star, Trophy, ShoppingBag, 
  Layers, ArrowRightLeft, Pencil, Trash2 
} from 'lucide-react';
import type { Product, ProductTypeStrategy } from '@/types';

const TYPE_STRATEGY_OPTIONS: { value: ProductTypeStrategy; label: string; icon: React.ReactNode }[] = [
  { value: 'SINGLE_HERO', label: 'Single Hero', icon: <Star className="h-4 w-4" /> },
  { value: 'KIT_HERO', label: 'Kit Hero', icon: <Layers className="h-4 w-4" /> },
  { value: 'UPSELL', label: 'Upsell', icon: <ArrowRightLeft className="h-4 w-4" /> },
  { value: 'CROSSSELL', label: 'Cross-sell', icon: <ShoppingBag className="h-4 w-4" /> },
];

export default function Produtos() {
  const products = useStore((state) => state.products);
  const marketplaces = useStore((state) => state.marketplaces);
  const addProduct = useStore((state) => state.addProduct);
  const updateProduct = useStore((state) => state.updateProduct);
  const deleteProduct = useStore((state) => state.deleteProduct);

  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    isChampion: false,
    typeStrategy: 'SINGLE_HERO' as ProductTypeStrategy,
    marketplacesSelling: [] as string[],
    notes: '',
  });

  const champions = products.filter(p => p.isChampion);
  const nonChampions = products.filter(p => !p.isChampion);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        name: product.name,
        isChampion: product.isChampion,
        typeStrategy: product.typeStrategy,
        marketplacesSelling: product.marketplacesSelling,
        notes: product.notes,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: '',
        name: '',
        isChampion: false,
        typeStrategy: 'SINGLE_HERO',
        marketplacesSelling: [],
        notes: '',
      });
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.sku || !formData.name) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct({
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
      });
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
    }
  };

  const toggleMarketplace = (mpId: string) => {
    setFormData(prev => ({
      ...prev,
      marketplacesSelling: prev.marketplacesSelling.includes(mpId)
        ? prev.marketplacesSelling.filter(id => id !== mpId)
        : [...prev.marketplacesSelling, mpId],
    }));
  };

  const getTypeIcon = (type: ProductTypeStrategy) => {
    const option = TYPE_STRATEGY_OPTIONS.find(o => o.value === type);
    return option?.icon || <Package className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            {champions.length} campeões Pareto · {products.length} total
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Produto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por SKU ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Strategy Guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Estratégia de Produtos
          </CardTitle>
          <CardDescription>
            Marketplaces preferem singles (ranking). Loja própria prefere kits (AOV).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TYPE_STRATEGY_OPTIONS.map(opt => (
            <div key={opt.value} className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="flex justify-center mb-1">{opt.icon}</div>
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground">
                {products.filter(p => p.typeStrategy === opt.value).length} produtos
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Champions Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Campeões Pareto
        </h2>
        {champions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum campeão definido. Marque produtos como "Campeão" para priorizá-los.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {champions.filter(p => 
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.sku.toLowerCase().includes(search.toLowerCase())
            ).map(product => (
              <Card key={product.id} className="border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                      </div>
                      <p className="font-medium text-sm mb-2">{product.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getTypeIcon(product.typeStrategy)}
                          <span className="ml-1">{product.typeStrategy}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {product.marketplacesSelling.length} canais
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(product)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Other Products */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Outros Produtos
        </h2>
        {nonChampions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum produto adicional cadastrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {nonChampions.filter(p => 
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.sku.toLowerCase().includes(search.toLowerCase())
            ).map(product => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                      <p className="font-medium text-sm mb-2">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {product.typeStrategy}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {product.marketplacesSelling.length} canais
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(product)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Ex: 6006-Branco"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.typeStrategy}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, typeStrategy: v as ProductTypeStrategy }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_STRATEGY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isChampion}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isChampion: checked }))}
              />
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Campeão Pareto
              </Label>
            </div>

            <div>
              <Label>Canais onde está vendendo</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-auto">
                {marketplaces.filter(m => m.isSelling).map(mp => (
                  <div key={mp.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.marketplacesSelling.includes(mp.id)}
                      onCheckedChange={() => toggleMarketplace(mp.id)}
                    />
                    <span className="text-sm">{mp.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o produto..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.sku || !formData.name}>
              {editingProduct ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
