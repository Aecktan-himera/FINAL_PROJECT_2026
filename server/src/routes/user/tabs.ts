import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import prisma from "../../lib/prisma";

// Схема для валидации тела запроса сохранения
const saveTabsBodySchema = z.object({
  tabs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum([
        "projects-list",
        "project-detail",
        "users-list",
        "teams-list",
        "calendar",
        "contacts",
        "project-form",
        "kanban-board",
        "admin-users",
      ]),
      data: z.any().optional(),
    }),
  ),
  activeId: z.string().nullable(),
});

const userTabsRoutes: FastifyPluginAsyncZod = async (app) => {
  // Аутентификация для всех маршрутов
  app.addHook("preHandler", app.authenticate);

  // Запрет для new_user
  app.addHook("preHandler", async (req, reply) => {
    if (req.user!.role === "new_user") {
      return reply.status(403).send({
        message: "Access denied. Your account is pending activation.",
      });
    }
  });

  // Получение состояния вкладок
  app.get("/tabs", { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.sub;

    const state = await prisma.userTabsState.findUnique({
      where: { userId },
    });

    if (!state) {
      // Если записи нет – возвращаем пустые вкладки
      return { tabs: [], activeId: null };
    }

    return {
      tabs: state.tabs as any[],
      activeId: state.activeId,
    };
  });

  // Сохранение состояния вкладок (создаём или обновляем)
  app.post(
    "/tabs",
    {
      preHandler: [app.authenticate],
      schema: { body: saveTabsBodySchema },
    },
    async (req, reply) => {
      const userId = req.user.sub;
      const { tabs, activeId } = req.body;

      await prisma.userTabsState.upsert({
        where: { userId },
        update: {
          tabs: tabs as any,
          activeId,
          updatedAt: new Date(),
        },
        create: {
          userId,
          tabs: tabs as any,
          activeId,
        },
      });

      reply.status(200).send({ success: true });
    },
  );
};

export default userTabsRoutes;
