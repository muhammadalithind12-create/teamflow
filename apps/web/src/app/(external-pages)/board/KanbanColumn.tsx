'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Pencil, Plus, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TfCard, TfColumn } from './types';
import { KanbanCard } from './KanbanCard';

export function KanbanColumn({
  column,
  cards,
  onOpenCard,
  onAddCard,
  onRenameColumn,
  onDeleteColumn,
}: {
  column: TfColumn;
  cards: TfCard[];
  onOpenCard: (card: TfCard) => void;
  onAddCard: (columnId: string, title: string) => Promise<void>;
  onRenameColumn: (columnId: string, title: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  });

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);

  const submitAdd = async () => {
    const title = newTitle.trim();
    if (!title) {
      setAdding(false);
      return;
    }
    setNewTitle('');
    setAdding(false);
    await onAddCard(column.id, title);
  };

  const submitRename = async () => {
    const title = renameValue.trim();
    setRenaming(false);
    if (title && title !== column.title) {
      await onRenameColumn(column.id, title);
    } else {
      setRenameValue(column.title);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 p-2 transition-colors',
        isOver && 'border-primary/60 bg-primary/5'
      )}
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        {renaming ? (
          <div className="flex flex-1 items-center gap-1">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitRename();
                if (e.key === 'Escape') {
                  setRenameValue(column.title);
                  setRenaming(false);
                }
              }}
              className="h-7 text-sm font-semibold"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => void submitRename()}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setRenameValue(column.title);
                setRenaming(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="flex-1 text-sm font-semibold truncate">{column.title}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {cards.length}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              title="Rename column"
              onClick={() => {
                setRenameValue(column.title);
                setRenaming(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Delete column and its cards"
              onClick={() => void onDeleteColumn(column.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 overflow-y-auto px-1 py-1 min-h-[60px] max-h-[calc(100vh-380px)]">
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onOpen={onOpenCard} />
          ))}
          {cards.length === 0 && !adding && (
            <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              Drop cards here
            </div>
          )}
        </div>
      </SortableContext>

      <div className="px-1 pt-1">
        {adding ? (
          <div className="flex flex-col gap-1.5">
            <Input
              autoFocus
              placeholder="Card title…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitAdd();
                if (e.key === 'Escape') {
                  setNewTitle('');
                  setAdding(false);
                }
              }}
              className="h-8 text-sm"
            />
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 text-xs" onClick={() => void submitAdd()}>
                Add card
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setNewTitle('');
                  setAdding(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus className="mr-1 h-4 w-4" /> Add card
          </Button>
        )}
      </div>
    </div>
  );
}
