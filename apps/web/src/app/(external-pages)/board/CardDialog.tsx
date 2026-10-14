'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TfCard } from './types';

export function CardDialog({
  card,
  onClose,
  onSave,
  onDelete,
}: {
  card: TfCard | null;
  onClose: () => void;
  onSave: (cardId: string, patch: Partial<TfCard>) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [labels, setLabels] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setAssignee(card.assignee);
      setLabels(card.labels.join(', '));
    }
  }, [card]);

  const handleSave = async () => {
    if (!card || !title.trim()) return;
    setSaving(true);
    try {
      await onSave(card.id, {
        title: title.trim(),
        description,
        assignee: assignee.trim(),
        labels: labels
          .split(',')
          .map((l) => l.trim().toLowerCase())
          .filter(Boolean),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    if (!window.confirm(`Delete "${card.title}"?`)) return;
    await onDelete(card.id);
    onClose();
  };

  return (
    <Dialog open={card !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Card details</DialogTitle>
          <DialogDescription>
            Changes save to the shared board and sync live to everyone viewing it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-title">Title</Label>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-desc">Description</Label>
            <Textarea
              id="card-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done…"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-assignee">Assignee</Label>
              <Input
                id="card-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="card-labels">Labels (comma separated)</Label>
              <Input
                id="card-labels"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="frontend, urgent"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => void handleDelete()}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
