import React from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Calendar,
  Sparkles,
  BarChart2,
  PieChart,
  ArrowRight,
  ShieldCheck,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { MonthlySpendingSummary } from '../../types/budget';
import { CategoryIcon } from '../common/CategoryIcon';
import { triggerHaptic } from '../../services/storage';

interface MonthlyReportModalProps {
  summary: MonthlySpendingSummary | null;
  onClose: () => void;
  currencySymbol?: string;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  summary,
  onClose,
  currencySymbol = '$',
}) => {
  if (!summary) return null;

  const {
    monthName,
    reportGeneratedDate,
    totalExpense,
    totalIncome,
    netSavings,
    savingsRate,
    dailyAverageSpend,
    priorMonthComparison,
    categoryBreakdown,
    dailyTrend,
    insights,
    isDemoSummary,
  } = summary;

  const isExpenseDecreased = priorMonthComparison.expenseDiff < 0;
  const isSavingsIncreased = priorMonthComparison.savingsDiff >= 0;

  // Max daily spend for scaling the 30-day histogram
  const maxDaySpend = Math.max(1, ...dailyTrend.map((d) => d.amount));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in overscroll-contain select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[88vh] flex flex-col select-none overscroll-contain my-auto"
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
      >
        {/* Mobile iOS Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-700/80 mx-auto mt-3.5 mb-1 shrink-0 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-2 pb-4 sm:py-5 border-b border-slate-800/80 bg-slate-950/40 select-none">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-sm shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {monthName} Spending Report
                </h2>
                {isDemoSummary && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Preview
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Generated for 1st of month ({reportGeneratedDate})</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            draggable={false}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Report Content - comfortably spaced, strictly scrollable */}
        <div
          className="px-4 sm:px-6 py-5 sm:py-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 no-scrollbar modal-scrollable touch-pan-y overscroll-contain"
          onDragStart={(e) => e.preventDefault()}
        >
          {/* Key KPI Hero Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* Total Spent */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Total Spent</span>
              <div className="text-base sm:text-lg font-bold text-white truncate">
                {currencySymbol}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                {isExpenseDecreased ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 font-semibold">
                    <TrendingDown className="w-3 h-3" />
                    {Math.abs(priorMonthComparison.expenseChangePercent)}%
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-0.5 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    +{priorMonthComparison.expenseChangePercent}%
                  </span>
                )}
                <span className="text-slate-500 text-[10px]">vs prior mo.</span>
              </div>
            </div>

            {/* Total Income */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Total Income</span>
              <div className="text-base sm:text-lg font-bold text-emerald-400 truncate">
                {currencySymbol}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {summary.transactionCount} records
              </span>
            </div>

            {/* Net Saved */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Net Saved</span>
              <div className="text-base sm:text-lg font-bold text-teal-300 truncate">
                {currencySymbol}{netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-emerald-400 font-semibold">{savingsRate}%</span>
                <span className="text-slate-500 text-[10px]">savings rate</span>
              </div>
            </div>

            {/* Daily Average */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-[11px] text-slate-400 font-medium">Daily Average</span>
              <div className="text-base sm:text-lg font-bold text-white truncate">
                {currencySymbol}{dailyAverageSpend.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500 block">per day spend</span>
            </div>
          </div>

          {/* Month-over-Month Comparison Breakdown */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Month-over-Month Comparison ({monthName} vs {priorMonthComparison.priorMonthName})
              </h3>
            </div>

            {/* Comparative visual bars */}
            <div className="space-y-3">
              {/* Expenses comparison */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Monthly Outflow (Expenses)</span>
                  <div className="text-right">
                    <span className="text-white font-bold mr-2">{currencySymbol}{totalExpense.toFixed(2)}</span>
                    <span className="text-slate-400 text-[11px]">was {currencySymbol}{priorMonthComparison.priorTotalExpense.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 h-2.5 rounded-full overflow-hidden bg-slate-900 p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${Math.min(100, (totalExpense / Math.max(totalExpense, priorMonthComparison.priorTotalExpense)) * 100)}%` }}
                  />
                  <div
                    className="h-full rounded-full bg-slate-600"
                    style={{ width: `${Math.min(100, (priorMonthComparison.priorTotalExpense / Math.max(totalExpense, priorMonthComparison.priorTotalExpense)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Net savings comparison */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Net Retained (Savings)</span>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold mr-2">{currencySymbol}{netSavings.toFixed(2)}</span>
                    <span className="text-slate-400 text-[11px]">was {currencySymbol}{priorMonthComparison.priorNetSavings.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 h-2.5 rounded-full overflow-hidden bg-slate-900 p-0.5 border border-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (Math.max(0, netSavings) / Math.max(1, Math.max(netSavings, priorMonthComparison.priorNetSavings))) * 100)}%` }}
                  />
                  <div
                    className="h-full rounded-full bg-slate-600"
                    style={{ width: `${Math.min(100, (Math.max(0, priorMonthComparison.priorNetSavings) / Math.max(1, Math.max(netSavings, priorMonthComparison.priorNetSavings))) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
              <span>Overall Monthly Variance</span>
              <span className={`font-semibold flex items-center gap-1 ${isExpenseDecreased ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isExpenseDecreased ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    Saved {currencySymbol}{Math.abs(priorMonthComparison.expenseDiff).toFixed(2)} more ({Math.abs(priorMonthComparison.expenseChangePercent)}% drop in costs)
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    Spent {currencySymbol}{priorMonthComparison.expenseDiff.toFixed(2)} more (+{priorMonthComparison.expenseChangePercent}%)
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Statistical Tool: Category Breakdown Table */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                Category Spending Breakdown & Statistical Shifts
              </h3>
              <span className="text-[11px] text-slate-400">{categoryBreakdown.length} categories</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2.5 font-medium">Category</th>
                    <th className="pb-2.5 font-medium text-right">{monthName.split(' ')[0]}</th>
                    <th className="pb-2.5 font-medium text-right">Share</th>
                    <th className="pb-2.5 font-medium text-right">{priorMonthComparison.priorMonthName.split(' ')[0]}</th>
                    <th className="pb-2.5 font-medium text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {categoryBreakdown.map((item) => {
                    const isDown = item.changePercent < 0;
                    const isZero = item.changePercent === 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: item.color }}
                            >
                              <CategoryIcon name={item.icon} size={14} />
                            </div>
                            <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-none">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-bold text-white">
                          {currencySymbol}{item.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right text-slate-400 font-medium">
                          {item.percentage}%
                        </td>
                        <td className="py-2.5 text-right text-slate-400">
                          {currencySymbol}{item.priorAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-semibold">
                          {isZero ? (
                            <span className="text-slate-500">0.0%</span>
                          ) : isDown ? (
                            <span className="text-emerald-400">{item.changePercent}%</span>
                          ) : (
                            <span className="text-rose-400">+{item.changePercent}%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistical Tool: 30-Day Daily Spending Histogram */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Daily Spending Timeline (Day 1 - {dailyTrend.length})
              </h3>
              <span className="text-[11px] text-slate-400">Peak: {currencySymbol}{maxDaySpend.toFixed(2)}</span>
            </div>

            <div className="flex items-end justify-between h-32 pt-4 gap-1 overflow-x-auto no-scrollbar">
              {dailyTrend.map((d) => {
                const heightPct = maxDaySpend > 0 ? (d.amount / maxDaySpend) * 100 : 0;
                return (
                  <div
                    key={d.day}
                    className="flex-1 min-w-[7px] flex flex-col items-center gap-1 group cursor-pointer"
                    title={`Day ${d.day}: ${currencySymbol}${d.amount.toFixed(2)}`}
                  >
                    <div className="w-full flex items-end justify-center h-24 bg-slate-900 rounded-sm p-0.5">
                      <div
                        className="w-full bg-emerald-500 group-hover:bg-emerald-400 rounded-xs transition-all duration-300"
                        style={{
                          height: `${Math.max(6, heightPct)}%`,
                          opacity: d.amount > 0 ? 1 : 0.2,
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-500 group-hover:text-white">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Insights & Takeaways */}
          <div className="p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
            <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Automated Financial Insights
            </h3>
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Saved in Calendar on 1st of each month</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium ios-touch-active"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
