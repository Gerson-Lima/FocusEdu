# 🔍 Como Verificar e Corrigir Atividades com userId Incorreto

## ⚠️ Problema

Se você está recebendo notificações de atividades de outro usuário, pode ser que algumas atividades tenham o `userId` incorreto no Firestore.

## ✅ Solução Implementada

O sistema agora tem **validações rigorosas** que garantem que:

1. ✅ Apenas atividades com `userId` válido são processadas
2. ✅ O email é buscado usando o `userId` da atividade
3. ✅ O token FCM é buscado usando o `userId` da atividade
4. ✅ Validação final confirma que email e token pertencem ao usuário correto
5. ✅ Logs detalhados mostram exatamente o que está acontecendo

## 🔍 Como Verificar no Firestore

### Passo 1: Acessar Firestore Console

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: **agenda-fd0df**
3. Vá em **Firestore Database** → **Dados**

### Passo 2: Verificar Atividades

1. Clique na coleção **`activity`**
2. Para cada atividade, verifique:
   - O campo **`userId`** deve corresponder ao UID do usuário
   - Compare com o UID do usuário em **`users/{userId}`**

### Passo 3: Verificar Usuários

1. Clique na coleção **`users`**
2. Anote os UIDs dos usuários
3. Verifique se o email está correto em cada documento

## 🛠️ Como Corrigir Atividades com userId Incorreto

### Opção 1: Via Firebase Console (Manual)

1. Acesse a atividade com `userId` incorreto
2. Clique em **Editar documento**
3. Corrija o campo **`userId`** para o UID correto
4. Salve

### Opção 2: Via Código (Script)

Se houver muitas atividades incorretas, você pode criar um script para corrigir:

```typescript
// Script para corrigir userId de atividades
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

async function corrigirAtividades() {
  const activitiesRef = collection(db, 'activity');
  const snapshot = await getDocs(activitiesRef);
  
  snapshot.forEach(async (docSnapshot) => {
    const data = docSnapshot.data();
    const activityId = docSnapshot.id;
    
    // Verifica se tem userId
    if (!data.userId) {
      console.log(`Atividade ${activityId} sem userId`);
      // Você precisa determinar o userId correto manualmente
    }
    
    // Verifica se o userId corresponde a um usuário válido
    const userRef = doc(db, 'users', data.userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log(`Atividade ${activityId} tem userId inválido: ${data.userId}`);
      // Você precisa determinar o userId correto manualmente
    }
  });
}
```

## 📊 Logs do Sistema

O sistema agora mostra logs detalhados no terminal:

```
[ActivityNotifications] Processando 2 atividade(s) para usuário abc123
[ActivityNotifications] Email encontrado para usuário abc123: usuario@email.com
[ActivityNotifications] ✅ Email enviado para usuario@email.com (userId: abc123, 2 atividade(s))
```

Se houver erro, você verá:
```
[ActivityNotifications] ERRO: Encontradas 1 atividades com userId incorreto para usuário abc123
[ActivityNotifications] ERRO: Email não corresponde ao userId! userId: abc123, email esperado: correto@email.com, email usado: errado@email.com
```

## ✅ Verificação Final

Após corrigir, teste:

1. Crie uma atividade com entrega para amanhã
2. Verifique os logs no terminal
3. Confirme que o email recebido é do usuário correto
4. Verifique que apenas as atividades do usuário logado aparecem

## 🎯 Prevenção

O sistema agora:
- ✅ Valida `userId` ao criar atividades
- ✅ Valida `userId` ao processar notificações
- ✅ Valida que email e token pertencem ao usuário correto
- ✅ Remove atividades inválidas do processamento
- ✅ Mostra logs detalhados para debug

---

**Se o problema persistir**, verifique:
1. Se as atividades foram criadas com `userId` correto
2. Se o email do usuário está correto no Firestore
3. Se há cache do navegador (tente limpar ou usar modo anônimo)

