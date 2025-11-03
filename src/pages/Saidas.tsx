import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, X, ShoppingCart, Pencil, Eye, Package, ChevronUp, ChevronDown, CheckCircle2, MoreVertical, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import { useState, useEffect } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Função para aplicar máscara de telefone
function maskTelefone(v) {
  if (!v) return '';
  v = v.replace(/\D/g, ''); // remove tudo que não é número
  v = v.replace(/^55/, ''); // remove o 55 inicial se tiver
  if (v.length > 11) v = v.slice(0, 11); // limita a 11 dígitos (DDD + 9)
  let r = '+55 ';
  if (v.length > 0) r += '(' + v.substring(0, 2);
  if (v.length >= 3) r += ') ' + v.substring(2, v.length > 6 ? (v.length === 11 ? 7 : 6) : v.length);
  if (v.length >= 7) r += '-' + v.substring(v.length > 6 ? (v.length === 11 ? 7 : 6) : 0);
  return r;
}

// Função para formatar valores monetários com separadores de milhar
function formatarMoeda(valor) {
  if (!valor || valor === 0) return '0,00';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const Saidas = () => {
  const { user } = useAuth();
  const [vendaDialogOpen, setVendaDialogOpen] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [selecionarClienteDialogOpen, setSelecionarClienteDialogOpen] = useState(false);
  const [selecionarProdutoDialogOpen, setSelecionarProdutoDialogOpen] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [produtoSearch, setProdutoSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado da venda
  const [vendaData, setVendaData] = useState({
    clienteId: null, // null = venda à vista (UUID ou null no Supabase)
    produtos: [],
    servicos: [],
    veiculo: '',
    observacoes: '',
    status: 'Em Aberto',
    desconto: ''
  });

  // Estado temporário para adicionar produto/serviço
  const [produtoTemporario, setProdutoTemporario] = useState({ produtoId: '', quantidade: '', fracionado: false });
  const [servicoTemporario, setServicoTemporario] = useState({ descricao: '', valor: '', quantidade: '1' });

  // Estados para tabela e ações
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('data');
  const [sortAsc, setSortAsc] = useState(false); // mais recente primeiro
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [visualizarVendaDialogOpen, setVisualizarVendaDialogOpen] = useState(false);
  const [vendaParaVisualizar, setVendaParaVisualizar] = useState(null);
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false);
  const [vendaParaExcluir, setVendaParaExcluir] = useState(null);
  const [vendaParaEditar, setVendaParaEditar] = useState(null);
  const [sucessoDialogOpen, setSucessoDialogOpen] = useState(false);
  const [totalVendaSucesso, setTotalVendaSucesso] = useState(0);

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
        carregarClientes(),
        carregarProdutos(),
        carregarVendas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
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

  const carregarVendas = async () => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao carregar vendas:', error);
        toast.error('Erro ao carregar vendas');
        return;
      }

      // Converter do formato do Supabase para o formato esperado
      const vendasFormatadas = (data || []).map(venda => ({
        id: venda.id,
        clienteId: venda.cliente_id, // UUID ou null
        produtos: venda.produtos || [],
        servicos: venda.servicos || [],
        veiculo: venda.veiculo || '',
        observacoes: venda.observacoes || '',
        status: venda.status || 'Em Aberto',
        desconto: venda.desconto ? venda.desconto.toString() : '0',
        total: parseFloat(venda.total) || 0,
        data: venda.data,
      }));

      setVendas(vendasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    }
  };

  // Função para obter cliente por ID
  const obterCliente = (clienteId) => {
    if (!clienteId) return null;
    return clientes.find(c => c.id === clienteId) || null;
  };

  // Função para obter produto por código
  const obterProduto = (codigo) => {
    return produtos.find(p => p.codigo === codigo) || null;
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

  // Filtro + Ordenação de vendas
  let vendasFiltradas = vendas.filter(v => {
    const cliente = v.clienteId !== null ? obterCliente(v.clienteId) : null;
    const clienteNome = cliente?.nome || '';
    const clienteDoc = cliente?.doc || '';
    const totalStr = v.total?.toString() || '';
    
    return (
      formatarData(v.data).toLowerCase().includes(search.toLowerCase()) ||
      clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      clienteDoc.toLowerCase().includes(search.toLowerCase()) ||
      totalStr.includes(search) ||
      (v.veiculo && v.veiculo.toLowerCase().includes(search.toLowerCase()))
    );
  });

  vendasFiltradas = vendasFiltradas.sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'data') {
      aVal = new Date(a.data).getTime();
      bVal = new Date(b.data).getTime();
    } else if (sortBy === 'cliente') {
      const clienteA = a.clienteId !== null ? obterCliente(a.clienteId)?.nome || '' : 'Venda à Vista';
      const clienteB = b.clienteId !== null ? obterCliente(b.clienteId)?.nome || '' : 'Venda à Vista';
      aVal = clienteA;
      bVal = clienteB;
    } else {
      aVal = a[sortBy] || '';
      bVal = b[sortBy] || '';
    }
    
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(vendasFiltradas.length / perPage) || 1;
  const paginated = vendasFiltradas.slice((page-1)*perPage, page*perPage);

  // Função para visualizar venda
  const handleVisualizarVenda = (index) => {
    const venda = vendasFiltradas[(page-1)*perPage + index];
    setVendaParaVisualizar(venda);
    setVisualizarVendaDialogOpen(true);
  };

  // Função para gerar PDF da nota fiscal
  const handleEmitirNota = (index) => {
    const venda = vendasFiltradas[(page-1)*perPage + index];
    if (!venda) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Função auxiliar para adicionar linha de texto
    const addText = (text, x, y, options = {}) => {
      const fontSize = options.fontSize || 10;
      const fontStyle = options.fontStyle || 'normal';
      const align = options.align || 'left';
      
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.text(text, x, y, { align });
    };

    // Cabeçalho da nota
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    addText('DICAR TRATORES', pageWidth / 2, 15, { fontSize: 20, fontStyle: 'bold', align: 'center' });
    addText('NOTA FISCAL', pageWidth / 2, 25, { fontSize: 14, fontStyle: 'bold', align: 'center' });
    addText('Nº ' + (venda.id || 'N/A').substring(0, 10), pageWidth / 2, 32, { fontSize: 10, align: 'center' });

    yPosition = 50;

    // Informações da empresa
    addText('EMITENTE', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 7;
    addText('Dicar Tratores', margin, yPosition, { fontSize: 10 });
    yPosition += 5;
    addText('CNPJ: 21.131.995/0001-08', margin, yPosition, { fontSize: 9 });
    yPosition += 5;
    addText('Endereço: R. José Luís Marinho, 114 - Parque Industrial, Italva - RJ, 28250-000', margin, yPosition, { fontSize: 9 });
    yPosition += 10;

    // Informações do cliente
    addText('DESTINATÁRIO', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
    yPosition += 7;
    
    if (venda.clienteId !== null) {
      const cliente = obterCliente(venda.clienteId);
      if (cliente) {
        addText(cliente.nome, margin, yPosition, { fontSize: 10 });
        yPosition += 5;
        if (cliente.doc) {
          const docFormatado = cliente.tipoDoc === 'CNPJ' 
            ? cliente.doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
            : cliente.doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
          addText(`${cliente.tipoDoc}: ${docFormatado}`, margin, yPosition, { fontSize: 9 });
          yPosition += 5;
        }
        if (cliente.telefone) {
          addText(`Telefone: ${maskTelefone(cliente.telefone)}`, margin, yPosition, { fontSize: 9 });
          yPosition += 5;
        }
      }
    } else {
      addText('Venda à Vista', margin, yPosition, { fontSize: 10 });
      yPosition += 5;
    }

    yPosition += 5;

    // Informações da venda
    addText('DATA: ' + formatarData(venda.data), margin, yPosition, { fontSize: 10 });
    addText('STATUS: ' + (venda.status || 'Em Aberto'), pageWidth - margin, yPosition, { fontSize: 10, align: 'right' });
    yPosition += 7;

    if (venda.veiculo) {
      addText('VEÍCULO: ' + venda.veiculo, margin, yPosition, { fontSize: 10 });
      yPosition += 7;
    }

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 7;

    // Inicializar totais
    let totalProdutos = 0;
    let totalServicos = 0;

    // Tabela de produtos
    if (venda.produtos && venda.produtos.length > 0) {
      addText('PRODUTOS', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
      yPosition += 7;

      // Cabeçalho da tabela
      const tableTop = yPosition;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, tableTop - 4, pageWidth - 2 * margin, 6, 'F');
      
      addText('Código', margin + 5, tableTop, { fontSize: 9, fontStyle: 'bold' });
      addText('Descrição', margin + 30, tableTop, { fontSize: 9, fontStyle: 'bold' });
      addText('Qtd', margin + 100, tableTop, { fontSize: 9, fontStyle: 'bold', align: 'right' });
      addText('Unit.', margin + 115, tableTop, { fontSize: 9, fontStyle: 'bold', align: 'right' });
      addText('Total', margin + 150, tableTop, { fontSize: 9, fontStyle: 'bold', align: 'right' });

      yPosition = tableTop + 5;

      venda.produtos.forEach((item) => {
        const produto = obterProduto(item.produtoId);
        const preco = parseFloat(item.preco) || 0;
        const quantidade = parseFloat(item.quantidade) || 0;
        const subtotal = preco * quantidade;
        totalProdutos += subtotal;

        // Quebra de página se necessário
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        addText(produto?.codigo || item.produtoId, margin + 5, yPosition, { fontSize: 8 });
        const descricao = produto?.descricao || 'Produto não encontrado';
        // Quebrar descrição se muito longa
        const maxDescWidth = 60;
        if (descricao.length > maxDescWidth) {
          const descPart1 = descricao.substring(0, maxDescWidth);
          const descPart2 = descricao.substring(maxDescWidth);
          addText(descPart1, margin + 30, yPosition, { fontSize: 8 });
          yPosition += 4;
          addText(descPart2, margin + 30, yPosition, { fontSize: 8 });
        } else {
          addText(descricao, margin + 30, yPosition, { fontSize: 8 });
        }
        
        const qtdText = (item.fracionado ? quantidade.toFixed(1) : Math.floor(quantidade)) + ' ' + (produto?.unidade || '');
        addText(qtdText, margin + 100, yPosition, { fontSize: 8, align: 'right' });
        addText('R$ ' + formatarMoeda(preco), margin + 115, yPosition, { fontSize: 8, align: 'right' });
        addText('R$ ' + formatarMoeda(subtotal), margin + 150, yPosition, { fontSize: 8, align: 'right' });

        yPosition += 6;
      });

      yPosition += 3;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      addText('Subtotal Produtos: R$ ' + formatarMoeda(totalProdutos), pageWidth - margin, yPosition, { fontSize: 10, align: 'right' });
      yPosition += 7;
    }

    // Tabela de serviços
    if (venda.servicos && venda.servicos.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }

      addText('SERVIÇOS', margin, yPosition, { fontSize: 12, fontStyle: 'bold' });
      yPosition += 7;

      const tableTop = yPosition;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, tableTop - 4, pageWidth - 2 * margin, 6, 'F');
      
      addText('Descrição', margin + 5, tableTop, { fontSize: 9, fontStyle: 'bold' });
      addText('Qtd', margin + 100, tableTop, { fontSize: 9, fontStyle: 'bold', align: 'right' });
      addText('Unit.', margin + 115, tableTop, { fontSize: 9, fontStyle: 'bold', align: 'right' });
      addText('Total', margin + 150, tableTop, { fontSize: 9, fontStyle: 'bold', align: 'right' });

      yPosition = tableTop + 5;

      venda.servicos.forEach((servico) => {
        const valor = parseFloat(servico.valor || 0);
        const quantidade = parseInt(servico.quantidade || 1);
        const subtotal = valor * quantidade;
        totalServicos += subtotal;

        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        addText(servico.descricao, margin + 5, yPosition, { fontSize: 8 });
        addText(quantidade + 'x', margin + 100, yPosition, { fontSize: 8, align: 'right' });
        addText('R$ ' + formatarMoeda(valor), margin + 115, yPosition, { fontSize: 8, align: 'right' });
        addText('R$ ' + formatarMoeda(subtotal), margin + 150, yPosition, { fontSize: 8, align: 'right' });

        yPosition += 6;
      });

      yPosition += 3;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      addText('Subtotal Serviços: R$ ' + formatarMoeda(totalServicos), pageWidth - margin, yPosition, { fontSize: 10, align: 'right' });
      yPosition += 7;
    }

    // Total
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    const subtotalGeral = totalProdutos + totalServicos;
    const desconto = parseFloat(venda.desconto) || 0;
    const valorDesconto = subtotalGeral * (desconto / 100);

    yPosition += 5;
    
    // Se houver desconto, mostrar subtotal e desconto antes do total
    if (desconto > 0) {
      addText('Subtotal: R$ ' + formatarMoeda(subtotalGeral), pageWidth - margin, yPosition, { fontSize: 10, align: 'right' });
      yPosition += 6;
      doc.setTextColor(34, 197, 94); // Verde para desconto
      addText('Desconto (' + desconto + '%): -R$ ' + formatarMoeda(valorDesconto), pageWidth - margin, yPosition, { fontSize: 10, align: 'right' });
      doc.setTextColor(0, 0, 0); // Resetar para preto
      yPosition += 6;
    }
    
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F');
    addText('TOTAL GERAL', margin + 5, yPosition + 3, { fontSize: 12, fontStyle: 'bold' });
    addText('R$ ' + formatarMoeda(venda.total || 0), pageWidth - margin - 5, yPosition + 3, { fontSize: 14, fontStyle: 'bold', align: 'right' });

    yPosition += 15;

    // Observações
    if (venda.observacoes) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      addText('OBSERVAÇÕES:', margin, yPosition, { fontSize: 10, fontStyle: 'bold' });
      yPosition += 6;
      
      const observacoes = doc.splitTextToSize(venda.observacoes, pageWidth - 2 * margin);
      observacoes.forEach((line) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        addText(line, margin, yPosition, { fontSize: 9 });
        yPosition += 5;
      });
    }

    // Rodapé
    const footerY = pageHeight - 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    addText('Documento gerado automaticamente pelo sistema Dicar Tratores', pageWidth / 2, footerY + 8, { fontSize: 8, align: 'center' });
    addText('Data de emissão: ' + new Date().toLocaleString('pt-BR'), pageWidth / 2, footerY + 12, { fontSize: 8, align: 'center' });

    // Salvar o PDF
    const fileName = `NotaFiscal_${venda.id?.substring(0, 8) || Date.now()}_${formatarData(venda.data).replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  // Função para excluir venda
  const handleExcluirVenda = (index) => {
    const venda = vendasFiltradas[(page-1)*perPage + index];
    setVendaParaExcluir(venda);
    setExcluirDialogOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!vendaParaExcluir || !user) return;
    
    try {
      // Reverter estoque dos produtos vendidos
      if (vendaParaExcluir.produtos) {
        for (const item of vendaParaExcluir.produtos) {
          const quantidade = parseFloat(item.quantidade || 1);
          await atualizarEstoqueProduto(item.produtoId, quantidade); // Positivo para adicionar de volta
        }
      }
      
      // Remover a venda do Supabase
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', vendaParaExcluir.id);

      if (error) {
        console.error('Erro ao excluir venda:', error);
        toast.error('Erro ao excluir venda');
        return;
      }

      toast.success('Venda excluída com sucesso!');
      await carregarVendas();
      
      setExcluirDialogOpen(false);
      setVendaParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast.error('Erro ao excluir venda');
    }
  };

  // Função para editar venda (abre o diálogo com dados preenchidos)
  const handleEditarVenda = (index) => {
    const venda = vendasFiltradas[(page-1)*perPage + index];
    
    setVendaData({
      clienteId: venda.clienteId, // UUID ou null
      produtos: (venda.produtos || []).map(p => ({
        ...p,
        quantidade: parseFloat(p.quantidade) || 1,
        fracionado: p.fracionado || false
      })),
      servicos: (venda.servicos || []).map(s => ({
        ...s,
        quantidade: parseInt(s.quantidade) || 1
      })),
      veiculo: venda.veiculo || '',
      observacoes: venda.observacoes || '',
      status: venda.status || 'Em Aberto',
      desconto: venda.desconto ? String(venda.desconto) : ''
    });
    
    setVendaParaEditar(venda);
    setVendaDialogOpen(true);
  };

  // Função para selecionar cliente
  const handleSelecionarCliente = (clienteId) => {
    setVendaData(prev => ({ ...prev, clienteId }));
    setSelecionarClienteDialogOpen(false);
    setClienteSearch('');
  };

  // Função para remover cliente
  const handleRemoverCliente = () => {
    setVendaData(prev => ({ ...prev, clienteId: null }));
  };

  // Função para selecionar produto
  const handleSelecionarProduto = (produtoId) => {
    setProdutoTemporario(prev => ({ ...prev, produtoId }));
    setSelecionarProdutoDialogOpen(false);
    setProdutoSearch('');
  };

  // Função para adicionar produto à venda
  const handleAdicionarProduto = () => {
    if (!produtoTemporario.produtoId || !produtoTemporario.quantidade) {
      alert('Por favor, selecione um produto e informe uma quantidade válida.');
      return;
    }

    const produto = obterProduto(produtoTemporario.produtoId);
    if (!produto) {
      alert('Produto não encontrado.');
      return;
    }

    // Verificar quantidade válida
    const quantidade = produtoTemporario.fracionado 
      ? parseFloat(produtoTemporario.quantidade) 
      : parseInt(produtoTemporario.quantidade);
    
    if (quantidade <= 0) {
      alert('Por favor, informe uma quantidade válida.');
      return;
    }

    const estoqueDisponivel = parseFloat(produto.estoque) || 0;
    
    // Verificar estoque disponível
    const quantidadeJaAdicionada = vendaData.produtos
      .filter(p => p.produtoId === produtoTemporario.produtoId)
      .reduce((sum, p) => sum + parseFloat(p.quantidade), 0);
    
    if (quantidadeJaAdicionada + quantidade > estoqueDisponivel) {
      alert(`Estoque insuficiente. Disponível: ${estoqueDisponivel - quantidadeJaAdicionada} ${produto.unidade || ''}`);
      return;
    }

    // Obter o preço do produto, convertendo para número
    const precoUnitario = parseFloat(produto.preco) || 0;
    
    setVendaData(prev => ({
      ...prev,
      produtos: [...prev.produtos, {
        produtoId: produtoTemporario.produtoId,
        quantidade: quantidade,
        preco: precoUnitario,
        fracionado: produtoTemporario.fracionado
      }]
    }));

    setProdutoTemporario({ produtoId: '', quantidade: '', fracionado: false });
  };

  // Função para remover produto da venda
  const handleRemoverProduto = (index) => {
    setVendaData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  // Função para atualizar quantidade de produto
  const handleAtualizarQuantidadeProduto = (index, novaQuantidade) => {
    const item = vendaData.produtos[index];
    const produto = obterProduto(item.produtoId);
    if (!produto) return;
    
    // Se fracionado, permite decimais (1.1, 1.2, etc.), senão apenas inteiros
    let quantidade = item.fracionado ? parseFloat(novaQuantidade) : Math.floor(parseFloat(novaQuantidade));
    
    // Limitar casas decimais para fracionado (1.0 a 1.9 por unidade)
    if (item.fracionado) {
      const parteInteira = Math.floor(quantidade);
      const parteDecimal = quantidade - parteInteira;
      // Limitar a parte decimal a 0.9
      quantidade = parteInteira + Math.min(parteDecimal, 0.9);
      quantidade = Math.round(quantidade * 10) / 10; // Arredondar para 1 casa decimal
    } else {
      quantidade = Math.floor(quantidade);
    }
    
    if (quantidade < (item.fracionado ? 0.1 : 1)) return;
    
    const estoqueDisponivel = parseFloat(produto.estoque) || 0;
    
    // Verificar se não excede estoque (considerando outras quantidades já adicionadas)
    const quantidadeJaAdicionada = vendaData.produtos
      .filter((p, i) => p.produtoId === item.produtoId && i !== index)
      .reduce((sum, p) => sum + parseFloat(p.quantidade), 0);
    
    if (quantidadeJaAdicionada + quantidade > estoqueDisponivel) {
      alert(`Estoque insuficiente. Disponível: ${estoqueDisponivel - quantidadeJaAdicionada} ${produto.unidade || ''}`);
      return;
    }
    
    setVendaData(prev => ({
      ...prev,
      produtos: prev.produtos.map((p, i) => 
        i === index ? { ...p, quantidade: quantidade } : p
      )
    }));
  };

  // Função para alternar modo fracionado do produto
  const handleToggleFracionado = (index) => {
    const item = vendaData.produtos[index];
    const novaQuantidade = item.fracionado 
      ? Math.floor(parseFloat(item.quantidade)) // Converter de fracionado para inteiro
      : parseFloat(item.quantidade); // Manter como está se não estava fracionado
    
    setVendaData(prev => ({
      ...prev,
      produtos: prev.produtos.map((p, i) => 
        i === index ? { ...p, fracionado: !p.fracionado, quantidade: novaQuantidade } : p
      )
    }));
  };

  // Função para adicionar serviço à venda
  const handleAdicionarServico = () => {
    if (!servicoTemporario.descricao || !servicoTemporario.valor || parseFloat(servicoTemporario.valor) <= 0) {
      alert('Por favor, preencha a descrição e valor do serviço.');
      return;
    }

    const quantidade = parseInt(servicoTemporario.quantidade) || 1;
    if (quantidade < 1) {
      alert('A quantidade deve ser no mínimo 1.');
      return;
    }

    setVendaData(prev => ({
      ...prev,
      servicos: [...prev.servicos, {
        descricao: servicoTemporario.descricao,
        valor: parseFloat(servicoTemporario.valor),
        quantidade: quantidade
      }]
    }));

    setServicoTemporario({ descricao: '', valor: '', quantidade: '1' });
  };

  // Função para remover serviço da venda
  const handleRemoverServico = (index) => {
    setVendaData(prev => ({
      ...prev,
      servicos: prev.servicos.filter((_, i) => i !== index)
    }));
  };

  // Função para atualizar quantidade do serviço
  const handleAtualizarQuantidadeServico = (index, novaQuantidade) => {
    if (novaQuantidade < 1) return;
    
    setVendaData(prev => ({
      ...prev,
      servicos: prev.servicos.map((s, i) => 
        i === index ? { ...s, quantidade: novaQuantidade } : s
      )
    }));
  };

  // Função para atualizar o estoque de um produto (reduzir ao vender)
  const atualizarEstoqueProduto = async (produtoId, quantidadeVariacao) => {
    if (!user) return;

    try {
      const produto = produtos.find(p => p.codigo === produtoId);
      if (!produto || !produto.id) {
        console.error('Produto não encontrado:', produtoId);
        return;
      }

      const estoqueAtual = parseFloat(produto.estoque) || 0;
      const novoEstoque = Math.max(0, estoqueAtual + quantidadeVariacao); // Não permite estoque negativo

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

  // Função para finalizar e registrar a venda
  const handleFinalizarVenda = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Validar se há produtos ou serviços
    if (vendaData.produtos.length === 0 && vendaData.servicos.length === 0) {
      toast.error('Adicione pelo menos um produto ou serviço antes de finalizar a venda.');
      return;
    }

    // Validar estoque de todos os produtos antes de processar
    for (const item of vendaData.produtos) {
      const produto = obterProduto(item.produtoId);
      if (!produto) {
        toast.error(`Produto ${item.produtoId} não encontrado.`);
        return;
      }
      const estoqueDisponivel = parseFloat(produto.estoque) || 0;
      const quantidade = parseFloat(item.quantidade) || 0;
      if (quantidade > estoqueDisponivel) {
        toast.error(`Estoque insuficiente para o produto ${produto.codigo} - ${produto.descricao}. Disponível: ${estoqueDisponivel} ${produto.unidade || ''}`);
        return;
      }
    }

    // Calcular total
    const total = calcularTotal();
    const cliente = vendaData.clienteId ? obterCliente(vendaData.clienteId) : null;

    try {
      const dadosSupabase = {
        cliente_id: vendaData.clienteId,
        cliente_codigo: cliente?.doc || null,
        produtos: vendaData.produtos.map(p => ({
          produtoId: p.produtoId,
          quantidade: parseFloat(p.quantidade) || 1,
          preco: parseFloat(p.preco),
          fracionado: p.fracionado || false
        })),
        servicos: vendaData.servicos.map(s => ({
          descricao: s.descricao,
          valor: parseFloat(s.valor),
          quantidade: parseInt(s.quantidade || 1)
        })),
        veiculo: vendaData.veiculo.trim() || null,
        observacoes: vendaData.observacoes.trim() || null,
        status: vendaData.status || 'Em Aberto',
        desconto: parseFloat(vendaData.desconto) || 0,
        total: total,
        user_id: user.id,
      };

      if (vendaParaEditar) {
        // Editar venda existente
        // Primeiro, reverter estoque dos produtos da venda antiga
        if (vendaParaEditar.produtos) {
          for (const item of vendaParaEditar.produtos) {
            await atualizarEstoqueProduto(item.produtoId, parseFloat(item.quantidade));
          }
        }

        // Atualizar no Supabase
        const { error } = await supabase
          .from('vendas')
          .update(dadosSupabase)
          .eq('id', vendaParaEditar.id);

        if (error) {
          console.error('Erro ao atualizar venda:', error);
          toast.error('Erro ao atualizar venda');
          return;
        }

        toast.success('Venda atualizada com sucesso!');
      } else {
        // Nova venda
        const { error } = await supabase
          .from('vendas')
          .insert([dadosSupabase]);

        if (error) {
          console.error('Erro ao criar venda:', error);
          toast.error('Erro ao criar venda');
          return;
        }
      }

      // Atualizar estoque dos produtos (reduzir)
      for (const item of vendaData.produtos) {
        const quantidade = parseFloat(item.quantidade);
        await atualizarEstoqueProduto(item.produtoId, -quantidade);
      }

      // Recarregar dados
      await carregarVendas();

      // Limpar formulário e fechar diálogo
      setVendaData({ clienteId: null, produtos: [], servicos: [], veiculo: '', observacoes: '', status: 'Em Aberto', desconto: '' });
      setProdutoTemporario({ produtoId: '', quantidade: '', fracionado: false });
      setServicoTemporario({ descricao: '', valor: '', quantidade: '1' });
      setVendaParaEditar(null);
      setVendaDialogOpen(false);

      // Mostrar diálogo de sucesso
      setTotalVendaSucesso(total);
      setSucessoDialogOpen(true);
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      toast.error('Erro ao salvar venda');
    }
  };

  // Calcular total da venda
  const calcularTotal = () => {
    const totalProdutos = vendaData.produtos.reduce((sum, p) => {
      // Usar o preço armazenado no item (já vem do produto quando foi adicionado)
      const preco = parseFloat(p.preco) || 0;
      const quantidade = parseFloat(p.quantidade) || 0;
      return sum + (preco * quantidade);
    }, 0);
    
    const totalServicos = vendaData.servicos.reduce((sum, s) => {
      const valor = parseFloat(s.valor || 0);
      const quantidade = parseInt(s.quantidade || 1);
      return sum + (valor * quantidade);
    }, 0);
    
    const subtotal = totalProdutos + totalServicos;
    const descontoPercentual = parseFloat(vendaData.desconto) || 0;
    const valorDesconto = subtotal * (descontoPercentual / 100);
    const total = subtotal - valorDesconto;
    
    return total;
  };

  // Limpar dados ao fechar diálogo
  const handleDialogClose = (open) => {
    setVendaDialogOpen(open);
    if (open) {
      // Recarregar dados ao abrir o diálogo
      carregarClientes();
      carregarProdutos();
    } else {
      setVendaData({ clienteId: null, produtos: [], servicos: [], veiculo: '', observacoes: '', status: 'Em Aberto', desconto: '' });
      setProdutoTemporario({ produtoId: '', quantidade: '', fracionado: false });
      setServicoTemporario({ descricao: '', valor: '', quantidade: '1' });
      setClienteSearch('');
      setProdutoSearch('');
      setVendaParaEditar(null);
    }
  };

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(cliente => {
    if (!clienteSearch.trim()) return true;
    const searchLower = clienteSearch.toLowerCase();
    return (
      cliente.nome?.toLowerCase().includes(searchLower) ||
      cliente.doc?.replace(/\D/g, '').includes(clienteSearch.replace(/\D/g, '')) ||
      cliente.telefone?.replace(/\D/g, '').includes(clienteSearch.replace(/\D/g, ''))
    );
  });

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    if (!produtoSearch.trim()) return true;
    const searchLower = produtoSearch.toLowerCase();
    return (
      produto.codigo?.toLowerCase().includes(searchLower) ||
      produto.descricao?.toLowerCase().includes(searchLower) ||
      produto.categoria?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saídas (PDV)</h1>
          <p className="text-muted-foreground mt-2">
            Ponto de venda e registros de saída
          </p>
        </div>
        <Dialog open={vendaDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[99.75vw] h-[99.75vh] max-w-none max-h-none flex flex-col p-0 left-[0.125vw] top-[0.125vh] translate-x-0 translate-y-0">
            <div className="p-1 border-b">
            <DialogHeader>
              <DialogTitle className="text-lg">{vendaParaEditar ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
            </DialogHeader>
            </div>
            
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Formulário Principal - Lado Esquerdo */}
              <div className="w-[54%] flex flex-col min-h-0 overflow-y-auto border-r bg-background">
                <div className="pt-1 px-2.5 pb-2.5 space-y-1 flex-1">
                  {/* Primeira Linha: Cliente | Adicionar Produto */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Card de Informações do Cliente */}
                    <div className="flex flex-col col-span-2">
                      <Label className="text-xs font-semibold mb-2 block">Informações do Cliente</Label>
                      <Card className="p-3 flex-1">
                        {vendaData.clienteId !== null ? (
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2 p-2 bg-muted/30 border rounded-md">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs truncate">{obterCliente(vendaData.clienteId)?.nome}</p>
                                {obterCliente(vendaData.clienteId)?.doc && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {obterCliente(vendaData.clienteId)?.tipoDoc}: {obterCliente(vendaData.clienteId)?.doc}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoverCliente}
                                className="shrink-0 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => setSelecionarClienteDialogOpen(true)}
                            >
                              Alterar Cliente
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => setSelecionarClienteDialogOpen(true)}
                              disabled={clientes.length === 0}
                            >
                              <Plus className="h-3 w-3 mr-1.5" />
                              Selecionar Cliente
                            </Button>
                            <Badge variant="secondary" className="w-full justify-center py-1 text-[10px]">Venda à Vista</Badge>
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Adicionar Produtos */}
                    <div className="flex flex-col col-span-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <Label className="text-xs font-semibold">Adicionar Produto</Label>
                      </div>
                      <Card className="p-3 flex-1">
                        <div className="space-y-3">
                          {produtoTemporario.produtoId ? (
                            <>
                              <div className="flex items-center gap-1.5 p-1.5 bg-muted rounded-md">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {obterProduto(produtoTemporario.produtoId)?.codigo} - {obterProduto(produtoTemporario.produtoId)?.descricao}
                                  </p>
                                  {obterProduto(produtoTemporario.produtoId)?.estoque !== undefined && (
                                    <p className="text-[10px] text-muted-foreground">
                                      Estoque: {obterProduto(produtoTemporario.produtoId)?.estoque} {obterProduto(produtoTemporario.produtoId)?.unidade || ''}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setProdutoTemporario({ produtoId: '', quantidade: '', fracionado: false })}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-muted-foreground mb-0.5 block">Quantidade</Label>
                                  <Input
                                    type="number"
                                    placeholder={produtoTemporario.fracionado ? "1.0" : "1"}
                                    value={produtoTemporario.quantidade}
                                    onChange={(e) => setProdutoTemporario(prev => ({ ...prev, quantidade: e.target.value }))}
                                    min={produtoTemporario.fracionado ? "0.1" : "1"}
                                    step={produtoTemporario.fracionado ? "0.1" : "1"}
                                    className="w-full h-8 text-xs"
                                  />
                                </div>
                                <div className="flex items-end gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <Checkbox
                                      checked={produtoTemporario.fracionado}
                                      onCheckedChange={(checked) => setProdutoTemporario(prev => ({ ...prev, fracionado: checked === true }))}
                                      className="h-3.5 w-3.5"
                                    />
                                    <Label className="text-[10px]">F</Label>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleAdicionarProduto}
                                    disabled={!produtoTemporario.produtoId || !produtoTemporario.quantidade}
                                    className="h-8 text-xs px-2 flex-1"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Adicionar
                                  </Button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => setSelecionarProdutoDialogOpen(true)}
                              disabled={produtos.length === 0}
                            >
                              <Package className="h-3 w-3 mr-1.5" />
                              Selecionar Produto
                            </Button>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Segunda Linha: Adicionar Serviço | Informações Adicionais */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Adicionar Serviços */}
                    <div className="flex flex-col col-span-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                        <Label className="text-xs font-semibold">Adicionar Serviço</Label>
                      </div>
                      <Card className="p-3 flex-1">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-0.5 block">Descrição</Label>
                            <Input
                              type="text"
                              placeholder="Ex: Troca de óleo, Revisão..."
                              value={servicoTemporario.descricao}
                              onChange={(e) => setServicoTemporario(prev => ({ ...prev, descricao: e.target.value }))}
                              className="w-full h-8 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-muted-foreground mb-0.5 block">Valor Unit. (R$)</Label>
                              <Input
                                type="number"
                                placeholder="0,00"
                                value={servicoTemporario.valor}
                                onChange={(e) => setServicoTemporario(prev => ({ ...prev, valor: e.target.value }))}
                                min="0.01"
                                step="0.01"
                                className="w-full h-8 text-xs"
                              />
                            </div>
                            <div className="flex gap-1.5">
                              <div className="flex-1">
                                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Qtd</Label>
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={servicoTemporario.quantidade}
                                  onChange={(e) => setServicoTemporario(prev => ({ ...prev, quantidade: e.target.value }))}
                                  min="1"
                                  step="1"
                                  className="w-full h-8 text-xs"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleAdicionarServico}
                                  disabled={!servicoTemporario.descricao || !servicoTemporario.valor}
                                  className="h-8 text-xs px-2"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="flex flex-col col-span-2">
                      <Label className="text-xs font-semibold mb-2 block">Informações Adicionais</Label>
                      <Card className="p-3 flex-1">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-0.5 block">Veículo (opcional)</Label>
                            <Input
                              type="text"
                              placeholder="Ex: Trator Modelo X, Ano 2020..."
                              value={vendaData.veiculo}
                              onChange={(e) => setVendaData(prev => ({ ...prev, veiculo: e.target.value }))}
                              className="w-full h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-0.5 block">Observações (opcional)</Label>
                            <Input
                              type="text"
                              placeholder="Adicione observações..."
                              value={vendaData.observacoes}
                              onChange={(e) => setVendaData(prev => ({ ...prev, observacoes: e.target.value }))}
                              className="w-full h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground mb-0.5 block">Status</Label>
                            <Select
                              value={vendaData.status}
                              onValueChange={(value) => setVendaData(prev => ({ ...prev, status: value }))}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pago">Pago</SelectItem>
                                <SelectItem value="Em Aberto">Em Aberto</SelectItem>
                                <SelectItem value="Orçamento">Orçamento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Terceira Linha: Desconto */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Desconto abaixo de Adicionar Serviço */}
                    <div className="flex flex-col col-span-2">
                      <Label className="text-xs font-semibold mb-2 block">Desconto</Label>
                      <Card className="p-3">
                        <div>
                          <Label className="text-[10px] text-muted-foreground mb-0.5 block">Desconto (%)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={vendaData.desconto}
                            onChange={(e) => {
                              const valor = e.target.value;
                              const numValor = parseFloat(valor) || 0;
                              if (numValor >= 0 && numValor <= 100) {
                                setVendaData(prev => ({ ...prev, desconto: valor }));
                              } else if (valor === '') {
                                setVendaData(prev => ({ ...prev, desconto: '' }));
                              }
                            }}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full h-8 text-xs"
                          />
                        </div>
                      </Card>
                    </div>
                    {/* Desconto abaixo de Informações Adicionais (espaço vazio para manter alinhamento) */}
                    <div className="flex flex-col col-span-2">
                    </div>
                  </div>
                </div>
              </div>

              {/* Painel Lateral - Canhoto */}
              <div className="flex-1 border-l bg-gradient-to-b from-muted/50 to-muted/30 flex flex-col min-w-0">
                <div className="p-2.5 border-b bg-background/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      Resumo da Venda
                    </h3>
                    {(vendaData.produtos.length > 0 || vendaData.servicos.length > 0) && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        {(vendaData.produtos.length || 0) + (vendaData.servicos.length || 0)} {((vendaData.produtos.length || 0) + (vendaData.servicos.length || 0)) === 1 ? 'item' : 'itens'}
                      </Badge>
                    )}
                  </div>
                  {vendaData.clienteId !== null && (
                    <div className="p-1.5 bg-muted/50 rounded-md">
                      <p className="font-medium text-xs">{obterCliente(vendaData.clienteId)?.nome}</p>
                      {obterCliente(vendaData.clienteId)?.doc && (
                        <p className="text-muted-foreground text-[10px] mt-0.5">
                          {obterCliente(vendaData.clienteId)?.tipoDoc}: {obterCliente(vendaData.clienteId)?.doc}
                        </p>
                      )}
                    </div>
                  )}
                  {vendaData.clienteId === null && (
                    <Badge variant="secondary" className="w-full justify-center py-1 text-[10px]">Venda à Vista</Badge>
                  )}
                  {vendaData.veiculo && (
                    <div className="mt-1.5 p-1.5 bg-muted/50 rounded-md">
                      <p className="text-[10px] text-muted-foreground">Veículo</p>
                      <p className="font-medium text-xs">{vendaData.veiculo}</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  {vendaData.produtos.length === 0 && vendaData.servicos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                      <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                      <p className="font-medium text-xs">Nenhum item adicionado</p>
                      <p className="text-[10px] mt-0.5">Adicione produtos ou serviços na área ao lado</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                        <h4 className="font-semibold text-[10px] uppercase tracking-wide text-muted-foreground">Itens</h4>
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0.5">
                          {(vendaData.produtos.length || 0) + (vendaData.servicos.length || 0)}
                        </Badge>
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="h-7">
                              <TableHead className="text-[10px] p-1.5">Código</TableHead>
                              <TableHead className="text-[10px] p-1.5">Descrição</TableHead>
                              <TableHead className="text-[10px] p-1.5 text-center">Qtd</TableHead>
                              <TableHead className="text-[10px] p-1.5 text-right">Unit.</TableHead>
                              <TableHead className="text-[10px] p-1.5 text-right">Subtotal</TableHead>
                              <TableHead className="text-[10px] p-1.5 text-center">Status</TableHead>
                              <TableHead className="text-[10px] p-1.5 text-center w-20">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Produtos */}
                            {vendaData.produtos.map((item, index) => {
                              const produto = obterProduto(item.produtoId);
                              const preco = parseFloat(item.preco) || 0;
                              const quantidade = parseFloat(item.quantidade) || 0;
                              const subtotal = preco * quantidade;
                              return (
                                <TableRow key={`produto-${index}`} className="h-auto">
                                  <TableCell className="text-[10px] p-1.5 font-semibold text-primary">{produto?.codigo || '-'}</TableCell>
                                  <TableCell className="text-[10px] p-1.5 text-muted-foreground">{produto?.descricao || '-'}</TableCell>
                                  <TableCell className="text-[10px] p-1.5">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-4 w-4"
                                        onClick={() => {
                                          const decremento = item.fracionado ? 0.1 : 1;
                                          handleAtualizarQuantidadeProduto(index, Math.max(item.fracionado ? 0.1 : 1, quantidade - decremento));
                                        }}
                                      >
                                        <ChevronDown className="h-2 w-2" />
                                      </Button>
                                      <span className="text-[10px] font-medium min-w-[40px] text-center">
                                        {item.fracionado ? quantidade.toFixed(1) : quantidade} {produto?.unidade || ''}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-4 w-4"
                                        onClick={() => {
                                          const produto = obterProduto(item.produtoId);
                                          const estoqueDisponivel = parseFloat(produto?.estoque) || 0;
                                          const quantidadeJaAdicionada = vendaData.produtos
                                            .filter((p, i) => p.produtoId === item.produtoId && i !== index)
                                            .reduce((sum, p) => sum + parseFloat(p.quantidade), 0);
                                          const incremento = item.fracionado ? 0.1 : 1;
                                          const novaQuantidade = quantidade + incremento;
                                          if (quantidadeJaAdicionada + novaQuantidade <= estoqueDisponivel) {
                                            handleAtualizarQuantidadeProduto(index, novaQuantidade);
                                          } else {
                                            alert(`Estoque insuficiente. Disponível: ${estoqueDisponivel - quantidadeJaAdicionada} ${produto?.unidade || ''}`);
                                          }
                                        }}
                                      >
                                        <ChevronUp className="h-2 w-2" />
                                      </Button>
                                      <Checkbox
                                        checked={item.fracionado || false}
                                        onCheckedChange={() => handleToggleFracionado(index)}
                                        className="h-3 w-3 ml-1"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-[10px] p-1.5 text-right">R$ {preco > 0 ? formatarMoeda(preco) : '0,00'}</TableCell>
                                  <TableCell className="text-[10px] p-1.5 text-right font-bold">R$ {subtotal > 0 ? formatarMoeda(subtotal) : '0,00'}</TableCell>
                                  <TableCell className="text-[10px] p-1.5">
                                    <Badge 
                                      variant={
                                        vendaData.status === 'Pago' ? 'default' : 
                                        vendaData.status === 'Em Aberto' ? 'secondary' : 
                                        'outline'
                                      }
                                      className={
                                        vendaData.status === 'Pago' ? 'bg-green-500 hover:bg-green-600' : 
                                        vendaData.status === 'Em Aberto' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 
                                        'bg-blue-500 hover:bg-blue-600 text-white'
                                      }
                                    >
                                      {vendaData.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-[10px] p-1.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleRemoverProduto(index)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {/* Serviços */}
                            {vendaData.servicos.map((servico, index) => {
                              const valor = parseFloat(servico.valor || 0);
                              const quantidade = parseInt(servico.quantidade || 1);
                              const subtotal = valor * quantidade;
                              return (
                                <TableRow key={`servico-${index}`} className="h-auto">
                                  <TableCell className="text-[10px] p-1.5">-</TableCell>
                                  <TableCell className="text-[10px] p-1.5 font-medium">{servico.descricao}</TableCell>
                                  <TableCell className="text-[10px] p-1.5">
                                    <div className="flex items-center justify-center gap-0.5">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-4 w-4"
                                        onClick={() => {
                                          const quantidadeAtual = parseInt(servico.quantidade || 1);
                                          handleAtualizarQuantidadeServico(index, Math.max(1, quantidadeAtual - 1));
                                        }}
                                      >
                                        <ChevronDown className="h-2 w-2" />
                                      </Button>
                                      <span className="text-[10px] font-medium min-w-[30px] text-center">
                                        {quantidade}x
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-4 w-4"
                                        onClick={() => {
                                          const quantidadeAtual = parseInt(servico.quantidade || 1);
                                          handleAtualizarQuantidadeServico(index, quantidadeAtual + 1);
                                        }}
                                      >
                                        <ChevronUp className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-[10px] p-1.5 text-right">R$ {formatarMoeda(valor)}</TableCell>
                                  <TableCell className="text-[10px] p-1.5 text-right font-bold">R$ {formatarMoeda(subtotal)}</TableCell>
                                  <TableCell className="text-[10px] p-1.5">
                                    <Badge 
                                      variant={
                                        vendaData.status === 'Pago' ? 'default' : 
                                        vendaData.status === 'Em Aberto' ? 'secondary' : 
                                        'outline'
                                      }
                                      className={
                                        vendaData.status === 'Pago' ? 'bg-green-500 hover:bg-green-600' : 
                                        vendaData.status === 'Em Aberto' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 
                                        'bg-blue-500 hover:bg-blue-600 text-white'
                                      }
                                    >
                                      {vendaData.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-[10px] p-1.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleRemoverServico(index)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Fixo na Parte Inferior */}
                {(vendaData.produtos.length > 0 || vendaData.servicos.length > 0) && (() => {
                  const subtotalProdutos = vendaData.produtos.reduce((sum, p) => {
                    const preco = parseFloat(p.preco) || 0;
                    const quantidade = parseFloat(p.quantidade) || 0;
                    return sum + (preco * quantidade);
                  }, 0);
                  const subtotalServicos = vendaData.servicos.reduce((sum, s) => {
                    const valor = parseFloat(s.valor || 0);
                    const quantidade = parseInt(s.quantidade || 1);
                    return sum + (valor * quantidade);
                  }, 0);
                  const subtotal = subtotalProdutos + subtotalServicos;
                  const descontoPercentual = parseFloat(vendaData.desconto) || 0;
                  const valorDesconto = subtotal * (descontoPercentual / 100);
                  const total = calcularTotal();
                  
                  return (
                    <div className="p-2.5 border-t bg-background shadow-lg space-y-1">
                      {descontoPercentual > 0 && (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-medium">R$ {formatarMoeda(subtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Desconto ({descontoPercentual}%):</span>
                            <span className="font-medium text-green-600">- R$ {formatarMoeda(valorDesconto)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t">
                        <span className="text-xs font-bold uppercase tracking-wide">Total</span>
                        <span className="text-lg font-bold text-primary">R$ {formatarMoeda(total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <DialogFooter className="p-3 border-t">
              <Button type="button" variant="secondary" size="sm" onClick={() => handleDialogClose(false)}>
                Cancelar
              </Button>
              <Button 
                type="button"
                size="sm"
                disabled={vendaData.produtos.length === 0 && vendaData.servicos.length === 0}
                onClick={handleFinalizarVenda}
              >
                {vendaParaEditar ? 'Salvar Alterações' : 'Finalizar Venda'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de Seleção de Cliente */}
      <Dialog open={selecionarClienteDialogOpen} onOpenChange={(open) => {
        setSelecionarClienteDialogOpen(open);
        if (!open) setClienteSearch('');
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
            <DialogDescription>
              Selecione um cliente da lista ou feche para venda à vista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <Input
              placeholder="Buscar cliente por nome, documento ou telefone..."
              value={clienteSearch}
              onChange={(e) => setClienteSearch(e.target.value)}
              className="w-full"
            />
            <div className="overflow-y-auto flex-1 min-h-0 border rounded-md p-2">
              {clientes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum cliente cadastrado.
                </p>
              ) : clientesFiltrados.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado com o termo "{clienteSearch}".
                </p>
              ) : (
                <div className="space-y-2">
                  {clientesFiltrados.map((cliente) => {
                    return (
                      <Button
                        key={cliente.id}
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => handleSelecionarCliente(cliente.id)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium">{cliente.nome}</span>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            {cliente.doc && (
                              <span>{cliente.tipoDoc}: {cliente.doc}</span>
                            )}
                            {cliente.telefone && (
                              <span>{maskTelefone(cliente.telefone)}</span>
                            )}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSelecionarClienteDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Seleção de Produto */}
      <Dialog open={selecionarProdutoDialogOpen} onOpenChange={(open) => {
        setSelecionarProdutoDialogOpen(open);
        if (open) {
          carregarProdutos();
        } else {
          setProdutoSearch('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Produto</DialogTitle>
            <DialogDescription>
              Selecione um produto da lista abaixo. A quantidade em estoque está exibida.
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
              {produtos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto cadastrado.
                </p>
              ) : produtosFiltrados.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto encontrado com o termo "{produtoSearch}".
                </p>
              ) : (
                <div className="space-y-2">
                  {produtosFiltrados.map((produto, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={() => handleSelecionarProduto(produto.codigo)}
                      disabled={parseFloat(produto.estoque) <= 0}
                    >
                      <div className="flex flex-col items-start w-full">
                        <div className="flex justify-between w-full items-center mb-1">
                          <span className="font-medium">{produto.codigo} - {produto.descricao}</span>
                        </div>
                        <div className="flex justify-between w-full items-center text-sm text-muted-foreground">
                          <span>Estoque: {produto.estoque || '0'} {produto.unidade || ''}</span>
                          {produto.preco && (
                            <span>R$ {formatarMoeda(parseFloat(produto.preco))}</span>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSelecionarProdutoDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">
              Carregando...
            </p>
          ) : vendas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma venda registrada ainda. Clique em "Nova Venda" para começar.
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 justify-between">
                <Input 
                  placeholder="Buscar por data, cliente, veículo ou total" 
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
                        onClick={()=>{setSortBy('cliente'); setSortAsc(sortBy==='cliente'?!sortAsc:true);}} 
                        className="cursor-pointer"
                      >
                        Cliente {sortBy==='cliente' ? (sortAsc?'▲':'▼') : ''}
                      </TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead 
                        onClick={()=>{setSortBy('total'); setSortAsc(sortBy==='total'?!sortAsc:true);}} 
                        className="cursor-pointer text-right"
                      >
                        Total {sortBy==='total' ? (sortAsc?'▲':'▼') : ''}
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma venda encontrada.
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((venda, idx) => {
                      const cliente = venda.clienteId !== null ? obterCliente(venda.clienteId) : null;
                      const totalItens = (venda.produtos?.length || 0) + (venda.servicos?.length || 0);
                      const status = venda.status || 'Em Aberto';
                      
                      return (
                        <TableRow key={venda.id || idx}>
                          <TableCell>{formatarData(venda.data)}</TableCell>
                          <TableCell>
                            {cliente ? cliente.nome : <Badge variant="secondary">Venda à Vista</Badge>}
                          </TableCell>
                          <TableCell>
                            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {venda.total ? formatarMoeda(venda.total) : '0,00'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={
                                status === 'Pago' ? 'default' : 
                                status === 'Em Aberto' ? 'secondary' : 
                                'outline'
                              }
                              className={
                                status === 'Pago' ? 'bg-green-500 hover:bg-green-600 text-white' : 
                                status === 'Em Aberto' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 
                                'bg-blue-500 hover:bg-blue-600 text-white'
                              }
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleVisualizarVenda(idx)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEmitirNota(idx)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Emitir Nota
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditarVenda(idx)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleExcluirVenda(idx)}
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

      {/* Diálogo de Visualização de Venda */}
      <Dialog open={visualizarVendaDialogOpen} onOpenChange={setVisualizarVendaDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes da Venda</DialogTitle>
            <DialogDescription>
              Informações completas da venda registrada
            </DialogDescription>
          </DialogHeader>
          {vendaParaVisualizar && (
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* Cabeçalho com informações principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Data e Hora</Label>
                  <p className="font-semibold text-base mt-1">{formatarData(vendaParaVisualizar.data)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(vendaParaVisualizar.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
                <Card className="p-4">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                  <div className="mt-1">
                    <Badge 
                      variant={
                        vendaParaVisualizar.status === 'Pago' ? 'default' : 
                        vendaParaVisualizar.status === 'Em Aberto' ? 'secondary' : 
                        'outline'
                      }
                      className={
                        vendaParaVisualizar.status === 'Pago' ? 'bg-green-500 hover:bg-green-600 text-white' : 
                        vendaParaVisualizar.status === 'Em Aberto' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 
                        'bg-blue-500 hover:bg-blue-600 text-white'
                      }
                    >
                      {vendaParaVisualizar.status || 'Em Aberto'}
                    </Badge>
                  </div>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Total da Venda</Label>
                  <p className="font-bold text-2xl text-primary mt-1">R$ {vendaParaVisualizar.total ? formatarMoeda(vendaParaVisualizar.total) : '0,00'}</p>
                </Card>
              </div>

              {/* Informações do Cliente */}
              <Card className="p-4">
                <Label className="text-sm font-semibold mb-3 block">Informações do Cliente</Label>
                {vendaParaVisualizar.clienteId !== null ? (() => {
                  const cliente = obterCliente(vendaParaVisualizar.clienteId);
                  if (!cliente) {
                    return <p className="text-muted-foreground">Cliente não encontrado</p>;
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Nome</Label>
                        <p className="font-medium">{cliente.nome}</p>
                      </div>
                      {cliente.doc && (
                        <div>
                          <Label className="text-xs text-muted-foreground">{cliente.tipoDoc}</Label>
                          <p className="font-medium">
                            {cliente.tipoDoc === 'CNPJ' 
                              ? cliente.doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
                              : cliente.doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
                            }
                          </p>
                        </div>
                      )}
                      {cliente.telefone && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Telefone</Label>
                          <p className="font-medium">{maskTelefone(cliente.telefone)}</p>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Venda à Vista</Badge>
                  </div>
                )}
              </Card>

              {/* Informações Adicionais */}
              {(vendaParaVisualizar.veiculo || vendaParaVisualizar.observacoes) && (
                <Card className="p-4">
                  <Label className="text-sm font-semibold mb-3 block">Informações Adicionais</Label>
                  <div className="space-y-3">
                    {vendaParaVisualizar.veiculo && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Veículo</Label>
                        <p className="font-medium">{vendaParaVisualizar.veiculo}</p>
                      </div>
                    )}
                    {vendaParaVisualizar.observacoes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Observações</Label>
                        <p className="font-medium whitespace-pre-wrap text-sm bg-muted/50 p-2 rounded-md">{vendaParaVisualizar.observacoes}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Resumo de Itens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendaParaVisualizar.produtos && vendaParaVisualizar.produtos.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-semibold">Produtos ({vendaParaVisualizar.produtos.length})</Label>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-9">
                            <TableHead className="text-xs">Código</TableHead>
                            <TableHead className="text-xs">Descrição</TableHead>
                            <TableHead className="text-xs text-right">Qtd</TableHead>
                            <TableHead className="text-xs text-right">Unit.</TableHead>
                            <TableHead className="text-xs text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendaParaVisualizar.produtos.map((item, index) => {
                            const produto = obterProduto(item.produtoId);
                            const preco = parseFloat(item.preco) || 0;
                            const quantidade = parseFloat(item.quantidade) || 0;
                            const subtotal = preco * quantidade;
                            return (
                              <TableRow key={index}>
                                <TableCell className="text-xs font-mono">{produto?.codigo || item.produtoId}</TableCell>
                                <TableCell className="text-xs">{produto?.descricao || 'Produto não encontrado'}</TableCell>
                                <TableCell className="text-xs text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {item.fracionado ? quantidade.toFixed(1) : Math.floor(quantidade)} {produto?.unidade || ''}
                                    {item.fracionado && <Badge variant="outline" className="text-[10px] px-1">F</Badge>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-right">R$ {formatarMoeda(preco)}</TableCell>
                                <TableCell className="text-xs text-right font-semibold">R$ {formatarMoeda(subtotal)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Subtotal Produtos:</span>
                        <span className="font-semibold">
                          R$ {formatarMoeda(vendaParaVisualizar.produtos.reduce((sum, item) => {
                            const preco = parseFloat(item.preco) || 0;
                            const quantidade = parseFloat(item.quantidade) || 0;
                            return sum + (preco * quantidade);
                          }, 0))}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {vendaParaVisualizar.servicos && vendaParaVisualizar.servicos.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-semibold">Serviços ({vendaParaVisualizar.servicos.length})</Label>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-9">
                            <TableHead className="text-xs">Descrição</TableHead>
                            <TableHead className="text-xs text-right">Qtd</TableHead>
                            <TableHead className="text-xs text-right">Unit.</TableHead>
                            <TableHead className="text-xs text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendaParaVisualizar.servicos.map((servico, index) => {
                            const valor = parseFloat(servico.valor || 0);
                            const quantidade = parseInt(servico.quantidade || 1);
                            const subtotal = valor * quantidade;
                            return (
                              <TableRow key={index}>
                                <TableCell className="text-xs">{servico.descricao}</TableCell>
                                <TableCell className="text-xs text-right">{quantidade}x</TableCell>
                                <TableCell className="text-xs text-right">R$ {formatarMoeda(valor)}</TableCell>
                                <TableCell className="text-xs text-right font-semibold">R$ {formatarMoeda(subtotal)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Subtotal Serviços:</span>
                        <span className="font-semibold">
                          R$ {formatarMoeda(vendaParaVisualizar.servicos.reduce((sum, servico) => {
                            const valor = parseFloat(servico.valor || 0);
                            const quantidade = parseInt(servico.quantidade || 1);
                            return sum + (valor * quantidade);
                          }, 0))}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Total Final */}
              <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                {(() => {
                  const subtotalProdutos = (vendaParaVisualizar.produtos || []).reduce((sum, item) => {
                    const preco = parseFloat(item.preco) || 0;
                    const quantidade = parseFloat(item.quantidade) || 0;
                    return sum + (preco * quantidade);
                  }, 0);
                  const subtotalServicos = (vendaParaVisualizar.servicos || []).reduce((sum, servico) => {
                    const valor = parseFloat(servico.valor || 0);
                    const quantidade = parseInt(servico.quantidade || 1);
                    return sum + (valor * quantidade);
                  }, 0);
                  const subtotal = subtotalProdutos + subtotalServicos;
                  const desconto = parseFloat(vendaParaVisualizar.desconto) || 0;
                  const valorDesconto = subtotal * (desconto / 100);
                  
                  return (
                    <div className="space-y-2">
                      {desconto > 0 && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-medium">R$ {formatarMoeda(subtotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Desconto ({desconto}%):</span>
                            <span className="font-medium text-green-600">- R$ {formatarMoeda(valorDesconto)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2"></div>
                        </>
                      )}
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Total Geral</Label>
                        <p className="font-bold text-2xl text-primary">R$ {vendaParaVisualizar.total ? formatarMoeda(vendaParaVisualizar.total) : '0,00'}</p>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setVisualizarVendaDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {vendaParaExcluir && `Tem certeza que deseja excluir esta venda de R$ ${vendaParaExcluir.total ? formatarMoeda(vendaParaExcluir.total) : '0,00'} realizada em ${formatarData(vendaParaExcluir.data)}? Esta ação não pode ser desfeita e o estoque dos produtos será revertido.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setExcluirDialogOpen(false);
              setVendaParaExcluir(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Sucesso */}
      <AlertDialog open={sucessoDialogOpen} onOpenChange={setSucessoDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold">Venda Registrada!</AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                A venda foi registrada com sucesso.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total da Venda:</span>
              <span className="text-2xl font-bold text-primary">R$ {formatarMoeda(totalVendaSucesso)}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setSucessoDialogOpen(false)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Saidas;
