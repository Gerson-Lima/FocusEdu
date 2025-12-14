# Configuração da Cloud Function para Notificações

Este guia explica como configurar e fazer deploy da Cloud Function que verifica atividades e envia notificações 1 dia antes da entrega.

## 📋 Pré-requisitos

1. Firebase CLI instalado
2. Node.js 18+ instalado
3. Conta Firebase com Cloud Functions habilitado

## 🚀 Passo 1: Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

## 🔐 Passo 2: Fazer Login no Firebase

```bash
firebase login
```

## ⚙️ Passo 3: Inicializar Functions no Projeto

No diretório raiz do projeto:

```bash
firebase init functions
```

Quando perguntado:
- **Selecione seu projeto Firebase**: `agenda-fd0df`
- **Linguagem**: TypeScript
- **ESLint**: Sim (opcional)
- **Instalar dependências**: Sim

## 🔑 Passo 4: Configurar Service Account

Para que a Cloud Function possa acessar o Firestore e enviar notificações, você precisa de uma Service Account:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá em **⚙️ Configurações do Projeto** → **Contas de serviço**
3. Clique em **Gerar nova chave privada**
4. Baixe o arquivo JSON
5. Adicione o conteúdo do JSON como variável de ambiente:

**Opção A: Via Firebase Console (Recomendado)**
- Vá em **Functions** → **Configurações**
- Adicione a variável de ambiente `FIREBASE_SERVICE_ACCOUNT` com o conteúdo do JSON (como string)

**Opção B: Via Firebase CLI**
```bash
firebase functions:config:set service_account.key="$(cat path/to/service-account-key.json)"
```

## 📝 Passo 5: Atualizar Regras do Firestore

Certifique-se de que as regras do Firestore permitem que a Cloud Function leia atividades e tokens FCM. As regras já foram atualizadas no arquivo `firestore.rules`.

## 🏗️ Passo 6: Fazer Build e Deploy

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

## 🧪 Passo 7: Testar a Function

### Teste Manual via HTTP

Após o deploy, você receberá uma URL como:
```
https://us-central1-agenda-fd0df.cloudfunctions.net/testActivityNotifications
```

Acesse essa URL no navegador ou via curl:

```bash
curl https://us-central1-agenda-fd0df.cloudfunctions.net/testActivityNotifications
```

### Teste Local (Emulador)

```bash
firebase emulators:start --only functions
```

Depois acesse: `http://localhost:5001/agenda-fd0df/us-central1/testActivityNotifications`

## ⏰ Agendamento Automático

A função `checkActivityNotifications` está configurada para rodar **diariamente às 8:00 AM (horário de Brasília)**.

Para alterar o horário, edite `functions/index.ts`:

```typescript
.schedule("0 8 * * *") // Formato cron: minuto hora dia mês dia-da-semana
.timeZone("America/Sao_Paulo")
```

Exemplos de agendamento:
- `"0 8 * * *"` - Todos os dias às 8:00 AM
- `"0 9 * * 1-5"` - Segunda a sexta às 9:00 AM
- `"0 */6 * * *"` - A cada 6 horas

## 📊 Monitoramento

Para ver os logs da função:

```bash
firebase functions:log
```

Ou no Firebase Console:
- **Functions** → **Logs**

## 🔧 Troubleshooting

### Erro: "Permission denied"
- Verifique se as regras do Firestore permitem leitura
- Verifique se a Service Account tem as permissões corretas

### Erro: "Invalid registration token"
- O token FCM do usuário pode estar expirado
- A função remove automaticamente tokens inválidos

### Erro: "Function failed to deploy"
- Verifique se todas as dependências estão instaladas
- Verifique se o TypeScript compila sem erros: `npm run build`

## 📚 Recursos

- [Documentação Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Cloud Scheduler](https://cloud.google.com/scheduler/docs)

