import React, { useState, useEffect } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useAuth } from '../../context/AuthContext';
import { Transaction, TransactionType, RecurrenceInterval } from '../../types/budget';
import { X, Calendar, FileText, Check, Repeat, Plus, Clock } from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { triggerHaptic } from '../../services/storage';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTx?: Transaction | null;
  defaultType?: TransactionType;
  defaultDate?: string;
  onOpenCategoryManager?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  editTx,
  defaultType = 'expense',
  defaultDate,
  onOpenCategoryManager,
}) => {
  const { categories, addTransaction, updateTransaction, formatCurrency } = useBudget();
  const { currentUser } = useAuth();

  const getLocalDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = (): string => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState(getLocalTimeString());
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurrenceInterval>('monthly');

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (editTx) {
      setType(editTx.type);
      setAmountStr(editTx.amount.toString());
      setCategoryId(editTx.categoryId);
      setDate(editTx.date);
      setTime(editTx.time || getLocalTimeString());
      setNote(editTx.note || '');
      setIsRecurring(Boolean(editTx.isRecurring));
      setRecurringInterval(editTx.recurringInterval || 'monthly');
    } else {
      setType(defaultType);
      setAmountStr('');
      setDate(defaultDate || getLocalDateString());
      setTime(getLocalTimeString());
      setNote('');
      setIsRecurring(false);
      setRecurringInterval('monthly');
      const firstCat = categories.find((c) => c.type === defaultType);
      if (firstCat) setCategoryId(firstCat.id);
    }
  }, [editTx, defaultType, defaultDate, categories, isOpen]);

  // Sync category when type flips
  useEffect(() => {
    if (!editTx) {
      const match = categories.find((c) => c.type === type);
      if (match) setCategoryId(match.id);
    }
  }, [type, categories, editTx]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    if (!categoryId) return;

    const finalDate = date || getLocalDateString();
    const finalTime = time || getLocalTimeString();

    if (editTx) {
      updateTransaction({
        ...editTx,
        type,
        amount,
        categoryId,
        date: finalDate,
        time: finalTime,
        note: note.trim(),
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
    } else {
      addTransaction({
        type,
        amount,
        categoryId,
        date: finalDate,
        time: finalTime,
        note: note.trim(),
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
    }

    onClose();
  };

  const handleQuickAddAmount = (add: number) => {
    triggerHaptic('light');
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + add).toString());
  };

  const currencySymbol = currentUser?.currency.symbol || '$';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* iOS Drag Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <h3 className="text-base font-semibold text-white">
            {editTx ? 'Edit Transaction' : 'Record Transaction'}
          </h3>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* iOS Segmented Control (Expense vs Income) */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('expense');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('income');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          {/* Large Amount Display */}
          <div className="flex flex-col items-center justify-center py-2">
            <span className="text-xs text-slate-400 mb-1">Amount</span>
            <div className="flex items-center text-4xl sm:text-5xl font-bold tracking-tight text-white">
              <span className="text-slate-400 mr-1 text-3xl">{currencySymbol}</span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-48 text-center bg-transparent focus:outline-none placeholder:text-slate-600 font-bold"
              />
            </div>

            {/* Quick chips */}
            <div className="flex gap-2 mt-3">
              {[5, 10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 ios-touch-active"
                >
                  +{currencySymbol}{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">Category</label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenCategoryManager();
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom Category</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {availableCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCategoryId(cat.id);
                    }}
                    className={`flex flex-col items-center text-center p-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-white/40 ring-2 ring-emerald-500 shadow-md scale-[1.02]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white mb-1.5 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={18} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-200 line-clamp-1">
                      {cat.name}
                    </span>
                  </button>
                );
              })}

              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenCategoryManager();
                  }}
                  className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl border border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/40 text-slate-400 hover:text-white transition"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800 text-slate-400 mb-1.5">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium">New...</span>
                </button>
              )}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Date</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Time</label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Note / Memo</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Lunch with team, monthly gym pass, groceries..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Recurring Option */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">Recurring Bill or Income</p>
                <p className="text-[11px] text-slate-400">Repeats automatically</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRecurring && (
                <select
                  value={recurringInterval}
                  onChange={(e) => setRecurringInterval(e.target.value as RecurrenceInterval)}
                  className="bg-slate-800 text-xs text-white rounded-lg px-2 py-1 border border-slate-700"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 ios-touch-active"
          >
            <Check className="w-4 h-4" />
            <span>{editTx ? 'Save Changes' : 'Record Transaction'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
