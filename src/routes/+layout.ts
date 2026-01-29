import { QueryClient } from '@tanstack/svelte-query'
import { browser } from '$app/environment'

export const load = ({ data }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  return {
    ...data,
    queryClient
  }
}
