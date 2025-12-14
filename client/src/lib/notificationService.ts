import { getMessagingInstance, getToken, VAPID_KEY } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const FCM_TOKEN_COLLECTION = 'fcm_tokens';

export interface FCMTokenData {
  userId: string;
  token: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Registra o Service Worker necessário para notificações push
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers não são suportados neste navegador');
    return null;
  }

  try {
    // Verifica se já existe um service worker registrado
    let registration = await navigator.serviceWorker.getRegistration('/');
    
    if (!registration) {
      // Tenta registrar o service worker
      // O arquivo deve estar em /firebase-messaging-sw.js na raiz do domínio
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('Service Worker registrado com sucesso:', registration.scope);
    } else {
      console.log('Service Worker já estava registrado:', registration.scope);
    }
    
    // Aguarda o service worker estar completamente ativo
    if (registration.installing) {
      console.log('Service Worker está instalando...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout aguardando service worker instalar'));
        }, 10000);
        
        registration.installing!.addEventListener('statechange', () => {
          console.log('Service Worker state:', registration.installing!.state);
          if (registration.installing!.state === 'activated') {
            clearTimeout(timeout);
            resolve();
          } else if (registration.installing!.state === 'redundant') {
            clearTimeout(timeout);
            reject(new Error('Service Worker se tornou redundante'));
          }
        });
      });
    } else if (registration.waiting) {
      console.log('Service Worker está esperando...');
      // Se está esperando, tenta ativar
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      await navigator.serviceWorker.ready;
    } else {
      // Já está ativo, mas aguarda estar completamente pronto
      await navigator.serviceWorker.ready;
    }

    // Aguarda um pouco mais para garantir que está totalmente pronto
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Service Worker está pronto!');
    return registration;
  } catch (error) {
    console.error('Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Solicita permissão de notificações e obtém o token FCM
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Verifica se o navegador suporta notificações
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers não são suportados neste navegador');
      return null;
    }

    // PASSO 1: Registra o Service Worker PRIMEIRO (antes de inicializar messaging)
    console.log('Passo 1: Registrando Service Worker...');
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Não foi possível registrar o Service Worker');
      return null;
    }

    // Aguarda o service worker estar completamente pronto
    console.log('Aguardando Service Worker estar pronto...');
    await navigator.serviceWorker.ready;
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Service Worker está pronto!');

    // PASSO 2: Solicita permissão
    console.log('Passo 2: Solicitando permissão de notificações...');
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Permissão de notificações negada');
      return null;
    }

    console.log('Permissão de notificações concedida');

    // PASSO 3: Inicializa Firebase Messaging AGORA (depois do service worker estar pronto)
    console.log('Passo 3: Inicializando Firebase Messaging...');
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.error('Não foi possível inicializar Firebase Messaging');
      return null;
    }
    console.log('Firebase Messaging inicializado');

    // PASSO 4: Obtém o token FCM
    console.log('Passo 4: Obtendo token FCM...');
    console.log('Service Worker active:', registration.active?.state);
    console.log('VAPID Key:', VAPID_KEY.substring(0, 20) + '...');

    // Verifica se o Service Worker suporta push
    if (!registration.pushManager) {
      throw new Error('Service Worker não suporta Push Manager. Verifique se está usando HTTPS ou localhost.');
    }

    // Verifica se já existe uma subscription
    let subscription = await registration.pushManager.getSubscription();
    console.log('Subscription existente:', subscription ? 'Sim' : 'Não');

    let token: string | null = null;
    try {
      // Tenta obter o token
      console.log('Chamando getToken com VAPID key...');
      token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      console.log('Token FCM obtido com sucesso!');
    } catch (tokenError: any) {
      console.error('Erro ao obter token FCM:', tokenError);
      console.error('Código do erro:', tokenError.code);
      console.error('Mensagem do erro:', tokenError.message);
      console.error('Stack:', tokenError.stack);
      
      // Erro código 20 geralmente indica problema com o serviço de push do navegador
      if (tokenError.code === 20 || tokenError.message?.includes('push service error')) {
        const errorMsg = 
          'Erro ao registrar serviço de push. Possíveis causas:\n' +
          '1. Navegador bloqueando serviços de push (Brave Browser precisa ativar "Usar serviços do Google para mensagens push")\n' +
          '2. Chave VAPID não configurada corretamente no Firebase Console\n' +
          '3. Cloud Messaging não habilitado no Firebase Console\n' +
          '4. Problema de conexão com o serviço de push do Google';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Se for erro de VAPID key, dá uma mensagem mais clara
      if (tokenError.code === 'messaging/invalid-vapid-key' || 
          tokenError.message?.includes('VAPID')) {
        throw new Error('Chave VAPID inválida. Verifique se a chave está correta no Firebase Console e no código.');
      }
      
      throw tokenError;
    }

    if (!token) {
      console.warn('Não foi possível obter o token FCM');
      return null;
    }

    console.log('Token FCM obtido com sucesso');
    return token;
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificações:', error);
    return null;
  }
}

/**
 * Salva o token FCM do usuário no Firestore
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    // VALIDAÇÃO: Garante que userId e token são válidos
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('userId inválido ao salvar token FCM');
    }
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('token FCM inválido');
    }
    
    const tokenRef = doc(db, FCM_TOKEN_COLLECTION, userId);
    const tokenData: FCMTokenData = {
      userId: userId.trim(), // Garante que não há espaços
      token: token.trim(), // Garante que não há espaços
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Verifica se já existe um token
    const existingToken = await getDoc(tokenRef);
    if (existingToken.exists()) {
      const existingData = existingToken.data() as FCMTokenData;
      
      // VALIDAÇÃO CRÍTICA: Se o token existente pertence a outro usuário, remove e recria
      if (existingData.userId && existingData.userId !== userId) {
        console.warn(
          `[saveFCMToken] Token existente pertence a outro usuário! ` +
          `Existente: ${existingData.userId}, Novo: ${userId}. Removendo token antigo.`
        );
        // Remove o token antigo e cria um novo
        await setDoc(tokenRef, tokenData);
      } else {
        tokenData.createdAt = existingData.createdAt; // Mantém a data de criação original
        await setDoc(tokenRef, tokenData, { merge: true });
      }
    } else {
      await setDoc(tokenRef, tokenData);
    }
    
    console.log(`[saveFCMToken] Token FCM salvo no Firestore para userId: ${userId}`);
  } catch (error) {
    console.error('Erro ao salvar token FCM:', error);
    throw error;
  }
}

/**
 * Obtém o token FCM salvo do usuário
 */
export async function getFCMToken(userId: string): Promise<string | null> {
  try {
    const tokenRef = doc(db, FCM_TOKEN_COLLECTION, userId);
    const tokenDoc = await getDoc(tokenRef);
    
    if (tokenDoc.exists()) {
      const data = tokenDoc.data() as FCMTokenData;
      return data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter token FCM:', error);
    return null;
  }
}

/**
 * Verifica se o usuário já tem permissão de notificações
 */
export function hasNotificationPermission(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Inicializa as notificações para o usuário
 * Solicita permissão, obtém token e salva no Firestore
 */
export async function initializeNotifications(userId: string): Promise<boolean> {
  try {
    // Verifica se já tem permissão
    if (!hasNotificationPermission()) {
      const token = await requestNotificationPermission();
      if (!token) {
        return false;
      }
      await saveFCMToken(userId, token);
      return true;
    }

    // PASSO 1: Registra o Service Worker PRIMEIRO
    console.log('Registrando Service Worker (já tem permissão)...');
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Não foi possível registrar o Service Worker');
      return false;
    }

    // Aguarda o service worker estar completamente pronto
    await navigator.serviceWorker.ready;
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Service Worker está pronto!');

    // PASSO 2: Inicializa Firebase Messaging AGORA
    console.log('Inicializando Firebase Messaging...');
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.error('Não foi possível inicializar Firebase Messaging');
      return false;
    }

    console.log('Tentando obter token FCM (já tem permissão)...');

    // Verifica se o Service Worker suporta push
    if (!registration.pushManager) {
      console.error('Service Worker não suporta Push Manager');
      return false;
    }

    // PASSO 3: Obtém o token
    let token: string | null = null;
    try {
      console.log('Chamando getToken com VAPID key...');
      token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      console.log('Token FCM obtido com sucesso!');
    } catch (tokenError: any) {
      console.error('Erro ao obter token FCM:', tokenError);
      console.error('Código do erro:', tokenError.code);
      console.error('Mensagem do erro:', tokenError.message);
      
      // Erro código 20 geralmente indica problema com o serviço de push do navegador
      if (tokenError.code === 20 || tokenError.message?.includes('push service error')) {
        console.error(
          'Erro ao registrar serviço de push. Possíveis causas:\n' +
          '1. Navegador bloqueando serviços de push (Brave Browser precisa ativar "Usar serviços do Google para mensagens push")\n' +
          '2. Chave VAPID não configurada corretamente no Firebase Console\n' +
          '3. Cloud Messaging não habilitado no Firebase Console'
        );
      }
      
      return false;
    }

    if (token) {
      await saveFCMToken(userId, token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao inicializar notificações:', error);
    return false;
  }
}

