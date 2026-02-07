import { QueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'

import { client } from '$lib/eden.js';

export const load = async ({ fetch, depends }) => {
  depends("layout:data")
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  const res = await fetch('/api/layout')
  const data = await res.json() as Awaited<ReturnType<typeof client.layout.get>>['data']

  return {
    queryClient,
    ...data
  }
}
