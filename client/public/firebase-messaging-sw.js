// Use a versão compatível com o Firebase 12.x do projeto
// Firebase compat SDK para service workers
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD9sTauUQNY8EiQdUrn5mSzBtS7LuLajg0",
  authDomain: "agenda-fd0df.firebaseapp.com",
  projectId: "agenda-fd0df",
  storageBucket: "agenda-fd0df.firebasestorage.app",
  messagingSenderId: "410252885923",
  appId: "1:410252885923:web:3f92cb92cedb2eec9f6416"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // VALIDAÇÃO: Verifica se a notificação tem userId
  // Se for uma notificação de atividade, deve ter userId no payload.data
  if (payload.data?.type === 'activity_reminder') {
    const notificationUserId = payload.data?.userId;
    
    if (!notificationUserId) {
      console.warn('[firebase-messaging-sw.js] Notificação de atividade sem userId, ignorando');
      return; // Não mostra notificação sem userId
    }
    
    // Tenta obter o userId do usuário logado do IndexedDB/localStorage
    // Se não conseguir, ainda mostra, mas o app vai validar quando abrir
    // Por enquanto, apenas valida que tem userId
    console.log('[firebase-messaging-sw.js] Notificação de atividade para userId:', notificationUserId);
  }
  
  const notificationTitle = payload.notification?.title || 'Nova notificação';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.png',
    badge: '/favicon.png',
    tag: payload.data?.activityId || 'notification',
    requireInteraction: false,
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
