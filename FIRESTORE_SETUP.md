# Configuração das Regras de Segurança do Firestore

O erro "Missing or insufficient permissions" indica que as regras de segurança do Firestore precisam ser configuradas.

## Passo a Passo para Configurar as Regras

### Opção 1: Via Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `agenda-fd0df`
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras** (Rules)
5. Cole o seguinte código nas regras:

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
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Clique em **Publicar** (Publish)

### Opção 2: Via Firebase CLI

Se você tiver o Firebase CLI instalado:

```bash
firebase deploy --only firestore:rules
```

## Regras Temporárias para Desenvolvimento (NÃO USE EM PRODUÇÃO)

⚠️ **ATENÇÃO**: As regras abaixo permitem acesso total a usuários autenticados. Use APENAS para desenvolvimento/testes.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Verificação

Após configurar as regras:

1. Recarregue a página da aplicação
2. Faça login novamente
3. Tente criar uma atividade
4. Se ainda houver erro, verifique:
   - Se você está autenticado (verifique o console do navegador)
   - Se o `userId` está sendo enviado corretamente nos dados
   - Se as regras foram publicadas corretamente

## Solução de Problemas

### Erro: "Missing or insufficient permissions"

- Verifique se você está autenticado
- Verifique se as regras foram publicadas
- Verifique se o `userId` no documento corresponde ao `request.auth.uid`

### Erro: "ERR_BLOCKED_BY_CLIENT"

- Desative extensões do navegador que possam estar bloqueando
- Verifique se há firewall/proxy bloqueando requisições
- Teste em modo anônimo/privado

