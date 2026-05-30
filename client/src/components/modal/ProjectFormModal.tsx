import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Project } from '../../types/project';
import { useCreateProject, useUpdateProject, useProjects } from '../../hooks/useProjects';
import { XMarkIcon } from '@heroicons/react/24/outline';

const projectFormSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  key: z.string().min(1, 'Ключ обязателен').max(10),
  description: z.string().optional(),
  parentProjectId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().optional(),
  responsibleId: z.uuid().optional().nullable(),
});

type FormData = z.infer<typeof projectFormSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Project;
  isEditing?: boolean;
}

export function ProjectFormModal({ isOpen, onClose, initialData, isEditing }: Props) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: projects } = useProjects();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          key: initialData.key,
          description: initialData.description || '',
          parentProjectId: initialData.parentProjectId,
          isPublic: initialData.isPublic,
          responsibleId: initialData.responsibleId,
        }
      : { isPublic: false, parentProjectId: null, responsibleId: null },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        initialData
          ? {
              name: initialData.name,
              key: initialData.key,
              description: initialData.description || '',
              parentProjectId: initialData.parentProjectId,
              isPublic: initialData.isPublic,
              responsibleId: initialData.responsibleId,
            }
          : { isPublic: false, parentProjectId: null, responsibleId: null }
      );
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && initialData) {
        await updateProject.mutateAsync({ id: initialData.id, data });
      } else {
        await createProject.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save project', error);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose} // клик по фону закрывает
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // клик внутри модалки не закрывает
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-4">
            {isEditing ? 'Редактировать проект' : 'Создать проект'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-white/80">Название</label>
              <input
                {...register('name')}
                className="mt-1 w-full rounded-lg border border-white/30 bg-white/50 dark:bg-black/20 px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-white/80">Ключ</label>
              <input
                {...register('key')}
                className="mt-1 w-full rounded-lg border border-white/30 bg-white/50 dark:bg-black/20 px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.key && <p className="text-red-600 text-xs mt-1">{errors.key.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-white/80">Описание</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/30 bg-white/50 dark:bg-black/20 px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-white/80">Родительский проект</label>
              <select
                {...register('parentProjectId')}
                className="mt-1 w-full rounded-lg border border-white/30 bg-white/50 dark:bg-black/20 px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Нет</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isPublic')}
                className="rounded border-white/30 bg-white/50 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-sm text-blue-900 dark:text-white/80">Публичный проект</label>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-white/30 text-blue-900 dark:text-white hover:bg-white/20 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}