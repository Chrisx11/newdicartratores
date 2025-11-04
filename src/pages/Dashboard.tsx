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
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt } from 'lucide-react';

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
      color: 'hsl(var(--primary))',
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
    return <Loading />;
  }

  return (
    <div className="space-section">
      <div>
        <h1 className="h1">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          Visão geral do seu negócio
        </p>
      </div>

            <div className="grid grid-responsive md:grid-cols-2 lg:grid-cols-4 gap-4">      
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-all duration-300 animate-fade-in border-l-4 border-l-primary/20 hover:border-l-primary/60 group" 
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
          >             
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                                                                  
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors"> 
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-primary/10 ${stat.color} transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              {stat.change !== null && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">                                                                      
                  {stat.changeType === 'increase' ? (
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                  ) : stat.changeType === 'decrease' ? (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  ) : null}
                  {stat.change && (
                    <>
                      <span className={stat.changeType === 'increase' ? 'text-primary font-semibold' : stat.changeType === 'decrease' ? 'text-destructive font-semibold' : ''}>                                                       
                        {stat.change}
                      </span>
                      {' '}desde o último mês
                    </>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-responsive md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-1 md:col-span-2 lg:col-span-4 shadow-[var(--shadow-card)] animate-fade-in hover:shadow-[var(--shadow-elegant)] transition-all duration-300" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>                                                                     
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Vendas dos Últimos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
                        {vendasPorDia.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={vendasPorDia}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />                                                                              
                  <XAxis
                    dataKey="data"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-xs"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value) => [formatarMoeda(value), 'Vendas']}
                      className="rounded-lg border bg-background shadow-md"
                    />}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorVendas)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Nenhuma venda registrada"
                description="Não há vendas registradas nos últimos 30 dias. Quando houver vendas, elas aparecerão aqui."
              />
            )}
          </CardContent>
        </Card>

                <Card className="col-span-1 md:col-span-2 lg:col-span-3 shadow-[var(--shadow-card)] animate-fade-in hover:shadow-[var(--shadow-elegant)] transition-all duration-300" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>                                                                     
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
                        {produtosMaisVendidos.length > 0 ? (
              <div className="space-y-3">
                {produtosMaisVendidos.map((produto, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200 group"
                  >                                                                               
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary/20 transition-colors">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{produto.descricao}</p>
                        <p className="text-xs text-muted-foreground">{produto.codigo}</p>                                                                         
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{produto.quantidade.toFixed(2)}</p>                                                                      
                      <p className="text-xs text-muted-foreground">unidades</p> 
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Nenhum produto vendido"
                description="Ainda não há produtos vendidos. Quando houver vendas, os produtos mais vendidos aparecerão aqui."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-responsive md:grid-cols-2 gap-4">
                <Card className="shadow-[var(--shadow-card)] animate-fade-in hover:shadow-[var(--shadow-elegant)] transition-all duration-300" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>                            
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Vendas Recentes
            </CardTitle>
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
                    <TableRow key={venda.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{venda.cliente}</TableCell>                                                                            
                      <TableCell className="font-semibold text-primary">{formatarMoeda(venda.total)}</TableCell>       
                      <TableCell>
                        <Badge 
                          variant={
                            venda.status === 'Pago' ? 'success' :
                            venda.status === 'Em Aberto' ? 'warning' :
                            'info'
                          }
                        >                                                                     
                          {venda.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(parseISO(venda.data), 'dd/MM/yyyy', { locale: ptBR })}                                                                          
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Receipt}
                title="Nenhuma venda registrada"
                description="Ainda não há vendas registradas. Quando houver vendas, as mais recentes aparecerão aqui."
              />
            )}
          </CardContent>
        </Card>

                        <Card className="shadow-[var(--shadow-card)] animate-fade-in border-t-4 border-t-destructive/30" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>                    
          <CardHeader className="flex flex-row items-center justify-between">   
            <CardTitle>Estoque Baixo</CardTitle>
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
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
                    <TableRow key={produto.codigo} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{produto.descricao}</p>                                                                            
                          <p className="text-xs text-muted-foreground">{produto.codigo}</p>                                                                     
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={produto.estoque <= 5 ? 'destructive' : produto.estoque <= 7 ? 'warning' : 'secondary'}
                        >                                                                    
                          {produto.estoque.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={Package}
                title="Estoque adequado"
                description="Todos os produtos estão com estoque adequado. Quando houver produtos com estoque baixo, eles aparecerão aqui."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
