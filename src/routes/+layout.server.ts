import { client } from '$lib/eden.js';

export const load = async ({ depends, fetch }) => {
  depends("layout:data")
  const res = await fetch('/api/layout')
  const data = await res.json() as Awaited<ReturnType<typeof client.layout.get>>['data']

  return data;
}
