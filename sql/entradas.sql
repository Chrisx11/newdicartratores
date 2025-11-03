-- Garantir que a extensão uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de entradas
CREATE TABLE IF NOT EXISTS entradas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  produto_codigo VARCHAR(100) NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade DECIMAL(10, 2) NOT NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_entradas_user_id ON entradas(user_id);
CREATE INDEX IF NOT EXISTS idx_entradas_produto_codigo ON entradas(produto_codigo);
CREATE INDEX IF NOT EXISTS idx_entradas_produto_id ON entradas(produto_id);
CREATE INDEX IF NOT EXISTS idx_entradas_data ON entradas(data DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias entradas
CREATE POLICY "Usuários podem ver suas próprias entradas"
  ON entradas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias entradas
CREATE POLICY "Usuários podem criar suas próprias entradas"
  ON entradas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias entradas
CREATE POLICY "Usuários podem atualizar suas próprias entradas"
  ON entradas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários excluírem suas próprias entradas
CREATE POLICY "Usuários podem excluir suas próprias entradas"
  ON entradas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_entradas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_entradas_updated_at BEFORE UPDATE ON entradas
    FOR EACH ROW EXECUTE FUNCTION update_entradas_updated_at();

