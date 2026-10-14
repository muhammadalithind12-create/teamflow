'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TfCard } from './types';

const LABEL_COLORS: Record<string, string> = {
  frontend: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  backend: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  design: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  marketing: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  content: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  infra: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  billing: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ops: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  research: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  experiment: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  a11y: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
};

function labelClass(label: string): string {
  return (
    LABEL_COLORS[label.toLowerCase()] ??
    'bg-muted text-muted-foreground'
  );
}

export function KanbanCard({
  card,
  onOpen,
}: {
  card: TfCard;
  onOpen: (card: TfCard) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      className={cn(
        'group rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing',
        'hover:border-primary/50 hover:shadow transition-shadow',
        isDragging && 'opacity-40 shadow-lg'
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
        <p className="text-sm font-medium leading-snug flex-1">{card.title}</p>
      </div>
      {card.description && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 pl-6">
          {card.description}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
        {card.labels.map((label) => (
          <Badge key={label} variant="secondary" className={cn('text-[10px] px-1.5 py-0', labelClass(label))}>
            {label}
          </Badge>
        ))}
        {card.assignee && (
          <span className="ml-auto flex items-center gap-1.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
              title={card.assignee}
            >
              {card.assignee
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
