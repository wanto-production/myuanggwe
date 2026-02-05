import { client } from "$lib/eden";

export const load = async ({ depends, fetch }) => {
  depends('dashboard:data')
  try {
    const res = await fetch('/api/dashboard')
    const data = await res.json() as Awaited<ReturnType<typeof client.dashboard.get>>['data']

    return data
  } catch (error) {
    console.error('Dashboard load error:', error);
    return {
      walletList: [],
      totalBalance: 0,
      walletCount: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      recentTransactions: []
    };
  }
};
