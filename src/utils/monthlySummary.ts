import { Transaction, Category, MonthlySpendingSummary, MonthlyCategoryStats } from '../types/budget';

// Formatting helper for month titles
export function formatMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// Get or compute monthly summary for any month YYYY-MM based strictly on user data
export function getMonthlySummaryForMonth(
  targetYearMonth: string,
  transactions: Transaction[],
  categories: Category[]
): MonthlySpendingSummary {
  const targetTxs = transactions.filter((t) => t.date.startsWith(targetYearMonth));

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
