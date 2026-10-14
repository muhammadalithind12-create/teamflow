import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, KanbanSquare } from 'lucide-react';
import Link from 'next/link';

export function HomeHero() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-24 px-4 text-center">
      <Badge variant="secondary" className="px-3 py-1">
        Multi-tenant Kanban SaaS
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl max-w-3xl">
        Team projects,{' '}
        <span className="text-primary">finally in flow</span>
      </h1>
      <p className="text-muted-foreground text-lg max-w-xl">
        TeamFlow is a realtime Kanban workspace for teams — drag-and-drop boards,
        live collaboration, and strict per-workspace data isolation powered by
        Supabase Row Level Security.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/board">
            Try the live demo <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/sign-up">
            <KanbanSquare className="mr-2 h-4 w-4" /> Create your workspace
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        No login needed for the demo — open it in two tabs and watch cards sync live.
      </p>
    </section>
  );
}
