import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, TrendingUp, ShoppingCart, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, subDays, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

// Função para formatar valores monetários
function formatarMoeda(valor) {
  if (!valor || valor === 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Função para calcular diferença percentual
function calcularVariacao(valorAtual, valorAnterior) {
  if (!valorAnterior || valorAnterior === 0) {
    return valorAtual > 0 ? 100 : 0;
  }
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Métricas principais
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalProdutosEstoque, setTotalProdutosEstoque] = useState(0);
  const [vendasMes, setVendasMes] = useState(0);
  const [vendasMesAnterior, setVendasMesAnterior] = useState(0);
  const [vendasPendentes, setVendasPendentes] = useState(0);
  const [vendasPendentesAnterior, setVendasPendentesAnterior] = useState(0);
  
  // Dados para gráficos
  const [vendasPorDia, setVendasPorDia] = useState([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const [vendasRecentes, setVendasRecentes] = useState([]);
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState([]);

  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarClientes(),
        carregarProdutos(),
        carregarVendas(),
        carregarVendasRecentes(),
        carregarProdutosMaisVendidos(),
        carregarProdutosEstoqueBaixo()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarClientes = async () => {
    try {
      const { count, error } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalClientes(count || 0);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, estoque');

      if (error) throw error;

      const produtos = data || [];
      setTotalProdutos(produtos.length);
      
      // Calcular total de produtos em estoque (estoque > 0)
      const produtosComEstoque = produtos.filter(p => p.estoque > 0);
      setTotalProdutosEstoque(produtosComEstoque.length);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const carregarVendas = async () => {
    try {
      const agora = new Date();
      const inicioMesAtual = startOfMonth(agora);
      const inicioMesAnterior = startOfMonth(subDays(inicioMesAtual, 1));

      // Vendas do mês atual
      const { data: vendasAtual, error: errorAtual } = await supabase
        .from('vendas')
        .select('total, data, status')
        .gte('data', inicioMesAtual.toISOString())
        .order('data', { ascending: false });

      if (errorAtual) throw errorAtual;

      // Vendas do mês anterior
      const { data: vendasAnterior, error: errorAnterior } = await supabase
        .from('vendas')
        .select('total, data, status')
        .gte('data', inicioMesAnterior.toISOString())
        .lt('data', inicioMesAtual.toISOString())
        .order('data', { ascending: false });

      if (errorAnterior) throw errorAnterior;

      // Calcular totais
      const totalMesAtual = (vendasAtual || []).reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
      const totalMesAnterior = (vendasAnterior || []).reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
      
      setVendasMes(totalMesAtual);
      setVendasMesAnterior(totalMesAnterior);

      // Vendas pendentes (Em Aberto)
      const pendentesAtual = (vendasAtual || []).filter(v => v.status === 'Em Aberto').length;
      const pendentesAnterior = (vendasAnterior || []).filter(v => v.status === 'Em Aberto').length;
      
      setVendasPendentes(pendentesAtual);
      setVendasPendentesAnterior(pendentesAnterior);

      // Preparar dados para gráfico (últimos 30 dias)
      const ultimos30Dias = Array.from({ length: 30 }, (_, i) => {
        const data = subDays(agora, 29 - i);
        return {
          data: format(data, 'dd/MM'),
          dataISO: data.toISOString(),
          total: 0
        };
      });

      // Preencher com dados reais
      (vendasAtual || []).forEach(venda => {
        const dataVenda = parseISO(venda.data);
        const diaIndex = ultimos30Dias.findIndex(d => 
          format(parseISO(d.dataISO), 'yyyy-MM-dd') === format(dataVenda, 'yyyy-MM-dd')
        );
        if (diaIndex !== -1) {
          ultimos30Dias[diaIndex].total += parseFloat(venda.total) || 0;
        }
      });

      setVendasPorDia(ultimos30Dias);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  const carregarVendasRecentes = async () => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes:nome
        `)
        .order('data', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Buscar nomes dos clientes separadamente (já que pode ser null)
      const vendasComClientes = await Promise.all((data || []).map(async (venda) => {
        let nomeCliente = 'Venda à Vista';
        if (venda.cliente_id) {
          const { data: cliente } = await supabase
            .from('clientes')
            .select('nome')
            .eq('id', venda.cliente_id)
            .single();
          if (cliente) nomeCliente = cliente.nome;
        } else if (venda.cliente_codigo) {
          nomeCliente = `Cliente ${venda.cliente_codigo}`;
        }

        return {
          id: venda.id,
          cliente: nomeCliente,
          total: parseFloat(venda.total) || 0,
          status: venda.status,
          data: venda.data
        };
      }));

      setVendasRecentes(vendasComClientes);
    } catch (error) {
      console.error('Erro ao carregar vendas recentes:', error);
    }
  };

  const carregarProdutosMaisVendidos = async () => {
    try {
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select('produtos')
        .order('data', { ascending: false });

      if (error) throw error;

      // Agregar produtos vendidos
      const produtosVendidos = {};
      (vendas || []).forEach(venda => {
        const produtos = venda.produtos || [];
        produtos.forEach(produto => {
          const produtoId = produto.produtoId || produto.id;
          if (!produtosVendidos[produtoId]) {
            produtosVendidos[produtoId] = {
              id: produtoId,
              quantidade: 0,
              codigo: produto.codigo || produtoId
            };
          }
          produtosVendidos[produtoId].quantidade += parseFloat(produto.quantidade || 0);
        });
      });

      // Buscar detalhes dos produtos
      const produtosIds = Object.keys(produtosVendidos);
      if (produtosIds.length > 0) {
        const { data: produtos, error: produtosError } = await supabase
          .from('produtos')
          .select('id, codigo, descricao')
          .in('id', produtosIds);

        if (!produtosError && produtos) {
          const produtosComDetalhes = Object.values(produtosVendidos)
            .map(pv => {
              const produto = produtos.find(p => p.id === pv.id);
              return {
                codigo: produto?.codigo || pv.codigo,
                descricao: produto?.descricao || 'Produto não encontrado',
                quantidade: pv.quantidade
              };
            })
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 5);

          setProdutosMaisVendidos(produtosComDetalhes);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produtos mais vendidos:', error);
    }
  };

  const carregarProdutosEstoqueBaixo = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('codigo, descricao, estoque')
        .lt('estoque', 10)
        .order('estoque', { ascending: true })
        .limit(5);

      if (error) throw error;
      setProdutosEstoqueBaixo(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos com estoque baixo:', error);
    }
  };

  const variacaoVendas = calcularVariacao(vendasMes, vendasMesAnterior);
  const variacaoPendentes = calcularVariacao(vendasPendentes, vendasPendentesAnterior);

  const chartConfig = {
    vendas: {
      label: 'Vendas',
      color: 'hsl(var(--chart-1))',
    },
  };

  const stats = [
    {
      title: 'Total de Clientes',
      value: totalClientes.toLocaleString('pt-BR'),
      change: null,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Produtos em Estoque',
      value: `${totalProdutosEstoque} / ${totalProdutos}`,
      change: null,
      icon: Package,
      color: 'text-accent',
    },
    {
      title: 'Vendas do Mês',
      value: formatarMoeda(vendasMes),
      change: `${variacaoVendas >= 0 ? '+' : ''}${variacaoVendas.toFixed(1)}%`,
      changeType: variacaoVendas >= 0 ? 'increase' : 'decrease',
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Vendas Pendentes',
      value: vendasPendentes.toString(),
      change: `${variacaoPendentes >= 0 ? '+' : ''}${variacaoPendentes.toFixed(1)}%`,
      changeType: variacaoPendentes >= 0 ? 'increase' : 'decrease',
      icon: ShoppingCart,
      color: 'text-accent',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-section">
      <div>
        <h1 className="h1">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid grid-responsive md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change !== null && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.changeType === 'increase' ? (
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  )}
                  <span className={stat.changeType === 'increase' ? 'text-primary' : 'text-destructive'}>
                    {stat.change}
                  </span>
                  {' '}desde o último mês
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-responsive md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadow-[var(--shadow-card)] animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            {vendasPorDia.length > 0 ? (
              <ChartContainer config={chartConfig}>
                <AreaChart data={vendasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="data"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => [formatarMoeda(value), 'Vendas']}
                    />} 
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-vendas)"
                    fill="var(--color-vendas)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma venda registrada nos últimos 30 dias.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-[var(--shadow-card)] animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {produtosMaisVendidos.length > 0 ? (
              <div className="space-y-4">
                {produtosMaisVendidos.map((produto, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{produto.descricao}</p>
                      <p className="text-xs text-muted-foreground">{produto.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{produto.quantidade.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum produto vendido ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-responsive md:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)] animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {vendasRecentes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasRecentes.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">{venda.cliente}</TableCell>
                      <TableCell>{formatarMoeda(venda.total)}</TableCell>
                      <TableCell>
                        <Badge variant={venda.status === 'Pago' ? 'default' : 'secondary'}>
                          {venda.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {format(parseISO(venda.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma venda registrada ainda.
              </p>
            )}
          </CardContent>
        </Card>

                <Card className="shadow-[var(--shadow-card)] animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
          <CardHeader className="flex flex-row items-center justify-between">   
            <CardTitle>Estoque Baixo</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            {produtosEstoqueBaixo.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosEstoqueBaixo.map((produto) => (
                    <TableRow key={produto.codigo}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{produto.descricao}</p>
                          <p className="text-xs text-muted-foreground">{produto.codigo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={produto.estoque <= 5 ? 'destructive' : 'secondary'}>
                          {produto.estoque.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Todos os produtos estão com estoque adequado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
