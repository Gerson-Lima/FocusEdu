import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/MockAuthContext';
import {
  initializeNotifications,
  hasNotificationPermission,
  requestNotificationPermission,
  saveFCMToken,
} from '@/lib/notificationService';
import { onMessage } from 'firebase/messaging';
import { getMessagingInstance } from '@/firebase';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  data?: Record<string, any>;
}

// Chave do localStorage para notificações fechadas
const getDismissedNotificationsKey = (userId: string) => `dismissed_notifications_${userId}`;

// Interface para armazenar informações sobre notificações fechadas
interface DismissedNotification {
  id: string;
  dismissedAt: number;
}

// Funções para gerenciar notificações fechadas no localStorage
function getDismissedNotifications(userId: string): Set<string> {
  if (typeof window === 'undefined' || !userId) return new Set();
  
  try {
    const key = getDismissedNotificationsKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) return new Set();
    
    const dismissed: DismissedNotification[] = JSON.parse(stored);
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 dias em milissegundos
    
    // Remove notificações fechadas há mais de 7 dias
    const recent = dismissed.filter(d => d.dismissedAt > sevenDaysAgo);
    
    // Salva de volta se houve limpeza
    if (recent.length !== dismissed.length) {
      localStorage.setItem(key, JSON.stringify(recent));
    }
    
    return new Set(recent.map(d => d.id));
  } catch (error) {
    console.error('Erro ao ler notificações fechadas:', error);
    return new Set();
  }
}

function addDismissedNotification(userId: string, notificationId: string) {
  if (typeof window === 'undefined' || !userId) return;
  
  try {
    const key = getDismissedNotificationsKey(userId);
    const dismissed = getDismissedNotifications(userId);
    
    // Adiciona a nova notificação fechada
    const dismissedArray: DismissedNotification[] = Array.from(dismissed).map(id => ({
      id,
      dismissedAt: Date.now(), // Atualiza timestamp para todas (simplificado)
    }));
    
    dismissedArray.push({
      id: notificationId,
      dismissedAt: Date.now(),
    });
    
    // Mantém apenas as últimas 100 notificações fechadas
    const limited = dismissedArray.slice(-100);
    
    localStorage.setItem(key, JSON.stringify(limited));
  } catch (error) {
    console.error('Erro ao salvar notificação fechada:', error);
  }
}

function clearDismissedNotifications(userId: string) {
  if (typeof window === 'undefined' || !userId) return;
  
  try {
    const key = getDismissedNotificationsKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Erro ao limpar notificações fechadas:', error);
  }
}

export interface NotificationState {
  permission: NotificationPermission | null;
  isSupported: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  notifications: NotificationItem[];
}

export function useNotifications() {
  const { currentUser } = useFirebaseAuth();
  const [state, setState] = useState<NotificationState>({
    permission: null,
    isSupported: false,
    isInitialized: false,
    isLoading: false,
    notifications: [],
  });

  // Verifica suporte e permissão inicial
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      const permission = supported ? Notification.permission : null;
      
      setState((prev) => ({
        ...prev,
        isSupported: supported,
        permission,
      }));
    };

    checkSupport();
  }, []);

  // Inicializa notificações quando o usuário estiver logado
  useEffect(() => {
    if (!currentUser || !state.isSupported || state.isInitialized) {
      return;
    }

    const init = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      
      try {
        const success = await initializeNotifications(currentUser.uid);
        if (success) {
          setState((prev) => ({
            ...prev,
            isInitialized: true,
            permission: 'granted',
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    init();
  }, [currentUser, state.isSupported, state.isInitialized]);

  // Escuta mensagens quando o app está em primeiro plano
  useEffect(() => {
    if (!state.isInitialized || !currentUser) {
      return;
    }

    const messaging = getMessagingInstance();
    if (!messaging) {
      return;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensagem recebida em primeiro plano:', payload);
      
      if (!currentUser) {
        console.warn('[Notifications] Usuário não está logado, ignorando notificação');
        return;
      }
      
      // VALIDAÇÃO CRÍTICA: Verifica se a notificação pertence ao usuário logado
      const notificationUserId = payload.data?.userId;
      if (notificationUserId && notificationUserId !== currentUser.uid) {
        console.warn(
          `[Notifications] Notificação ignorada: pertence a outro usuário. ` +
          `Notificação userId: ${notificationUserId}, Usuário logado: ${currentUser.uid}`
        );
        return; // Ignora notificações de outros usuários
      }
      
      // Se não tem userId na notificação mas é de atividade, também ignora por segurança
      if (payload.data?.type === 'activity_reminder' && !notificationUserId) {
        console.warn('[Notifications] Notificação de atividade sem userId, ignorando por segurança');
        return;
      }
      
      // Extrai informações da notificação
      const title = payload.notification?.title || 'Nova notificação';
      const body = payload.notification?.body || '';
      const messageId = payload.messageId || `msg-${Date.now()}-${Math.random()}`;
      
      // Cria uma chave única baseada no conteúdo da notificação
      // Se for uma notificação de atividade, usa activityId + dueDate
      // Caso contrário, usa o messageId
      let notificationKey = messageId;
      if (payload.data?.activityId && payload.data?.dueDate) {
        notificationKey = `activity_${payload.data.activityId}_${payload.data.dueDate}`;
      }
      
      // Verifica se a notificação já foi fechada anteriormente
      const dismissed = getDismissedNotifications(currentUser.uid);
      if (dismissed.has(notificationKey)) {
        console.log('Notificação já foi fechada anteriormente, ignorando:', notificationKey);
        return;
      }
      
      // Adiciona à lista de notificações
      const notificationItem: NotificationItem = {
        id: notificationKey, // Usa a chave única em vez do messageId
        title,
        body,
        timestamp: Date.now(),
        data: payload.data,
      };
      
      setState((prev) => {
        // Remove notificações duplicadas com a mesma chave
        const filtered = prev.notifications.filter(n => n.id !== notificationKey);
        return {
          ...prev,
          notifications: [notificationItem, ...filtered].slice(0, 50), // Mantém apenas as últimas 50
        };
      });
      
      // Mostra notificação usando toast quando o app está aberto
      toast.info(title, {
        description: body,
        duration: 5000,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [state.isInitialized, currentUser]);

  // Função para solicitar permissão manualmente
  const requestPermission = async () => {
    if (!currentUser) {
      toast.error('Você precisa estar logado para ativar notificações');
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        await saveFCMToken(currentUser.uid, token);
        setState((prev) => ({
          ...prev,
          permission: 'granted',
          isInitialized: true,
          isLoading: false,
        }));
        toast.success('Notificações ativadas com sucesso!');
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
        toast.error('Permissão de notificações negada');
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      toast.error('Erro ao ativar notificações');
      return false;
    }
  };

  const clearNotifications = () => {
    if (currentUser) {
      // Marca todas as notificações atuais como fechadas
      state.notifications.forEach(notif => {
        addDismissedNotification(currentUser.uid, notif.id);
      });
    }
    
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  const removeNotification = (id: string) => {
    // Marca a notificação como fechada no localStorage
    if (currentUser) {
      addDismissedNotification(currentUser.uid, id);
    }
    
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  return {
    ...state,
    requestPermission,
    clearNotifications,
    removeNotification,
  };
}

