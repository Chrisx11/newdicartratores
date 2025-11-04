import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Tag, Ruler, Pencil, Trash2, PackageCheck, MoreVertical, X, Package } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Função para formatar valores monetários com separadores de milhar
function formatarMoeda(valor) {
  if (!valor || valor === 0) return '-';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Função para ordenação numérica natural (ex: "Prateleira 1", "Prateleira 2", "Prateleira 10")
function ordenacaoNatural(a, b) {
  return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

const Produtos = () => {
  const { user } = useAuth();
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  const [localizacao, setLocalizacao] = useState({ corredor: '', prateleira: '', sessao: '' });
  const [localizacoes, setLocalizacoes] = useState([]); // lista de localizações criadas
  const [localizacoesCompletas, setLocalizacoesCompletas] = useState([]); // lista completa com IDs
  const [tab, setTab] = useState('todas');
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [categoriasCompletas, setCategoriasCompletas] = useState([]); // lista completa com IDs
  const [unidadeDialogOpen, setUnidadeDialogOpen] = useState(false);
  const [unidade, setUnidade] = useState('');
  const [unidades, setUnidades] = useState([]);
  const [unidadesCompletas, setUnidadesCompletas] = useState([]); // lista completa com IDs
  const [locTab, setLocTab] = useState('corredor');
  const [locInput, setLocInput] = useState('');
  const [produtoDialogOpen, setProdutoDialogOpen] = useState(false);
  const [novoProduto, setNovoProduto] = useState({ codigo: '', descricao: '', categoria: '', unidade: '', corredor: '', prateleira: '', sessao: '', estoque: '', preco: '' });
  const [produtos, setProdutos] = useState([]);
  const [editProdutoIndex, setEditProdutoIndex] = useState(null);
  const [produtoParaEditar, setProdutoParaEditar] = useState(null);
  const [ajustarEstoqueDialogOpen, setAjustarEstoqueDialogOpen] = useState(false);
  const [produtoAjusteEstoque, setProdutoAjusteEstoque] = useState(null);
  const [novoEstoque, setNovoEstoque] = useState('');
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tabela
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('codigo');
  const [sortAsc, setSortAsc] = useState(true);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);

  // Carregar dados do Supabase ao montar o componente
  useEffect(() => {
    if (user) {
      carregarTodosDados();
    }
  }, [user]);

  const carregarTodosDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarCategorias(),
        carregarUnidades(),
        carregarLocalizacoes(),
        carregarProdutos()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }

      const categoriasData = data || [];
      setCategoriasCompletas(categoriasData);
      setCategorias(categoriasData.map(c => c.nome).sort());
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar unidades:', error);
        return;
      }

      const unidadesData = data || [];
      setUnidadesCompletas(unidadesData);
      setUnidades(unidadesData.map(u => u.nome).sort());
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    }
  };

  const carregarLocalizacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('localizacoes')
        .select('*')
        .order('tipo', { ascending: true });

      if (error) {
        console.error('Erro ao carregar localizações:', error);
        return;
      }

      const localizacoesData = data || [];
      setLocalizacoesCompletas(localizacoesData);

      // Converter para o formato esperado pelo componente
      const localizacoesFormatadas = localizacoesData.map(loc => {
        const obj = { corredor: '', prateleira: '', sessao: '' };
        obj[loc.tipo] = loc.valor;
        return obj;
      });

      setLocalizacoes(localizacoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar localizações:', error);
    }
  };

  const handleExcluirCategoria = async (categoriaNome) => {
    if (!user) return;

    try {
      const categoriaParaExcluir = categoriasCompletas.find(c => c.nome === categoriaNome);
      if (!categoriaParaExcluir) return;

      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoriaParaExcluir.id);

      if (error) {
        console.error('Erro ao excluir categoria:', error);
        toast.error('Erro ao excluir categoria');
        return;
      }

      toast.success('Categoria excluída com sucesso!');
      await carregarCategorias();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleExcluirUnidade = async (unidadeNome) => {
    if (!user) return;

    try {
      const unidadeParaExcluir = unidadesCompletas.find(u => u.nome === unidadeNome);
      if (!unidadeParaExcluir) return;

      const { error } = await supabase
        .from('unidades')
        .delete()
        .eq('id', unidadeParaExcluir.id);

      if (error) {
        console.error('Erro ao excluir unidade:', error);
        toast.error('Erro ao excluir unidade');
        return;
      }

      toast.success('Unidade excluída com sucesso!');
      await carregarUnidades();
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      toast.error('Erro ao excluir unidade');
    }
  };

  const handleExcluirLocalizacao = async (tipo, valor) => {
    if (!user) return;

    try {
      const localizacaoParaExcluir = localizacoesCompletas.find(l => l.tipo === tipo && l.valor === valor);
      if (!localizacaoParaExcluir) return;

      const { error } = await supabase
        .from('localizacoes')
        .delete()
        .eq('id', localizacaoParaExcluir.id);

      if (error) {
        console.error('Erro ao excluir localização:', error);
        toast.error('Erro ao excluir localização');
        return;
      }

      toast.success('Localização excluída com sucesso!');
      await carregarLocalizacoes();
    } catch (error) {
      console.error('Erro ao excluir localização:', error);
      toast.error('Erro ao excluir localização');
    }
  };

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('codigo', { ascending: true });

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        toast.error('Erro ao carregar produtos');
        return;
      }

      // Converter do formato do Supabase para o formato esperado
      const produtosFormatados = (data || []).map(produto => ({
        id: produto.id,
        codigo: produto.codigo,
        descricao: produto.descricao,
        categoria: produto.categoria || '',
        unidade: produto.unidade || '',
        corredor: produto.corredor || '',
        prateleira: produto.prateleira || '',
        sessao: produto.sessao || '',
        estoque: produto.estoque ? produto.estoque.toString() : '0',
        preco: produto.preco ? produto.preco.toString() : '0',
      }));

      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const handleAddLocal = async () => {
    if (!locInput.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('localizacoes')
        .insert([{
          tipo: locTab,
          valor: locInput.trim(),
          user_id: user.id
        }]);

      if (error) {
        console.error('Erro ao criar localização:', error);
        toast.error('Erro ao criar localização');
        return;
      }

      toast.success('Localização cadastrada com sucesso!');
      await carregarLocalizacoes();
      setLocInput('');
    } catch (error) {
      console.error('Erro ao criar localização:', error);
      toast.error('Erro ao criar localização');
    }
  };

  // Filtro + Ordenação de produtos
  let produtosFiltrados = produtos.filter(p =>
    p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(search.toLowerCase()) ||
    p.unidade?.toLowerCase().includes(search.toLowerCase()) ||
    p.corredor?.toLowerCase().includes(search.toLowerCase()) ||
    p.prateleira?.toLowerCase().includes(search.toLowerCase()) ||
    p.sessao?.toLowerCase().includes(search.toLowerCase()) ||
    p.estoque?.toString().includes(search)
  );
  produtosFiltrados = produtosFiltrados.sort((a, b) => {
    const aVal = a[sortBy] || '';
    const bVal = b[sortBy] || '';
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });
  const totalPages = Math.ceil(produtosFiltrados.length / perPage) || 1;
  const paginated = produtosFiltrados.slice((page-1)*perPage, page*perPage);

  return (
    <div className="space-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Produtos</h1>
                      <p className="text-muted-foreground mt-2 text-pretty">
              Gerencie seu estoque de produtos
            </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={localDialogOpen} onOpenChange={setLocalDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <MapPin className="h-4 w-4 mr-2" /> Localizações
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Localizações</DialogTitle>
              </DialogHeader>
              {/* Botões de seleção */}
              <div className="flex gap-2 mb-3">
                <Button variant={locTab==='corredor' ? 'default' : 'secondary'} size="sm" onClick={()=>setLocTab('corredor')}>Corredor</Button>
                <Button variant={locTab==='prateleira' ? 'default' : 'secondary'} size="sm" onClick={()=>setLocTab('prateleira')}>Prateleira</Button>
                <Button variant={locTab==='sessao' ? 'default' : 'secondary'} size="sm" onClick={()=>setLocTab('sessao')}>Sessão</Button>
              </div>
              <form onSubmit={e => { e.preventDefault(); handleAddLocal(); }} className="flex gap-2 mb-2">
                <Input className="flex-1" placeholder={locTab.charAt(0).toUpperCase() + locTab.slice(1)} value={locInput} onChange={e => setLocInput(e.target.value)} />
                <Button type="submit">Cadastrar</Button>
              </form>
              <div className="font-medium mb-1 mt-3 text-muted-foreground">Cadastrados</div>
              <ul className="max-h-40 overflow-auto bg-muted rounded px-2 py-1">
                {
                  (() => {
                    let uniques;
                    if(locTab==='corredor') uniques = [...new Set(localizacoes.filter(l=>l.corredor).map(l=>l.corredor))].sort(ordenacaoNatural);
                    if(locTab==='prateleira') uniques = [...new Set(localizacoes.filter(l=>l.prateleira).map(l=>l.prateleira))].sort(ordenacaoNatural);
                    if(locTab==='sessao') uniques = [...new Set(localizacoes.filter(l=>l.sessao).map(l=>l.sessao))].sort(ordenacaoNatural);
                    return uniques.length === 0 
                      ? <li className="text-muted-foreground">Nenhum {locTab} cadastrado.</li>
                      : uniques.map((v, i) => (
                        <li key={i} className="py-1 border-b border-muted-foreground/10 last:border-none flex items-center justify-between group">
                          <span>{v}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleExcluirLocalizacao(locTab, v)}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </li>
                      ));
                  })()
                }
              </ul>
              <div className="flex justify-end mt-3">
                <Button type="button" variant="secondary" onClick={()=>setLocalDialogOpen(false)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Tag className="h-4 w-4 mr-2" /> Categorias
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
              </DialogHeader>
              <form onSubmit={async (e) => { 
                e.preventDefault(); 
                if (!categoria.trim() || !user) return;

                try {
                  const { error } = await supabase
                    .from('categorias')
                    .insert([{
                      nome: categoria.trim(),
                      user_id: user.id
                    }]);

                  if (error) {
                    console.error('Erro ao criar categoria:', error);
                    toast.error('Erro ao criar categoria');
                    return;
                  }

                  toast.success('Categoria cadastrada com sucesso!');
                  await carregarCategorias();
                  setCategoria('');
                } catch (error) {
                  console.error('Erro ao criar categoria:', error);
                  toast.error('Erro ao criar categoria');
                }
              }} className="flex flex-col gap-2">
                <Input placeholder="Nova categoria" value={categoria} onChange={e => setCategoria(e.target.value)} />
                <Button type="submit">Cadastrar</Button>
              </form>
              <div className="mt-4">
                <div className="font-medium mb-1 text-muted-foreground">Cadastradas</div>
                <ul className="max-h-40 overflow-auto bg-muted rounded px-2 py-1">
                  {categorias.length === 0
                    ? <li className="text-muted-foreground">Nenhuma categoria cadastrada.</li>
                    : categorias.map((c, i) => (
                        <li key={i} className="py-1 border-b border-muted-foreground/10 last:border-none flex items-center justify-between group">
                          <span>{c}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleExcluirCategoria(c)}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </li>
                      ))}
                </ul>
              </div>
              <div className="flex justify-end mt-3">
                <Button type="button" variant="secondary" onClick={()=>setCatDialogOpen(false)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={unidadeDialogOpen} onOpenChange={setUnidadeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Ruler className="h-4 w-4 mr-2" /> Unidades
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Unidade</DialogTitle>
              </DialogHeader>
              <form onSubmit={async (e) => { 
                e.preventDefault(); 
                if (!unidade.trim() || !user) return;

                try {
                  const { error } = await supabase
                    .from('unidades')
                    .insert([{
                      nome: unidade.trim(),
                      user_id: user.id
                    }]);

                  if (error) {
                    console.error('Erro ao criar unidade:', error);
                    toast.error('Erro ao criar unidade');
                    return;
                  }

                  toast.success('Unidade cadastrada com sucesso!');
                  await carregarUnidades();
                  setUnidade('');
                } catch (error) {
                  console.error('Erro ao criar unidade:', error);
                  toast.error('Erro ao criar unidade');
                }
              }} className="flex flex-col gap-2">
                <Input placeholder="Nova unidade" value={unidade} onChange={e => setUnidade(e.target.value)} />
                <Button type="submit">Cadastrar</Button>
              </form>
              <div className="mt-4">
                <div className="font-medium mb-1 text-muted-foreground">Cadastradas</div>
                <ul className="max-h-40 overflow-auto bg-muted rounded px-2 py-1">
                  {unidades.length === 0
                    ? <li className="text-muted-foreground">Nenhuma unidade cadastrada.</li>
                    : unidades.map((u, i) => (
                        <li key={i} className="py-1 border-b border-muted-foreground/10 last:border-none flex items-center justify-between group">
                          <span>{u}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleExcluirUnidade(u)}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </li>
                      ))}
                </ul>
              </div>
              <div className="flex justify-end mt-3">
                <Button type="button" variant="secondary" onClick={()=>setUnidadeDialogOpen(false)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={produtoDialogOpen} onOpenChange={(open) => {
            setProdutoDialogOpen(open);
            if (!open) {
              setNovoProduto({ codigo: '', descricao: '', categoria: '', unidade: '', corredor: '', prateleira: '', sessao: '', estoque: '', preco: '' });
              setEditProdutoIndex(null);
              setProdutoParaEditar(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editProdutoIndex !== null ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                <DialogDescription>Preencha os dados do produto.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                if (!user) {
                  toast.error('Usuário não autenticado');
                  return;
                }

                try {
                  const dadosSupabase = {
                    codigo: novoProduto.codigo.trim(),
                    descricao: novoProduto.descricao.trim(),
                    categoria: novoProduto.categoria || null,
                    unidade: novoProduto.unidade || null,
                    corredor: novoProduto.corredor || null,
                    prateleira: novoProduto.prateleira || null,
                    sessao: novoProduto.sessao || null,
                    estoque: parseFloat(novoProduto.estoque) || 0,
                    preco: parseFloat(novoProduto.preco) || 0,
                    user_id: user.id,
                  };

                  if (produtoParaEditar) {
                    // Atualizar produto existente
                    const { error } = await supabase
                      .from('produtos')
                      .update(dadosSupabase)
                      .eq('id', produtoParaEditar.id);

                    if (error) {
                      console.error('Erro ao atualizar produto:', error);
                      toast.error('Erro ao atualizar produto');
                      return;
                    }

                    toast.success('Produto atualizado com sucesso!');
                  } else {
                    // Criar novo produto
                    const { error } = await supabase
                      .from('produtos')
                      .insert([dadosSupabase]);

                    if (error) {
                      console.error('Erro ao criar produto:', error);
                      toast.error('Erro ao criar produto');
                      return;
                    }

                    toast.success('Produto cadastrado com sucesso!');
                  }

                  await carregarProdutos();
                  setNovoProduto({ codigo: '', descricao: '', categoria: '', unidade: '', corredor: '', prateleira: '', sessao: '', estoque: '', preco: '' });
                  setEditProdutoIndex(null);
                  setProdutoParaEditar(null);
                  setProdutoDialogOpen(false);
                } catch (error) {
                  console.error('Erro ao salvar produto:', error);
                  toast.error('Erro ao salvar produto');
                }
              }}>
                <Input placeholder="Código" value={novoProduto.codigo} onChange={e=>setNovoProduto(p => ({...p, codigo: e.target.value}))} />
                <Input placeholder="Descrição" value={novoProduto.descricao} onChange={e=>setNovoProduto(p => ({...p, descricao: e.target.value}))} />
                <Combobox
                  options={categorias}
                  value={novoProduto.categoria}
                  onValueChange={(v) => setNovoProduto(p => ({...p, categoria: v}))}
                  placeholder="Categoria"
                  searchPlaceholder="Buscar categoria..."
                  emptyMessage="Nenhuma categoria encontrada."
                />
                <Combobox
                  options={unidades}
                  value={novoProduto.unidade}
                  onValueChange={(v) => setNovoProduto(p => ({...p, unidade: v}))}
                  placeholder="Unidade"
                  searchPlaceholder="Buscar unidade..."
                  emptyMessage="Nenhuma unidade encontrada."
                />
                {(() => {
                  const corredores = [...new Set(localizacoes.filter(l=>l.corredor).map(l=>l.corredor))].sort(ordenacaoNatural);
                  return (
                    <Combobox
                      options={corredores}
                      value={novoProduto.corredor}
                      onValueChange={(v) => setNovoProduto(p => ({...p, corredor: v}))}
                      placeholder="Corredor"
                      searchPlaceholder="Buscar corredor..."
                      emptyMessage="Nenhum corredor encontrado."
                    />
                  );
                })()}
                {(() => {
                  const prateleiras = [...new Set(localizacoes.filter(l=>l.prateleira).map(l=>l.prateleira))].sort(ordenacaoNatural);
                  return (
                    <Combobox
                      options={prateleiras}
                      value={novoProduto.prateleira}
                      onValueChange={(v) => setNovoProduto(p => ({...p, prateleira: v}))}
                      placeholder="Prateleira"
                      searchPlaceholder="Buscar prateleira..."
                      emptyMessage="Nenhuma prateleira encontrada."
                    />
                  );
                })()}
                {(() => {
                  const sessoes = [...new Set(localizacoes.filter(l=>l.sessao).map(l=>l.sessao))].sort(ordenacaoNatural);
                  return (
                    <Combobox
                      options={sessoes}
                      value={novoProduto.sessao}
                      onValueChange={(v) => setNovoProduto(p => ({...p, sessao: v}))}
                      placeholder="Sessão"
                      searchPlaceholder="Buscar sessão..."
                      emptyMessage="Nenhuma sessão encontrada."
                    />
                  );
                })()}
                <Input 
                  type="number" 
                  placeholder="Valor Unitário (R$)" 
                  value={novoProduto.preco} 
                  onChange={e=>setNovoProduto(p => ({...p, preco: e.target.value}))}
                  min="0"
                  step="0.01"
                />
                <Input 
                  type="number" 
                  placeholder="Estoque Inicial" 
                  value={novoProduto.estoque} 
                  onChange={e=>setNovoProduto(p => ({...p, estoque: e.target.value}))}
                  min="0"
                  step="0.01"
                />
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={()=>setProdutoDialogOpen(false)}>Fechar</Button>
                  <Button type="submit">Registrar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Catálogo de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <Input placeholder="Buscar produto" value={search} onChange={e=>{setSearch(e.target.value); setPage(1);}} className="max-w-xs" />
            <div className="flex items-center gap-2">
              <Select value={perPage+''} onValueChange={v => {setPerPage(+v); setPage(1);}}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 por página</SelectItem>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={()=>{setSortBy('codigo'); setSortAsc(sortBy==='codigo'?!sortAsc:true);}} className="cursor-pointer">Código {sortBy==='codigo' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('descricao'); setSortAsc(sortBy==='descricao'?!sortAsc:true);}} className="cursor-pointer">Descrição {sortBy==='descricao' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('categoria'); setSortAsc(sortBy==='categoria'?!sortAsc:true);}} className="cursor-pointer">Categoria {sortBy==='categoria' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('corredor'); setSortAsc(sortBy==='corredor'?!sortAsc:true);}} className="cursor-pointer">Corredor {sortBy==='corredor' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('prateleira'); setSortAsc(sortBy==='prateleira'?!sortAsc:true);}} className="cursor-pointer">Prateleira {sortBy==='prateleira' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('sessao'); setSortAsc(sortBy==='sessao'?!sortAsc:true);}} className="cursor-pointer">Sessão {sortBy==='sessao' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('estoque'); setSortAsc(sortBy==='estoque'?!sortAsc:true);}} className="cursor-pointer">Estoque {sortBy==='estoque' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('unidade'); setSortAsc(sortBy==='unidade'?!sortAsc:true);}} className="cursor-pointer">Unidade {sortBy==='unidade' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('preco'); setSortAsc(sortBy==='preco'?!sortAsc:true);}} className="cursor-pointer text-right">Valor Unitário {sortBy==='preco' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowSkeleton colCount={11} />
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="p-0">
                      <EmptyState
                        icon={Package}
                        title={produtos.length === 0 
                          ? "Nenhum produto cadastrado" 
                          : "Nenhum produto encontrado"}
                        description={produtos.length === 0
                          ? "Comece adicionando seu primeiro produto ao catálogo."
                          : search.trim() !== ''
                            ? `Nenhum produto corresponde à busca "${search}".`
                            : "Tente ajustar os filtros de busca."}
                        action={produtos.length === 0 ? {
                          label: "Cadastrar Produto",
                          onClick: () => setProdutoDialogOpen(true)
                        } : undefined}
                        className="py-8"
                      />
                    </TableCell>
                  </TableRow>
                ) : paginated.map((p, idx) => {
                  const realIdx = (page-1)*perPage+idx;
                  const preco = parseFloat(p.preco) || 0;
                  const estoque = parseFloat(p.estoque) || 0;
                  const valorTotal = preco * estoque;
                  return (
                    <TableRow key={p.id || `produto-${idx}`}>
                      <TableCell>{p.codigo}</TableCell>
                      <TableCell>{p.descricao}</TableCell>
                      <TableCell>{p.categoria}</TableCell>
                      <TableCell>{p.corredor}</TableCell>
                      <TableCell>{p.prateleira}</TableCell>
                      <TableCell>{p.sessao}</TableCell>
                      <TableCell>{p.estoque || '0'}</TableCell>
                      <TableCell>{p.unidade}</TableCell>
                      <TableCell className="text-right">
                        {preco > 0 ? `R$ ${formatarMoeda(preco)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {valorTotal > 0 ? `R$ ${formatarMoeda(valorTotal)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              const produto = produtos[realIdx];
                              setNovoProduto(produto);
                              setEditProdutoIndex(realIdx);
                              setProdutoParaEditar(produto);
                              setProdutoDialogOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setProdutoAjusteEstoque(produtos[realIdx]);
                              setNovoEstoque(produtos[realIdx].estoque || '0');
                              setAjustarEstoqueDialogOpen(true);
                            }}>
                              <PackageCheck className="mr-2 h-4 w-4" />
                              Ajustar Estoque
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setProdutoParaExcluir(produtos[realIdx]);
                                setExcluirDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="pt-4 flex justify-between items-center">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={()=>setPage(page-1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={()=>setPage(page+1)}>Próxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={ajustarEstoqueDialogOpen} onOpenChange={(open) => {
        setAjustarEstoqueDialogOpen(open);
        if (!open) {
          setProdutoAjusteEstoque(null);
          setNovoEstoque('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              {produtoAjusteEstoque && `Ajuste o estoque atual do produto ${produtoAjusteEstoque.codigo} - ${produtoAjusteEstoque.descricao}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!produtoAjusteEstoque || !user) return;
            
            const estoqueValue = parseFloat(novoEstoque);
            if (isNaN(estoqueValue) || estoqueValue < 0) {
              toast.error('Por favor, informe um valor de estoque válido (número maior ou igual a zero).');
              return;
            }

            try {
              const { error } = await supabase
                .from('produtos')
                .update({ estoque: estoqueValue })
                .eq('id', produtoAjusteEstoque.id);

              if (error) {
                console.error('Erro ao ajustar estoque:', error);
                toast.error('Erro ao ajustar estoque');
                return;
              }

              toast.success('Estoque atualizado com sucesso!');
              await carregarProdutos();
              setAjustarEstoqueDialogOpen(false);
              setProdutoAjusteEstoque(null);
              setNovoEstoque('');
            } catch (error) {
              console.error('Erro ao ajustar estoque:', error);
              toast.error('Erro ao ajustar estoque');
            }
          }} className="space-y-4">
            {produtoAjusteEstoque && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estoque Atual:</label>
                  <p className="text-sm text-muted-foreground">{produtoAjusteEstoque.estoque || '0'} {produtoAjusteEstoque.unidade || ''}</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="novoEstoque" className="text-sm font-medium">Novo Estoque:</label>
                  <Input
                    id="novoEstoque"
                    type="number"
                    placeholder="Digite o novo valor de estoque"
                    value={novoEstoque}
                    onChange={(e) => setNovoEstoque(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Unidade: {produtoAjusteEstoque.unidade || 'UN'}</p>
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setAjustarEstoqueDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {produtoParaExcluir && 
                `Tem certeza que deseja excluir o produto "${typeof produtoParaExcluir === 'number' ? produtos[produtoParaExcluir]?.codigo : produtoParaExcluir.codigo} - ${typeof produtoParaExcluir === 'number' ? produtos[produtoParaExcluir]?.descricao : produtoParaExcluir.descricao}"? Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setExcluirDialogOpen(false);
              setProdutoParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!produtoParaExcluir) return;

                try {
                  const produtoId = typeof produtoParaExcluir === 'number' 
                    ? produtos[produtoParaExcluir]?.id 
                    : produtoParaExcluir.id;

                  if (!produtoId) {
                    toast.error('Erro ao identificar produto');
                    return;
                  }

                  const { error } = await supabase
                    .from('produtos')
                    .delete()
                    .eq('id', produtoId);

                  if (error) {
                    console.error('Erro ao excluir produto:', error);
                    toast.error('Erro ao excluir produto');
                    return;
                  }

                  toast.success('Produto excluído com sucesso!');
                  await carregarProdutos();
                  setExcluirDialogOpen(false);
                  setProdutoParaExcluir(null);
                } catch (error) {
                  console.error('Erro ao excluir produto:', error);
                  toast.error('Erro ao excluir produto');
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;
