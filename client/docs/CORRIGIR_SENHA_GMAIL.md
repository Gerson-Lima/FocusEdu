# 🔐 Como Corrigir o Erro de Autenticação Gmail

## ❌ Problema Identificado

O erro nos logs mostra:
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

Isso significa que a **senha de app do Gmail está incorreta ou expirada**.

## ✅ Solução: Gerar Nova Senha de App

### Passo 1: Acessar Conta Google

1. Acesse: https://myaccount.google.com/
2. Faça login com a conta: **ziralngiocurso@gmail.com**

### Passo 2: Ativar Verificação em Duas Etapas

**IMPORTANTE**: A senha de app só funciona se a verificação em duas etapas estiver ativada!

1. Vá em **Segurança**
2. Procure por **"Verificação em duas etapas"**
3. Se não estiver ativada:
   - Clique em **"Ativar"**
   - Siga as instruções para configurar
   - Use seu celular para receber códigos

### Passo 3: Gerar Nova Senha de App

1. Ainda em **Segurança**, role até **"Senhas de app"**
2. Se não aparecer, clique em **"Como fazer login no Google"** → **"Senhas de app"**
3. Clique em **"Selecionar app"** → escolha **"Email"**
4. Clique em **"Selecionar dispositivo"** → escolha **"Outro (nome personalizado)"**
5. Digite: **"Agenda Acadêmica"**
6. Clique em **"Gerar"**
7. **COPIE A SENHA** (16 caracteres, sem espaços)
   - Exemplo: `abcd efgh ijkl mnop` → copie como `abcdefghijklmnop` (sem espaços)

### Passo 4: Atualizar o `.env`

1. Abra o arquivo `.env` na raiz do projeto
2. Encontre a linha:
   ```bash
   EMAIL_SMTP_PASSWORD="plbv qjsp bubd ybhl"
   ```
3. Substitua pela nova senha (entre aspas):
   ```bash
   EMAIL_SMTP_PASSWORD="nova_senha_aqui_sem_espacos"
   ```
   **IMPORTANTE**: 
   - Se a senha tiver espaços, mantenha entre aspas: `"abcd efgh ijkl mnop"`
   - Se não tiver espaços, pode usar sem aspas: `abcdefghijklmnop`

### Passo 5: Reiniciar o Servidor

**CRÍTICO**: Após alterar o `.env`, você DEVE reiniciar o servidor:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente:
npm run dev
```

### Passo 6: Testar

1. Crie uma atividade com entrega para amanhã
2. Verifique os logs no terminal
3. Você deve ver:
   ```
   [EmailService] ✅ Conexão SMTP verificada com sucesso
   [EmailService] ✅ Email enviado com SUCESSO para usuario@email.com
   ```

## 🔍 Verificar se Funcionou

Nos logs do terminal, você deve ver:

### ✅ Sucesso:
```
[EmailService] ✅ Conexão SMTP verificada com sucesso
[EmailService] ✅ Email enviado com SUCESSO para usuario@email.com
[ActivityNotifications] ✅ Email enviado com SUCESSO para usuario@email.com
```

### ❌ Se ainda der erro:
```
[EmailService] ❌ Erro ao verificar conexão SMTP: Invalid login
```

Se ainda der erro após gerar nova senha:
1. Verifique se copiou a senha corretamente (sem espaços extras)
2. Verifique se a verificação em duas etapas está ativada
3. Tente gerar outra senha de app
4. Verifique se não há espaços antes ou depois da senha no `.env`

## 📝 Exemplo de `.env` Correto

```bash
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=ziralngiocurso@gmail.com
EMAIL_SMTP_PASSWORD="abcd efgh ijkl mnop"
```

Ou se a senha não tiver espaços:
```bash
EMAIL_SMTP_PASSWORD=abcdefghijklmnop
```

## ⚠️ Importante

- **NUNCA** use sua senha normal do Gmail
- **SEMPRE** use uma senha de app gerada
- **SEMPRE** reinicie o servidor após alterar o `.env`
- A senha de app funciona apenas se a verificação em duas etapas estiver ativada

