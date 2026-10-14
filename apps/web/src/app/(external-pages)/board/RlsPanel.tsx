import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Short explainer that sells the RLS design behind the demo board.
 * Rendered below the Kanban on /board.
 */
export function RlsPanel() {
  return (
    <Card className="mt-10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          How tenant isolation works here
        </CardTitle>
        <CardDescription>
          Every row in this demo is protected by Postgres Row Level Security — the same
          mechanism that isolates paying tenants in production.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          Each board belongs to exactly one <strong className="text-foreground">workspace</strong> (the
          tenant). RLS policies on <code className="text-foreground">tf_boards</code>,{' '}
          <code className="text-foreground">tf_columns</code> and{' '}
          <code className="text-foreground">tf_cards</code> only let a query touch rows whose
          workspace is either the public <code className="text-foreground">demo</code> workspace
          or a workspace the signed-in user belongs to (checked through{' '}
          <code className="text-foreground">tf_members</code> via a{' '}
          <code className="text-foreground">SECURITY DEFINER</code> helper, so policies can never
          recurse). The cards table carries a denormalized{' '}
          <code className="text-foreground">board_id</code> so the policy needs no extra join.
        </p>
        <div className="rounded-lg bg-muted/60 p-4 font-mono text-xs leading-relaxed overflow-x-auto">
          <p className="text-muted-foreground">-- the core idea, one policy per table:</p>
          <p>
            <span className="text-primary">create policy</span> tf_cards_select{' '}
            <span className="text-primary">on</span> tf_cards <span className="text-primary">for select</span>
          </p>
          <p className="pl-2">
            <span className="text-primary">using</span> (
          </p>
          <p className="pl-6">
            <span className="text-primary">exists</span> (
            <span className="text-primary">select</span> 1 <span className="text-primary">from</span> tf_boards b
          </p>
          <p className="pl-10">
            <span className="text-primary">where</span> b.id = tf_cards.board_id
          </p>
          <p className="pl-12">
            <span className="text-primary">and</span> (tf_is_demo_workspace(b.workspace_id)
          </p>
          <p className="pl-16">
            <span className="text-primary">or</span> tf_is_member(b.workspace_id)))
          </p>
          <p className="pl-2">);</p>
        </div>
        <p>
          Result: tenant A&apos;s cards are invisible to tenant B at the{' '}
          <strong className="text-foreground">database</strong> level — not just hidden in the UI.
          The realtime channel you see syncing above respects the same policies, so live
          updates can never leak across workspaces either.
        </p>
      </CardContent>
    </Card>
  );
}
