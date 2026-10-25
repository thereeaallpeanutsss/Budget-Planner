import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  Sparkles,
  Layers,
  X,
  Plus,
} from 'lucide-react';
import { Transaction, Category, MonthlySpendingSummary } from '../../types/budget';
import { CategoryIcon } from '../common/CategoryIcon';
import { triggerHaptic } from '../../services/storage';
import { getMonthlySummaryForMonth, getPriorMonthForDate, formatMonthName } from '../../utils/monthlySummary';

interface CalendarSpendingViewProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol?: string;
  onOpenReport: (summary: MonthlySpendingSummary) => void;
  onOpenAddTransaction?: (date?: string) => void;
}

export const CalendarSpendingView: React.FC<CalendarSpendingViewProps> = ({
  transactions,
  categories,
  currencySymbol = '$',
  onOpenReport,
  onOpenAddTransaction,
}) => {
  // Calendar active month state (defaults to current date, e.g. October 2026)
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(), // 0-indexed (9 = Oct)
    };
  });

  const getLocalTodayDate = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Selected date for expanded view
  const [selectedDate, setSelectedDate] = useState<string | null>(() => getLocalTodayDate());

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Month navigation
  const handlePrevMonth = () => {
    triggerHaptic('light');
    setCurrentYearMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    setCurrentYearMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleJumpToday = () => {
    triggerHaptic('light');
    const now = new Date();
    setCurrentYearMonth({
      year: now.getFullYear(),
      month: now.getMonth(),
    });
    setSelectedDate(getLocalTodayDate());
  };

  // Compute days in month and starting day of week
  const monthData = useMemo(() => {
    const { year, month } = currentYearMonth;
    const firstDayDate = new Date(year, month, 1);
    const lastDayDate = new Date(year, month + 1, 0);

    const totalDays = lastDayDate.getDate();
    // Week starts with Monday (0) and ends with Sunday (6)
    // firstDayDate.getDay() gives 0 for Sunday, 1 for Monday, etc.
    const startDayOfWeek = (firstDayDate.getDay() + 6) % 7;

    const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthDisplayName = firstDayDate.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });

    return {
      year,
      month,
      monthString,
      monthDisplayName,
      totalDays,
      startDayOfWeek,
    };
  }, [currentYearMonth]);

  // Aggregate transactions by date for this month
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, { transactions: Transaction[]; totalExpense: number; totalIncome: number }>();

    for (const tx of transactions) {
      if (!map.has(tx.date)) {
        map.set(tx.date, { transactions: [], totalExpense: 0, totalIncome: 0 });
      }
      const entry = map.get(tx.date)!;
      entry.transactions.push(tx);
      if (tx.type === 'expense') {
        entry.totalExpense += tx.amount;
      } else {
        entry.totalIncome += tx.amount;
      }
    }

    return map;
  }, [transactions]);

  // Selected date transactions
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    const entry = transactionsByDate.get(selectedDate);
    const dateObj = new Date(`${selectedDate}T00:00:00`);

    const formattedDate = dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const isFirstOfMonth = selectedDate.endsWith('-01');
    const priorMonthStr = isFirstOfMonth ? getPriorMonthForDate(selectedDate) : null;

    return {
      date: selectedDate,
      formattedDate,
      transactions: entry?.transactions || [],
      totalExpense: entry?.totalExpense || 0,
      totalIncome: entry?.totalIncome || 0,
      isFirstOfMonth,
      priorMonthStr,
    };
  }, [selectedDate, transactionsByDate]);

  // Check if today matches a day in calendar
  const todayStr = useMemo(() => getLocalTodayDate(), []);

  const handleOpenDay1Report = (dayDateStr: string) => {
    triggerHaptic('success');
    const priorMonth = getPriorMonthForDate(dayDateStr);
    if (priorMonth) {
      const summary = getMonthlySummaryForMonth(priorMonth, transactions, categories);
      onOpenReport(summary);
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-slate-800">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Spending Calendar & Daily Timeline
              </h2>
              <p className="text-xs text-slate-400">
                Tap any day to view timestamps and accurate local transaction history
              </p>
            </div>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleJumpToday}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-white px-3 min-w-[130px] text-center">
              {monthData.monthDisplayName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Report Banner (if viewing 1st day of month or October with imaginary September) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">
              1st of Month Summary Archive
            </h4>
            <p className="text-[11px] text-slate-400">
              Monthly spending reports are auto-compiled on Day 1 of each month
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const priorMonth = getPriorMonthForDate(`${monthData.monthString}-01`);
            if (priorMonth) {
              const summary = getMonthlySummaryForMonth(priorMonth, transactions, categories);
              onOpenReport(summary);
            }
          }}
          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-xl shadow-md ios-touch-active shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>View Report</span>
        </button>
      </div>

      {/* Calendar Grid Container */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        {/* Day-of-week header: Monday to Sunday */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-semibold text-slate-400 pb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty spacer cells before start day */}
          {Array.from({ length: monthData.startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[56px] sm:min-h-[74px] rounded-2xl bg-slate-950/20 border border-transparent opacity-40 pointer-events-none" />
          ))}

          {/* Actual days of month */}
          {Array.from({ length: monthData.totalDays }).map((_, index) => {
            const dayNum = index + 1;
            const dayDateStr = `${monthData.monthString}-${String(dayNum).padStart(2, '0')}`;
            const dayData = transactionsByDate.get(dayDateStr);
            const isSelected = selectedDate === dayDateStr;
            const isToday = todayStr === dayDateStr;
            const isDay1 = dayNum === 1;

            const hasExpense = (dayData?.totalExpense || 0) > 0;
            const hasIncome = (dayData?.totalIncome || 0) > 0;

            return (
              <div
                key={dayDateStr}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDate(dayDateStr);
                }}
                className={`relative min-h-[58px] sm:min-h-[78px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg scale-[1.02] z-10'
                    : isToday
                    ? 'bg-slate-800/80 border-slate-600 hover:border-slate-500'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                {/* Day Number and Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : isSelected
                        ? 'text-emerald-300 font-extrabold'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Day 1 Report Icon Badge */}
                  {isDay1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDay1Report(dayDateStr);
                      }}
                      title="View Previous Month Report"
                      className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center hover:scale-110 transition shrink-0"
                    >
                      <Award className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Spending Amount or Activity indicator */}
                <div className="mt-1 space-y-0.5">
                  {hasExpense && (
                    <div className="text-[10px] sm:text-xs font-bold text-rose-300 truncate">
                      -{currencySymbol}{dayData!.totalExpense.toFixed(0)}
                    </div>
                  )}

                  {hasIncome && !hasExpense && (
                    <div className="text-[10px] sm:text-xs font-bold text-emerald-400 truncate">
                      +{currencySymbol}{dayData!.totalIncome.toFixed(0)}
                    </div>
                  )}

                  {/* Dot indicators if multiple */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded View for Selected Day */}
      {selectedDayData && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-fade-in">
          {/* Header of selected day */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                Daily Breakdown
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                {selectedDayData.formattedDate}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddTransaction && (
                <button
                  onClick={() => onOpenAddTransaction(selectedDayData.date)}
                  className="flex items-center gap-1.5 text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-medium ios-touch-active"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log on this day</span>
                </button>
              )}
            </div>
          </div>

          {/* Day 1 Highlight Banner if selected date is 1st of month */}
          {selectedDayData.isFirstOfMonth && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Day 1 Milestone: {formatMonthName(selectedDayData.priorMonthStr || '')} Summary Archived Here
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Full comparative statistics, breakdown tables, and velocity trends for last month.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenDay1Report(selectedDayData.date)}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-xl shadow-md ios-touch-active shrink-0"
              >
                Open Report
              </button>
            </div>
          )}

          {/* Daily Net Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> Outflow
              </span>
              <div className="text-base font-bold text-white mt-0.5">
                {currencySymbol}{selectedDayData.totalExpense.toFixed(2)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Inflow
              </span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {currencySymbol}{selectedDayData.totalIncome.toFixed(2)}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400">Records</span>
              <div className="text-base font-bold text-white mt-0.5">
                {selectedDayData.transactions.length} items
              </div>
            </div>
          </div>

          {/* Transaction items on this day */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-300">
              Activity Timeline (Accurate Local Timestamps)
            </span>

            {selectedDayData.transactions.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-500">
                No transactions recorded on this date.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayData.transactions.map((tx) => {
                  const cat = catMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: cat?.color || '#64748b' }}
                        >
                          <CategoryIcon name={cat?.icon || 'Tag'} size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white truncate">
                              {cat?.name || 'General'}
                            </span>
                            {/* Accurate Local Time Badge */}
                            <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5 text-slate-500" />
                              <span>{tx.time || '12:00'}</span>
                            </span>
                          </div>
                          {tx.note && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {tx.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span
                          className={`text-sm font-bold ${
                            isIncome ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {currencySymbol}{tx.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
