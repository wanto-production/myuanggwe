import { QueryClient } from "@tanstack/svelte-query";

export async function invalidateFn(queryClient: QueryClient) {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    await queryClient.invalidateQueries({ queryKey: ['category'] })
    await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    await queryClient.invalidateQueries({ queryKey: ['wallets'] })
} 
