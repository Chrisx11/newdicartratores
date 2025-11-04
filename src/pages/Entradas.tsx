import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MoreVertical, ArrowDownToLine, Package } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Entradas = () => {
  const { user } = useAuth();
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [novaEntrada, setNovaEntrada] = useState({ produtoId: '', quantidade: '' });
  const [entradas, setEntradas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [editEntradaIndex, setEditEntradaIndex] = useState(null);
  const [entradaParaEditar, setEntradaParaEditar] = useState(null);
  const [dataOriginal, setDataOriginal] = useState(null);
  const [quantidadeOriginal, setQuantidadeOriginal] = useState(null);
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false);
  const [entradaParaExcluir, setEntradaParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [selecionarProdutoDialogOpen, setSelecionarProdutoDialogOpen] = useState(false);
  const [produtoSearch, setProdutoSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Tabela
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('data');
  const [sortAsc, setSortAsc] = useState(false); // mais recente primeiro
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
        carregarProdutos(),
        carregarEntradas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const carregarEntradas = async () => {
    try {
      const { data, error } = await supabase
        .from('entradas')
        .select('*')
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao carregar entradas:', error);
        toast.error('Erro ao carregar entradas');
        return;
      }

      // Converter do formato do Supabase para o formato esperado
      const entradasFormatadas = (data || []).map(entrada => ({
        id: entrada.id,
        produtoId: entrada.produto_codigo,
        quantidade: entrada.quantidade,
        data: entrada.data,
      }));

      setEntradas(entradasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
      toast.error('Erro ao carregar entradas');
    }
  };

  // Função para formatar data
  const formatarData = (dataISO) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para obter produto por ID/código
  const obterProduto = (produtoId) => {
    return produtos.find(p => p.codigo === produtoId) || null;
  };

  // Função para selecionar produto no diálogo
  const handleSelecionarProduto = (produtoId) => {
    setNovaEntrada(prev => ({ ...prev, produtoId }));
    setSelecionarProdutoDialogOpen(false);
  };

  // Filtro + Ordenação de entradas
  let entradasFiltradas = entradas.filter(e => {
    const produto = obterProduto(e.produtoId);
    if (!produto) return false;
    return (
      formatarData(e.data).toLowerCase().includes(search.toLowerCase()) ||
      produto.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      e.quantidade?.toString().includes(search)
    );
  });

  entradasFiltradas = entradasFiltradas.sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'data') {
      aVal = new Date(a.data).getTime();
      bVal = new Date(b.data).getTime();
    } else if (sortBy === 'codigo') {
      const prodA = obterProduto(a.produtoId);
      const prodB = obterProduto(b.produtoId);
      aVal = prodA?.codigo || '';
      bVal = prodB?.codigo || '';
    } else if (sortBy === 'descricao') {
      const prodA = obterProduto(a.produtoId);
      const prodB = obterProduto(b.produtoId);
      aVal = prodA?.descricao || '';
      bVal = prodB?.descricao || '';
    } else {
      aVal = a[sortBy] || '';
      bVal = b[sortBy] || '';
    }
    
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(entradasFiltradas.length / perPage) || 1;
  const paginated = entradasFiltradas.slice((page-1)*perPage, page*perPage);

  // Função para atualizar o estoque de um produto no Supabase
  const atualizarEstoqueProduto = async (produtoId, quantidadeVariacao) => {
    if (!user) return;

    try {
      const produto = produtos.find(p => p.codigo === produtoId);
      if (!produto || !produto.id) {
        console.error('Produto não encontrado:', produtoId);
        return;
      }

      const estoqueAtual = parseFloat(produto.estoque) || 0;
      const novoEstoque = estoqueAtual + quantidadeVariacao;

      const { error } = await supabase
        .from('produtos')
        .update({ estoque: novoEstoque })
        .eq('id', produto.id);

      if (error) {
        console.error('Erro ao atualizar estoque:', error);
        toast.error('Erro ao atualizar estoque do produto');
        return;
      }

      // Atualizar estado local
      await carregarProdutos();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      toast.error('Erro ao atualizar estoque do produto');
    }
  };

  const handleSalvarEntrada = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!novaEntrada.produtoId || !novaEntrada.quantidade || parseFloat(novaEntrada.quantidade) <= 0) {
      toast.error('Por favor, selecione um produto e informe uma quantidade válida.');
      return;
    }

    const quantidadeNova = parseFloat(novaEntrada.quantidade);
    const produto = produtos.find(p => p.codigo === novaEntrada.produtoId);

    try {
      const dadosSupabase = {
        produto_codigo: novaEntrada.produtoId,
        produto_id: produto?.id || null,
        quantidade: quantidadeNova,
        data: entradaParaEditar && dataOriginal ? dataOriginal : new Date().toISOString(),
        user_id: user.id,
      };

      if (entradaParaEditar) {
        // Editar entrada existente
        const entradaAntiga = entradaParaEditar;
        const quantidadeAntiga = entradaAntiga.quantidade;
        const produtoIdAntigo = entradaAntiga.produtoId;
        
        // Verificar se o produto foi alterado
        if (produtoIdAntigo !== novaEntrada.produtoId) {
          // Produto foi alterado: remover quantidade do produto antigo e adicionar ao novo
          await atualizarEstoqueProduto(produtoIdAntigo, -quantidadeAntiga);
          await atualizarEstoqueProduto(novaEntrada.produtoId, quantidadeNova);
        } else {
          // Mesmo produto: calcular diferença na quantidade
          const diferenca = quantidadeNova - quantidadeAntiga;
          if (diferenca !== 0) {
            await atualizarEstoqueProduto(novaEntrada.produtoId, diferenca);
          }
        }

        // Atualizar entrada no Supabase
        const { error } = await supabase
          .from('entradas')
          .update(dadosSupabase)
          .eq('id', entradaParaEditar.id);

        if (error) {
          console.error('Erro ao atualizar entrada:', error);
          toast.error('Erro ao atualizar entrada');
          return;
        }

        toast.success('Entrada atualizada com sucesso!');
      } else {
        // Nova entrada
        const { error } = await supabase
          .from('entradas')
          .insert([dadosSupabase]);

        if (error) {
          console.error('Erro ao criar entrada:', error);
          toast.error('Erro ao criar entrada');
          return;
        }

        // Adicionar quantidade ao estoque
        await atualizarEstoqueProduto(novaEntrada.produtoId, quantidadeNova);
        toast.success('Entrada registrada com sucesso!');
      }

      // Recarregar dados
      await carregarEntradas();
      
      setNovaEntrada({ produtoId: '', quantidade: '' });
      setEditEntradaIndex(null);
      setEntradaParaEditar(null);
      setDataOriginal(null);
      setQuantidadeOriginal(null);
      setEntradaDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      toast.error('Erro ao salvar entrada');
    }
  };

  const handleEditarEntrada = (index) => {
    const entrada = entradasFiltradas[(page-1)*perPage + index];
    const realIndex = entrada.id
      ? entradas.findIndex(e => e.id === entrada.id)
      : -1;
    
    setNovaEntrada({
      produtoId: entrada.produtoId,
      quantidade: entrada.quantidade.toString()
    });
    setEditEntradaIndex(realIndex);
    setEntradaParaEditar(entrada);
    setDataOriginal(entrada.data); // Guardar a data original para manter ao salvar
    setQuantidadeOriginal(entrada.quantidade); // Guardar a quantidade original para calcular diferença
    setEntradaDialogOpen(true);
  };

  const handleExcluirEntrada = (index) => {
    const entrada = entradasFiltradas[(page-1)*perPage + index];
    // Usar a entrada completa como identificador
    setEntradaParaExcluir(entrada);
    setExcluirDialogOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!entradaParaExcluir || excluindo || !user) return;
    
    setExcluindo(true);
    
    try {
      // Encontrar a entrada usando o ID
      const entradaEncontrada = entradaParaExcluir.id
        ? entradas.find(e => e.id === entradaParaExcluir.id)
        : entradaParaExcluir;

      if (!entradaEncontrada || !entradaEncontrada.id) {
        toast.error('Erro ao identificar entrada');
        return;
      }

      // Subtrair a quantidade do estoque do produto
      await atualizarEstoqueProduto(entradaEncontrada.produtoId, -entradaEncontrada.quantidade);
      
      // Remover a entrada do Supabase
      const { error } = await supabase
        .from('entradas')
        .delete()
        .eq('id', entradaEncontrada.id);

      if (error) {
        console.error('Erro ao excluir entrada:', error);
        toast.error('Erro ao excluir entrada');
        return;
      }

      toast.success('Entrada excluída com sucesso!');
      await carregarEntradas();
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
      toast.error('Erro ao excluir entrada');
    } finally {
      setExcluirDialogOpen(false);
      setEntradaParaExcluir(null);
      setExcluindo(false);
    }
  };

  return (
    <div className="space-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Entradas</h1>
                      <p className="text-muted-foreground mt-2 text-pretty">
              Registre entradas de estoque
            </p>
        </div>
        <Dialog open={entradaDialogOpen} onOpenChange={(open) => {
          setEntradaDialogOpen(open);
          if (open) {
            // Recarregar produtos ao abrir o diálogo
            carregarProdutos();
          } else {
            setNovaEntrada({ produtoId: '', quantidade: '' });
            setEditEntradaIndex(null);
            setEntradaParaEditar(null);
            setDataOriginal(null);
            setQuantidadeOriginal(null);
          }
        }}>
          <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrada
        </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{entradaParaEditar ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
              <DialogDescription>
                Selecione o produto e informe a quantidade da entrada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSalvarEntrada} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto</label>
                {novaEntrada.produtoId ? (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm">
                      {(() => {
                        const produto = obterProduto(novaEntrada.produtoId);
                        return produto ? `${produto.codigo} - ${produto.descricao}` : 'Produto não encontrado';
                      })()}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNovaEntrada(prev => ({ ...prev, produtoId: '' }))}
                    >
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelecionarProdutoDialogOpen(true)}
                    disabled={produtos.length === 0}
                  >
                    Selecionar produto
                  </Button>
                )}
                {produtos.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto cadastrado. Cadastre produtos na página de Produtos primeiro.
                  </p>
                )}
              </div>
              <Input 
                type="number" 
                placeholder="Quantidade" 
                value={novaEntrada.quantidade} 
                onChange={e => setNovaEntrada(p => ({...p, quantidade: e.target.value}))}
                min="0.01"
                step="0.01"
                required
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEntradaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {entradaParaEditar ? 'Salvar' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Histórico de Entradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading text="Carregando entradas..." />
          ) : entradas.length === 0 ? (
            <EmptyState
              icon={ArrowDownToLine}
              title="Nenhuma entrada registrada"
              description="Comece registrando uma nova entrada de produto no estoque."
              action={{
                label: "Nova Entrada",
                onClick: () => setEntradaDialogOpen(true)
              }}
            />
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 justify-between">
                <Input 
                  placeholder="Buscar por data, código ou descrição" 
                  value={search} 
                  onChange={e => {setSearch(e.target.value); setPage(1);}} 
                  className="max-w-xs" 
                />
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
                      <TableHead 
                        onClick={()=>{setSortBy('data'); setSortAsc(sortBy==='data'?!sortAsc:false);}} 
                        className="cursor-pointer"
                      >
                        Data {sortBy==='data' ? (sortAsc?'▲':'▼') : ''}
                      </TableHead>
                      <TableHead 
                        onClick={()=>{setSortBy('codigo'); setSortAsc(sortBy==='codigo'?!sortAsc:true);}} 
                        className="cursor-pointer"
                      >
                        Código {sortBy==='codigo' ? (sortAsc?'▲':'▼') : ''}
                      </TableHead>
                      <TableHead 
                        onClick={()=>{setSortBy('descricao'); setSortAsc(sortBy==='descricao'?!sortAsc:true);}} 
                        className="cursor-pointer"
                      >
                        Descrição {sortBy==='descricao' ? (sortAsc?'▲':'▼') : ''}
                      </TableHead>
                                            <TableHead
                        onClick={()=>{setSortBy('quantidade'); setSortAsc(sortBy==='quantidade'?!sortAsc:true);}}
                        className="cursor-pointer"
                      >
                        Quantidade {sortBy==='quantidade' ? (sortAsc?'▲':'▼') : ''}
                      </TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <EmptyState
                            icon={ArrowDownToLine}
                            title="Nenhuma entrada encontrada"
                            description={entradasFiltradas.length === 0 && entradas.length > 0
                              ? `Nenhuma entrada corresponde à busca "${search}".`
                              : "Tente ajustar os filtros de busca."}
                            className="py-8"
                          />
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((entrada, idx) => {
                      const produto = obterProduto(entrada.produtoId);
                      if (!produto) return null;
                      
                      return (
                        <TableRow key={entrada.id || `${entrada.produtoId}-${entrada.data}-${idx}`}>
                          <TableCell>{formatarData(entrada.data)}</TableCell>
                          <TableCell>{produto.codigo}</TableCell>
                          <TableCell>{produto.descricao}</TableCell>
                          <TableCell>{entrada.quantidade}</TableCell>
                          <TableCell>{produto.unidade || ''}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditarEntrada(idx)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleExcluirEntrada(idx)}
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
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={()=>setPage(page-1)}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={()=>setPage(page+1)}>
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {entradaParaExcluir && (() => {
                const produto = obterProduto(entradaParaExcluir.produtoId);
                return produto 
                  ? `Tem certeza que deseja excluir a entrada de ${entradaParaExcluir.quantidade} ${produto.unidade || ''} do produto ${produto.codigo} - ${produto.descricao}? Esta ação não pode ser desfeita e o estoque será atualizado.`
                  : 'Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita e o estoque será atualizado.';
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setExcluirDialogOpen(false);
              setEntradaParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={selecionarProdutoDialogOpen} onOpenChange={(open) => {
        setSelecionarProdutoDialogOpen(open);
        if (open) {
          // Recarregar produtos ao abrir o diálogo para mostrar estoque atualizado
          carregarProdutos();
        } else {
          // Limpar busca ao fechar o diálogo
          setProdutoSearch('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Produto</DialogTitle>
            <DialogDescription>
              Selecione um produto da lista abaixo. A quantidade em estoque está exibida para cada produto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <Input
              placeholder="Buscar produto por código ou descrição..."
              value={produtoSearch}
              onChange={(e) => setProdutoSearch(e.target.value)}
              className="w-full"
            />
            <div className="overflow-y-auto flex-1 min-h-0 border rounded-md p-2">
              {(() => {
                // Filtrar produtos baseado na busca
                const produtosFiltrados = produtos.filter(produto => {
                  if (!produtoSearch.trim()) return true;
                  const searchLower = produtoSearch.toLowerCase();
                  return (
                    produto.codigo?.toLowerCase().includes(searchLower) ||
                    produto.descricao?.toLowerCase().includes(searchLower) ||
                    produto.categoria?.toLowerCase().includes(searchLower)
                  );
                });

                if (produtos.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum produto cadastrado. Cadastre produtos na página de Produtos primeiro.
                    </p>
                  );
                }

                if (produtosFiltrados.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum produto encontrado com o termo "{produtoSearch}".
                    </p>
                  );
                }

                return (
                  <div className="space-y-2">
                    {produtosFiltrados.map((produto, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-auto p-4 group"
                        onClick={() => handleSelecionarProduto(produto.codigo)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex justify-between w-full items-center mb-1">
                            <span className="font-medium">{produto.codigo} - {produto.descricao}</span>
                          </div>
                          <div className="flex justify-between w-full items-center text-sm text-muted-foreground group-hover:text-accent-foreground/80">
                            <span>Estoque: {produto.estoque || '0'} {produto.unidade || ''}</span>
                            {produto.categoria && (
                              <span className="text-xs">Categoria: {produto.categoria}</span>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSelecionarProdutoDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Entradas;
