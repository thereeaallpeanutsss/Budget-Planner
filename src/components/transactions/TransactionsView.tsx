import React, { useState, useMemo } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useAuth } from '../../context/AuthContext';
import { Transaction, TransactionType } from '../../types/budget';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { exportTransactionsToCSV, triggerHaptic } from '../../services/storage';

interface TransactionsViewProps {
  onEditTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onEditTransaction,
  onOpenAddModal,
}) => {
  const { userData } = useAuth();
  const { transactions, categories, formatCurrency, deleteTransaction } = useBudget();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Extract available months from existing transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.substring(0, 7));
      }
    }
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Category match
      if (selectedCat !== 'all' && tx.categoryId !== selectedCat) return false;

      // Month match
      if (monthFilter !== 'all' && !tx.date.startsWith(monthFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const catName = catMap.get(tx.categoryId)?.name.toLowerCase() || '';
        const note = (tx.note || '').toLowerCase();
        if (!catName.includes(query) && !note.includes(query)) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, selectedCat, monthFilter, searchQuery, catMap]);

  // Totals for filtered set
  const filteredTotals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of filtered) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return { inc, exp, net: inc - exp };
  }, [filtered]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};
    for (const tx of filtered) {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleExportCSV = () => {
    if (userData) {
      triggerHaptic('success');
      exportTransactionsToCSV(userData);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-400">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'} found
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          title="Export CSV for Excel/Numbers"
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl ios-touch-active font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions by note or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Filter */}
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            {(['all', 'expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  triggerHaptic('light');
                  setTypeFilter(t);
                }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  typeFilter === t
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Month Selector */}
          {availableMonths.length > 0 && (
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Category Selector */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtered Summary Card */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-slate-400">Total In:</span>{' '}
            <span className="text-white font-bold">{formatCurrency(filteredTotals.inc)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          <div>
            <span className="text-slate-400">Total Out:</span>{' '}
            <span className="text-white font-bold">{formatCurrency(filteredTotals.exp)}</span>
          </div>
        </div>
      </div>

      {/* Grouped Transaction List */}
      {groupedByDate.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or add a new entry.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md"
          >
            Log Transaction
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateStr, items]) => {
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const dateObj = new Date(dateStr);
            const dateLabel = isToday
              ? 'Today'
              : dateObj.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-medium text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dateLabel}</span>
                  <span className="text-[10px] text-slate-600">({items.length})</span>
                </div>

                <div className="space-y-1.5">
                  {items.map((tx) => {
                    const cat = catMap.get(tx.categoryId);
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: cat?.color || '#64748b' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white truncate">
                                {cat?.name || 'General'}
                              </span>
                              {tx.time && (
                                <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-mono border border-slate-800">
                                  <Clock className="w-2.5 h-2.5 text-slate-500" />
                                  <span>{tx.time}</span>
                                </span>
                              )}
                              {tx.isRecurring && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                                  Recurring
                                </span>
                              )}
                            </div>
                            {tx.note && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {tx.note}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3 pl-3 shrink-0">
                          <div
                            className={`text-sm font-bold ${
                              isIncome ? 'text-emerald-400' : 'text-slate-100'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </div>

                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
