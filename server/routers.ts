import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
// Lazy import to avoid loading firebase-admin on server startup
// import { checkAndSendActivityNotifications } from "./_core/activityNotifications";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  notifications: router({
    // Endpoint de teste para verificar e enviar notificações
    test: publicProcedure.mutation(async () => {
      try {
        console.log("[Notifications Router] Iniciando teste de notificações...");
        // Lazy import - only load when this endpoint is called
        const { checkAndSendActivityNotifications } = await import("./_core/activityNotifications");
        const result = await checkAndSendActivityNotifications(true); // true = modo teste
        
        console.log("[Notifications Router] Resultado do teste:", {
          checked: result?.checked,
          sent: result?.sent,
          errors: result?.errors,
          activitiesCount: result?.activities?.length,
        });
        
        // Ensure result has all required fields
        const response = {
          success: true,
          checked: result?.checked ?? 0,
          sent: result?.sent ?? 0,
          errors: result?.errors ?? 0,
          activities: result?.activities ?? [],
        };
        
        console.log("[Notifications Router] Retornando resposta:", response);
        return response;
      } catch (error: any) {
        console.error("[Notifications Router] Erro ao testar notificações:", error);
        console.error("[Notifications Router] Stack trace:", error?.stack);
        const errorMessage = error?.message || "Erro desconhecido";
        
        // Check if it's a Firebase Admin configuration error
        if (errorMessage.includes("Project Id") || errorMessage.includes("Firebase Admin não está configurado")) {
          const response = {
            success: false,
            error: "Firebase Admin não está configurado. Veja CONFIGURAR_FIREBASE_ADMIN.md para configurar as credenciais.",
            checked: 0,
            sent: 0,
            errors: 0,
            activities: [],
          };
          console.log("[Notifications Router] Retornando erro de configuração:", response);
          return response;
        }
        
        const response = {
          success: false,
          error: errorMessage,
          checked: 0,
          sent: 0,
          errors: 0,
          activities: [],
        };
        console.log("[Notifications Router] Retornando erro genérico:", response);
        return response;
      }
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
