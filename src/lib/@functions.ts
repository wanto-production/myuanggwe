import { invalidateAll } from "$app/navigation";
import { QueryClient } from "@tanstack/svelte-query";


export async function invalidateFn(queryClient: QueryClient) {

  await Promise.all([
    invalidateAll(),
    queryClient.refetchQueries({ queryKey: ['dashboard'] }),
    queryClient.refetchQueries({ queryKey: ['category'] }),
    queryClient.refetchQueries({ queryKey: ['transactions'] }),
    queryClient.refetchQueries({ queryKey: ['wallets'] }),
  ])
} 
