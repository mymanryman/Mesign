import { isLearned } from '../lib/progress';
import { useStore } from '../lib/store';
import type { Catalog } from '../lib/types';

export function TopicPicker({ catalog }: { catalog: Catalog }) {
  const { settings, updateSettings, progress } = useStore();
  const selected = new Set(settings.topicIds);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSettings({ topicIds: catalog.topics.filter((t) => next.has(t.id)).map((t) => t.id) });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {catalog.topics.map((topic) => {
        const signs = catalog.signs.filter((s) => s.topicIds.includes(topic.id));
        const learned = signs.filter((s) => isLearned(progress[s.id])).length;
        const on = selected.has(topic.id);
        return (
          <button
            key={topic.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(topic.id)}
            className={`rounded-xl border-2 p-3 text-left transition-colors ${
              on ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/40' : 'border-transparent bg-white dark:bg-slate-900'
            }`}
          >
            <span className="block font-medium">{topic.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {learned} av {signs.length} kan du
            </span>
          </button>
        );
      })}
    </div>
  );
}
