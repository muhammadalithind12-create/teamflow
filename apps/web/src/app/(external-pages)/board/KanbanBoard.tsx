'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseClient } from './useSupabaseClient';
import { cn } from '@/lib/utils';
import type { TfBoard, TfCard, TfColumn, TfWorkspace } from './types';
import { KanbanColumn } from './KanbanColumn';
import { CardDialog } from './CardDialog';

/** Compute a fractional position for `list[index]` given its new neighbours. */
function positionFor(list: TfCard[], index: number): number {
  const prev = list[index - 1];
  const next = list[index + 1];
  if (prev && next) {
    if (next.position - prev.position > 0.01) {
      return (prev.position + next.position) / 2;
    }
    return -1; // gap exhausted -> renormalize
  }
  if (prev) return prev.position + 1000;
  if (next) return next.position > 1000 ? next.position - 1000 : -1;
  return 1000;
}

export function KanbanBoard() {
  const supabase = useSupabaseClient();
  const [mounted, setMounted] = useState(false);
  const [workspace, setWorkspace] = useState<TfWorkspace | null>(null);
  const [board, setBoard] = useState<TfBoard | null>(null);
  const [columns, setColumns] = useState<TfColumn[]>([]);
  const [cardsByColumn, setCardsByColumn] = useState<Record<string, TfCard[]>>({});
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<TfCard | null>(null);
  const [dialogCard, setDialogCard] = useState<TfCard | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data: ws, error: wsErr } = await supabase
        .from('tf_workspaces')
        .select('id, name, slug')
        .eq('slug', 'demo')
        .single();
      if (wsErr || !ws) throw new Error('Demo workspace not found. Run the SQL seed first.');
      setWorkspace(ws);

      const { data: boards, error: bErr } = await supabase
        .from('tf_boards')
        .select('id, workspace_id, title')
        .eq('workspace_id', ws.id)
        .limit(1);
      if (bErr || !boards?.length) throw new Error('No board found in the demo workspace.');
      const b = boards[0] as TfBoard;
      setBoard(b);

      const { data: cols } = await supabase
        .from('tf_columns')
        .select('id, board_id, title, position')
        .eq('board_id', b.id)
        .order('position');
      const { data: cards } = await supabase
        .from('tf_cards')
        .select('id, column_id, board_id, title, description, assignee, labels, position')
        .eq('board_id', b.id)
        .order('position');

      const typedCols = (cols ?? []) as TfColumn[];
      const typedCards = (cards ?? []) as TfCard[];
      setColumns(typedCols);
      const grouped: Record<string, TfCard[]> = {};
      for (const c of typedCols) grouped[c.id] = [];
      for (const card of typedCards) {
        if (!grouped[card.column_id]) grouped[card.column_id] = [];
        grouped[card.column_id].push(card);
      }
      setCardsByColumn(grouped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load board.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (supabase) void load();
  }, [supabase, load]);

  // ---- Realtime sync -------------------------------------------------------
  useEffect(() => {
    if (!supabase || !board) return;
    const channel = supabase
      .channel(`tf-board-${board.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tf_cards', filter: `board_id=eq.${board.id}` },
        (payload) => {
          const row = payload.new as TfCard;
          setCardsByColumn((prev) => {
            const col = [...(prev[row.column_id] ?? [])];
            if (!col.some((c) => c.id === row.id)) {
              col.push(row);
              col.sort((a, b) => a.position - b.position);
            }
            const next: Record<string, TfCard[]> = { ...prev, [row.column_id]: col };
            for (const cid of Object.keys(next)) {
              if (cid !== row.column_id) next[cid] = next[cid].filter((c) => c.id !== row.id);
            }
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tf_cards', filter: `board_id=eq.${board.id}` },
        (payload) => {
          const row = payload.new as TfCard;
          setCardsByColumn((prev) => {
            const next: Record<string, TfCard[]> = {};
            for (const cid of Object.keys(prev)) {
              next[cid] = prev[cid].filter((c) => c.id !== row.id);
            }
            const col = [...(next[row.column_id] ?? []), row].sort(
              (a, b) => a.position - b.position
            );
            next[row.column_id] = col;
            return next;
          });
          setDialogCard((d) => (d && d.id === row.id ? row : d));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tf_cards', filter: `board_id=eq.${board.id}` },
        (payload) => {
          const row = payload.old as { id: string };
          setCardsByColumn((prev) => {
            const next: Record<string, TfCard[]> = {};
            for (const cid of Object.keys(prev)) {
              next[cid] = prev[cid].filter((c) => c.id !== row.id);
            }
            return next;
          });
          setDialogCard((d) => (d && d.id === row.id ? null : d));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tf_columns', filter: `board_id=eq.${board.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as TfColumn;
            setColumns((prev) =>
              prev.some((c) => c.id === row.id)
                ? prev
                : [...prev, row].sort((a, b) => a.position - b.position)
            );
            setCardsByColumn((prev) =>
              prev[row.id] ? prev : { ...prev, [row.id]: [] }
            );
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as TfColumn;
            setColumns((prev) =>
              prev.map((c) => (c.id === row.id ? row : c)).sort((a, b) => a.position - b.position)
            );
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as { id: string };
            setColumns((prev) => prev.filter((c) => c.id !== row.id));
            setCardsByColumn((prev) => {
              const next = { ...prev };
              delete next[row.id];
              return next;
            });
          }
        }
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, board]);

  // ---- Drag and drop --------------------------------------------------------
  const findColumnOfCard = useCallback(
    (cardId: string): string | undefined =>
      columns.find((c) => (cardsByColumn[c.id] ?? []).some((card) => card.id === cardId))?.id,
    [columns, cardsByColumn]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card as TfCard | undefined;
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeColId = findColumnOfCard(activeId);
    const overColId = columns.some((c) => c.id === overId)
      ? overId
      : findColumnOfCard(overId);
    if (!activeColId || !overColId || activeColId === overColId) return;

    setCardsByColumn((prev) => {
      const activeCards = [...(prev[activeColId] ?? [])];
      const overCards = [...(prev[overColId] ?? [])];
      const activeIndex = activeCards.findIndex((c) => c.id === activeId);
      if (activeIndex === -1) return prev;
      const [moved] = activeCards.splice(activeIndex, 1);
      const isOverColumn = columns.some((c) => c.id === overId);
      const overIndex = isOverColumn
        ? overCards.length
        : Math.max(0, overCards.findIndex((c) => c.id === overId));
      overCards.splice(overIndex, 0, { ...moved, column_id: overColId });
      return { ...prev, [activeColId]: activeCards, [overColId]: overCards };
    });
  };

  const persistMove = useCallback(
    async (cardId: string) => {
      if (!supabase) return;
      const colId = findColumnOfCard(cardId);
      if (!colId) return;
      const list = [...(cardsByColumn[colId] ?? [])].sort((a, b) => a.position - b.position);
      const index = list.findIndex((c) => c.id === cardId);
      if (index === -1) return;

      let newPos = positionFor(list, index);
      if (newPos === -1) {
        // Renormalize: re-space the whole column, then persist everything.
        const updates = list.map((c, i) => ({ ...c, position: (i + 1) * 1000 }));
        setCardsByColumn((prev) => ({ ...prev, [colId]: updates }));
        for (const u of updates) {
          await supabase.from('tf_cards').update({ column_id: colId, position: u.position }).eq('id', u.id);
        }
        return;
      }
      setCardsByColumn((prev) => ({
        ...prev,
        [colId]: (prev[colId] ?? []).map((c) => (c.id === cardId ? { ...c, position: newPos } : c)),
      }));
      const { error: upErr } = await supabase
        .from('tf_cards')
        .update({ column_id: colId, position: newPos })
        .eq('id', cardId);
      if (upErr) void load();
    },
    [cardsByColumn, findColumnOfCard, load, supabase]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);

    // Same-column reorder: arrayMove, then persist.
    const colId = findColumnOfCard(activeId);
    if (colId && over.data.current?.type !== 'column') {
      const overColId = findColumnOfCard(String(over.id));
      if (overColId === colId) {
        const list = [...(cardsByColumn[colId] ?? [])];
        const oldIndex = list.findIndex((c) => c.id === activeId);
        const newIndex = list.findIndex((c) => c.id === String(over.id));
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const moved = arrayMove(list, oldIndex, newIndex);
          setCardsByColumn((prev) => ({ ...prev, [colId]: moved }));
        }
      }
    }
    void persistMove(activeId);
  };

  // ---- Mutations -------------------------------------------------------------
  const addCard = useCallback(
    async (columnId: string, title: string) => {
      if (!supabase || !board) return;
      const existing = cardsByColumn[columnId] ?? [];
      const position = existing.length ? Math.max(...existing.map((c) => c.position)) + 1000 : 1000;
      const { data, error: insErr } = await supabase
        .from('tf_cards')
        .insert({ column_id: columnId, board_id: board.id, title, position })
        .select()
        .single();
      if (insErr || !data) {
        setError('Could not add card. Please try again.');
        return;
      }
      const row = data as TfCard;
      setCardsByColumn((prev) => ({
        ...prev,
        [columnId]: [...(prev[columnId] ?? []), row].sort((a, b) => a.position - b.position),
      }));
    },
    [board, cardsByColumn, supabase]
  );

  const saveCard = useCallback(
    async (cardId: string, patch: Partial<TfCard>) => {
      if (!supabase) return;
      const { error: upErr } = await supabase.from('tf_cards').update(patch).eq('id', cardId);
      if (upErr) {
        setError('Could not save card. Please try again.');
        return;
      }
      setCardsByColumn((prev) => {
        const next: Record<string, TfCard[]> = {};
        for (const cid of Object.keys(prev)) {
          next[cid] = prev[cid].map((c) => (c.id === cardId ? { ...c, ...patch } : c));
        }
        return next;
      });
    },
    [supabase]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!supabase) return;
      const { error: delErr } = await supabase.from('tf_cards').delete().eq('id', cardId);
      if (delErr) {
        setError('Could not delete card. Please try again.');
        return;
      }
      setCardsByColumn((prev) => {
        const next: Record<string, TfCard[]> = {};
        for (const cid of Object.keys(prev)) {
          next[cid] = prev[cid].filter((c) => c.id !== cardId);
        }
        return next;
      });
    },
    [supabase]
  );

  const addColumn = useCallback(
    async (title: string) => {
      if (!supabase || !board) return;
      const position = columns.length;
      const { data, error: insErr } = await supabase
        .from('tf_columns')
        .insert({ board_id: board.id, title, position })
        .select()
        .single();
      if (insErr || !data) {
        setError('Could not add column. Please try again.');
        return;
      }
      const row = data as TfColumn;
      setColumns((prev) => [...prev, row].sort((a, b) => a.position - b.position));
      setCardsByColumn((prev) => ({ ...prev, [row.id]: [] }));
    },
    [board, columns.length, supabase]
  );

  const renameColumn = useCallback(
    async (columnId: string, title: string) => {
      if (!supabase) return;
      const { error: upErr } = await supabase.from('tf_columns').update({ title }).eq('id', columnId);
      if (upErr) {
        setError('Could not rename column. Please try again.');
        return;
      }
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, title } : c)));
    },
    [supabase]
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      if (!supabase) return;
      if (!window.confirm('Delete this column and all its cards?')) return;
      const { error: delErr } = await supabase.from('tf_columns').delete().eq('id', columnId);
      if (delErr) {
        setError('Could not delete column. Please try again.');
        return;
      }
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      setCardsByColumn((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
    },
    [supabase]
  );

  // ---- Render ------------------------------------------------------------------
  if (!mounted || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading board…</p>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-semibold">Board unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The Supabase connection isn&apos;t configured. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and redeploy.
        </p>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-semibold">Couldn&apos;t load the demo board</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {workspace?.name ?? 'Workspace'}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{board?.title ?? 'Board'}</h1>
        </div>
        <span
          className={cn(
            'ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            live ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                 : 'bg-muted text-muted-foreground'
          )}
          title={live ? 'Realtime channel connected' : 'Connecting to realtime channel…'}
        >
          <span className={cn('h-2 w-2 rounded-full', live ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50')} />
          {live ? 'LIVE' : 'CONNECTING'}
        </span>
        <p className="w-full text-sm text-muted-foreground">
          Public demo workspace — no login needed. Open this page in a second tab and drag a card:
          both tabs update instantly.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={(cardsByColumn[column.id] ?? []).slice().sort((a, b) => a.position - b.position)}
              onOpenCard={setDialogCard}
              onAddCard={addCard}
              onRenameColumn={renameColumn}
              onDeleteColumn={deleteColumn}
            />
          ))}

          <div className="w-72 shrink-0">
            {addingColumn ? (
              <div className="flex flex-col gap-1.5 rounded-xl border bg-muted/40 p-2">
                <Input
                  autoFocus
                  placeholder="Column title…"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const t = newColumnTitle.trim();
                      if (t) {
                        setNewColumnTitle('');
                        setAddingColumn(false);
                        void addColumn(t);
                      }
                    }
                    if (e.key === 'Escape') {
                      setNewColumnTitle('');
                      setAddingColumn(false);
                    }
                  }}
                  className="h-8 text-sm"
                />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const t = newColumnTitle.trim();
                      if (t) {
                        setNewColumnTitle('');
                        setAddingColumn(false);
                        void addColumn(t);
                      }
                    }}
                  >
                    Add column
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setNewColumnTitle('');
                      setAddingColumn(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed text-muted-foreground"
                onClick={() => setAddingColumn(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Add column
              </Button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-72 rotate-2 rounded-lg border bg-card p-3 shadow-xl">
              <p className="text-sm font-medium">{activeCard.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDialog
        card={dialogCard}
        onClose={() => setDialogCard(null)}
        onSave={saveCard}
        onDelete={deleteCard}
      />
    </div>
  );
}
