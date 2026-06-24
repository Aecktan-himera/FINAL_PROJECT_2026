import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useProjectTags } from '../../hooks/useKanban';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type Filters = {
  assigneeId: string;
  tagId: string;
  priority: string;
  search: string;
};

interface Props {
  projectId: string;
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function FiltersBar({ projectId, filters, onChange }: Props) {
  const { data: members } = useProjectMembers(projectId);
  const { data: tags } = useProjectTags(projectId);

  return (
    <div className="flex flex-wrap gap-3 p-3 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center bg-white/10 rounded px-2">
        <MagnifyingGlassIcon className="h-4 w-4 text-white/70" />
        <input
          type="text"
          placeholder="Поиск задач"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="bg-transparent text-white px-2 py-1 outline-none"
        />
      </div>
      <select value={filters.assigneeId} onChange={e => onChange({ ...filters, assigneeId: e.target.value })} className="bg-white/10 text-white rounded px-2 py-1">
        <option value="">Все исполнители</option>
        {members?.map(m => <option key={m.userId} value={m.userId}>{m.user.username}</option>)}
      </select>
      <select value={filters.tagId} onChange={e => onChange({ ...filters, tagId: e.target.value })} className="bg-white/10 text-white rounded px-2 py-1">
        <option value="">Все теги</option>
        {tags?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <select value={filters.priority} onChange={e => onChange({ ...filters, priority: e.target.value })} className="bg-white/10 text-white rounded px-2 py-1">
        <option value="">Все приоритеты</option>
        <option value="low">Низкий</option>
        <option value="medium">Средний</option>
        <option value="high">Высокий</option>
        <option value="urgent">Критический</option>
      </select>
    </div>
  );
}