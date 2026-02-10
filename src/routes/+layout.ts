import { QueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'
import gsap from "gsap";
import { client } from '$lib/eden.js';
import { ScrollTrigger } from 'gsap/all';

export const load = async ({ fetch, depends }) => {
  depends("layout:data")

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  gsap.registerPlugin(ScrollTrigger)

  try {

    const res = await fetch('/api/layout')
    const data = await res.json() as Awaited<ReturnType<typeof client.layout.get>>['data']

    return {
      queryClient,
      ...data
    }
  } catch {
    return {
      queryClient,

      user: null,
      session: null,
      organizations: [],
      activeOrg: null
    }
  }
}
