import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
} from "../../schemas/project.schema";
import prisma from "../../lib/prisma";

// Рекурсивное каскадное удаление проектов
async function deleteProjectCascade(projectId: string) {
  const children = await prisma.project.findMany({
    where: { parentProjectId: projectId },
    select: { id: true },
  });
  for (const child of children) {
    await deleteProjectCascade(child.id);
  }
  await prisma.project.delete({ where: { id: projectId } });
}

// Вспомогательная проверка роли участника в проекте
async function checkProjectMembershipRole(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) return { allowed: false };
  const allowedRoles = ["owner", "team_lead"];
  return { allowed: allowedRoles.includes(member.projectRole), currentRole: member.projectRole };
}

const projectsRoutes: FastifyPluginAsyncZod = async (app) => {
  // 1. Аутентификация
  app.addHook("preValidation", app.authenticate);

  // 2. Запрет для new_user
  app.addHook("preValidation", async (request, reply) => {
    if (request.user!.role === "new_user") {
      return reply.status(403).send({
        message: "Access denied. Your account is pending activation.",
      });
    }
  });

  // POST /projects – создание проекта (доступно только team_lead и admin)
  app.post(
    "/",
    { schema: { body: createProjectSchema } },
    async (req, reply) => {
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      if (userRole !== "team_lead" && userRole !== "admin") {
        return reply
          .status(403)
          .send({ message: "Only team leads and admins can create projects" });
      }

      const {
        name,
        key,
        description,
        parentProjectId,
        isPublic,
        responsibleId,
      } = req.body;

      if (parentProjectId) {
        const parent = await prisma.project.findUnique({
          where: { id: parentProjectId },
        });
        if (!parent) {
          return reply
            .status(404)
            .send({ message: "Parent project not found" });
        }
      }

      const project = await prisma.project.create({
        data: {
          name,
          key,
          description,
          parentProjectId: parentProjectId || null,
          isPublic: isPublic ?? false,
          ownerId: userId,
          responsibleId: responsibleId || null,
        },
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          projectRole: "owner",
        },
      });

      reply.status(201).send(project);
    },
  );

  // GET /projects – список проектов пользователя
  app.get("/", async (req, reply) => {
    const userId = req.user!.sub;
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true } },
            responsible: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    reply.send(memberships.map((m) => m.project));
  });

  // GET /projects/public – список публичных проектов
  app.get("/public", async (req, reply) => {
    const projects = await prisma.project.findMany({
      where: { isPublic: true },
      include: {
        owner: { select: { id: true, username: true } },
        responsible: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return projects;
  });

  // GET /projects/:id – детали проекта (публичные доступны без членства)
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.sub;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true } },
        responsible: { select: { id: true, username: true } },
        parentProject: { select: { id: true, name: true, key: true } },
        children: { select: { id: true, name: true, key: true } },
        members: {
          include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
        },
      },
    });

    if (!project) {
      return reply.status(404).send({ message: "Project not found" });
    }

    if (project.isPublic) {
      return reply.send(project);
    }

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });
    if (!member) {
      return reply.status(403).send({ message: "Access denied" });
    }

    reply.send(project);
  });

  // PATCH /projects/:id – обновление проекта
  app.patch(
    "/:id",
    { schema: { body: updateProjectSchema } },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      const project = await prisma.project.findUnique({
        where: { id },
        select: { ownerId: true },
      });
      if (!project) {
        return reply.status(404).send({ message: "Project not found" });
      }

      if (project.ownerId !== userId && userRole !== "admin") {
        return reply
          .status(403)
          .send({ message: "Only owner or admin can update the project" });
      }

      const updateData = req.body;
      delete (updateData as any).ownerId;

      const updated = await prisma.project.update({
        where: { id },
        data: updateData,
      });
      reply.send(updated);
    },
  );

  // DELETE /projects/:id – удаление проекта с поддержкой mode
  app.delete(
    "/:id",
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        querystring: z.object({
          mode: z.enum(["cascade", "reparent"]).optional(),
        }),
      },
    },
    async (req, reply) => {
      const { id } = req.params;
      const { mode } = req.query;
      const userId = req.user!.sub;
      const userRole = req.user!.role;

      const project = await prisma.project.findUnique({
        where: { id },
        select: { ownerId: true },
      });
      if (!project) {
        return reply.status(404).send({ message: "Project not found" });
      }
      if (project.ownerId !== userId && userRole !== "admin") {
        return reply
          .status(403)
          .send({ message: "Only owner or admin can delete the project" });
      }

      const children = await prisma.project.findMany({
        where: { parentProjectId: id },
        select: { id: true, name: true },
      });

      if (children.length === 0) {
        await prisma.project.delete({ where: { id } });
        return reply.status(204).send();
      }

      if (!mode) {
        return reply.status(409).send({
          message: "Project has children. Specify mode=cascade or mode=reparent.",
          children: children.map((c) => ({ id: c.id, name: c.name })),
        });
      }

      if (mode === "cascade") {
        await deleteProjectCascade(id);
      } else if (mode === "reparent") {
        await prisma.project.updateMany({
          where: { parentProjectId: id },
          data: { parentProjectId: null },
        });
        await prisma.project.delete({ where: { id } });
      }

      return reply.status(204).send();
    },
  );

  // GET /projects/:projectId/members – список участников проекта
  app.get("/:projectId/members", async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const userId = req.user!.sub;

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) {
      return reply
        .status(403)
        .send({ message: "You are not a member of this project" });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
    reply.send(members);
  });

  // POST /projects/:projectId/members – добавить участника
  app.post(
    "/:projectId/members",
    { schema: { body: addMemberSchema } },
    async (req, reply) => {
      const { projectId } = req.params as { projectId: string };
      const currentUserId = req.user!.sub;
      const { userId, projectRole } = req.body;

      const { allowed } = await checkProjectMembershipRole(projectId, currentUserId);
      if (!allowed) {
        return reply
          .status(403)
          .send({ message: "Only project owner or team lead can add members" });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return reply.status(404).send({ message: "Project not found" });
      }

      const userToAdd = await prisma.user.findUnique({ where: { id: userId } });
      if (!userToAdd) {
        return reply.status(404).send({ message: "User not found" });
      }

      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (existing) {
        return reply
          .status(409)
          .send({ message: "User is already a member of this project" });
      }

      const newMember = await prisma.projectMember.create({
        data: {
          projectId,
          userId,
          projectRole,
        },
        include: {
          user: {
            select: { id: true, username: true, email: true, avatarUrl: true },
          },
        },
      });
      reply.status(201).send(newMember);
    },
  );

  // DELETE /projects/:projectId/members/:userId – удалить участника
  app.delete("/:projectId/members/:userId", async (req, reply) => {
    const { projectId, userId } = req.params as {
      projectId: string;
      userId: string;
    };
    const currentUserId = req.user!.sub;

    const { allowed, currentRole } = await checkProjectMembershipRole(projectId, currentUserId);
    if (!allowed) {
      return reply
        .status(403)
        .send({ message: "Only project owner or team lead can remove members" });
    }

    if (currentUserId === userId) {
      return reply
        .status(400)
        .send({ message: "You cannot remove yourself from the project" });
    }

    const memberToRemove = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!memberToRemove) {
      return reply
        .status(404)
        .send({ message: "User is not a member of this project" });
    }

    if (currentRole === "team_lead" && memberToRemove.projectRole === "owner") {
      return reply
        .status(403)
        .send({ message: "Team lead cannot remove the project owner" });
    }

    if (memberToRemove.projectRole === "owner") {
      const ownersCount = await prisma.projectMember.count({
        where: { projectId, projectRole: "owner" },
      });
      if (ownersCount <= 1) {
        return reply
          .status(400)
          .send({ message: "Cannot remove the only project owner" });
      }
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    reply.status(204).send();
  });
};

export default projectsRoutes;