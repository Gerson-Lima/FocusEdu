# 🧪 Como Testar as Notificações

## 📋 Pré-requisitos

1. ✅ Notificações ativadas no navegador (botão no header)
2. ✅ Token FCM salvo no Firestore (coleção `fcm_tokens`)
3. ✅ Pelo menos uma atividade cadastrada que vence hoje ou amanhã

## 🎯 Método 1: Teste Rápido (Recomendado)

### Passo 1: Criar uma Atividade de Teste

1. Vá em **Atividades** no menu lateral
2. Clique em **Nova Atividade**
3. Preencha:
   - **Título**: "Teste de Notificação"
   - **Data de Entrega**: Amanhã (12/12) às 9:00
   - **Status**: Pendente ou Não Iniciada
   - **Categoria**: Qualquer uma
4. Salve a atividade

### Passo 2: Testar via Botão no Header

1. Clique no **ícone de sino** (notificações) no header
2. Se as notificações estiverem ativadas, você verá um botão **"Testar Notificações"**
3. Clique no botão
4. Aguarde alguns segundos
5. Você deve receber uma notificação dizendo: **"Teste de Notificação" vence amanhã (12/12)**

### Passo 3: Verificar Resultado

- ✅ **Se recebeu notificação**: Funcionou! 🎉
- ⚠️ **Se não recebeu mas apareceu "Enviadas: 1"**: 
  - Verifique se o navegador não está bloqueando notificações
  - Verifique se o app está em primeiro plano (notificações aparecem como toast)
  - Verifique o console do navegador para erros

## 🎯 Método 2: Teste com Atividade que Vence Hoje

Para testar imediatamente (sem esperar até amanhã):

1. Crie uma atividade com **Data de Entrega = Hoje**
2. Clique em **"Testar Notificações"**
3. A notificação dirá: **"vence hoje (12/12)"** ao invés de "amanhã"

## 🎯 Método 3: Teste via Cloud Function (Produção)

Se você já fez deploy da Cloud Function:

### Via HTTP Endpoint

```bash
curl https://us-central1-agenda-fd0df.cloudfunctions.net/testActivityNotifications
```

### Via Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Functions** → **Logs**
3. Execute a função `testActivityNotifications`
4. Verifique os logs

## 🔍 Verificações de Debug

### 1. Verificar se o Token FCM está salvo

No Firebase Console:
1. Vá em **Firestore Database**
2. Procure pela coleção `fcm_tokens`
3. Deve haver um documento com seu `userId`
4. O documento deve ter um campo `token` com uma string longa

### 2. Verificar no Console do Navegador

Abra DevTools (F12) → Console e procure por:
- `Token FCM obtido com sucesso` ✅
- `Token FCM salvo no Firestore` ✅
- Erros relacionados a Service Worker ❌

### 3. Verificar Service Worker

1. DevTools (F12) → **Application** → **Service Workers**
2. Deve aparecer `firebase-messaging-sw.js` registrado
3. Status: **"activated and is running"** ✅

### 4. Verificar Permissões do Navegador

1. DevTools (F12) → **Application** → **Notifications**
2. Deve estar **"Allowed"** ✅

Ou:
- Chrome: Configurações → Privacidade → Notificações → Seu site → Permitir
- Firefox: Configurações → Privacidade → Notificações → Seu site → Permitir

## 🐛 Problemas Comuns

### "Nenhuma atividade encontrada"

**Causa**: Não há atividades que vencem hoje ou amanhã

**Solução**: 
- Crie uma atividade com entrega para hoje ou amanhã
- Certifique-se de que o status não é "concluída"

### "Enviadas: 0" mas "Verificadas: 1"

**Causa**: Token FCM não encontrado ou inválido

**Solução**:
- Verifique se o token está salvo no Firestore (`fcm_tokens`)
- Tente ativar notificações novamente
- Verifique se o Service Worker está registrado

### "Erros: 1"

**Causa**: Token FCM inválido ou expirado

**Solução**:
- A função remove automaticamente tokens inválidos
- Ative notificações novamente no header
- Isso gerará um novo token

### Notificação não aparece

**Causa**: Navegador bloqueando ou app em primeiro plano

**Solução**:
- Se o app está aberto: notificação aparece como **toast** (canto da tela)
- Se o app está fechado: notificação aparece no **sistema**
- Verifique se o navegador não está bloqueando notificações

## 📝 Exemplo de Teste Completo

1. **11/12 às 23:00** - Crie atividade "Teste" com entrega **12/12 às 9:00**
2. **11/12 às 23:05** - Clique em "Testar Notificações"
3. **Resultado esperado**: 
   - Toast/Notificação: **"Teste" vence amanhã (12/12)**
   - Console: `Enviadas: 1`

## ✅ Checklist de Teste

- [ ] Notificações ativadas no navegador
- [ ] Token FCM salvo no Firestore
- [ ] Service Worker registrado
- [ ] Atividade criada com entrega para hoje ou amanhã
- [ ] Atividade não está concluída
- [ ] Botão "Testar Notificações" clicado
- [ ] Notificação recebida (toast ou sistema)

## 🎉 Sucesso!

Se você recebeu a notificação, está tudo funcionando! A Cloud Function agendada enviará notificações automaticamente todos os dias às 8:00 AM para atividades que vencem no dia seguinte.

