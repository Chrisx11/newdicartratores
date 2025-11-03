import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, TrendingUp, ShoppingCart } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total de Clientes',
      value: '1,234',
      change: '+12%',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Produtos em Estoque',
      value: '856',
      change: '+5%',
      icon: Package,
      color: 'text-accent',
    },
    {
      title: 'Vendas do Mês',
      value: 'R$ 45.231',
      change: '+23%',
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      title: 'Pedidos Pendentes',
      value: '23',
      change: '-8%',
      icon: ShoppingCart,
      color: 'text-accent',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={stat.change.startsWith('+') ? 'text-primary' : 'text-destructive'}>
                  {stat.change}
                </span>
                {' '}desde o último mês
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nenhuma venda registrada ainda.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nenhum dado disponível ainda.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
