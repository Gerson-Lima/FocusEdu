# Configuração de Notificações Push no Firebase Console

Este guia explica o que precisa ser configurado no Firebase Console para habilitar notificações push.

## 📋 Passo 1: Habilitar Cloud Messaging (FCM)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **agenda-fd0df**
3. No menu lateral, vá em **Build** → **Cloud Messaging**
4. Se ainda não estiver habilitado, clique em **"Get Started"** ou **"Habilitar"**

## 🔑 Passo 2: Obter a Chave VAPID (Web Push Certificate)

1. Ainda na página **Cloud Messaging**
2. Role até a seção **"Web configuration"** ou **"Configuração da Web"**
3. Procure por **"Web Push certificates"** ou **"Certificados Web Push"**
4. Se não existir uma chave, clique em **"Generate key pair"** ou **"Gerar par de chaves"**
5. **Copie a chave gerada** - você vai precisar dela (parece com: `BElGCi...`)

   ⚠️ **IMPORTANTE**: Guarde essa chave, ela será usada no código!

## 📱 Passo 3: Verificar Configuração do App Web

1. No Firebase Console, vá em **⚙️ Configurações do Projeto** (ícone de engrenagem)
2. Role até **"Seus aplicativos"** ou **"Your apps"**
3. Verifique se o app web está configurado corretamente com:
   - **App ID**: `1:410252885923:web:3f92cb92cedb2eec9f6416`
   - **Messaging Sender ID**: `410252885923`

## ⚙️ Passo 4: Configurar Cloud Functions (Opcional mas Recomendado)

Para enviar notificações automaticamente 1 dia antes da entrega, você precisará de Cloud Functions:

1. No Firebase Console, vá em **Build** → **Functions**
2. Se ainda não tiver habilitado, clique em **"Get Started"**
3. Aceite os termos e aguarde a configuração inicial
4. Você precisará instalar o Firebase CLI localmente (veremos depois)

## 🔐 Passo 5: Configurar Regras do Firestore (Se necessário)

1. Vá em **Firestore Database** → **Regras**
2. Certifique-se de que as regras permitem:
   - Usuários autenticados podem ler/escrever seus próprios dados
   - Uma coleção para armazenar tokens FCM dos usuários

## 📝 Resumo das Informações que Você Precisa

Após seguir os passos acima, você terá:

- ✅ Cloud Messaging habilitado
- ✅ Chave VAPID (Web Push Certificate) - **COPIE E GUARDE ESTA CHAVE!**
- ✅ Messaging Sender ID: `410252885923` (já está no seu código)
- ✅ Configurações do projeto confirmadas

## 🚀 Próximos Passos

Depois de obter a chave VAPID, você precisará:

1. Atualizar o arquivo `firebase-messaging-sw.js` com as credenciais corretas
2. Criar um serviço para solicitar permissão de notificações
3. Salvar o token FCM do usuário no Firestore
4. Criar Cloud Function para verificar atividades e enviar notificações

---

**Nota**: A chave VAPID é necessária para que o navegador aceite notificações push do seu domínio. Sem ela, as notificações não funcionarão.

