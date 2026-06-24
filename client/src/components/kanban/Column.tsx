import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { Column as ColumnType, Task } from '../../types/kanban';

interface Props {
  column: ColumnType;
  filters: { assigneeId: string; tagId: string; priority: string; search: string };
  onEditColumn: (column: ColumnType) => void;
  onAddTask: () => void;
}

function filterTasks(tasks: Task[], filters: Props['filters']) {
  return tasks.filter(task => {
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.tagId) {
      const hasTag = task.taskTags?.some(tt => tt.tag.id === filters.tagId);
      if (!hasTag) return false;
    }
    return true;
  });
}

export default function Column({ column, filters, onEditColumn, onAddTask }: Props) {
  const filteredTasks = filterTasks(column.tasks, filters);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg w-80 flex-shrink-0 flex flex-col max-h-full">
      <div className="p-3 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="font-medium text-white">{column.name}</h3>
          {column.wipLimit > 0 && (
            <span className="text-xs text-white/60">({filteredTasks.length}/{column.wipLimit})</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEditColumn(column)}
            className="text-white/70 hover:text-white p-1"
            title="Редактировать колонку"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={onAddTask} className="text-white/70 hover:text-white p-1">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Droppable droppableId={column.id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 overflow-y-auto min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
          >
            {filteredTasks.map((task, idx) => (
              <Draggable key={task.id} draggableId={task.id} index={idx}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                    <TaskCard task={task} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}