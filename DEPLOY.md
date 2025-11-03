# 🚀 Guia Rápido de Deploy

## Passo a Passo para Publicar no GitHub

### 1. Criar Repositório no GitHub

1. Acesse https://github.com e faça login
2. Clique no botão **"+"** no canto superior direito → **"New repository"**
3. Escolha um nome (ex: `dicar-tratores-connect`)
4. **NÃO** marque "Initialize this repository with a README"
5. Escolha se será público ou privado
6. Clique em **"Create repository"**

### 2. Conectar ao GitHub

**Opção A: Usando HTTPS (Recomendado para iniciantes)**

```powershell
# Substitua SEU_USUARIO pelo seu usuário do GitHub
# Substitua NOME_DO_REPOSITORIO pelo nome que você escolheu

git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
git branch -M main
git push -u origin main
```

**Opção B: Usando SSH**

Se você já configurou SSH no GitHub:

```powershell
git remote add origin git@github.com:SEU_USUARIO/NOME_DO_REPOSITORIO.git
git branch -M main
git push -u origin main
```

### 3. Se pedir autenticação

- **HTTPS**: Use um Personal Access Token (não sua senha)
  - Vá em GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Gere um novo token com permissão `repo`
  - Use esse token como senha

- **SSH**: Certifique-se de ter configurado sua chave SSH no GitHub

## 📦 Deploy no Vercel

### Após publicar no GitHub:

1. Acesse https://vercel.com
2. Faça login com sua conta GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Importe o repositório que você acabou de criar
5. O Vercel detectará automaticamente:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Clique em **"Deploy"**
7. Aguarde alguns minutos e seu site estará online! 🎉

### Variáveis de Ambiente (Opcional)

Se precisar configurar variáveis de ambiente:

1. No projeto do Vercel, vá em **Settings** → **Environment Variables**
2. Adicione as variáveis necessárias:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Faça um novo deploy

## ✅ Verificação

Após o deploy, você receberá uma URL do tipo:
`https://seu-projeto.vercel.app`

Acesse essa URL para verificar se tudo está funcionando!

