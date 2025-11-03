-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  doc VARCHAR(18) NOT NULL,
  tipo_doc VARCHAR(4) NOT NULL CHECK (tipo_doc IN ('CPF', 'CNPJ')),
  telefone VARCHAR(11),
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_doc ON clientes(doc);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios clientes
CREATE POLICY "Usuários podem ver seus próprios clientes"
  ON clientes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para usuários criarem seus próprios clientes
CREATE POLICY "Usuários podem criar seus próprios clientes"
  ON clientes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios clientes
CREATE POLICY "Usuários podem atualizar seus próprios clientes"
  ON clientes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários excluírem seus próprios clientes
CREATE POLICY "Usuários podem excluir seus próprios clientes"
  ON clientes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

