/**
 * Firebase Cloud Functions para o projeto Agenda Acadêmica
 * 
 * Para deploy:
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init functions
 * 4. firebase deploy --only functions
 */

import * as functions from "firebase-functions";
import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin if not already initialized
let adminApp;
if (getApps().length === 0) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      adminApp = initializeApp();
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw error;
  }
} else {
  adminApp = getApps()[0]!;
}

const db = getFirestore(adminApp);
const messaging = getMessaging(adminApp);

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
 */
async function checkAndSendActivityNotifications(): Promise<{
  checked: number;
  sent: number;
  errors: number;
}> {
  const now = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  // Calcula o timestamp para 1 dia a partir de agora (meia-noite)
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowMidnight = tomorrow.getTime();
  
  // Calcula o timestamp para o final do dia de amanhã
  const tomorrowEnd = tomorrowMidnight + (24 * 60 * 60 * 1000) - 1;
  
  console.log(`[ActivityNotifications] Verificando atividades com entrega entre ${new Date(tomorrowMidnight).toISOString()} e ${new Date(tomorrowEnd).toISOString()}`);
  
  let checked = 0;
  let sent = 0;
  let errors = 0;

  try {
    // Busca todas as atividades que têm entrega amanhã
    // e que não estão concluídas
    const activitiesSnapshot = await db
      .collection("activity")
      .where("dueDate", ">=", tomorrowMidnight)
      .where("dueDate", "<=", tomorrowEnd)
      .get();

    checked = activitiesSnapshot.size;
    console.log(`[ActivityNotifications] Encontradas ${checked} atividades com entrega amanhã`);

    if (checked === 0) {
      return { checked: 0, sent: 0, errors: 0 };
    }

    // Agrupa atividades por usuário
    const activitiesByUser = new Map<string, Activity[]>();
    
    activitiesSnapshot.forEach((doc) => {
      const data = doc.data();
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
    });

    console.log(`[ActivityNotifications] ${activitiesByUser.size} usuários com atividades pendentes`);

    // Para cada usuário, busca o token FCM e envia notificação
    for (const [userId, activities] of activitiesByUser.entries()) {
      try {
        // Busca o token FCM do usuário
        const tokenDoc = await db.collection("fcm_tokens").doc(userId).get();
        
        if (!tokenDoc.exists) {
          console.log(`[ActivityNotifications] Usuário ${userId} não tem token FCM registrado`);
          continue;
        }

        const tokenData = tokenDoc.data() as FCMToken;
        const fcmToken = tokenData.token;

        if (!fcmToken) {
          console.log(`[ActivityNotifications] Usuário ${userId} tem documento FCM mas sem token`);
          continue;
        }

        // Prepara a mensagem de notificação
        // Se o usuário tem múltiplas atividades, envia uma notificação consolidada
        let title: string;
        let body: string;

        if (activities.length === 1) {
          const activity = activities[0]!;
          title = "⏰ Atividade próxima do prazo";
          body = `"${activity.title}" vence amanhã${activity.courseName ? ` (${activity.courseName})` : ""}`;
        } else {
          title = "⏰ Atividades próximas do prazo";
          body = `Você tem ${activities.length} atividade${activities.length > 1 ? "s" : ""} vencendo amanhã`;
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
            activityId: activities[0]!.id,
            userId,
            dueDate: activities[0]!.dueDate.toString(),
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

        await messaging.send(message);
        sent++;
        console.log(`[ActivityNotifications] Notificação enviada para usuário ${userId} (${activities.length} atividade(s))`);

      } catch (error: any) {
        errors++;
        console.error(`[ActivityNotifications] Erro ao enviar notificação para usuário ${userId}:`, error);
        
        // Se o token é inválido, remove o token do Firestore
        if (error.code === "messaging/invalid-registration-token" || 
            error.code === "messaging/registration-token-not-registered") {
          console.log(`[ActivityNotifications] Removendo token inválido para usuário ${userId}`);
          await db.collection("fcm_tokens").doc(userId).delete();
        }
      }
    }

    return { checked, sent, errors };
  } catch (error) {
    console.error("[ActivityNotifications] Erro ao verificar atividades:", error);
    throw error;
  }
}

/**
 * Cloud Function agendada que verifica atividades e envia notificações
 * Roda diariamente às 8:00 AM (horário UTC)
 * 
 * Para testar localmente:
 * firebase emulators:start --only functions
 * 
 * Para testar manualmente:
 * firebase functions:shell
 * checkActivityNotifications()
 */
export const checkActivityNotifications = functions.pubsub
  .schedule("0 8 * * *") // Todos os dias às 8:00 AM UTC
  .timeZone("America/Sao_Paulo") // Ajuste para seu fuso horário
  .onRun(async (context) => {
    console.log("[checkActivityNotifications] Iniciando verificação de atividades...");
    
    try {
      const result = await checkAndSendActivityNotifications();
      
      console.log("[checkActivityNotifications] Verificação concluída:", {
        atividadesVerificadas: result.checked,
        notificacoesEnviadas: result.sent,
        erros: result.errors,
      });
      
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error("[checkActivityNotifications] Erro na verificação:", error);
      throw error;
    }
  });

/**
 * HTTP endpoint para testar manualmente a verificação de notificações
 * 
 * Uso:
 * curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/testActivityNotifications
 */
export const testActivityNotifications = functions.https.onRequest(
  async (req, res) => {
    console.log("[testActivityNotifications] Teste manual iniciado...");
    
    try {
      const result = await checkAndSendActivityNotifications();
      
      res.json({
        success: true,
        message: "Verificação de atividades concluída",
        ...result,
      });
    } catch (error: any) {
      console.error("[testActivityNotifications] Erro:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

