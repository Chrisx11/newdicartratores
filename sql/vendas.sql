-- Garantir que a extensão uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de vendas (saídas)
CREATE TABLE IF NOT EXISTS vendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_codigo VARCHAR(18), -- Para referência rápida, mesmo se cliente for deletado
  produtos JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de produtos: [{produtoId, quantidade, preco, fracionado}]
  servicos JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de serviços: [{descricao, valor, quantidade}]
  veiculo VARCHAR(255),
  observacoes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Em Aberto', -- 'Pago', 'Em Aberto', 'Orçamento'
  desconto DECIMAL(5, 2) DEFAULT 0, -- Percentual de desconto
  total DECIMAL(10, 2) NOT NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON vendas(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data DESC);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_produtos ON vendas USING GIN (produtos);
CREATE INDEX IF NOT EXISTS idx_vendas_servicos ON vendas USING GIN (servicos);

-- Habilitar RLS (Row Level Security)
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias vendas
CREATE POLICY "Usuários podem ver suas próprias vendas"
  ON vendas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias vendas
CREATE POLICY "Usuários podem criar suas próprias vendas"
  ON vendas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias vendas
CREATE POLICY "Usuários podem atualizar suas próprias vendas"
  ON vendas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários excluírem suas próprias vendas
CREATE POLICY "Usuários podem excluir suas próprias vendas"
  ON vendas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_vendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas
    FOR EACH ROW EXECUTE FUNCTION update_vendas_updated_at();

