import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createPortal } from 'react-dom';
import { useTask, useUpdateTask, useDeleteTask, useCreateSubtask, useToggleSubtask, useCreateComment, useDeleteComment, useTaskHistory, useProjectTags, useAddTagToTask, useRemoveTagFromTask } from '../../hooks/useKanban';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useAuthStore } from '../../store/authStore';
import { LiquidGlass } from '../ui/LiquidGlass';
import { XMarkIcon, PlusIcon, TrashIcon, CalendarIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  boardId: string;
}

export default function TaskModal({ isOpen, onClose, taskId, boardId }: Props) {
  const { user } = useAuthStore();
  const { data: task, isLoading, refetch } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask(boardId);
  const createSubtask = useCreateSubtask(taskId);
  const toggleSubtask = useToggleSubtask(taskId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const { data: history } = useTaskHistory(taskId);
  const { data: projectTags } = useProjectTags(task?.board?.projectId || '');
  const addTag = useAddTagToTask(taskId);
  const removeTag = useRemoveTagFromTask(taskId);
  const { data: members } = useProjectMembers(task?.board?.projectId || '');
  const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'history'>('subtasks');
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState<string>(task?.dueDate?.split('T')[0] || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [selectedTagId, setSelectedTagId] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.dueDate?.split('T')[0] || '');
      setAssigneeId(task.assigneeId || '');
    }
  }, [task]);

  if (!isOpen) return null;
  if (isLoading) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-gray-800 p-4 rounded">Загрузка...</div></div>;
  if (!task) return null;

  const isEditable = user?.role === 'admin' || user?.role === 'team_lead' || (user?.role === 'developer' && task.assigneeId === user.id);
  const canDelete = task.authorId === user?.id || user?.role === 'admin' || user?.role === 'team_lead';
  const canAssign = user?.role === 'admin' || user?.role === 'team_lead';

  const handleSave = async () => {
    await updateTask.mutateAsync({
      taskId,
      data: { title, description, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : null, assigneeId: canAssign ? assigneeId : undefined },
    });
    setEditingTitle(false);
    refetch();
  };

  const handleDelete = async () => {
    if (confirm('Удалить задачу?')) {
      await deleteTask.mutateAsync(taskId);
      onClose();
    }
  };

  const handleAddSubtask = async () => {
    if (newSubtaskTitle.trim()) {
      await createSubtask.mutateAsync(newSubtaskTitle);
      setNewSubtaskTitle('');
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await createComment.mutateAsync(newComment);
      setNewComment('');
    }
  };

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter(s => s.isCompleted).length;
  const progress = subtasks.length ? (completedCount / subtasks.length) * 100 : 0;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-800 p-4 border-b border-white/10 flex justify-between items-center">
          <div className="flex-1">
            {editingTitle ? (
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="bg-gray-700 text-white text-xl font-bold rounded px-2 py-1 w-full"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-bold text-white cursor-pointer" onClick={() => isEditable && setEditingTitle(true)}>
                {title}
              </h2>
            )}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4">
          <div className="col-span-2 space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">Описание</h3>
              {isEditable ? (
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={handleSave}
                  className="w-full bg-gray-700 text-white rounded p-2"
                  rows={6}
                />
              ) : (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{description || '_Нет описания_'}</ReactMarkdown>
                </div>
              )}
            </div>

            <div>
              <div className="flex gap-4 border-b border-white/20">
                <button className={`pb-2 ${activeTab === 'subtasks' ? 'text-white border-b-2 border-white' : 'text-white/60'}`} onClick={() => setActiveTab('subtasks')}>
                  Подзадачи ({subtasks.length})
                </button>
                <button className={`pb-2 ${activeTab === 'comments' ? 'text-white border-b-2 border-white' : 'text-white/60'}`} onClick={() => setActiveTab('comments')}>
                  Комментарии
                </button>
                <button className={`pb-2 ${activeTab === 'history' ? 'text-white border-b-2 border-white' : 'text-white/60'}`} onClick={() => setActiveTab('history')}>
                  История
                </button>
              </div>

              {activeTab === 'subtasks' && (
                <div className="mt-3">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      placeholder="Новая подзадача"
                      className="flex-1 bg-gray-700 text-white rounded px-2 py-1"
                    />
                    <button onClick={handleAddSubtask} className="bg-blue-600 px-3 py-1 rounded text-white">Добавить</button>
                  </div>
                  <div className="space-y-1">
                    {subtasks.map(sub => (
                      <label key={sub.id} className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={sub.isCompleted}
                          onChange={e => toggleSubtask.mutate({ subtaskId: sub.id, completed: e.target.checked })}
                        />
                        <span className={sub.isCompleted ? 'line-through text-white/50' : ''}>{sub.title}</span>
                      </label>
                    ))}
                  </div>
                  {subtasks.length > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="text-xs text-white/60 mt-1">{completedCount} из {subtasks.length} выполнено</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="mt-3">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {task.comments?.map(comment => (
                      <div key={comment.id} className="bg-gray-700/50 rounded p-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-white/70" />
                            <span className="text-sm font-medium text-white">{comment.author.username}</span>
                            <span className="text-xs text-white/50">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          {(comment.authorId === user?.id || user?.role === 'admin' || user?.role === 'team_lead') && (
                            <button onClick={() => deleteComment.mutate(comment.id)} className="text-red-400 hover:text-red-600">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-white/80 text-sm mt-1">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Написать комментарий..."
                      className="flex-1 bg-gray-700 text-white rounded px-2 py-1"
                      rows={2}
                    />
                    <button onClick={handleAddComment} className="bg-blue-600 px-3 py-1 rounded text-white h-fit">Отправить</button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {history?.map(entry => (
                    <div key={entry.id} className="text-sm text-white/70">
                      <span className="font-medium text-white">{entry.changer.username}</span> изменил(а) <strong>{entry.fieldName}</strong> с "{entry.oldValue}" на "{entry.newValue}" ({new Date(entry.changedAt).toLocaleString()})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm">Приоритет</label>
              <select value={priority} onChange={e => { setPriority(e.target.value); handleSave(); }} disabled={!isEditable} className="w-full bg-gray-700 text-white rounded p-1">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Критический</option>
              </select>
            </div>
            <div>
              <label className="block text-white text-sm">Дедлайн</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} onBlur={handleSave} disabled={!isEditable} className="w-full bg-gray-700 text-white rounded p-1" />
            </div>
            <div>
              <label className="block text-white text-sm">Исполнитель</label>
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} onBlur={handleSave} disabled={!canAssign} className="w-full bg-gray-700 text-white rounded p-1">
                <option value="">Не назначен</option>
                {members?.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white text-sm">Теги</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.taskTags?.map(tt => (
                  <span key={tt.tag.id} style={{ backgroundColor: tt.tag.color }} className="text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    {tt.tag.name}
                    {isEditable && <button onClick={() => removeTag.mutate(tt.tag.id)}><XMarkIcon className="w-3 h-3" /></button>}
                  </span>
                ))}
              </div>
              {isEditable && projectTags && (
                <div className="flex gap-1 mt-2">
                  <select value={selectedTagId} onChange={e => setSelectedTagId(e.target.value)} className="bg-gray-700 text-white text-sm rounded p-1 flex-1">
                    <option value="">Выбрать тег</option>
                    {projectTags.filter(t => !task.taskTags?.some(tt => tt.tag.id === t.id)).map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                  <button onClick={() => { if (selectedTagId) addTag.mutate(selectedTagId); setSelectedTagId(''); }} className="bg-blue-600 px-2 rounded text-white">+</button>
                </div>
              )}
            </div>
            <div className="pt-4 flex gap-2">
              {canDelete && (
                <button onClick={handleDelete} className="bg-red-600 px-3 py-1 rounded text-white">Удалить</button>
              )}
              <button className="bg-purple-600 px-3 py-1 rounded text-white">Создать встречу</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body // портал в body

  );
}