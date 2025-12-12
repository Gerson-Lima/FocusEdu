// Lazy import Firebase Admin to avoid errors in development
// Only import when the function is actually called
let firebaseAdmin: any = null;
let adminApp: any = null;
let db: any = null;
let messaging: any = null;

async function initializeFirebaseAdmin() {
  if (adminApp && db && messaging) {
    return; // Already initialized
  }

  // Lazy import - only load when needed
  if (!firebaseAdmin) {
    try {
      firebaseAdmin = await import("firebase-admin/app");
      const { getFirestore } = await import("firebase-admin/firestore");
      const { getMessaging } = await import("firebase-admin/messaging");
      
      // Store functions for later use
      (initializeFirebaseAdmin as any).getFirestore = getFirestore;
      (initializeFirebaseAdmin as any).getMessaging = getMessaging;
    } catch (error) {
      console.warn("Failed to import firebase-admin:", error);
      throw new Error("firebase-admin não está disponível. Instale com: npm install firebase-admin");
    }
  }

  const { initializeApp, getApps, cert } = firebaseAdmin;
  const getFirestore = (initializeFirebaseAdmin as any).getFirestore;
  const getMessaging = (initializeFirebaseAdmin as any).getMessaging;

  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    db = getFirestore(adminApp);
    messaging = getMessaging(adminApp);
    return;
  }

  // In production, use service account from environment
  // In development, you can use application default credentials
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || "agenda-fd0df",
      });
    } else {
      // Try to use application default credentials
      // Explicitly set projectId for local development
      adminApp = initializeApp({
        projectId: "agenda-fd0df",
      });
    }
    db = getFirestore(adminApp);
    messaging = getMessaging(adminApp);
  } catch (error: any) {
    console.error("[ActivityNotifications] Firebase Admin initialization failed:", error.message);
    console.error("[ActivityNotifications] Para desenvolvimento local, você precisa:");
    console.error("  1. Baixar a Service Account Key do Firebase Console");
    console.error("  2. Definir a variável de ambiente FIREBASE_SERVICE_ACCOUNT com o JSON");
    console.error("  3. Ou usar: firebase login e gcloud auth application-default login");
    // Don't throw - allow the function to be called but it will fail gracefully
    adminApp = null;
    db = null;
    messaging = null;
  }
}

interface Activity {
  id: string;
  userId: string;
  title: string;
  dueDate: number;
  status: string;
  courseName?: string;
}

interface FCMToken {
  userId: string;
  token: string;
}

/**
 * Verifica atividades que têm entrega em 1 dia e envia notificações
 * @param testMode Se true, verifica atividades que vencem hoje ou amanhã (útil para testes)
 */
export async function checkAndSendActivityNotifications(testMode: boolean = false): Promise<{
  checked: number;
  sent: number;
  errors: number;
  activities: Array<{ userId: string; title: string; dueDate: number }>;
}> {
  // Initialize Firebase Admin if not already done (lazy import)
  await initializeFirebaseAdmin();

  if (!adminApp || !db || !messaging) {
    throw new Error("Firebase Admin não está configurado. Configure FIREBASE_SERVICE_ACCOUNT ou use Application Default Credentials. Em desenvolvimento local, esta função só funciona com credenciais configuradas.");
  }

  const now = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  let startTime: number;
  let endTime: number;
  
  if (testMode) {
    // Modo teste: verifica atividades que vencem hoje ou amanhã
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMidnight = today.getTime();
    
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMidnight = tomorrow.getTime();
    const tomorrowEnd = tomorrowMidnight + (24 * 60 * 60 * 1000) - 1;
    
    startTime = todayMidnight;
    endTime = tomorrowEnd;
    
    console.log(`[ActivityNotifications] MODO TESTE: Verificando atividades com entrega entre ${new Date(startTime).toISOString()} e ${new Date(endTime).toISOString()}`);
  } else {
    // Modo produção: verifica apenas atividades que vencem amanhã
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMidnight = tomorrow.getTime();
    const tomorrowEnd = tomorrowMidnight + (24 * 60 * 60 * 1000) - 1;
    
    startTime = tomorrowMidnight;
    endTime = tomorrowEnd;
    
    console.log(`[ActivityNotifications] Verificando atividades com entrega entre ${new Date(startTime).toISOString()} e ${new Date(endTime).toISOString()}`);
  }
  
  let checked = 0;
  let sent = 0;
  let errors = 0;

  try {
    // Busca todas as atividades que têm entrega no período definido
    // e que não estão concluídas
    const activitiesSnapshot = await db
      .collection("activity")
      .where("dueDate", ">=", startTime)
      .where("dueDate", "<=", endTime)
      .get();

    checked = activitiesSnapshot.size;
    const activityList: Array<{ userId: string; title: string; dueDate: number }> = [];
    
    console.log(`[ActivityNotifications] Encontradas ${checked} atividades com entrega no período`);

    if (checked === 0) {
      return { checked: 0, sent: 0, errors: 0, activities: [] };
    }

    // Agrupa atividades por usuário
    const activitiesByUser = new Map<string, Activity[]>();
    
    activitiesSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // VALIDAÇÃO: Garante que a atividade tem userId
      if (!data.userId || typeof data.userId !== 'string') {
        console.warn(`[ActivityNotifications] Atividade ${doc.id} não tem userId válido, ignorando`);
        return;
      }
      
      const activity: Activity = {
        id: doc.id,
        userId: data.userId,
        title: data.title || data.name || "Atividade sem título",
        dueDate: data.dueDate,
        status: data.status,
        courseName: data.courseName || data.courseId,
      };

      // Ignora atividades concluídas
      if (activity.status === "concluida" || data.completedAt) {
        return;
      }

      if (!activitiesByUser.has(activity.userId)) {
        activitiesByUser.set(activity.userId, []);
      }
      activitiesByUser.get(activity.userId)!.push(activity);
      activityList.push({ userId: activity.userId, title: activity.title, dueDate: activity.dueDate });
    });

    console.log(`[ActivityNotifications] ${activitiesByUser.size} usuários com atividades pendentes`);

    // Para cada usuário, busca o token FCM e envia notificação
    for (const [userId, activities] of activitiesByUser.entries()) {
      try {
        // VALIDAÇÃO: Garante que o userId é válido
        if (!userId || typeof userId !== 'string') {
          console.warn(`[ActivityNotifications] userId inválido encontrado, ignorando: ${userId}`);
          continue;
        }
        
        // VALIDAÇÃO: Garante que as atividades pertencem a este usuário
        const invalidActivities = activities.filter(a => a.userId !== userId);
        if (invalidActivities.length > 0) {
          console.error(`[ActivityNotifications] ERRO: Encontradas ${invalidActivities.length} atividades com userId incorreto para usuário ${userId}`);
          console.error(`[ActivityNotifications] Atividades inválidas:`, invalidActivities.map(a => ({ id: a.id, userId: a.userId })));
          // Remove atividades inválidas
          activities.splice(0, activities.length, ...activities.filter(a => a.userId === userId));
        }
        
        if (activities.length === 0) {
          console.warn(`[ActivityNotifications] Nenhuma atividade válida para usuário ${userId}, pulando`);
          continue;
        }
        
        // FILTRO: Remove atividades que já tiveram email enviado
        const activitiesToNotify: Activity[] = [];
        for (const activity of activities) {
          // Verifica se já foi enviado email para esta atividade
          const emailNotificationKey = `${userId}_${activity.id}`;
          const emailNotificationDoc = await db.collection("sent_email_notifications").doc(emailNotificationKey).get();
          
          if (emailNotificationDoc.exists) {
            const notificationData = emailNotificationDoc.data();
            // Se já foi enviado e foi bem-sucedido, pula esta atividade
            if (notificationData?.emailSent === true) {
              console.log(`[ActivityNotifications] Email já foi enviado para atividade ${activity.id} (${activity.title}), pulando...`);
              continue;
            }
          }
          
          activitiesToNotify.push(activity);
        }
        
        if (activitiesToNotify.length === 0) {
          console.log(`[ActivityNotifications] Todas as atividades do usuário ${userId} já tiveram emails enviados, pulando...`);
          continue;
        }
        
        console.log(`[ActivityNotifications] Processando ${activitiesToNotify.length} atividade(s) para usuário ${userId} (${activities.length - activitiesToNotify.length} já tiveram email enviado)`);
        
        // Busca o email do usuário - usa o userId da atividade
        let userEmail: string | null = null;
        let userName: string | null = null;
        try {
          const userDoc = await db.collection("users").doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userEmail = userData?.email || null;
            userName = userData?.name || null;
            console.log(`[ActivityNotifications] Email encontrado para usuário ${userId}: ${userEmail || 'NÃO ENCONTRADO'}`);
          } else {
            console.warn(`[ActivityNotifications] Documento de usuário não encontrado para userId: ${userId}`);
          }
        } catch (error) {
          console.error(`[ActivityNotifications] Erro ao buscar dados do usuário ${userId}:`, error);
        }

        // Busca o token FCM do usuário - usa o userId da atividade
        const tokenDoc = await db.collection("fcm_tokens").doc(userId).get();
        
        let fcmToken: string | null = null;
        if (tokenDoc.exists) {
          const tokenData = tokenDoc.data() as FCMToken;
          fcmToken = tokenData.token || null;
          
          // VALIDAÇÃO CRÍTICA: Garante que o token pertence ao usuário correto
          if (tokenData.userId && tokenData.userId !== userId) {
            console.error(`[ActivityNotifications] ERRO CRÍTICO: Token FCM pertence a outro usuário! Token userId: ${tokenData.userId}, Esperado: ${userId}`);
            console.error(`[ActivityNotifications] Removendo token incorreto do documento ${userId}`);
            // Remove o token incorreto
            await db.collection("fcm_tokens").doc(userId).delete();
            fcmToken = null; // Não usa token incorreto
          } else if (fcmToken) {
            console.log(`[ActivityNotifications] Token FCM válido encontrado para usuário ${userId}`);
          }
        } else {
          console.log(`[ActivityNotifications] Nenhum token FCM encontrado para usuário ${userId}`);
        }

        // Prepara a mensagem de notificação
        // Se o usuário tem múltiplas atividades, envia uma notificação consolidada
        let title: string;
        let body: string;

        if (activitiesToNotify.length === 1) {
          const activity = activitiesToNotify[0]!;
          const dueDate = new Date(activity.dueDate);
          const dueDateStr = dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          
          // Verifica se vence hoje ou amanhã
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const activityDate = new Date(activity.dueDate);
          activityDate.setHours(0, 0, 0, 0);
          
          const isToday = activityDate.getTime() === today.getTime();
          const timeStr = isToday ? 'hoje' : 'amanhã';
          
          title = "⏰ Atividade próxima do prazo";
          body = `"${activity.title}" vence ${timeStr} (${dueDateStr})${activity.courseName ? ` - ${activity.courseName}` : ""}`;
        } else {
          title = "⏰ Atividades próximas do prazo";
          body = `Você tem ${activitiesToNotify.length} atividade${activitiesToNotify.length > 1 ? "s" : ""} vencendo amanhã`;
        }

        // Envia a notificação
        const message = {
          token: fcmToken,
          notification: {
            title,
            body,
          },
          data: {
            type: "activity_reminder",
            activityId: activitiesToNotify[0]!.id,
            activityTitle: activitiesToNotify[0]!.title,
            courseName: activitiesToNotify[0]!.courseName || "",
            userId,
            dueDate: activitiesToNotify[0]!.dueDate.toString(),
          },
          android: {
            priority: "high" as const,
          },
          apns: {
            headers: {
              "apns-priority": "10",
            },
          },
        };

        // Envia notificação push (se tiver token FCM)
        if (fcmToken) {
          try {
            // VALIDAÇÃO FINAL antes de enviar
            console.log(`[ActivityNotifications] Enviando push para userId: ${userId}, token: ${fcmToken.substring(0, 20)}...`);
            console.log(`[ActivityNotifications] Atividades:`, activitiesToNotify.map(a => ({ id: a.id, title: a.title, userId: a.userId })));
            
            await messaging.send(message);
            sent++;
            console.log(`[ActivityNotifications] ✅ Notificação push enviada com SUCESSO para usuário ${userId} (${activitiesToNotify.length} atividade(s))`);
          } catch (pushError: any) {
            console.error(`[ActivityNotifications] Erro ao enviar push para usuário ${userId}:`, pushError);
            // Se o token é inválido, remove o token do Firestore
            if (pushError.code === "messaging/invalid-registration-token" || 
                pushError.code === "messaging/registration-token-not-registered") {
              console.log(`[ActivityNotifications] Removendo token inválido para usuário ${userId}`);
              await db.collection("fcm_tokens").doc(userId).delete();
            }
          }
        } else {
          console.log(`[ActivityNotifications] Usuário ${userId} não tem token FCM registrado, pulando push`);
        }

        // Envia email (se tiver email configurado)
        if (userEmail) {
          try {
            console.log(`[ActivityNotifications] Tentando enviar email para ${userEmail} (userId: ${userId})`);
            
            const { sendActivityNotificationEmail } = await import('./emailService');
            const emailSent = await sendActivityNotificationEmail(
              userEmail,
              activitiesToNotify.map(a => ({
                title: a.title,
                dueDate: a.dueDate,
                courseName: a.courseName,
              })),
              userName || undefined
            );
            
            if (emailSent) {
              console.log(`[ActivityNotifications] ✅ Email enviado com SUCESSO para ${userEmail} (userId: ${userId}, ${activitiesToNotify.length} atividade(s))`);
              
              // Marca cada atividade como tendo recebido email
              for (const activity of activitiesToNotify) {
                const emailNotificationKey = `${userId}_${activity.id}`;
                await db.collection("sent_email_notifications").doc(emailNotificationKey).set({
                  userId,
                  activityId: activity.id,
                  activityTitle: activity.title,
                  dueDate: activity.dueDate,
                  emailSent: true,
                  sentAt: Date.now(),
                });
                console.log(`[ActivityNotifications] ✅ Marcado email como enviado para atividade ${activity.id} (${activity.title})`);
              }
              
              // Conta email como notificação enviada também
              if (!fcmToken) {
                sent++;
              }
            } else {
              console.error(`[ActivityNotifications] ❌ FALHA ao enviar email para ${userEmail} (userId: ${userId})`);
              console.error(`[ActivityNotifications] Verifique os logs do EmailService acima para mais detalhes`);
              
              // Marca como tentativa falhada (opcional - para debug)
              for (const activity of activitiesToNotify) {
                const emailNotificationKey = `${userId}_${activity.id}`;
                await db.collection("sent_email_notifications").doc(emailNotificationKey).set({
                  userId,
                  activityId: activity.id,
                  activityTitle: activity.title,
                  dueDate: activity.dueDate,
                  emailSent: false,
                  lastAttemptAt: Date.now(),
                }, { merge: true });
              }
            }
          } catch (emailError: any) {
            console.error(`[ActivityNotifications] ❌ ERRO ao enviar email para ${userEmail} (userId: ${userId}):`, emailError);
            console.error(`[ActivityNotifications] Stack trace:`, emailError.stack);
          }
        } else {
          console.log(`[ActivityNotifications] Usuário ${userId} não tem email cadastrado no Firestore, pulando envio de email`);
        }

      } catch (error: any) {
        errors++;
        console.error(`[ActivityNotifications] Erro ao processar notificações para usuário ${userId}:`, error);
      }
    }

    return { checked, sent, errors, activities: activityList };
  } catch (error) {
    console.error("[ActivityNotifications] Erro ao verificar atividades:", error);
    throw error;
  }
}

