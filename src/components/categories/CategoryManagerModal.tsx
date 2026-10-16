import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Category, TransactionType } from '../../types/budget';
import {
  X,
  Plus,
  Trash2,
  Tag,
  Check,
  FolderPlus,
  Sparkles,
  Palette,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { triggerHaptic } from '../../services/storage';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const POPULAR_CATEGORY_ICONS = [
  'ShoppingCart',
  'Utensils',
  'Home',
  'Car',
  'Zap',
  'ShoppingBag',
  'Film',
  'HeartPulse',
  'Plane',
  'CreditCard',
  'Coffee',
  'Dumbbell',
  'PawPrint',
  'BookOpen',
  'Music',
  'Gamepad2',
  'Shirt',
  'Sparkles',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'Gift',
  'Coins',
  'CircleEllipsis',
];

const CATEGORY_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Amber
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
}) => {
  const { userData, addCategory, removeCategoryItem } = useAuth();
  const [activeTab, setActiveTab] = useState<TransactionType>(defaultType);
  const [isCreating, setIsCreating] = useState(false);

  // New Category Form
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState('#10b981');

  if (!isOpen || !userData) return null;

  const currentCategories = userData.categories.filter((c) => c.type === activeTab);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCategory({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: activeTab,
    });

    setName('');
    setSelectedIcon('Tag');
    setIsCreating(false);
  };

  const handleDeleteCategory = (cat: Category) => {
    if (!cat.isCustom) return;
    triggerHaptic('medium');
    removeCategoryItem(cat.id);
  };

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Categories Manager</h3>
              <p className="text-xs text-slate-400">Manage default & custom categories</p>
            </div>
          </div>

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

        {/* Tab Switcher (Expense vs Income) */}
        <div className="px-6 pt-3 pb-1 select-none">
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              draggable={false}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('expense');
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense Categories ({userData.categories.filter((c) => c.type === 'expense').length})
            </button>
            <button
              type="button"
              draggable={false}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('income');
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income Categories ({userData.categories.filter((c) => c.type === 'income').length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          className="overflow-y-auto p-6 space-y-4 flex-1 modal-scrollable no-scrollbar touch-pan-y overscroll-contain"
          onDragStart={(e) => e.preventDefault()}
        >
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {currentCategories.length} categories available
                </span>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsCreating(true);
                  }}
                  className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-xl shadow-md ios-touch-active"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Custom Category</span>
                </button>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white truncate block">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cat.isCustom ? (
                            <span className="text-emerald-400 font-medium">Custom</span>
                          ) : (
                            'Default'
                          )}
                        </span>
                      </div>
                    </div>

                    {cat.isCustom && (
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete custom category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Create Custom Category Form */
            <form onSubmit={handleCreateSubmit} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-emerald-400" />
                  Add Custom {activeTab === 'expense' ? 'Expense' : 'Income'} Category
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Pet Care, Gaming, Coffee & Tea, Side Hustle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose Category Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                  {POPULAR_CATEGORY_ICONS.map((iconName) => {
                    const isSelected = selectedIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedIcon(iconName);
                        }}
                        className={`h-9 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md scale-110'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <CategoryIcon name={iconName} size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose Color Accent
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedColor(c);
                      }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        selectedColor === c
                          ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                >
                  <CategoryIcon name={selectedIcon} size={20} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white">
                    {name.trim() || 'New Category Preview'}
                  </span>
                  <span className="text-[10px] text-slate-400 block capitalize">
                    {activeTab} • Custom
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save Category
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
