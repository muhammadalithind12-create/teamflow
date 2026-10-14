'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/supabase-clients/client';

type BrowserClient = ReturnType<typeof createClient>;

/**
 * Creates the Supabase browser client only after mount, so server prerenders
 * never touch it (the client throws when env vars are absent at build time).
 * Returns null until the client exists.
 */
export function useSupabaseClient(): BrowserClient | null {
  const [client, setClient] = useState<BrowserClient | null>(null);

  useEffect(() => {
    try {
      setClient(createClient());
    } catch {
      setClient(null);
    }
  }, []);

  return client;
}
