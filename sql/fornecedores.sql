-- Criar tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  doc VARCHAR(18) NOT NULL,
  tipo_doc VARCHAR(4) NOT NULL CHECK (tipo_doc IN ('CPF', 'CNPJ')),
  telefone VARCHAR(11),
  endereco TEXT,
  responsavel VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id ON fornecedores(user_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_doc ON fornecedores(doc);

-- Habilitar RLS (Row Level Security)
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios fornecedores
CREATE POLICY "Usuários podem ver seus próprios fornecedores"
  ON fornecedores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para usuários criarem seus próprios fornecedores
CREATE POLICY "Usuários podem criar seus próprios fornecedores"
  ON fornecedores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios fornecedores
CREATE POLICY "Usuários podem atualizar seus próprios fornecedores"
  ON fornecedores
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários excluírem seus próprios fornecedores
CREATE POLICY "Usuários podem excluir seus próprios fornecedores"
  ON fornecedores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_fornecedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION update_fornecedores_updated_at();

