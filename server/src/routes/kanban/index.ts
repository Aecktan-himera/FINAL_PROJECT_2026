import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import prisma from '../../lib/prisma';

// ------------------------------
// Schemas
// ------------------------------
const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
});

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const createColumnSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#808080'),
  wipLimit: z.number().int().min(0).default(0),
});

const updateColumnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  wipLimit: z.number().int().min(0).optional(),
});

const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(), // tag ids
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

const moveTaskSchema = z.object({
  targetColumnId: z.string().uuid(),
  afterTaskId: z.string().uuid().nullable(), // null = move to beginning
});

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(200),
});

const toggleSubtaskSchema = z.object({
  completed: z.boolean(),
});

const createCommentSchema = z.object({
  content: z.string().min(1),
});

const addTagToTaskSchema = z.object({
  tagId: z.string().uuid(),
});

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#cccccc'),
});

// ------------------------------
// Permission helpers
// ------------------------------
async function getProjectMember(userId: string, projectId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

async function checkProjectAccess(projectId: string, userId: string) {
  const member = await getProjectMember(userId, projectId);
  if (!member) throw new Error('Not a member of this project');
  return member;
}

async function checkBoardAccess(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { project: true },
  });
  if (!board) throw new Error('Board not found');
  const member = await getProjectMember(userId, board.projectId);
  if (!member) throw new Error('Not a member of this project');
  return { board, member };
}

async function checkTaskAccess(taskId: string, userId: string, write = false) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: { include: { project: true } },
      assignee: true,
    },
  });
  if (!task) throw new Error('Task not found');
  const member = await getProjectMember(userId, task.board.project.id);
  if (!member) throw new Error('Not a member of this project');
  if (!write) return { task, member };
  // For write operations: assignee can edit own task, team_lead/owner can edit any
  const canEdit = member.projectRole === 'owner' || member.projectRole === 'team_lead' ||
    (member.projectRole === 'developer' && task.assigneeId === userId);
  if (!canEdit) throw new Error('Not authorized to modify this task');
  return { task, member };
}

// Helper: calculate new position when moving task
async function calculateNewPosition(columnId: string, afterTaskId: string | null) {
  const tasks = await prisma.task.findMany({
    where: { columnId, parentTaskId: null }, // only root tasks
    orderBy: { position: 'asc' },
    select: { id: true, position: true },
  });
  if (tasks.length === 0) return '0'; // first task
  if (!afterTaskId) {
    // move to beginning: take first task's position - 1
    const firstPos = tasks[0].position;
    // if firstPos is '0' or '0.0', we need to shift all tasks? Simpler: use decimal with high precision
    // we'll use BigInt approach: treat as integer string and use division
    // Actually easier: use fraction with denominator 2^16, but we'll just use decimal strings
    // Let's implement using decimal numbers as strings
    const newPos = (parseFloat(firstPos) - 1).toString();
    return newPos;
  }
  const afterIndex = tasks.findIndex(t => t.id === afterTaskId);
  if (afterIndex === -1) throw new Error('afterTaskId not found in column');
  let prevPos = afterIndex >= 0 ? tasks[afterIndex].position : null;
  let nextPos = afterIndex + 1 < tasks.length ? tasks[afterIndex + 1].position : null;
  if (!prevPos && !nextPos) return '0';
  if (!nextPos) {
    // at end: prevPos + 1
    const newPos = (parseFloat(prevPos!) + 1).toString();
    return newPos;
  }
  // between prev and next
  const newPos = ((parseFloat(prevPos!) + parseFloat(nextPos)) / 2).toString();
  return newPos;
}

// ------------------------------
// Routes
// ------------------------------
const kanbanRoutes: FastifyPluginAsyncZod = async (app) => {
  // Authentication for all routes
  app.addHook('preHandler', app.authenticate);
  // Also block new_user (not activated)
  app.addHook('preHandler', async (req, reply) => {
    if (req.user!.role === 'new_user') {
      return reply.status(403).send({ message: 'Account pending activation' });
    }
  });

  // ---------- Boards ----------
  // GET /projects/:projectId/boards
  app.get('/projects/:projectId/boards', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const userId = req.user!.sub;
    await checkProjectAccess(projectId, userId);
    const boards = await prisma.board.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              where: { parentTaskId: null },
              orderBy: { position: 'asc' },
              include: {
                assignee: { select: { id: true, username: true, avatarUrl: true } },
                taskTags: { include: { tag: true } },
                _count: { select: { comments: true, subtasks: true } },
              },
            },
          },
        },
      },
    });
    return boards;
  });

  // POST /projects/:projectId/boards
  app.post('/projects/:projectId/boards', { schema: { body: createBoardSchema } }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const userId = req.user!.sub;
    const member = await checkProjectAccess(projectId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can create boards' });
    }
    const { name } = req.body;
    const maxPos = await prisma.board.aggregate({
      where: { projectId },
      _max: { position: true },
    });
    const board = await prisma.board.create({
      data: {
        name,
        projectId,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
    reply.status(201).send(board);
  });

  // PATCH /boards/:boardId
  app.patch('/boards/:boardId', { schema: { body: updateBoardSchema } }, async (req, reply) => {
    const { boardId } = req.params as { boardId: string };
    const userId = req.user!.sub;
    const { board, member } = await checkBoardAccess(boardId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can update boards' });
    }
    const updated = await prisma.board.update({
      where: { id: boardId },
      data: req.body,
    });
    return updated;
  });

  // DELETE /boards/:boardId
  app.delete('/boards/:boardId', async (req, reply) => {
    const { boardId } = req.params as { boardId: string };
    const userId = req.user!.sub;
    const { board, member } = await checkBoardAccess(boardId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can delete boards' });
    }
    await prisma.board.delete({ where: { id: boardId } });
    reply.status(204).send();
  });

  // ---------- Columns ----------
  // GET /boards/:boardId/columns - already included in board retrieval
  // POST /boards/:boardId/columns
  app.post('/boards/:boardId/columns', { schema: { body: createColumnSchema } }, async (req, reply) => {
    const { boardId } = req.params as { boardId: string };
    const userId = req.user!.sub;
    const { board, member } = await checkBoardAccess(boardId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can create columns' });
    }
    const { name, color, wipLimit } = req.body;
    const maxPos = await prisma.column.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    const column = await prisma.column.create({
      data: {
        name,
        color,
        wipLimit,
        boardId,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
    reply.status(201).send(column);
  });

  // PATCH /columns/:columnId
  app.patch('/columns/:columnId', { schema: { body: updateColumnSchema } }, async (req, reply) => {
    const { columnId } = req.params as { columnId: string };
    const userId = req.user!.sub;
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) return reply.status(404).send({ message: 'Column not found' });
    const { board, member } = await checkBoardAccess(column.boardId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can update columns' });
    }
    const updated = await prisma.column.update({
      where: { id: columnId },
      data: req.body,
    });
    return updated;
  });

  // DELETE /columns/:columnId
  app.delete('/columns/:columnId', async (req, reply) => {
    const { columnId } = req.params as { columnId: string };
    const userId = req.user!.sub;
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) return reply.status(404).send({ message: 'Column not found' });
    const { board, member } = await checkBoardAccess(column.boardId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can delete columns' });
    }
    // Option: move tasks to another column? For simplicity, we'll delete tasks (cascade)
    await prisma.column.delete({ where: { id: columnId } });
    reply.status(204).send();
  });

  // PATCH /columns/reorder (boardId query param)
  app.patch('/columns/reorder', { schema: { body: reorderColumnsSchema, querystring: z.object({ boardId: z.string().uuid() }) } }, async (req, reply) => {
    const { boardId } = req.query as { boardId: string };
    const { columnIds } = req.body;
    const userId = req.user!.sub;
    const { board, member } = await checkBoardAccess(boardId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can reorder columns' });
    }
    await prisma.$transaction(
      columnIds.map((id, idx) =>
        prisma.column.update({
          where: { id },
          data: { position: idx },
        })
      )
    );
    reply.status(200).send({ success: true });
  });

  // ---------- Tasks ----------
  // POST /boards/:boardId/columns/:columnId/tasks
  app.post('/boards/:boardId/columns/:columnId/tasks', { schema: { body: createTaskSchema } }, async (req, reply) => {
    const { boardId, columnId } = req.params as { boardId: string; columnId: string };
    const userId = req.user!.sub;
    const { board, member } = await checkBoardAccess(boardId, userId);
    // Check if user can create tasks (developer+)
    if (!['owner', 'team_lead', 'developer'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Not authorized to create tasks' });
    }
    const column = await prisma.column.findUnique({ where: { id: columnId } });
    if (!column || column.boardId !== boardId) {
      return reply.status(404).send({ message: 'Column not found in this board' });
    }
    const { title, description, priority, dueDate, assigneeId, tags } = req.body;
    // Assignee check: if assigneeId provided, user must be team_lead or owner, or assign to self
    let finalAssigneeId = assigneeId;
    if (assigneeId && assigneeId !== userId && !['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only team_lead or owner can assign tasks to others' });
    }
    // Calculate position (end of column)
    const maxPos = await prisma.task.aggregate({
      where: { columnId, parentTaskId: null },
      _max: { position: true },
    });
    const position = ((maxPos._max.position ? parseFloat(maxPos._max.position) : -1) + 1).toString();

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        authorId: userId,
        assigneeId: finalAssigneeId,
        boardId,
        columnId,
        position,
      },
    });

    // Add tags
    if (tags && tags.length) {
      await prisma.taskTag.createMany({
        data: tags.map(tagId => ({ taskId: task.id, tagId })),
      });
    }

    // Create notification for assignee
    if (finalAssigneeId && finalAssigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: finalAssigneeId,
          type: 'task_assigned',
          message: `You have been assigned to task "${title}"`,
          taskId: task.id,
          projectId: board.projectId,
        },
      });
    }

    const createdTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        assignee: { select: { id: true, username: true, avatarUrl: true } },
        taskTags: { include: { tag: true } },
      },
    });
    reply.status(201).send(createdTask);
  });

  // GET /tasks/:taskId
  app.get('/tasks/:taskId', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const userId = req.user!.sub;
    const { task } = await checkTaskAccess(taskId, userId, false);
    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        assignee: { select: { id: true, username: true, avatarUrl: true } },
        column: true,
        board: true,
        subtasks: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, isCompleted: true, createdAt: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, username: true, avatarUrl: true } } },
        },
        taskTags: { include: { tag: true } },
        history: {
          orderBy: { changedAt: 'asc' },
          include: { changer: { select: { id: true, username: true } } },
        },
        attachments: true,
      },
    });
    if (!fullTask) return reply.status(404).send({ message: 'Task not found' });
    return fullTask;
  });

  // PATCH /tasks/:taskId
  app.patch('/tasks/:taskId', { schema: { body: updateTaskSchema } }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const userId = req.user!.sub;
    const { task, member } = await checkTaskAccess(taskId, userId, true);
    const { assigneeId, ...rest } = req.body;
    const data: any = { ...rest };
    if (assigneeId !== undefined) {
      if (assigneeId !== null && assigneeId !== userId && !['owner', 'team_lead'].includes(member.projectRole)) {
        return reply.status(403).send({ message: 'Only team_lead or owner can assign tasks to others' });
      }
      data.assigneeId = assigneeId;
      // Notify new assignee if changed
      if (assigneeId && assigneeId !== task.assigneeId) {
        await prisma.notification.create({
          data: {
            userId: assigneeId,
            type: 'task_assigned',
            message: `You have been assigned to task "${task.title}"`,
            taskId: task.id,
            projectId: task.board.projectId,
          },
        });
      }
    }
    // Record history for changed fields (simplified: just log all changes)
    const oldTask = task;
    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
    });
    // Log changes (only if field changed)
    const changes: { field: string; old: any; new: any }[] = [];
    for (const key of Object.keys(rest)) {
      if (oldTask[key as keyof typeof oldTask] !== updated[key as keyof typeof updated]) {
        changes.push({ field: key, old: oldTask[key as keyof typeof oldTask], new: updated[key as keyof typeof updated] });
      }
    }
    if (assigneeId !== undefined && oldTask.assigneeId !== assigneeId) {
      changes.push({ field: 'assigneeId', old: oldTask.assigneeId, new: assigneeId });
    }
    await prisma.taskHistory.createMany({
      data: changes.map(change => ({
        taskId,
        changedBy: userId,
        fieldName: change.field,
        oldValue: change.old?.toString() ?? null,
        newValue: change.new?.toString() ?? null,
      })),
    });
    return updated;
  });

  // DELETE /tasks/:taskId
  app.delete('/tasks/:taskId', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const userId = req.user!.sub;
    const { task, member } = await checkTaskAccess(taskId, userId, true);
    // Delete allowed: author, team_lead, owner
    const canDelete = task.authorId === userId || ['owner', 'team_lead'].includes(member.projectRole);
    if (!canDelete) {
      return reply.status(403).send({ message: 'Not authorized to delete this task' });
    }
    await prisma.task.delete({ where: { id: taskId } });
    reply.status(204).send();
  });

  // PATCH /tasks/:taskId/move
  app.patch('/tasks/:taskId/move', { schema: { body: moveTaskSchema } }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const { targetColumnId, afterTaskId } = req.body;
    const userId = req.user!.sub;
    const { task, member } = await checkTaskAccess(taskId, userId, true);
    // Move permission: developer only own tasks, team_lead/owner any
    const canMove = member.projectRole === 'owner' || member.projectRole === 'team_lead' ||
      (member.projectRole === 'developer' && task.assigneeId === userId);
    if (!canMove) {
      return reply.status(403).send({ message: 'Not authorized to move this task' });
    }
    // Check target column exists and belongs to same board
    const targetColumn = await prisma.column.findUnique({
      where: { id: targetColumnId },
      include: { board: true },
    });
    if (!targetColumn || targetColumn.boardId !== task.boardId) {
      return reply.status(404).send({ message: 'Target column not found in same board' });
    }
    // Calculate new position
    const newPosition = await calculateNewPosition(targetColumnId, afterTaskId);
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        position: newPosition,
      },
    });
    // If column changed, record history
    if (task.columnId !== targetColumnId) {
      await prisma.taskHistory.create({
        data: {
          taskId,
          changedBy: userId,
          fieldName: 'columnId',
          oldValue: task.columnId,
          newValue: targetColumnId,
        },
      });
    }
    return updated;
  });

  // POST /tasks/:taskId/subtasks
  app.post('/tasks/:taskId/subtasks', { schema: { body: createSubtaskSchema } }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const userId = req.user!.sub;
    const { task } = await checkTaskAccess(taskId, userId, true);
    const { title } = req.body;
    const subtask = await prisma.task.create({
      data: {
        title,
        boardId: task.boardId,
        parentTaskId: taskId,
        authorId: userId,
        position: '0',
        isCompleted: false,
        // subtasks have columnId = null
      },
    });
    return subtask;
  });

  // PATCH /tasks/:taskId/subtasks/:subtaskId/toggle
  app.patch('/tasks/:taskId/subtasks/:subtaskId/toggle', { schema: { body: toggleSubtaskSchema } }, async (req, reply) => {
    const { taskId, subtaskId } = req.params as { taskId: string; subtaskId: string };
    const userId = req.user!.sub;
    const { completed } = req.body;
    // Verify parent task access
    await checkTaskAccess(taskId, userId, true);
    const subtask = await prisma.task.findUnique({ where: { id: subtaskId } });
    if (!subtask || subtask.parentTaskId !== taskId) {
      return reply.status(404).send({ message: 'Subtask not found under this task' });
    }
    const updated = await prisma.task.update({
      where: { id: subtaskId },
      data: { isCompleted: completed },
    });
    return updated;
  });

  // POST /tasks/:taskId/comments
  app.post('/tasks/:taskId/comments', { schema: { body: createCommentSchema } }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const userId = req.user!.sub;
    const { content } = req.body;
    await checkTaskAccess(taskId, userId, false); // view access only
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: userId,
      },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });
    // Notify assignee if not comment author
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { assigneeId: true } });
    if (task?.assigneeId && task.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          type: 'comment_added',
          message: `New comment on task "${taskId}"`,
          taskId,
        },
      });
    }
    return comment;
  });

  // DELETE /comments/:commentId
  app.delete('/comments/:commentId', async (req, reply) => {
    const { commentId } = req.params as { commentId: string };
    const userId = req.user!.sub;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: { include: { board: { include: { project: true } } } } },
    });
    if (!comment) return reply.status(404).send({ message: 'Comment not found' });
    const member = await getProjectMember(userId, comment.task.board.project.id);
    const isAuthor = comment.authorId === userId;
    const canDelete = isAuthor || (member && ['owner', 'team_lead'].includes(member.projectRole));
    if (!canDelete) {
      return reply.status(403).send({ message: 'Not authorized to delete this comment' });
    }
    await prisma.comment.delete({ where: { id: commentId } });
    reply.status(204).send();
  });

  // GET /tasks/:taskId/history
  app.get('/tasks/:taskId/history', async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const userId = req.user!.sub;
    await checkTaskAccess(taskId, userId, false);
    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      orderBy: { changedAt: 'desc' },
      include: { changer: { select: { id: true, username: true } } },
    });
    return history;
  });

  // ---------- Tags ----------
  // GET /projects/:projectId/tags
  app.get('/projects/:projectId/tags', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const userId = req.user!.sub;
    await checkProjectAccess(projectId, userId);
    const tags = await prisma.tag.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
    return tags;
  });

  // POST /projects/:projectId/tags
  app.post('/projects/:projectId/tags', { schema: { body: createTagSchema } }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const userId = req.user!.sub;
    const member = await checkProjectAccess(projectId, userId);
    if (!['owner', 'team_lead'].includes(member.projectRole)) {
      return reply.status(403).send({ message: 'Only owner or team_lead can create tags' });
    }
    const { name, color } = req.body;
    const tag = await prisma.tag.create({
      data: { name, color, projectId },
    });
    return tag;
  });

  // POST /tasks/:taskId/tags
  app.post('/tasks/:taskId/tags', { schema: { body: addTagToTaskSchema } }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const userId = req.user!.sub;
    const { tagId } = req.body;
    await checkTaskAccess(taskId, userId, true);
    // Check tag exists and belongs to same project
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) return reply.status(404).send({ message: 'Tag not found' });
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { board: true } });
    if (tag.projectId !== task!.board.projectId) {
      return reply.status(400).send({ message: 'Tag does not belong to this project' });
    }
    await prisma.taskTag.upsert({
      where: { taskId_tagId: { taskId, tagId } },
      update: {},
      create: { taskId, tagId },
    });
    reply.status(201).send({ success: true });
  });

  // DELETE /tasks/:taskId/tags/:tagId
  app.delete('/tasks/:taskId/tags/:tagId', async (req, reply) => {
    const { taskId, tagId } = req.params as { taskId: string; tagId: string };
    const userId = req.user!.sub;
    await checkTaskAccess(taskId, userId, true);
    await prisma.taskTag.delete({
      where: { taskId_tagId: { taskId, tagId } },
    });
    reply.status(204).send();
  });
};

export default kanbanRoutes;