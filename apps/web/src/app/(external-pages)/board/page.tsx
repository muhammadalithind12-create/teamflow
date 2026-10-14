import type { Metadata } from 'next';
import { KanbanBoard } from './KanbanBoard';
import { RlsPanel } from './RlsPanel';

export const metadata: Metadata = {
  title: 'Live Demo — TeamFlow',
  description:
    'Try the TeamFlow Kanban board live: drag-and-drop cards, edit in realtime, no login required. Multi-tenant with strict Supabase RLS isolation.',
};

export default function BoardPage() {
  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8">
      <KanbanBoard />
      <RlsPanel />
    </div>
  );
}
