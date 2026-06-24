import { useState } from 'react';
import TaskModal from './TaskModal';
import { ChatBubbleLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { Task } from '../../types/kanban';

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export default function TaskCard({ task }: { task: Task }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="bg-gray-700/80 rounded p-3 mb-2 cursor-pointer hover:bg-gray-600 transition"
      >
        <div className="flex justify-between items-start">
          <h4 className="text-white font-medium text-sm">{task.title}</h4>
          <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
        </div>
        <div className="flex justify-between items-center mt-2 text-white/60 text-xs">
          <div className="flex items-center gap-2">
            {task.assignee?.avatarUrl ? (
              <img src={task.assignee.avatarUrl} className="w-4 h-4 rounded-full" />
            ) : (
              <UserCircleIcon className="w-4 h-4" />
            )}
            <span>{task.assignee?.username || 'Не назначен'}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChatBubbleLeftIcon className="w-3 h-3" />
            <span>{task._count?.comments || 0}</span>
          </div>
        </div>
        {task.taskTags && task.taskTags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {task.taskTags.map(tt => (
              <span
                key={tt.tag.id}
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: tt.tag.color, color: '#fff' }}
              >
                {tt.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        taskId={task.id}
        boardId={task.boardId}
      />
    </>
  );
}