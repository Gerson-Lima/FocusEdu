# 🔧 Troubleshooting - Erro de Notificações

## Erro: "AbortError: Registration failed - push service error"

Este erro geralmente ocorre quando o Service Worker não está sendo registrado corretamente ou quando há problemas com a configuração do Firebase.

### ✅ Soluções Implementadas

1. **Registro automático do Service Worker**: O código agora registra o Service Worker automaticamente antes de solicitar o token FCM.

### 🔍 Verificações Necessárias

#### 1. Verificar se o Service Worker está acessível

Abra o navegador e acesse:
```
http://localhost:3000/firebase-messaging-sw.js
```

Ou no seu domínio de produção:
```
https://seu-dominio.com/firebase-messaging-sw.js
```

**Se retornar 404**: O arquivo não está sendo servido corretamente.

#### 2. Verificar no Console do Navegador

Abra o DevTools (F12) e vá em **Application** → **Service Workers**:
- Deve aparecer `firebase-messaging-sw.js` registrado
- Status deve ser "activated and is running"

#### 3. Verificar a Chave VAPID no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Seu projeto → **Cloud Messaging**
3. Role até **"Web Push certificates"**
4. Verifique se a chave está configurada e corresponde à chave no código:
   - Código: `BOLZkkZ9vT6dg4DuptIHveyyutoYcFB6etpbamtXIZ9WGzg5x-NRaG5qPSQuQEh8rokFy0Ots11YN5s1u5Q3UbU`
   - Se não corresponder, atualize o código com a chave correta

#### 4. Verificar HTTPS (Produção)

Notificações push **só funcionam em HTTPS** (exceto localhost).

- ✅ `http://localhost` - Funciona
- ✅ `https://seu-dominio.com` - Funciona
- ❌ `http://seu-dominio.com` - **NÃO funciona**

### 🛠️ Soluções Adicionais

#### Solução 1: Limpar Cache do Service Worker

1. Abra DevTools (F12)
2. Vá em **Application** → **Service Workers**
3. Clique em **Unregister** em todos os service workers
4. Vá em **Application** → **Storage** → **Clear site data**
5. Recarregue a página (Ctrl+Shift+R ou Cmd+Shift+R)

#### Solução 2: Verificar se o arquivo está no lugar certo

O arquivo deve estar em:
```
client/public/firebase-messaging-sw.js
```

E ser acessível em:
```
/firebase-messaging-sw.js
```

#### Solução 3: Verificar Console do Navegador

Procure por erros como:
- "Failed to register a ServiceWorker"
- "Service worker registration failed"
- "The script resource is behind a redirect"

#### Solução 4: Testar em Navegador Diferente

Alguns navegadores têm problemas com Service Workers:
- ✅ Chrome/Edge - Melhor suporte
- ✅ Firefox - Bom suporte
- ⚠️ Safari - Suporte limitado
- ❌ Internet Explorer - Não suporta

### 📝 Logs para Debug

Adicione estes logs no console para diagnosticar:

```javascript
// No console do navegador
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers registrados:', registrations);
});

// Verificar se o arquivo está acessível
fetch('/firebase-messaging-sw.js')
  .then(r => console.log('Service Worker acessível:', r.status))
  .catch(e => console.error('Service Worker não acessível:', e));
```

### 🔄 Se Nada Funcionar

1. **Regenerar chave VAPID no Firebase Console**
   - Cloud Messaging → Web Push certificates
   - Gerar nova chave
   - Atualizar no código (`client/src/firebase.ts`)

2. **Verificar se Cloud Messaging está habilitado**
   - Firebase Console → Cloud Messaging
   - Deve estar habilitado

3. **Verificar permissões do navegador**
   - Configurações do site → Notificações
   - Deve estar permitido

### 📞 Informações para Suporte

Se o problema persistir, forneça:
1. Console do navegador (F12 → Console)
2. Application → Service Workers (screenshot)
3. Network tab (verificar se `/firebase-messaging-sw.js` carrega)
4. Navegador e versão
5. URL do site (localhost ou produção)

