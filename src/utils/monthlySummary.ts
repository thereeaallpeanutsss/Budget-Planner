import { Transaction, Category, MonthlySpendingSummary, MonthlyCategoryStats } from '../types/budget';

// Formatting helper for month titles
export function formatMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// Imaginary September 2026 Report (available on October 1st)
export function getImaginarySeptemberSummary(): MonthlySpendingSummary {
  const dailyTrend = [
    { day: 1, amount: 1245.0 }, // Rent + groceries
    { day: 2, amount: 28.5 },
    { day: 3, amount: 42.0 },
    { day: 4, amount: 65.2 },
    { day: 5, amount: 110.0 },
    { day: 6, amount: 35.4 },
    { day: 7, amount: 18.0 },
    { day: 8, amount: 54.0 },
    { day: 9, amount: 31.5 },
    { day: 10, amount: 88.0 },
    { day: 11, amount: 72.0 },
    { day: 12, amount: 124.5 },
    { day: 13, amount: 45.0 },
    { day: 14, amount: 22.0 },
    { day: 15, amount: 168.0 }, // Mid-month groceries & utilities
    { day: 16, amount: 19.5 },
    { day: 17, amount: 38.0 },
    { day: 18, amount: 62.0 },
    { day: 19, amount: 94.0 },
    { day: 20, amount: 45.0 },
    { day: 21, amount: 14.5 },
    { day: 22, amount: 32.0 },
    { day: 23, amount: 58.0 },
    { day: 24, amount: 79.9 },
    { day: 25, amount: 115.0 },
    { day: 26, amount: 42.5 },
    { day: 27, amount: 24.0 },
    { day: 28, amount: 36.5 },
    { day: 29, amount: 51.0 },
    { day: 30, amount: 31.0 },
  ];

  const categoryBreakdown: MonthlyCategoryStats[] = [
    {
      id: 'cat_housing',
      name: 'Housing & Rent',
      icon: 'Home',
      color: '#6366f1',
      amount: 1200.0,
      percentage: 42.2,
      priorAmount: 1200.0,
      changePercent: 0.0,
    },
    {
      id: 'cat_groceries',
      name: 'Groceries & Supplies',
      icon: 'ShoppingCart',
      color: '#10b981',
      amount: 620.0,
      percentage: 21.8,
      priorAmount: 590.0,
      changePercent: 5.1,
    },
    {
      id: 'cat_dining',
      name: 'Food & Dining Out',
      icon: 'Utensils',
      color: '#f97316',
      amount: 310.0,
      percentage: 10.9,
      priorAmount: 425.0,
      changePercent: -27.1,
    },
    {
      id: 'cat_shopping',
      name: 'Shopping & Apparel',
      icon: 'ShoppingBag',
      color: '#8b5cf6',
      amount: 195.0,
      percentage: 6.8,
      priorAmount: 280.0,
      changePercent: -30.4,
    },
    {
      id: 'cat_utilities',
      name: 'Bills & Utilities',
      icon: 'Zap',
      color: '#eab308',
      amount: 178.5,
      percentage: 6.3,
      priorAmount: 210.0,
      changePercent: -15.0,
    },
    {
      id: 'cat_transport',
      name: 'Transport & Fuel',
      icon: 'Car',
      color: '#3b82f6',
      amount: 145.0,
      percentage: 5.1,
      priorAmount: 180.0,
      changePercent: -19.4,
    },
    {
      id: 'cat_entertainment',
      name: 'Entertainment & Media',
      icon: 'Film',
      color: '#ec4899',
      amount: 122.0,
      percentage: 4.3,
      priorAmount: 145.0,
      changePercent: -15.9,
    },
    {
      id: 'cat_health',
      name: 'Health & Fitness',
      icon: 'HeartPulse',
      color: '#ef4444',
      amount: 75.0,
      percentage: 2.6,
      priorAmount: 90.0,
      changePercent: -16.7,
    },
  ];

  return {
    month: '2026-09',
    monthName: 'September 2026',
    reportGeneratedDate: '2026-10-01',
    totalExpense: 2845.5,
    totalIncome: 4200.0,
    netSavings: 1354.5,
    savingsRate: 32,
    dailyAverageSpend: 94.85,
    transactionCount: 38,
    topCategory: {
      name: 'Housing & Rent',
      icon: 'Home',
      color: '#6366f1',
      amount: 1200.0,
      percentage: 42.2,
    },
    priorMonthComparison: {
      priorMonth: '2026-08',
      priorMonthName: 'August 2026',
      priorTotalExpense: 3120.0,
      priorTotalIncome: 4000.0,
      priorNetSavings: 880.0,
      expenseDiff: -274.5,
      expenseChangePercent: -8.8,
      savingsDiff: 474.5,
    },
    categoryBreakdown,
    dailyTrend,
    insights: [
      'You reduced total monthly spending by 8.8% compared to August (saved $274.50 more).',
      'Dining out dropped significantly by 27.1%, cutting $115 in discretionary expenses.',
      'Your net savings rate reached 32%, far surpassing the recommended 20% financial wellness benchmark.',
      'Shopping spending decreased by 30.4% from $280 to $195.',
      'Housing accounted for the largest fixed expense ($1,200), followed by Groceries ($620).',
    ],
    isDemoSummary: true,
  };
}

// Get or compute monthly summary for any month YYYY-MM
export function getMonthlySummaryForMonth(
  targetYearMonth: string,
  transactions: Transaction[],
  categories: Category[]
): MonthlySpendingSummary {
  // If target is September 2026 and user has few or no September records, use the rich demo summary
  const targetTxs = transactions.filter((t) => t.date.startsWith(targetYearMonth));
  if (targetYearMonth === '2026-09' && targetTxs.length < 5) {
    return getImaginarySeptemberSummary();
  }

  const [year, month] = targetYearMonth.split('-').map(Number);
  const targetDate = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Next month first day = report generated date
  const nextMonthDate = new Date(year, month, 1);
  const reportGeneratedDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

  // Prior month
  const priorDate = new Date(year, month - 2, 1);
  const priorYearMonth = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;
  const priorTxs = transactions.filter((t) => t.date.startsWith(priorYearMonth));

  const catMap = new Map(categories.map((c) => [c.id, c]));

  // Current month totals
  let totalExpense = 0;
  let totalIncome = 0;
  const catSpendMap = new Map<string, number>();
  const dailyMap = new Map<number, number>();

  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(d, 0);
  }

  for (const t of targetTxs) {
    if (t.type === 'expense') {
      totalExpense += t.amount;
      catSpendMap.set(t.categoryId, (catSpendMap.get(t.categoryId) || 0) + t.amount);
      const dayNum = parseInt(t.date.split('-')[2], 10);
      dailyMap.set(dayNum, (dailyMap.get(dayNum) || 0) + t.amount);
    } else {
      totalIncome += t.amount;
    }
  }

  // Prior month totals
  let priorTotalExpense = 0;
  let priorTotalIncome = 0;
  const priorCatSpendMap = new Map<string, number>();

  for (const t of priorTxs) {
    if (t.type === 'expense') {
      priorTotalExpense += t.amount;
      priorCatSpendMap.set(t.categoryId, (priorCatSpendMap.get(t.categoryId) || 0) + t.amount);
    } else {
      priorTotalIncome += t.amount;
    }
  }

  // If prior month had no records (e.g. October vs September where September was imaginary), estimate sensible baseline
  if (priorTotalExpense === 0 && targetYearMonth === '2026-10') {
    priorTotalExpense = 2845.5;
    priorTotalIncome = 4200.0;
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const priorNetSavings = priorTotalIncome - priorTotalExpense;
  const expenseDiff = totalExpense - priorTotalExpense;
  const expenseChangePercent =
    priorTotalExpense > 0 ? Math.round(((totalExpense - priorTotalExpense) / priorTotalExpense) * 1000) / 10 : 0;
  const savingsDiff = netSavings - priorNetSavings;
  const dailyAverageSpend = daysInMonth > 0 ? Math.round((totalExpense / daysInMonth) * 100) / 100 : 0;

  // Category breakdown
  const categoryBreakdown: MonthlyCategoryStats[] = Array.from(catSpendMap.entries()).map(([catId, amount]) => {
    const cat = catMap.get(catId);
    const priorAmt = priorCatSpendMap.get(catId) || 0;
    const changePercent = priorAmt > 0 ? Math.round(((amount - priorAmt) / priorAmt) * 1000) / 10 : 0;
    const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0;

    return {
      id: catId,
      name: cat?.name || 'Uncategorized',
      icon: cat?.icon || 'Tag',
      color: cat?.color || '#64748b',
      amount,
      percentage,
      priorAmount: priorAmt,
      changePercent,
    };
  }).sort((a, b) => b.amount - a.amount);

  const topCategory = categoryBreakdown[0]
    ? {
        name: categoryBreakdown[0].name,
        icon: categoryBreakdown[0].icon,
        color: categoryBreakdown[0].color,
        amount: categoryBreakdown[0].amount,
        percentage: categoryBreakdown[0].percentage,
      }
    : undefined;

  const dailyTrend = Array.from(dailyMap.entries()).map(([day, amount]) => ({
    day,
    amount,
  }));

  // Dynamic insights
  const insights: string[] = [];
  if (expenseDiff < 0) {
    insights.push(
      `You spent ${Math.abs(expenseChangePercent)}% less compared to ${formatMonthName(priorYearMonth)} (saved $${Math.abs(expenseDiff).toFixed(2)}).`
    );
  } else if (expenseDiff > 0) {
    insights.push(
      `Total expenses increased by ${expenseChangePercent}% compared to ${formatMonthName(priorYearMonth)} (+$${expenseDiff.toFixed(2)}).`
    );
  } else {
    insights.push(`Your spending remained steady compared to ${formatMonthName(priorYearMonth)}.`);
  }

  if (topCategory) {
    insights.push(
      `Your largest spending category was ${topCategory.name} totaling $${topCategory.amount.toFixed(2)} (${topCategory.percentage}% of all expenses).`
    );
  }

  if (savingsRate >= 20) {
    insights.push(`Strong savings rate of ${savingsRate}% achieved, comfortably surpassing the 20% benchmark.`);
  } else if (totalIncome > 0) {
    insights.push(`Savings rate was ${savingsRate}%. Consider tuning discretionary categories next month.`);
  }

  return {
    month: targetYearMonth,
    monthName: formatMonthName(targetYearMonth),
    reportGeneratedDate,
    totalExpense,
    totalIncome,
    netSavings,
    savingsRate,
    dailyAverageSpend,
    transactionCount: targetTxs.length,
    topCategory,
    priorMonthComparison: {
      priorMonth: priorYearMonth,
      priorMonthName: formatMonthName(priorYearMonth),
      priorTotalExpense,
      priorTotalIncome,
      priorNetSavings,
      expenseDiff,
      expenseChangePercent,
      savingsDiff,
    },
    categoryBreakdown,
    dailyTrend,
    insights,
    isDemoSummary: false,
  };
}

// Check if a calendar date is the 1st of any month, which stores the summary of the prior month
export function getPriorMonthForDate(dateStr: string): string | null {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (day !== 1) return null;

  // The month prior to dateStr
  const prior = new Date(year, month - 2, 1);
  return `${prior.getFullYear()}-${String(prior.getMonth() + 1).padStart(2, '0')}`;
}
