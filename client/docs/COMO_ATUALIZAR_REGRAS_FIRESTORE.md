# 🔐 Como Atualizar as Regras do Firestore - Passo a Passo

## ✅ Boa Notícia!

O token FCM está sendo obtido com sucesso! 🎉  
O problema agora é apenas **permissão do Firestore** para salvar o token.

## 📋 Passo a Passo no Firebase Console

### 1️⃣ Acessar o Firebase Console

1. Abra: https://console.firebase.google.com/
2. Faça login (se necessário)
3. Selecione o projeto: **agenda-fd0df**

### 2️⃣ Abrir Firestore Database

1. No menu lateral esquerdo, clique em **"Firestore Database"**
   - Ícone: 📊 (banco de dados)
   - Ou procure por "Firestore" no menu

### 3️⃣ Abrir a Aba Regras

1. Você verá 4 abas no topo: **Dados**, **Regras**, **Índices**, **Uso**
2. Clique na aba **"Regras"** (ou **"Rules"**)

### 4️⃣ Copiar as Regras

Copie **TODO** o código abaixo (Ctrl+A, Ctrl+C):

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

### 5️⃣ Colar no Editor

1. No editor de regras do Firebase Console:
   - Selecione TODO o código antigo (Ctrl+A ou Cmd+A)
   - Delete (Delete ou Backspace)
   - Cole o código novo (Ctrl+V ou Cmd+V)

### 6️⃣ Publicar

1. Procure o botão **"Publicar"** (ou **"Publish"**) no topo direito
2. Clique em **"Publicar"**
3. Se aparecer confirmação, clique em **"Publicar"** novamente
4. Aguarde a mensagem de sucesso (pode levar alguns segundos)

### 7️⃣ Verificar

1. Volte para sua aplicação
2. **Recarregue a página** (Ctrl+Shift+R)
3. Tente ativar notificações novamente
4. Deve funcionar! ✅

## 🎯 O Que Foi Corrigido

As regras agora verificam que:
- ✅ O `userId` no documento corresponde ao `request.auth.uid`
- ✅ O campo `userId` dentro dos dados também corresponde ao `request.auth.uid`
- ✅ Usuário está autenticado

## ⚠️ Importante

Após publicar as regras, pode levar **10-30 segundos** para serem aplicadas. Se ainda der erro, aguarde um pouco e tente novamente.

## 🔍 Verificar se Funcionou

1. Firebase Console → Firestore Database → **Dados**
2. Procure pela coleção **`fcm_tokens`**
3. Deve aparecer um documento com seu `userId` como ID
4. O documento deve ter: `userId`, `token`, `createdAt`, `updatedAt`

