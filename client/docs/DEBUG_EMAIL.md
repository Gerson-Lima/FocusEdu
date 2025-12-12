# 🔍 Debug: Por que o Email Não Está Sendo Enviado

## ✅ Correções Aplicadas

1. **Senha corrigida no `.env`**: A senha agora está entre aspas para preservar os espaços
2. **Logs detalhados adicionados**: O sistema agora mostra exatamente onde está falhando
3. **Validação simplificada**: Removida validação duplicada que poderia estar bloqueando

## 🔍 Como Verificar

### Passo 1: Verificar o `.env`

A senha deve estar assim (com aspas):
```bash
EMAIL_SMTP_PASSWORD="sidb gcwq ythh hmaj"
```

**NÃO assim:**
```bash
EMAIL_SMTP_PASSWORD=sidb gcwq ythh hmaj  # ❌ Sem aspas
```

### Passo 2: Reiniciar o Servidor

**IMPORTANTE**: Após alterar o `.env`, você DEVE reiniciar o servidor:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente:
npm run dev
```

### Passo 3: Verificar os Logs

Quando testar as notificações, você verá logs detalhados no terminal:

#### ✅ Se estiver funcionando:
```
[EmailService] Iniciando envio de email...
[EmailService] Destinatário: usuario@email.com
[EmailService] Configuração Gmail SMTP encontrada:
[EmailService] Host: smtp.gmail.com
[EmailService] Port: 587
[EmailService] User: ziralngiocurso@gmail.com
[EmailService] Password: ***hmaj
[EmailService] ✅ Conexão SMTP verificada com sucesso
[EmailService] ✅ Email enviado com SUCESSO para usuario@email.com
[ActivityNotifications] ✅ Email enviado com SUCESSO para usuario@email.com
```

#### ❌ Se houver erro de autenticação:
```
[EmailService] ❌ Erro ao verificar conexão SMTP: Invalid login
[EmailService] Código: EAUTH
```

#### ❌ Se a configuração não for encontrada:
```
[EmailService] Configuração de email não encontrada
[EmailService] Variáveis encontradas: { EMAIL_SMTP_HOST: 'NÃO', ... }
```

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Invalid login" ou "EAUTH"

**Causa**: Senha de app incorreta ou expirada

**Solução**:
1. Acesse: https://myaccount.google.com/ → Segurança
2. Vá em **Senhas de app**
3. Gere uma **nova senha de app** para "Agenda Acadêmica"
4. Atualize o `.env` com a nova senha (entre aspas)
5. Reinicie o servidor

### Problema 2: "Configuração de email não encontrada"

**Causa**: Variáveis de ambiente não estão sendo carregadas

**Solução**:
1. Verifique se o `.env` está na raiz do projeto
2. Verifique se as variáveis estão escritas corretamente (sem espaços antes do `=`)
3. Reinicie o servidor após alterar o `.env`

### Problema 3: "Usuário não tem email cadastrado"

**Causa**: O email do usuário não está no Firestore

**Solução**:
1. Verifique no Firestore Console se o documento `users/{userId}` tem o campo `email`
2. Se não tiver, o usuário precisa fazer login novamente para salvar o email

### Problema 4: "Conexão recusada" ou timeout

**Causa**: Firewall ou rede bloqueando SMTP

**Solução**:
1. Verifique se a porta 587 está aberta
2. Tente usar a porta 465 com `EMAIL_SMTP_SECURE=true`
3. Verifique se não há firewall bloqueando

## 🧪 Teste Manual

Para testar se o email está funcionando, você pode criar um script de teste:

```typescript
// test-email.ts
import { sendActivityNotificationEmail } from './server/_core/emailService';

async function test() {
  const result = await sendActivityNotificationEmail(
    'seuemail@teste.com',
    [{
      title: 'Teste',
      dueDate: Date.now() + 86400000,
      courseName: 'Teste',
    }],
    'Usuário Teste'
  );
  
  console.log('Resultado:', result);
}

test();
```

## 📋 Checklist

Antes de reportar problema, verifique:

- [ ] `.env` tem `EMAIL_SMTP_PASSWORD` entre aspas
- [ ] Servidor foi reiniciado após alterar `.env`
- [ ] Senha de app do Gmail está correta e ativa
- [ ] Verificação em duas etapas está ativada no Gmail
- [ ] Usuário tem email cadastrado no Firestore (`users/{userId}`)
- [ ] Logs no terminal mostram o que está acontecendo
- [ ] `nodemailer` está instalado (`npm list nodemailer`)

## 🔍 Verificar Logs Detalhados

Os logs agora mostram:
1. ✅ Se a configuração foi encontrada
2. ✅ Se a conexão SMTP foi verificada
3. ✅ Se o email foi enviado
4. ❌ Qualquer erro com detalhes completos

**Sempre verifique os logs no terminal do servidor** quando testar notificações!

