import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HomeCTA() {
  return (
    <section className="py-20 px-4 text-center">
      <div className="max-w-xl mx-auto flex flex-col gap-4 items-center">
        <h2 className="text-3xl font-bold tracking-tight">Ready to get your team in flow?</h2>
        <p className="text-muted-foreground">
          Create a workspace, invite your team, and ship — with realtime boards and data isolation built in.
        </p>
        <Button asChild size="lg">
          <Link href="/board">
            Open the live demo <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
