# Dicar Tratores Connect

Sistema de gestão para Dicar Tratores - desenvolvido com React, TypeScript e Supabase.

## 🚀 Tecnologias

- **Vite** - Build tool
- **TypeScript** - Tipagem estática
- **React** - Biblioteca UI
- **shadcn-ui** - Componentes UI
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação
- **React Router** - Roteamento

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta no Supabase (já configurada)

## 🛠️ Instalação e Desenvolvimento

```sh
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📦 Deploy no Vercel

O projeto está preparado para deploy no Vercel. Siga estes passos:

### Opção 1: Deploy via GitHub (Recomendado)

1. Faça push do código para o GitHub (veja instruções abaixo)
2. Acesse [Vercel](https://vercel.com) e faça login
3. Clique em "New Project"
4. Conecte seu repositório GitHub
5. Selecione este repositório
6. O Vercel detectará automaticamente as configurações do `vercel.json`
7. Clique em "Deploy"

### Opção 2: Deploy via Vercel CLI

```sh
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel
```

### Variáveis de Ambiente

Se necessário configurar variáveis de ambiente no Vercel:

1. Acesse as configurações do projeto no Vercel
2. Vá em "Settings" > "Environment Variables"
3. Adicione as variáveis necessárias (ex: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

## 📤 Publicar no GitHub

### 1. Criar repositório no GitHub

1. Acesse [GitHub](https://github.com) e faça login
2. Clique no botão "+" no canto superior direito
3. Selecione "New repository"
4. Escolha um nome (ex: `dicar-tratores-connect`)
5. NÃO marque "Initialize this repository with a README"
6. Clique em "Create repository"

### 2. Conectar repositório local ao GitHub

```sh
# Adicionar repositório remoto (substitua USERNAME e REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push para GitHub
git push -u origin main
```

### 3. Verificar push

Após o push, seu código estará disponível no GitHub e você poderá conectar o repositório ao Vercel para deploy automático.

## 📁 Estrutura do Projeto

```
├── public/          # Arquivos estáticos
├── src/
│   ├── components/  # Componentes React
│   ├── contexts/    # Contextos React (Auth)
│   ├── hooks/       # Custom hooks
│   ├── lib/         # Utilitários (Supabase, utils)
│   ├── pages/       # Páginas da aplicação
│   └── utils/       # Funções auxiliares
├── sql/             # Scripts SQL
├── vercel.json      # Configuração Vercel
└── package.json     # Dependências
```

## 🔒 Segurança

⚠️ **Importante**: As credenciais do Supabase estão atualmente no código. Para produção, considere:

1. Usar variáveis de ambiente
2. Criar arquivo `.env.local` (já está no .gitignore)
3. Configurar variáveis no Vercel

## 📝 Licença

Este projeto é privado e de uso interno.
