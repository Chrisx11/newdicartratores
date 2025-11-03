import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const emptyFornecedor = { nome: '', doc: '', tipoDoc: 'CPF', telefone: '', endereco: '', responsavel: '' };

function maskTelefone(v) {
  v = v.replace(/\D/g, '');
  v = v.replace(/^55/, '');
  if (v.length > 11) v = v.slice(0, 11);
  let r = '+55 ';
  if (v.length > 0) r += '(' + v.substring(0, 2);
  if (v.length >= 3) r += ') ' + v.substring(2, v.length > 6 ? (v.length === 11 ? 7 : 6) : v.length);
  if (v.length >= 7) r += '-' + v.substring(v.length > 6 ? (v.length === 11 ? 7 : 6) : 0);
  return r;
}
function maskCPF(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return v;
}
function maskCNPJ(v) {
  v = v.replace(/\D/g, '').slice(0, 14);
  v = v.replace(/(\d{2})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1/$2');
  v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  return v;
}

const Fornecedores = () => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState(emptyFornecedor);
  const [fornecedores, setFornecedores] = useState([]);
  const [docIsCnpj, setDocIsCnpj] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('nome');
  const [sortAsc, setSortAsc] = useState(true);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [editIndex, setEditIndex] = useState(null);
  const [fornecedorParaEditar, setFornecedorParaEditar] = useState(null);
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState(null);

  // Carregar fornecedores do Supabase ao montar o componente
  useEffect(() => {
    if (user) {
      carregarFornecedores();
    }
  }, [user]);

  const carregarFornecedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar fornecedores:', error);
        toast.error('Erro ao carregar fornecedores');
        return;
      }

      // Converter do formato do Supabase para o formato esperado
      const fornecedoresFormatados = (data || []).map(fornecedor => ({
        id: fornecedor.id,
        nome: fornecedor.nome,
        doc: fornecedor.doc,
        tipoDoc: fornecedor.tipo_doc,
        telefone: fornecedor.telefone || '',
        endereco: fornecedor.endereco || '',
        responsavel: fornecedor.responsavel || '',
      }));

      setFornecedores(fornecedoresFormatados);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  let fornecedoresFiltrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    f.doc.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
    f.telefone.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
    (f.endereco && f.endereco.toLowerCase().includes(search.toLowerCase())) ||
    (f.responsavel && f.responsavel.toLowerCase().includes(search.toLowerCase()))
  );
  fornecedoresFiltrados = fornecedoresFiltrados.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
    return 0;
  });
  const totalPages = Math.ceil(fornecedoresFiltrados.length / perPage) || 1;
  const paginated = fornecedoresFiltrados.slice((page-1)*perPage, page*perPage);

  const handleOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setNovoFornecedor(emptyFornecedor);
      setEditIndex(null);
      setFornecedorParaEditar(null);
      setDocIsCnpj(false);
    }
  };

  const handleSalvarFornecedor = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Converter para formato do Supabase
      const dadosSupabase = {
        nome: novoFornecedor.nome.trim(),
        doc: novoFornecedor.doc,
        tipo_doc: novoFornecedor.tipoDoc,
        telefone: novoFornecedor.telefone || null,
        endereco: novoFornecedor.endereco?.trim() || null,
        responsavel: novoFornecedor.responsavel?.trim() || null,
        user_id: user.id,
      };

      if (fornecedorParaEditar) {
        // Atualizar fornecedor existente
        const { error } = await supabase
          .from('fornecedores')
          .update(dadosSupabase)
          .eq('id', fornecedorParaEditar.id);

        if (error) {
          console.error('Erro ao atualizar fornecedor:', error);
          toast.error('Erro ao atualizar fornecedor');
          return;
        }

        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        // Criar novo fornecedor
        const { error } = await supabase
          .from('fornecedores')
          .insert([dadosSupabase]);

        if (error) {
          console.error('Erro ao criar fornecedor:', error);
          toast.error('Erro ao criar fornecedor');
          return;
        }

        toast.success('Fornecedor cadastrado com sucesso!');
      }

      // Recarregar lista
      await carregarFornecedores();
      setDialogOpen(false);
      setNovoFornecedor(emptyFornecedor);
      setEditIndex(null);
      setFornecedorParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleExcluirFornecedor = async () => {
    if (!fornecedorParaExcluir) return;

    try {
      const fornecedorId = typeof fornecedorParaExcluir === 'number' 
        ? fornecedores[fornecedorParaExcluir]?.id 
        : fornecedorParaExcluir.id;

      if (!fornecedorId) {
        toast.error('Erro ao identificar fornecedor');
        return;
      }

      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', fornecedorId);

      if (error) {
        console.error('Erro ao excluir fornecedor:', error);
        toast.error('Erro ao excluir fornecedor');
        return;
      }

      toast.success('Fornecedor excluído com sucesso!');
      await carregarFornecedores();
      setExcluirDialogOpen(false);
      setFornecedorParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error('Erro ao excluir fornecedor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus fornecedores
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editIndex !== null ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSalvarFornecedor();
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <span className="font-medium">CPF</span>
                <Switch checked={docIsCnpj} onCheckedChange={v => {
                  setDocIsCnpj(v); setNovoFornecedor(n => ({ ...n, tipoDoc: v ? 'CNPJ' : 'CPF', doc: '' }));
                }} />
                <span className="font-medium">CNPJ</span>
              </div>
              <Input placeholder="Nome" value={novoFornecedor.nome} required onChange={e => setNovoFornecedor(n => ({ ...n, nome: e.target.value }))} />
              <Input
                placeholder={docIsCnpj ? 'CNPJ' : 'CPF'}
                value={docIsCnpj ? maskCNPJ(novoFornecedor.doc) : maskCPF(novoFornecedor.doc)}
                required
                onChange={e => {
                  setNovoFornecedor(n => ({
                    ...n,
                    doc: e.target.value.replace(/\D/g, '').slice(0, docIsCnpj ? 14 : 11)
                  }));
                }}
                maxLength={docIsCnpj ? 18 : 14}
              />
              <Input
                type="tel"
                placeholder="+55 (__) _____-____"
                maxLength={19}
                value={maskTelefone(novoFornecedor.telefone)}
                required
                onInput={e => {
                  const input = e.target.value;
                  setNovoFornecedor(n => ({ ...n, telefone: input.replace(/\D/g, '').replace(/^55/, '').slice(0, 11) }));
                }}
              />
              <Input 
                placeholder="Endereço" 
                value={novoFornecedor.endereco || ''} 
                onChange={e => setNovoFornecedor(n => ({ ...n, endereco: e.target.value }))} 
              />
              <Input 
                placeholder="Responsável" 
                value={novoFornecedor.responsavel || ''} 
                onChange={e => setNovoFornecedor(n => ({ ...n, responsavel: e.target.value }))} 
              />
              <DialogFooter>
                <Button type="submit">{editIndex !== null ? 'Salvar Alterações' : 'Cadastrar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 justify-between">
            <Input placeholder="Buscar nome, documento ou telefone" value={search} onChange={e=>{setSearch(e.target.value); setPage(1);}} className="max-w-xs" />
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
                  <TableHead onClick={()=>{setSortBy('nome'); setSortAsc(sortBy==='nome'?!sortAsc:true);}} className="cursor-pointer">Nome {sortBy==='nome' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('tipoDoc'); setSortAsc(sortBy==='tipoDoc'?!sortAsc:true);}} className="cursor-pointer">Tipo</TableHead>
                  <TableHead onClick={()=>{setSortBy('doc'); setSortAsc(sortBy==='doc'?!sortAsc:true);}} className="cursor-pointer">Documento {sortBy==='doc' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('telefone'); setSortAsc(sortBy==='telefone'?!sortAsc:true);}} className="cursor-pointer">Telefone {sortBy==='telefone' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('endereco'); setSortAsc(sortBy==='endereco'?!sortAsc:true);}} className="cursor-pointer">Endereço {sortBy==='endereco' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead onClick={()=>{setSortBy('responsavel'); setSortAsc(sortBy==='responsavel'?!sortAsc:true);}} className="cursor-pointer">Responsável {sortBy==='responsavel' ? (sortAsc?'▲':'▼') : ''}</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado.</TableCell>
                  </TableRow>
                ) : paginated.map((f, idx) => {
                  const realIdx = (page-1)*perPage+idx;
                  return (
                    <TableRow key={f.id || `fornecedor-${idx}`}>
                      <TableCell>{f.nome}</TableCell>
                      <TableCell>{f.tipoDoc}</TableCell>
                      <TableCell>{f.tipoDoc === 'CNPJ' ? maskCNPJ(f.doc) : maskCPF(f.doc)}</TableCell>
                      <TableCell>{maskTelefone(f.telefone)}</TableCell>
                      <TableCell>{f.endereco || '-'}</TableCell>
                      <TableCell>{f.responsavel || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              const fornecedor = fornecedores[realIdx];
                              setNovoFornecedor(fornecedor);
                              setDocIsCnpj(fornecedor.tipoDoc === 'CNPJ');
                              setEditIndex(realIdx);
                              setFornecedorParaEditar(fornecedor);
                              setDialogOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setFornecedorParaExcluir(fornecedores[realIdx]);
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

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {fornecedorParaExcluir && 
                `Tem certeza que deseja excluir o fornecedor "${fornecedorParaExcluir.nome}"? Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setExcluirDialogOpen(false);
              setFornecedorParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirFornecedor}
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

export default Fornecedores;
