# 🔐 Como Configurar Firebase Admin para Notificações (Desenvolvimento Local)

## ❌ Problema

O erro `Unable to detect a Project Id in the current environment` acontece porque o Firebase Admin SDK precisa de credenciais para acessar o Firestore e enviar notificações.

## ✅ Solução: Baixar Service Account Key

### Passo 1: Acessar Firebase Console

1. Abra: https://console.firebase.google.com/
2. Selecione o projeto: **agenda-fd0df**

### Passo 2: Abrir Configurações do Projeto

1. Clique no ícone de **⚙️ Configurações** (canto superior esquerdo, ao lado do nome do projeto)
2. Ou clique no nome do projeto e depois em **"Configurações do projeto"**

### Passo 3: Ir para Contas de Serviço

1. No menu lateral, clique em **"Contas de serviço"** (ou **"Service accounts"**)
2. Você verá uma seção chamada **"Contas de serviço do Firebase"**

### Passo 4: Gerar Nova Chave Privada

1. Na seção **"Contas de serviço do Firebase"**, você verá uma conta chamada **"firebase-adminsdk-..."**
2. Clique no botão **"Gerar nova chave privada"** (ou **"Generate new private key"**)
3. Uma caixa de diálogo aparecerá avisando sobre segurança
4. Clique em **"Gerar chave"** (ou **"Generate key"**)
5. Um arquivo JSON será baixado (exemplo: `agenda-fd0df-firebase-adminsdk-xxxxx.json`)

### Passo 5: Configurar Variável de Ambiente

**Opção A: Via arquivo `.env` (Recomendado para desenvolvimento)**

1. No diretório raiz do projeto (`/home/zirlangio/Documentos/Projetos/agenda-academica/`), crie ou edite o arquivo `.env`
2. Abra o arquivo JSON baixado e copie TODO o conteúdo
3. No arquivo `.env`, adicione:

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"agenda-fd0df",...}'
```

⚠️ **IMPORTANTE**: 
- Use aspas simples `'...'` ao redor do JSON
- O JSON deve estar em UMA linha (sem quebras de linha)
- Ou use aspas duplas e escape as aspas internas: `FIREBASE_SERVICE_ACCOUNT="{\"type\":\"service_account\",...}"`

**Exemplo completo:**

```bash
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"agenda-fd0df","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@agenda-fd0df.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Opção B: Via terminal (temporário)**

```bash
export FIREBASE_SERVICE_ACCOUNT='$(cat /caminho/para/arquivo.json)'
```

### Passo 6: Reiniciar o Servidor

1. Pare o servidor (Ctrl+C)
2. Inicie novamente:

```bash
npm run dev
```

### Passo 7: Testar

1. Abra a aplicação no navegador
2. Clique no botão de notificações
3. Clique em **"Testar Notificações"**
4. Deve funcionar! ✅

## 🔒 Segurança

⚠️ **NUNCA** faça commit do arquivo JSON da Service Account no Git!

1. Adicione `.env` ao `.gitignore` (se ainda não estiver)
2. Adicione `*-firebase-adminsdk-*.json` ao `.gitignore`
3. NUNCA compartilhe a chave privada publicamente

## 🚀 Produção (Cloud Functions)

Em produção (Cloud Functions), você não precisa fazer isso manualmente. O Firebase já fornece as credenciais automaticamente.

## ❓ Problemas Comuns

### Erro: "Invalid JSON"
- Certifique-se de que o JSON está em UMA linha no `.env`
- Use aspas simples ao redor do JSON

### Erro: "Permission denied"
- Verifique se a Service Account tem permissões no Firestore
- No Firebase Console, vá em **IAM & Admin** → **IAM** e verifique se a conta tem a role **"Firebase Admin"** ou **"Editor"**

### Erro: "Project ID not found"
- Certifique-se de que o `project_id` no JSON é `"agenda-fd0df"`

## 📝 Verificar se Funcionou

Após configurar, quando você clicar em **"Testar Notificações"**, você deve ver no terminal:

```
[ActivityNotifications] MODO TESTE: Verificando atividades...
[ActivityNotifications] Encontradas X atividades...
[ActivityNotifications] Notificação enviada para usuário...
```

E no navegador, uma mensagem de sucesso! ✅

