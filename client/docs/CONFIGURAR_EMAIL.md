# 📧 Como Configurar Envio de Emails

Este guia explica como configurar o envio de emails para notificações de atividades.

## ⚠️ IMPORTANTE: Entendendo a Configuração

**O passo a passo abaixo é para configurar o SERVIDOR de email (remetente)**, não os emails dos usuários!

- **Servidor de Email (Remetente)**: É o email que você configura aqui (ex: `noreply@agendaacademica.com` ou seu Gmail pessoal)
- **Emails dos Usuários (Destinatários)**: São os emails dos usuários que fazem login no site (salvos automaticamente no Firestore)

**O sistema funciona assim:**
1. ✅ Quando um usuário faz login/cadastro, o email dele é **automaticamente salvo** no Firestore
2. ✅ Quando há atividades próximas do prazo, o sistema busca o email do usuário no Firestore
3. ✅ O sistema envia email para **qualquer usuário logado** que tenha email cadastrado
4. ✅ Você só precisa configurar **UMA VEZ** o servidor de email (remetente)

**Exemplo:**
- Você configura: `seuemail@gmail.com` como remetente (servidor)
- Usuário 1 faz login com: `joao@gmail.com` → recebe emails em `joao@gmail.com`
- Usuário 2 faz login com: `maria@hotmail.com` → recebe emails em `maria@hotmail.com`
- Usuário 3 faz login com: `pedro@yahoo.com` → recebe emails em `pedro@yahoo.com`

## 📋 Opções Disponíveis

O sistema suporta 3 opções para envio de emails:

1. **Gmail SMTP** (Mais simples, recomendado para começar)
2. **SendGrid** (Profissional, 100 emails/dia grátis)
3. **Mailgun** (Profissional, 5000 emails/mês grátis)

---

## 🚀 Opção 1: Gmail SMTP (Recomendado para Testes)

### Passo 1: Criar Senha de App no Gmail

1. Acesse sua conta Google: https://myaccount.google.com/
2. Vá em **Segurança**
3. Ative a **Verificação em duas etapas** (obrigatório)
4. Role até **Senhas de app**
5. Clique em **Selecionar app** → escolha **Email**
6. Clique em **Selecionar dispositivo** → escolha **Outro (nome personalizado)**
7. Digite: "Agenda Acadêmica"
8. Clique em **Gerar**
9. **Copie a senha gerada** (16 caracteres, sem espaços)

### Passo 2: Configurar Variáveis de Ambiente

No arquivo `.env` na raiz do projeto, adicione:

```bash
# Gmail SMTP
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=seuemail@gmail.com
EMAIL_SMTP_PASSWORD=senha_de_app_gerada
```

**Exemplo:**
```bash
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=joao@gmail.com
EMAIL_SMTP_PASSWORD=abcd efgh ijkl mnop
```

⚠️ **IMPORTANTE**: Use a **senha de app** gerada, NÃO sua senha normal do Gmail!

### Passo 3: Testar

1. Reinicie o servidor
2. Teste as notificações
3. Verifique se o email foi recebido

---

## 📬 Opção 2: SendGrid (Recomendado para Produção)

### Passo 1: Criar Conta SendGrid

1. Acesse: https://sendgrid.com/
2. Crie uma conta gratuita (100 emails/dia)
3. Complete a verificação de email

### Passo 2: Criar API Key

1. No painel do SendGrid, vá em **Settings** → **API Keys**
2. Clique em **Create API Key**
3. Dê um nome: "Agenda Acadêmica"
4. Selecione **Full Access** ou **Restricted Access** (apenas Mail Send)
5. Clique em **Create & View**
6. **Copie a API Key** (você só verá uma vez!)

### Passo 3: Verificar Domínio (Opcional)

Para usar seu próprio domínio:
1. Vá em **Settings** → **Sender Authentication**
2. Siga as instruções para verificar seu domínio

### Passo 4: Configurar Variáveis de Ambiente

No arquivo `.env`:

```bash
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@seudominio.com
```

**Exemplo:**
```bash
SENDGRID_API_KEY=SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SENDGRID_FROM_EMAIL=noreply@agendaacademica.com
```

---

## 📮 Opção 3: Mailgun (Alternativa Profissional)

### Passo 1: Criar Conta Mailgun

1. Acesse: https://www.mailgun.com/
2. Crie uma conta gratuita (5000 emails/mês)
3. Complete a verificação

### Passo 2: Obter Credenciais

1. No painel do Mailgun, vá em **Sending** → **Domain Settings**
2. Anote seu **Domain** (ex: `mg.seudominio.com`)
3. Vá em **Sending** → **API Keys**
4. **Copie a API Key**

### Passo 3: Configurar Variáveis de Ambiente

No arquivo `.env`:

```bash
# Mailgun
MAILGUN_DOMAIN=mg.seudominio.com
MAILGUN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxx
MAILGUN_SMTP_USER=postmaster@mg.seudominio.com
```

**Exemplo:**
```bash
MAILGUN_DOMAIN=mg.agendaacademica.com
MAILGUN_API_KEY=key-abc123def456ghi789jkl012mno345
MAILGUN_SMTP_USER=postmaster@mg.agendaacademica.com
```

---

## ✅ Como Funciona

Quando uma notificação é enviada:

1. **Push Notification** (se o usuário tiver token FCM registrado)
2. **Email** (se o usuário tiver email cadastrado no Firestore)

Ambos são enviados automaticamente quando há atividades próximas do prazo.

### 🔄 Fluxo Automático

1. **Usuário faz login/cadastro** → Email é salvo automaticamente no Firestore
2. **Sistema verifica atividades** → Busca atividades com prazo próximo
3. **Para cada usuário com atividades:**
   - Busca o email do usuário no Firestore (`users/{userId}`)
   - Envia notificação push (se tiver token FCM)
   - Envia email para o email do usuário (qualquer provedor: Gmail, Hotmail, Yahoo, etc.)
4. **Usuário recebe o email** no endereço que usou para fazer login

**Não precisa fazer nada manualmente para cada usuário!** O sistema funciona automaticamente para todos os usuários logados.

---

## 🧪 Testar o Envio de Email

### Teste Manual

1. Certifique-se de que as variáveis de ambiente estão configuradas
2. Reinicie o servidor
3. Crie uma atividade com entrega para amanhã
4. Aguarde a verificação automática ou clique em "Testar Notificações"
5. Verifique sua caixa de entrada (e spam)

### Verificar Logs

No terminal do servidor, você verá:
```
[ActivityNotifications] Email enviado para usuario@email.com (1 atividade(s))
```

---

## 🔧 Troubleshooting

### Erro: "nodemailer não está instalado"
```bash
npm install nodemailer @types/nodemailer
```

### Erro: "Configuração de email não encontrada"
- Verifique se as variáveis de ambiente estão no `.env`
- Reinicie o servidor após adicionar as variáveis

### Erro: "Invalid login" (Gmail)
- Certifique-se de usar a **senha de app**, não a senha normal
- Verifique se a verificação em duas etapas está ativada

### Email não chega
- Verifique a pasta de **Spam/Lixo Eletrônico**
- Verifique os logs do servidor para erros
- Teste com outro provedor de email

### SendGrid: "Forbidden"
- Verifique se a API Key está correta
- Verifique se o domínio está verificado (se necessário)

---

## 📝 Template do Email

O email enviado inclui:
- ✅ Saudação personalizada (com nome do usuário, se disponível)
- ✅ Lista de atividades com prazo próximo
- ✅ Nome da atividade
- ✅ Disciplina
- ✅ Data de vencimento formatada
- ✅ Design responsivo e profissional

---

## 🎯 Próximos Passos

Após configurar:
1. ✅ Teste o envio de emails
2. ✅ Verifique se os emails estão chegando
3. ✅ Personalize o template (opcional) em `server/_core/emailService.ts`

---

## 💡 Dicas

- **Desenvolvimento**: Use Gmail SMTP (mais simples)
- **Produção**: Use SendGrid ou Mailgun (mais confiável)
- **Testes**: Sempre verifique a pasta de spam
- **Segurança**: Nunca commite as variáveis de ambiente no Git

