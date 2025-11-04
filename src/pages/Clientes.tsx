import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, MoreVertical, Users } from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/skeleton';
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

const emptyCliente = { nome: '', doc: '', tipoDoc: 'CPF', telefone: '', endereco: '' };

// Função para aplicar máscara de telefone
function maskTelefone(v) {
  v = v.replace(/\D/g, ''); // remove tudo que não é número
  v = v.replace(/^55/, ''); // remove o 55 inicial se tiver
  if (v.length > 11) v = v.slice(0, 11); // limita a 11 dígitos (DDD + 9)
  let r = '+55 ';
  if (v.length > 0) r += '(' + v.substring(0, 2);
  if (v.length >= 3) r += ') ' + v.substring(2, v.length > 6 ? (v.length === 11 ? 7 : 6) : v.length);
  if (v.length >= 7) r += '-' + v.substring(v.length > 6 ? (v.length === 11 ? 7 : 6) : 0);
  return r;
}
// Máscara CPF
function maskCPF(v) {
  v = v.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return v;
}
// Máscara CNPJ
function maskCNPJ(v) {
  v = v.replace(/\D/g, '').slice(0, 14);
  v = v.replace(/(\d{2})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1/$2');
  v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  return v;
}

const Clientes = () => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoCliente, setNovoCliente] = useState(emptyCliente);
  const [clientes, setClientes] = useState([]);
  const [docIsCnpj, setDocIsCnpj] = useState(false);
  const [loading, setLoading] = useState(true);
  // Tabela
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('nome');
  const [sortAsc, setSortAsc] = useState(true);
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [editIndex, setEditIndex] = useState(null);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

  // Carregar clientes do Supabase ao montar o componente
  useEffect(() => {
    if (user) {
      carregarClientes();
    }
  }, [user]);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar clientes');
        return;
      }

      // Converter do formato do Supabase para o formato esperado
      const clientesFormatados = (data || []).map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        doc: cliente.doc,
        tipoDoc: cliente.tipo_doc,
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
      }));

      setClientes(clientesFormatados);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  // Filtro + Ordenação
  let clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.doc.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
    c.telefone.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
    (c.endereco && c.endereco.toLowerCase().includes(search.toLowerCase()))
  );
  clientesFiltrados = clientesFiltrados.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
    return 0;
  });
  const totalPages = Math.ceil(clientesFiltrados.length / perPage) || 1;
  const paginated = clientesFiltrados.slice((page-1)*perPage, page*perPage);

  // Limpar ao fechar modal
  const handleOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      setNovoCliente(emptyCliente);
      setEditIndex(null);
      setClienteParaEditar(null);
      setDocIsCnpj(false);
    }
  };

  const handleSalvarCliente = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Converter para formato do Supabase
      const dadosSupabase = {
        nome: novoCliente.nome.trim(),
        doc: novoCliente.doc,
        tipo_doc: novoCliente.tipoDoc,
        telefone: novoCliente.telefone || null,
        endereco: novoCliente.endereco?.trim() || null,
        user_id: user.id,
      };

      if (clienteParaEditar) {
        // Atualizar cliente existente
        const { error } = await supabase
          .from('clientes')
          .update(dadosSupabase)
          .eq('id', clienteParaEditar.id);

        if (error) {
          console.error('Erro ao atualizar cliente:', error);
          toast.error('Erro ao atualizar cliente');
          return;
        }

        toast.success('Cliente atualizado com sucesso!');
      } else {
        // Criar novo cliente
        const { error } = await supabase
          .from('clientes')
          .insert([dadosSupabase]);

        if (error) {
          console.error('Erro ao criar cliente:', error);
          toast.error('Erro ao criar cliente');
          return;
        }

        toast.success('Cliente cadastrado com sucesso!');
      }

      // Recarregar lista
      await carregarClientes();
      setDialogOpen(false);
      setNovoCliente(emptyCliente);
      setEditIndex(null);
      setClienteParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleExcluirCliente = async () => {
    if (!clienteParaExcluir) return;

    try {
      const clienteId = typeof clienteParaExcluir === 'number' 
        ? clientes[clienteParaExcluir]?.id 
        : clienteParaExcluir.id;

      if (!clienteId) {
        toast.error('Erro ao identificar cliente');
        return;
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (error) {
        console.error('Erro ao excluir cliente:', error);
        toast.error('Erro ao excluir cliente');
        return;
      }

      toast.success('Cliente excluído com sucesso!');
      await carregarClientes();
      setExcluirDialogOpen(false);
      setClienteParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  return (
    <div className="space-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Clientes</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Gerencie seus clientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editIndex !== null ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSalvarCliente();
              }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4">
                <span className="font-medium">CPF</span>
                <Switch checked={docIsCnpj} onCheckedChange={v => {
                  setDocIsCnpj(v); setNovoCliente(n => ({ ...n, tipoDoc: v ? 'CNPJ' : 'CPF', doc: '' }));
                }} />
                <span className="font-medium">CNPJ</span>
              </div>
              <Input placeholder="Nome" value={novoCliente.nome} required onChange={e => setNovoCliente(n => ({ ...n, nome: e.target.value }))} />
              <Input
                placeholder={docIsCnpj ? 'CNPJ' : 'CPF'}
                value={docIsCnpj ? maskCNPJ(novoCliente.doc) : maskCPF(novoCliente.doc)}
                required
                onChange={e => {
                  setNovoCliente(n => ({
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
                value={maskTelefone(novoCliente.telefone)}
                required
                onInput={e => {
                  const input = e.target.value;
                  // Armazena só os dígitos internamente
                  setNovoCliente(n => ({ ...n, telefone: input.replace(/\D/g, '').replace(/^55/, '').slice(0, 11) }));
                }}
              />
              <Input 
                placeholder="Endereço" 
                value={novoCliente.endereco || ''} 
                onChange={e => setNovoCliente(n => ({ ...n, endereco: e.target.value }))} 
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
          <CardTitle>Lista de Clientes</CardTitle>
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
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowSkeleton colCount={6} />
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        icon={Users}
                        title={clientesFiltrados.length === 0 && clientes.length === 0 
                          ? "Nenhum cliente cadastrado" 
                          : "Nenhum cliente encontrado"}
                        description={clientesFiltrados.length === 0 && clientes.length === 0
                          ? "Comece adicionando seu primeiro cliente ao sistema."
                          : `Nenhum cliente corresponde à busca "${search}".`}
                        action={clientesFiltrados.length === 0 && clientes.length === 0 ? {
                          label: "Cadastrar Cliente",
                          onClick: () => setDialogOpen(true)
                        } : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ) : paginated.map((c, idx) => {
                  const realIdx = (page-1)*perPage+idx;
                  return (
                    <TableRow key={c.id || `cliente-${idx}`}>
                      <TableCell>{c.nome}</TableCell>
                      <TableCell>{c.tipoDoc}</TableCell>
                      <TableCell>{c.tipoDoc === 'CNPJ' ? maskCNPJ(c.doc) : maskCPF(c.doc)}</TableCell>
                      <TableCell>{maskTelefone(c.telefone)}</TableCell>
                      <TableCell>{c.endereco || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              const cliente = clientes[realIdx];
                              setNovoCliente(cliente);
                              setDocIsCnpj(cliente.tipoDoc === 'CNPJ');
                              setEditIndex(realIdx);
                              setClienteParaEditar(cliente);
                              setDialogOpen(true);
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setClienteParaExcluir(clientes[realIdx]);
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
              {clienteParaExcluir && 
                `Tem certeza que deseja excluir o cliente "${clienteParaExcluir.nome}"? Esta ação não pode ser desfeita.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setExcluirDialogOpen(false);
              setClienteParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirCliente}
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

export default Clientes;
