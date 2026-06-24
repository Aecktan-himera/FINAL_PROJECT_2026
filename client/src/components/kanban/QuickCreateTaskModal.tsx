import { useState } from 'react';
import { useCreateTask, useProjectTags } from '../../hooks/useKanban';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  boardId: string;
  columnId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickCreateTaskModal({ boardId, columnId, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const { data: tags } = useProjectTags(boardId.split('-')[0]); // нужно получить projectId, упростим: передадим projectId пропсом
  const createTask = useCreateTask(boardId, columnId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask.mutateAsync({
      title,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      tags: selectedTagIds,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-4 w-96" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-bold">Новая задача</h3>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5 text-white/70" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Заголовок"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
            autoFocus
          />
          <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full bg-gray-700 text-white rounded px-2 py-1">
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
            <option value="urgent">Критический</option>
          </select>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-700 text-white rounded px-2 py-1" />
          {tags && (
            <select multiple value={selectedTagIds} onChange={e => setSelectedTagIds(Array.from(e.target.selectedOptions, o => o.value))} className="w-full bg-gray-700 text-white rounded px-2 py-1">
              {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
            </select>
          )}
          <button type="submit" className="w-full bg-blue-600 py-1 rounded text-white">Создать</button>
        </form>
      </div>
    </div>
  );
}