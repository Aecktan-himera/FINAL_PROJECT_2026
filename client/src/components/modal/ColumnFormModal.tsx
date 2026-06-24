import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateColumn, useUpdateColumn } from '../../hooks/useKanban';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Column } from '../../types/kanban';

const columnFormSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Некорректный цвет'),
  wipLimit: z.number().int().min(0, 'WIP-лимит не может быть отрицательным'),
});

type FormData = z.infer<typeof columnFormSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  column?: Column;
  isEditing?: boolean;
}

export function ColumnFormModal({ isOpen, onClose, boardId, column, isEditing }: Props) {
  const createColumn = useCreateColumn(boardId);
  const updateColumn = useUpdateColumn();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(columnFormSchema),
    defaultValues: {
      name: '',
      color: '#808080',
      wipLimit: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (column && isEditing) {
        reset({
          name: column.name,
          color: column.color,
          wipLimit: column.wipLimit,
        });
      } else {
        reset({
          name: '',
          color: '#808080',
          wipLimit: 0,
        });
      }
    }
  }, [isOpen, column, isEditing, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && column) {
        await updateColumn.mutateAsync({ columnId: column.id, data });
      } else {
        await createColumn.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save column', error);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-white mb-4">
            {isEditing ? 'Редактировать колонку' : 'Создать колонку'}
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
              <label className="block text-sm font-medium text-blue-900 dark:text-white/80">Цвет</label>
              <input
                type="color"
                {...register('color')}
                className="mt-1 w-full h-10 rounded border border-white/30 bg-white/50 dark:bg-black/20"
              />
              {errors.color && <p className="text-red-600 text-xs mt-1">{errors.color.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-white/80">WIP-лимит</label>
              <input
                type="number"
                {...register('wipLimit', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-white/30 bg-white/50 dark:bg-black/20 px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.wipLimit && <p className="text-red-600 text-xs mt-1">{errors.wipLimit.message}</p>}
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