import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useBoards, useReorderColumns, useMoveTask } from "../hooks/useKanban";
import { useAuthStore } from "../store/authStore";
import Column from "../components/kanban/Column";
import FiltersBar from "../components/kanban/FiltersBar";
import QuickCreateTaskModal from "../components/kanban/QuickCreateTaskModal";
import { ColumnFormModal } from "../components/modal/ColumnFormModal";
import { BoardFormModal } from "../components/modal/BoardFormModal";
import { ChevronDownIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { Column as ColumnType, Board } from "../types/kanban";

interface KanbanBoardProps {
  projectId?: string;
  boardId?: string;
}

export default function KanbanBoard({
  projectId: propProjectId,
  boardId: propBoardId,
}: KanbanBoardProps = {}) {
  const params = useParams<{ projectId: string; boardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const projectId = propProjectId ?? params.projectId;
  const boardId = propBoardId ?? params.boardId;

  const { data: boards, isLoading: boardsLoading } = useBoards(projectId!);
  const [boardSelectorOpen, setBoardSelectorOpen] = useState(false);
  const [filters, setFilters] = useState({
    assigneeId: "",
    tagId: "",
    priority: "",
    search: "",
  });
  const [showQuickCreate, setShowQuickCreate] = useState<{
    columnId: string;
  } | null>(null);
  const [showColumnModal, setShowColumnModal] = useState<{
    boardId: string;
    column?: ColumnType;
    isEditing?: boolean;
  } | null>(null);
  const [showBoardModal, setShowBoardModal] = useState<{
    projectId: string;
    board?: Board;
    isEditing?: boolean;
  } | null>(null);

  const currentBoard = useMemo(() => {
    if (!boards || boards.length === 0) return null;
    if (boardId) {
      return boards.find((b) => b.id === boardId) || boards[0] || null;
    }
    return boards[0] || null;
  }, [boards, boardId]);

  const reorderColumns = useReorderColumns(projectId!,currentBoard?.id || "");
  const moveTask = useMoveTask(projectId!, currentBoard?.id || "");

  // Редирект, если нужно выбрать первую доску
  useEffect(() => {
    if (boards && boards.length > 0 && currentBoard && (!boardId || !boards.some((b) => b.id === boardId))) {
      if (!propProjectId && !propBoardId) {
        navigate(`/projects/${projectId}/boards/${currentBoard.id}`, { replace: true });
      }
    }
  }, [boards, boardId, currentBoard, projectId, navigate, propProjectId, propBoardId]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "COLUMN") {
      const columnIds = currentBoard?.columns.map((c) => c.id) || [];
      const newOrder = Array.from(columnIds);
      const [removed] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, removed);
      reorderColumns.mutate(newOrder);
    } else if (type === "TASK") {
      const sourceColId = source.droppableId;
      const destColId = destination.droppableId;
      const sourceColumn = currentBoard?.columns.find((c) => c.id === sourceColId);
      const destColumn = currentBoard?.columns.find((c) => c.id === destColId);
      if (!sourceColumn || !destColumn) return;

      const sourceTasks = sourceColumn.tasks;
      const destTasks = destColId === sourceColId ? sourceTasks : destColumn.tasks;
      const taskId = sourceTasks[source.index]?.id;
      if (!taskId) return;

      const afterTaskId = destTasks[destination.index]?.id || null;
      moveTask.mutate({ taskId, targetColumnId: destColId, afterTaskId });
    }
  };

  const handleEditColumn = (column: ColumnType) => {
    setShowColumnModal({
      boardId: currentBoard!.id,
      column,
      isEditing: true,
    });
  };

  const handleEditBoard = () => {
    if (currentBoard) {
      setShowBoardModal({
        projectId: projectId!,
        board: currentBoard,
        isEditing: true,
      });
    }
  };

  const isTeamLeadOrOwner = user?.role === "team_lead" || user?.role === "admin";

  // Загрузка
  if (boardsLoading) {
    return <div className="p-8 text-white">Загрузка досок...</div>;
  }

  // Нет досок
  if (!boards || boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Нет досок</h3>
          <p className="text-white/70 mb-4">
            В этом проекте пока нет ни одной доски. Создайте первую доску, чтобы начать работу.
          </p>
          {isTeamLeadOrOwner ? (
            <button
              onClick={() => setShowBoardModal({ projectId: projectId!, isEditing: false })}
              className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg text-white hover:bg-blue-700 transition"
            >
              <PlusIcon className="h-5 w-5" />
              Создать доску
            </button>
          ) : (
            <p className="text-white/50 text-sm">Только тимлид или администратор могут создать доску</p>
          )}
        </div>
      </div>
    );
  }

  // Если нет текущей доски (например, после удаления всех досок, но boards не обновился)
  if (!currentBoard) {
    return <div className="p-8 text-white">Ошибка: не удалось загрузить доску</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm rounded-t-2xl">
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBoardSelectorOpen(!boardSelectorOpen)}
              className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-300"
            >
              {currentBoard.name}
              <ChevronDownIcon className="h-5 w-5" />
            </button>
            {isTeamLeadOrOwner && (
              <button
                onClick={handleEditBoard}
                className="text-white/50 hover:text-white p-1"
                title="Редактировать доску"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {boardSelectorOpen && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
              {boards?.map((board) => (
                <button
                  key={board.id}
                  onClick={() => {
                    navigate(`/projects/${projectId}/boards/${board.id}`);
                    setBoardSelectorOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-white whitespace-nowrap"
                >
                  {board.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {isTeamLeadOrOwner && (
          <button
            onClick={() => setShowBoardModal({ projectId: projectId!, isEditing: false })}
            className="bg-white/20 px-3 py-1 rounded text-white hover:bg-white/30"
          >
            + Добавить доску
          </button>
        )}
      </div>

      <FiltersBar projectId={projectId!} filters={filters} onChange={setFilters} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 p-4 overflow-x-auto flex-1">
          <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex gap-4">
                {currentBoard.columns.map((column, idx) => (
                  <Draggable key={column.id} draggableId={column.id} index={idx}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <Column
                          column={column}
                          filters={filters}
                          onEditColumn={handleEditColumn}
                          onAddTask={() => setShowQuickCreate({ columnId: column.id })}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {isTeamLeadOrOwner && (
            <button
              onClick={() => setShowColumnModal({ boardId: currentBoard.id, isEditing: false })}
              className="min-w-[280px] h-fit bg-white/10 rounded-lg p-4 text-white hover:bg-white/20"
            >
              + Добавить колонку
            </button>
          )}
        </div>
      </DragDropContext>

      {showQuickCreate && (
        <QuickCreateTaskModal
          boardId={currentBoard.id}
          columnId={showQuickCreate.columnId}
          onClose={() => setShowQuickCreate(null)}
          onSuccess={() => setShowQuickCreate(null)}
        />
      )}

      {showColumnModal && (
        <ColumnFormModal
          isOpen={true}
          onClose={() => setShowColumnModal(null)}
          boardId={showColumnModal.boardId}
          column={showColumnModal.column}
          isEditing={showColumnModal.isEditing}
        />
      )}

      {showBoardModal && (
        <BoardFormModal
          isOpen={true}
          onClose={() => setShowBoardModal(null)}
          projectId={showBoardModal.projectId}
          board={showBoardModal.board}
          isEditing={showBoardModal.isEditing}
        />
      )}
    </div>
  );
}