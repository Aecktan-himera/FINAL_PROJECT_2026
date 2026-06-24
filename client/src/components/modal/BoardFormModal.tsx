import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBoard, useUpdateBoard } from "../../hooks/useKanban";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { Board } from "../../types/kanban";
import { AxiosError } from "axios";

const boardFormSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
});

type FormData = z.infer<typeof boardFormSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  board?: Board;
  isEditing?: boolean;
}

export function BoardFormModal({
  isOpen,
  onClose,
  projectId,
  board,
  isEditing,
}: Props) {
  const createBoard = useCreateBoard(projectId);
  const updateBoard = useUpdateBoard();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(boardFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (isOpen) {
      reset(board && isEditing ? { name: board.name } : { name: "" });
    }
  }, [isOpen, board, isEditing, reset]);

  if (!isOpen) return null;
  if (!projectId) {
    console.error("BoardFormModal: projectId is required");
    return null;
  }
  /*const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && board) {
        await updateBoard.mutateAsync({ boardId: board.id, data: { name: data.name } });
      } else {
        await createBoard.mutateAsync(data.name);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save board', error);
    }
  };*/

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && board) {
        await updateBoard.mutateAsync({
          boardId: board.id,
          data: { name: data.name },
        });
      } else {
        await createBoard.mutateAsync(data.name);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save board", error);
      alert("Ошибка при создании доски: " + (error as AxiosError).message);
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
            {isEditing ? "Редактировать доску" : "Создать доску"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 dark:text-white/80">
                Название доски
              </label>
              <input
                {...register("name")}
                className="mt-1 w-full rounded-lg border border-white/30 bg-white/50 dark:bg-black/20 px-3 py-2 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Sprint 1"
              />
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
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
                {isSubmitting
                  ? "Сохранение..."
                  : isEditing
                    ? "Сохранить"
                    : "Создать"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
