# 🔍 Debug de Notificações - AbortError

## Erro: "AbortError: Registration failed - push service error"

Este erro geralmente ocorre quando há problemas na comunicação entre o Service Worker e o Firebase Messaging.

## ✅ Verificações

### 1. Verificar Service Worker no Console

Abra o DevTools (F12) → **Application** → **Service Workers**:

- ✅ Deve aparecer `firebase-messaging-sw.js`
- ✅ Status: **"activated and is running"**
- ❌ Se aparecer "redundant" ou erro, desregistre e recarregue

### 2. Verificar se o arquivo está acessível

No navegador, acesse:
```
http://localhost:3000/firebase-messaging-sw.js
```

- ✅ Deve mostrar o código do Service Worker
- ❌ Se der 404, o arquivo não está sendo servido

### 3. Verificar Console do Navegador

Procure por estas mensagens na ordem:

1. ✅ `"Service Worker registrado com sucesso"`
2. ✅ `"Service Worker está pronto!"`
3. ✅ `"Permissão de notificações concedida"`
4. ✅ `"Tentando obter token FCM..."`
5. ❌ Se aparecer erro aqui, veja o código do erro

### 4. Verificar Chave VAPID

No console, você deve ver:
```
VAPID Key: BOLZkkZ9vT6dg4DuptIHv...
```

Se não aparecer ou estiver diferente, verifique:
- Firebase Console → Cloud Messaging → Web Push certificates
- Compare com o código em `client/src/firebase.ts`

### 5. Verificar Permissões do Navegador

1. DevTools (F12) → **Application** → **Notifications**
2. Deve estar **"Allowed"** ✅

Ou:
- Chrome: Configurações → Privacidade → Notificações → Seu site → Permitir
- Firefox: Configurações → Privacidade → Notificações → Seu site → Permitir

## 🔧 Soluções

### Solução 1: Limpar Cache e Service Workers

1. DevTools (F12) → **Application** → **Service Workers**
2. Clique em **Unregister** em todos os service workers
3. **Application** → **Storage** → **Clear site data**
4. Recarregue a página (Ctrl+Shift+R)

### Solução 2: Verificar Versão do Firebase

O Service Worker usa Firebase 11.0.2 (compat) e o código principal usa 12.6.0.

Se houver incompatibilidade, tente:
- Atualizar o service worker para uma versão mais recente
- Ou usar a mesma versão em ambos

### Solução 3: Verificar HTTPS

Notificações push **só funcionam em HTTPS** (exceto localhost).

- ✅ `http://localhost` - Funciona
- ✅ `https://seu-dominio.com` - Funciona
- ❌ `http://seu-dominio.com` - **NÃO funciona**

### Solução 4: Verificar Erro Específico

No console, procure por:
- `"Código do erro:"` - Isso indica qual é o problema específico
- `"Mensagem do erro:"` - Mensagem detalhada do Firebase

**Erros comuns:**
- `messaging/invalid-vapid-key` → Chave VAPID incorreta
- `messaging/failed-service-worker-registration` → Service Worker não registrado
- `messaging/unsupported-browser` → Navegador não suporta

## 📝 Logs para Enviar

Se o problema persistir, envie:
1. Console completo (F12 → Console)
2. Application → Service Workers (screenshot)
3. Network tab → Verificar se `/firebase-messaging-sw.js` carrega (200 OK)
4. Código do erro específico (se aparecer)

## 🎯 Teste Manual

Execute no console do navegador:

```javascript
// 1. Verificar Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});

// 2. Verificar permissão
console.log('Permissão:', Notification.permission);

// 3. Tentar obter token manualmente
import('@/firebase').then(({ messaging, getToken, VAPID_KEY }) => {
  if (messaging) {
    getToken(messaging, { vapidKey: VAPID_KEY })
      .then(token => console.log('Token:', token))
      .catch(err => console.error('Erro:', err));
  }
});
```

