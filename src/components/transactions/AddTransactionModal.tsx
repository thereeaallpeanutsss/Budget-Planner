import React, { useState, useEffect } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useAuth } from '../../context/AuthContext';
import { Transaction, TransactionType, RecurrenceInterval } from '../../types/budget';
import {
  X,
  Calendar,
  FileText,
  Check,
  Repeat,
  Plus,
  Clock,
  Keyboard,
  Delete,
  CornerDownLeft,
  AlertCircle,
} from 'lucide-react';
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
  const { categories, addTransaction, updateTransaction } = useBudget();
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

  // Keypad & validation state
  const [showKeypad, setShowKeypad] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter categories by type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      // If a physical keyboard/fine pointer is connected (desktop/laptop),
      // digital on-screen keyboard should not appear by default.
      // If mobile/touch device, show digital keypad for easy entry.
      const hasPhysicalKeyboard =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(pointer: fine)').matches;
      setShowKeypad(!hasPhysicalKeyboard);

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
        else setCategoryId('');
      }
    }
  }, [editTx, defaultType, defaultDate, categories, isOpen]);

  // Sync category when type flips
  useEffect(() => {
    if (!editTx) {
      const match = categories.find((c) => c.type === type);
      if (match) {
        setCategoryId(match.id);
      } else {
        setCategoryId('');
      }
    }
  }, [type, categories, editTx]);

  if (!isOpen) return null;

  const formatDecimalAmount = (val: string): string => {
    if (!val) return val;
    if (val.includes('.')) {
      const parts = val.split('.');
      const intPart = parts[0] === '' ? '0' : parts[0];
      const decPart = parts[1] || '';
      if (decPart.length === 0) {
        return `${intPart}.00`;
      } else if (decPart.length === 1) {
        return `${intPart}.${decPart}0`;
      } else {
        return `${intPart}.${decPart.slice(0, 2)}`;
      }
    }
    return val;
  };

  const handleKeypadPress = (key: string) => {
    triggerHaptic('light');
    setFormError(null);

    if (key === 'backspace') {
      setAmountStr((prev) => prev.slice(0, -1));
    } else if (key === 'clear') {
      setAmountStr('');
    } else if (key === '.') {
      if (!amountStr) {
        setAmountStr('0.');
      } else if (!amountStr.includes('.')) {
        setAmountStr((prev) => prev + '.');
      }
    } else if (key === 'enter') {
      setAmountStr((prev) => formatDecimalAmount(prev));
      setShowKeypad(false);
    } else {
      // Numbers 0-9
      if (amountStr === '0') {
        setAmountStr(key);
      } else {
        const parts = amountStr.split('.');
        if (parts.length > 1 && parts[1].length >= 2) {
          // Limit cents to 2 decimal places
          return;
        }
        setAmountStr((prev) => prev + key);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const formattedStr = formatDecimalAmount(amountStr);
    setAmountStr(formattedStr);
    const amount = parseFloat(formattedStr);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      triggerHaptic('warning');
      return;
    }

    if (!categoryId) {
      setFormError('Please select or create a category first.');
      triggerHaptic('warning');
      return;
    }

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
    setFormError(null);
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + add).toString());
  };

  const currencySymbol = currentUser?.currency.symbol || '$';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fade-in overscroll-contain select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col select-none overscroll-contain"
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm select-none shrink-0">
          <h3 className="text-base font-semibold text-white">
            {editTx ? 'Edit Transaction' : 'Record Transaction'}
          </h3>
          <button
            type="button"
            draggable={false}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Scroll Viewport */}
        <div className="flex-1 overflow-y-auto overscroll-contain modal-scrollable no-scrollbar touch-pan-y">
          <form
            onSubmit={handleSubmit}
            className="w-full box-border px-5 sm:px-6 py-5 space-y-5"
            onDragStart={(e) => e.preventDefault()}
          >
            {/* Error Banner */}
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Segmented Control (Expense vs Income) */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-sm font-semibold select-none">
              <button
                type="button"
                draggable={false}
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
                draggable={false}
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

            {/* Large Amount Display with Keyboard Toggle & Tap-to-Reopen */}
            <div className="flex flex-col items-center justify-center py-2 select-none">
              <div className="flex items-center justify-between w-full max-w-xs px-2 mb-1">
                <span className="text-xs text-slate-400">Amount</span>
                <button
                  type="button"
                  draggable={false}
                  onClick={() => {
                    triggerHaptic('light');
                    setShowKeypad((prev) => !prev);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                    showKeypad
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title={showKeypad ? 'Hide on-screen keypad' : 'Show on-screen keypad'}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>{showKeypad ? 'Hide Pad' : 'Keypad'}</span>
                </button>
              </div>

              {/* Tapping on amount re-opens keypad if closed */}
              <div
                onClick={() => {
                  triggerHaptic('light');
                  setShowKeypad(true);
                }}
                className="flex items-center text-4xl sm:text-5xl font-bold tracking-tight text-white cursor-pointer px-4 py-1.5 rounded-2xl hover:bg-slate-800/40 transition group"
              >
                <span className="text-slate-400 mr-1 text-3xl select-none group-hover:text-emerald-400 transition">
                  {currencySymbol}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setAmountStr(val);
                    setFormError(null);
                  }}
                  onBlur={() => {
                    setAmountStr((prev) => formatDecimalAmount(prev));
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowKeypad(true);
                  }}
                  className="w-48 text-center bg-transparent focus:outline-none placeholder:text-slate-600 font-bold select-text text-white"
                />
              </div>

              {/* Quick chips */}
              <div className="flex gap-2 mt-3 flex-wrap justify-center">
                {[5, 10, 25, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    draggable={false}
                    onClick={() => handleQuickAddAmount(val)}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 ios-touch-active select-none"
                  >
                    +{currencySymbol}
                    {val}
                  </button>
                ))}
              </div>

              {/* Native Digital On-Screen Keypad (Calculator Layout: 7-8-9 top, 1-2-3 bottom, ., 0, ⌫) */}
              {showKeypad && (
                <div className="w-full max-w-sm mt-3 bg-slate-950/90 rounded-2xl p-2.5 sm:p-3 border border-slate-800/90 shadow-2xl animate-fade-in select-none">
                  {/* Grid 7-9, 4-6, 1-3, ., 0, Backspace */}
                  <div className="grid grid-cols-3 gap-2">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        draggable={false}
                        onClick={() => handleKeypadPress(digit)}
                        className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xl flex items-center justify-center border border-slate-800/80 transition-all shadow-sm"
                      >
                        {digit}
                      </button>
                    ))}

                    {/* Dot */}
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => handleKeypadPress('.')}
                      className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-2xl flex items-center justify-center border border-slate-800/80 transition-all shadow-sm"
                    >
                      .
                    </button>

                    {/* Zero */}
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => handleKeypadPress('0')}
                      className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-semibold text-xl flex items-center justify-center border border-slate-800/80 transition-all shadow-sm"
                    >
                      0
                    </button>

                    {/* Backspace */}
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => handleKeypadPress('backspace')}
                      className="h-12 rounded-xl bg-slate-900 hover:bg-rose-950/40 active:scale-95 text-rose-400 font-semibold text-base flex items-center justify-center border border-slate-800/80 hover:border-rose-500/30 transition-all shadow-sm"
                      title="Backspace"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Actions Row (Clear & Enter) */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => handleKeypadPress('clear')}
                      className="h-10 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium border border-slate-800 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => handleKeypadPress('enter')}
                      className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/50 shadow-md transition-all"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5" />
                      <span>Enter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Category Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-300">Category</label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => {
                      triggerHaptic('light');
                      onOpenCategoryManager();
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage Categories</span>
                  </button>
                )}
              </div>

              {availableCategories.length === 0 ? (
                /* Empty categories handling for new empty accounts */
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    No {type} categories configured yet.
                  </p>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenCategoryManager();
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 rounded-xl shadow-md inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Your First Category</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-1">
                  {availableCategories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        draggable={false}
                        onClick={() => {
                          triggerHaptic('light');
                          setCategoryId(cat.id);
                          setFormError(null);
                        }}
                        className={`relative flex flex-col items-center justify-between text-center p-2.5 rounded-2xl border transition-all select-none min-h-[82px] min-w-0 w-full ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/70 shadow-md shadow-emerald-950/50'
                            : 'bg-slate-950/70 border-slate-800/90 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white mb-1 shadow-sm shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} size={18} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-200 text-center leading-tight line-clamp-2 px-0.5 break-words max-w-full">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}

                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      draggable={false}
                      onClick={() => {
                        triggerHaptic('light');
                        onOpenCategoryManager();
                      }}
                      className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl border border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/40 text-slate-400 hover:text-white transition select-none min-h-[82px]"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800 text-slate-400 mb-1 shrink-0">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium">New...</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Date & Local Time Pickers - Equal spacing on both left and right side */}
            <div className="w-full box-border space-y-3.5">
              {/* Date Input */}
              <div className="w-full box-border">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Date</span>
                  </label>
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => {
                      triggerHaptic('light');
                      setDate(getLocalDateString());
                    }}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-500/10 transition-colors"
                  >
                    Today
                  </button>
                </div>
                <div className="w-full box-border">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full max-w-full box-border rounded-xl bg-slate-950 border border-slate-700/90 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [color-scheme:dark] block"
                  />
                </div>
              </div>

              {/* Local Time Input */}
              <div className="w-full box-border">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Local Time</span>
                  </label>
                  <button
                    type="button"
                    draggable={false}
                    onClick={() => {
                      triggerHaptic('light');
                      setTime(getLocalTimeString());
                    }}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-500/10 transition-colors"
                  >
                    Now
                  </button>
                </div>
                <div className="w-full box-border">
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full max-w-full box-border rounded-xl bg-slate-950 border border-slate-700/90 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [color-scheme:dark] block"
                  />
                </div>
              </div>
            </div>

            {/* Note / Memo */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Note / Memo
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Lunch with team, monthly pass, groceries..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full min-w-0 rounded-xl bg-slate-950 border border-slate-700/90 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors select-text"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Recurring Option */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
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
                    className="bg-slate-800 text-xs text-white rounded-lg px-2 py-1 border border-slate-700 focus:outline-none focus:border-emerald-500"
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
                  className="w-5 h-5 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              draggable={false}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 ios-touch-active cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editTx ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
