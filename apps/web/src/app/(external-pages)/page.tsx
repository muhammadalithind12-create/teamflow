import { Separator } from '@/components/ui/separator';
import { KanbanSquare, Lock, Radio, ShieldCheck, Users, Zap } from 'lucide-react';
import { HomeCTA } from './home-cta';
import { HomeFeatures, type HomeFeature } from './home-features';
import { HomeHero } from './home-hero';

const features: HomeFeature[] = [
  {
    icon: KanbanSquare,
    title: 'Drag-and-Drop Kanban',
    description: 'Buttery card sorting across columns with fractional positioning — no full-list rewrites on every move.',
  },
  {
    icon: Radio,
    title: 'Realtime Collaboration',
    description: 'Supabase postgres_changes streams every card move, edit, and delete to all open tabs instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'RLS Tenant Isolation',
    description: 'Row Level Security guarantees workspace A can never read workspace B — enforced in Postgres, not the UI.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Workspaces',
    description: 'Workspaces, boards, columns, and cards with role-based membership (owner / member).',
  },
  {
    icon: Lock,
    title: 'Secure by Default',
    description: 'SECURITY DEFINER helpers keep policies recursion-free; realtime respects the same RLS rules.',
  },
  {
    icon: Zap,
    title: 'Modern Stack',
    description: 'Next.js 16, TypeScript, Supabase, and Tailwind CSS — type-safe end to end.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HomeHero />
      <Separator />
      <HomeFeatures features={features} />
      <Separator />
      <HomeCTA />
    </div>
  );
}
