# 🔐 Como Atualizar as Regras do Firestore no Firebase Console

## 📋 Passo a Passo Detalhado

### Passo 1: Acessar o Firebase Console

1. Abra seu navegador
2. Acesse: https://console.firebase.google.com/
3. Faça login com sua conta Google (se necessário)

### Passo 2: Selecionar o Projeto

1. No topo da página, você verá o nome do projeto atual
2. Se não estiver no projeto correto, clique no nome do projeto (ou no ícone de dropdown)
3. Selecione: **agenda-fd0df**

### Passo 3: Abrir Firestore Database

1. No menu lateral esquerdo, procure por **"Firestore Database"** ou **"Firestore"**
2. Clique nele
3. Você verá uma tela com abas: **Dados**, **Regras**, **Índices**, **Uso**

### Passo 4: Abrir a Aba Regras

1. Clique na aba **"Regras"** (ou **"Rules"** se estiver em inglês)
2. Você verá um editor de código com as regras atuais

### Passo 5: Copiar as Regras Corretas

Copie TODO o código abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Activities collection
    // Users can only read/write their own activities
    match /activity/{activityId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Courses collection
    // Users can only read/write their own courses
    match /courses/{courseId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Kanban columns collection
    // Users can only read/write their own kanban columns
    match /kanban_columns/{columnId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Kanban items collection
    // Users can only read/write their own kanban items
    match /kanban_items/{itemId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Users collection (for user profiles)
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if isAuthenticated() && userId == request.auth.uid;
      allow create: if isAuthenticated() && userId == request.auth.uid;
      allow update: if isAuthenticated() && userId == request.auth.uid;
      allow delete: if isAuthenticated() && userId == request.auth.uid;
    }
    
    // FCM Tokens collection
    // Users can only read/write their own FCM token
    // IMPORTANTE: O userId no documento DEVE corresponder ao request.auth.uid
    match /fcm_tokens/{userId} {
      allow read: if isAuthenticated() && userId == request.auth.uid;
      allow create: if isAuthenticated() && userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && userId == request.auth.uid;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Passo 6: Colar no Editor

1. **Selecione TODO o código** que está no editor (Ctrl+A ou Cmd+A)
2. **Delete** o código antigo
3. **Cole** o código novo que você copiou acima (Ctrl+V ou Cmd+V)

### Passo 7: Publicar as Regras

1. Após colar o código, você verá um botão **"Publicar"** (ou **"Publish"**) no topo direito do editor
2. Clique em **"Publicar"**
3. Uma confirmação pode aparecer - clique em **"Publicar"** novamente
4. Aguarde alguns segundos até aparecer a mensagem de sucesso

### Passo 8: Verificar se Funcionou

1. Volte para a aplicação no navegador
2. **Recarregue a página** (Ctrl+Shift+R ou Cmd+Shift+R)
3. Faça login novamente (se necessário)
4. Tente ativar notificações novamente
5. O token deve ser salvo com sucesso!

## ✅ Verificação Rápida

Após publicar as regras, você pode verificar:

1. No Firebase Console → Firestore Database → **Dados**
2. Procure pela coleção **`fcm_tokens`**
3. Deve aparecer um documento com seu `userId`
4. O documento deve ter os campos: `userId`, `token`, `createdAt`, `updatedAt`

## 🐛 Se Ainda Der Erro

### Verificar se está autenticado:

No console do navegador (F12), execute:
```javascript
import('@/firebase').then(({ auth }) => {
  console.log('Usuário autenticado:', auth.currentUser);
  console.log('UID:', auth.currentUser?.uid);
});
```

### Verificar se as regras foram publicadas:

1. Firebase Console → Firestore Database → **Regras**
2. Verifique se o código que você colou está lá
3. Deve aparecer uma mensagem no topo dizendo quando foi publicado pela última vez

### Verificar se o userId está correto:

O código salva o token com `userId` como ID do documento. Certifique-se de que:
- O `userId` usado no código corresponde ao `request.auth.uid`
- As regras verificam: `userId == request.auth.uid`

## 📝 Nota Importante

As regras do Firestore podem levar alguns segundos para serem aplicadas após a publicação. Se ainda der erro, aguarde 10-20 segundos e tente novamente.

