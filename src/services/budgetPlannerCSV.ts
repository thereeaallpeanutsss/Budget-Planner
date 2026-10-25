import { UserAppData, Transaction, Category, RecurringSubscription } from '../types/budget';
import { getUserData, saveUserData } from './storage';

export interface ParsedPlannerResult {
  valid: boolean;
  type: 'planner_overview' | 'week_log' | 'monthly_overview' | 'standard_csv' | 'unknown';
  detectedMonth?: string; // YYYY-MM if detected
  weekNumber?: number; // 1, 2, 3, 4
  detectedMonthlyBudget?: number;
  categoriesFound: string[];
  transactionsToCreate: Array<{
    categoryName: string;
    amount: number;
    date: string;
    note: string;
  }>;
  subscriptionsToCreate: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  summaryText: string;
  rawFileName?: string;
}

/**
 * Format number into German/European CSV convention (comma for decimal, e.g. 76,25 or 520)
 */
export function formatCSVNumber(val: number): string {
  if (val === 0) return '0';
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(2).replace('.', ',');
}

/**
 * Parse a CSV number string (supports both '76,25' and '76.25')
 */
export function parseCSVNumber(str: string): number {
  if (!str) return 0;
  const clean = str.trim().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Split CSV line by delimiter (handles semicolon or comma)
 */
function splitCSVLine(line: string, delimiter = ';'): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

/**
 * Trigger file download in browser
 */
function downloadCSV(csvContent: string, filename: string) {
  // UTF-8 BOM so Microsoft Excel and Numbers display German umlauts/special characters correctly
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * EXPORT 1: Monthly Overview (Overview-Monthly_Budget_Calc exact layout)
 * Columns: ;Woche 1;Woche 2;Woche 3;Woche 4
 * Rows: <Category>;w1;w2;w3;w4
 * week total;...
 * weekly budget;...
 * weekly budget remaining;...
 * ;Monthly Expenses;;;
 * ;Rent;520;;
 * ;D-Ticket;45;;
 * ...
 */
export function exportOverviewCSV(userData: UserAppData, targetYearMonth?: string): void {
  const ym = targetYearMonth || new Date().toISOString().substring(0, 7);
  const [year, month] = ym.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const expenseCategories = userData.categories.filter((c) => c.type === 'expense');
  const monthTxs = userData.transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(ym)
  );

  // Group transactions into 4 weeks: 1-7, 8-14, 15-21, 22-end
  const catSpendByWeek = new Map<string, [number, number, number, number]>();
  for (const cat of expenseCategories) {
    catSpendByWeek.set(cat.id, [0, 0, 0, 0]);
  }

  for (const t of monthTxs) {
    const day = parseInt(t.date.split('-')[2], 10);
    let weekIdx = 0;
    if (day >= 1 && day <= 7) weekIdx = 0;
    else if (day >= 8 && day <= 14) weekIdx = 1;
    else if (day >= 15 && day <= 21) weekIdx = 2;
    else weekIdx = 3;

    const current = catSpendByWeek.get(t.categoryId);
    if (current) {
      current[weekIdx] += t.amount;
    }
  }

  // Week totals
  const weekTotals: [number, number, number, number] = [0, 0, 0, 0];
  for (const [_, weeks] of catSpendByWeek.entries()) {
    weekTotals[0] += weeks[0];
    weekTotals[1] += weeks[1];
    weekTotals[2] += weeks[2];
    weekTotals[3] += weeks[3];
  }

  // Active subscriptions (fixed monthly expenses)
  const activeSubs = userData.subscriptions.filter((s) => s.active);
  const totalMonthlyExpenses = activeSubs.reduce((sum, s) => sum + s.amount, 0);

  // Total monthly budget
  const totalBudgeted = userData.budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const monthlyBudget = totalBudgeted > 0 ? totalBudgeted : 870;

  // After monthly expenses
  const totalAfterMonthExpenses = Math.max(0, monthlyBudget - totalMonthlyExpenses);
  const weeklyBudget = totalAfterMonthExpenses / 4;

  const weeklyRemaining: [number, number, number, number] = [
    weeklyBudget - weekTotals[0],
    weeklyBudget - weekTotals[1],
    weeklyBudget - weekTotals[2],
    weeklyBudget - weekTotals[3],
  ];

  const totalVariableSpent = weekTotals[0] + weekTotals[1] + weekTotals[2] + weekTotals[3];
  const monthlyProj = totalMonthlyExpenses + totalVariableSpent;
  const monthlyBudgetRemaining = monthlyBudget - monthlyProj;
  const avgRemainingPerWeek = monthlyBudgetRemaining / 4;
  const totalSpent = monthlyProj;

  // Build CSV lines matching the user's template exactly
  const lines: string[] = [];
  lines.push(';Woche 1;Woche 2;Woche 3;Woche 4');

  for (const cat of expenseCategories) {
    const weeks = catSpendByWeek.get(cat.id) || [0, 0, 0, 0];
    lines.push(
      `${cat.name};${formatCSVNumber(weeks[0])};${formatCSVNumber(weeks[1])};${formatCSVNumber(
        weeks[2]
      )};${formatCSVNumber(weeks[3])}`
    );
  }

  lines.push(';;;;');
  lines.push(';;;;');
  lines.push(
    `week total;${formatCSVNumber(weekTotals[0])};${formatCSVNumber(
      weekTotals[1]
    )};${formatCSVNumber(weekTotals[2])};${formatCSVNumber(weekTotals[3])}`
  );
  lines.push(
    `weekly budget;${formatCSVNumber(weeklyBudget)};${formatCSVNumber(
      weeklyBudget
    )};${formatCSVNumber(weeklyBudget)};${formatCSVNumber(weeklyBudget)}`
  );
  lines.push(
    `weekly budget remaining;${formatCSVNumber(weeklyRemaining[0])};${formatCSVNumber(
      weeklyRemaining[1]
    )};${formatCSVNumber(weeklyRemaining[2])};${formatCSVNumber(weeklyRemaining[3])}`
  );

  lines.push(';Monthly Expenses;;;');
  for (const sub of activeSubs) {
    lines.push(`;${sub.name};${formatCSVNumber(sub.amount)};;`);
  }
  lines.push(
    `;Total Monthly after month. expenses;${formatCSVNumber(totalAfterMonthExpenses)};;`
  );

  lines.push(`monthly proj.;${formatCSVNumber(monthlyProj)};;;`);
  lines.push(`monthly budget;${formatCSVNumber(monthlyBudget)};;;`);
  lines.push(`monthly budget remaining;${formatCSVNumber(monthlyBudgetRemaining)};;;`);
  lines.push(`avg. remaining per week;${formatCSVNumber(avgRemainingPerWeek)};;;`);
  lines.push(';;;;');
  lines.push(`Total Spent;${formatCSVNumber(totalSpent)};;;`);

  const csvString = lines.join('\r\n');
  downloadCSV(
    csvString,
    `Overview-Monthly_Budget_Calc_${userData.profile.name.toLowerCase().replace(/\s+/g, '_')}_${ym}.csv`
  );
}

/**
 * EXPORT 2: Week Log Table (Week_1-Week_1 exact layout)
 * Row 1: <weekNum>;<Category1>;<Category2>;...;<CategoryN>;
 * Rows: ;amount;;;;
 * ...
 * ;;;;;Total
 * Total weekly;wCat1;wCat2;...;wCatN;total
 * proj. monthly;pCat1;pCat2;...;pCatN;projTotal
 */
export function exportWeekLogCSV(
  userData: UserAppData,
  weekNum: number,
  targetYearMonth?: string
): void {
  const ym = targetYearMonth || new Date().toISOString().substring(0, 7);
  const [year, month] = ym.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  let startDay = 1;
  let endDay = 7;
  if (weekNum === 2) {
    startDay = 8;
    endDay = 14;
  } else if (weekNum === 3) {
    startDay = 15;
    endDay = 21;
  } else if (weekNum === 4) {
    startDay = 22;
    endDay = daysInMonth;
  }

  const expenseCategories = userData.categories.filter((c) => c.type === 'expense');

  // Filter transactions falling into this week
  const weekTxs = userData.transactions.filter((t) => {
    if (t.type !== 'expense' || !t.date.startsWith(ym)) return false;
    const d = parseInt(t.date.split('-')[2], 10);
    return d >= startDay && d <= endDay;
  });

  // Organize by category
  const txsByCat = new Map<string, number[]>();
  for (const cat of expenseCategories) {
    txsByCat.set(cat.id, []);
  }

  for (const t of weekTxs) {
    const list = txsByCat.get(t.categoryId);
    if (list) {
      list.push(t.amount);
    }
  }

  // Max entries count in any column (minimum 13 rows like in template)
  let maxRows = 13;
  for (const [_, list] of txsByCat.entries()) {
    if (list.length > maxRows) maxRows = list.length;
  }

  const lines: string[] = [];
  // Row 1: WeekNum;Cat1;Cat2;...;CatN;
  lines.push(`${weekNum};${expenseCategories.map((c) => c.name).join(';')};`);

  // Rows of amounts
  for (let r = 0; r < maxRows; r++) {
    const cells: string[] = ['']; // leading empty cell
    for (const cat of expenseCategories) {
      const list = txsByCat.get(cat.id) || [];
      const val = list[r];
      cells.push(val !== undefined ? formatCSVNumber(val) : '');
    }
    cells.push(''); // trailing empty cell
    lines.push(cells.join(';'));
  }

  // Total label row
  const totalRowBefore = new Array(expenseCategories.length + 1).fill('').join(';') + ';Total';
  lines.push(totalRowBefore);

  // Total weekly row
  const weeklyTotals: number[] = [];
  let grandTotal = 0;
  for (const cat of expenseCategories) {
    const list = txsByCat.get(cat.id) || [];
    const sum = list.reduce((a, b) => a + b, 0);
    weeklyTotals.push(sum);
    grandTotal += sum;
  }

  lines.push(
    `Total weekly;${weeklyTotals.map((n) => formatCSVNumber(n)).join(';')};${formatCSVNumber(
      grandTotal
    )}`
  );

  // Proj monthly row (weekly * 4)
  lines.push(
    `proj. monthly;${weeklyTotals
      .map((n) => formatCSVNumber(n * 4))
      .join(';')};${formatCSVNumber(grandTotal * 4)}`
  );

  const csvString = lines.join('\r\n');
  downloadCSV(csvString, `Week_${weekNum}-Week_${weekNum}_${ym}.csv`);
}

/**
 * EXPORT 3: Complete Budget Planner Multi-Table Export (All 4 Weeks + Overview in one unified CSV)
 */
export function exportCompletePlannerCSV(userData: UserAppData, targetYearMonth?: string): void {
  const ym = targetYearMonth || new Date().toISOString().substring(0, 7);
  // Download Overview
  exportOverviewCSV(userData, ym);
}

/**
 * Intelligent Parser for Budget Planner CSV files:
 * Automatically identifies whether it's an Overview sheet, a Week sheet, or standard CSV,
 * extracts categories, weekly transactions, subscriptions, and budget limits.
 */
export function parseBudgetPlannerCSV(
  csvContent: string,
  targetMonth = new Date().toISOString().substring(0, 7)
): ParsedPlannerResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      valid: false,
      type: 'unknown',
      categoriesFound: [],
      transactionsToCreate: [],
      subscriptionsToCreate: [],
      totalAmount: 0,
      summaryText: 'The uploaded file is empty.',
    };
  }

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // 1. Check if it's an OVERVIEW file (;Woche 1;Woche 2;Woche 3;Woche 4)
  const isOverview =
    lines.some((l) => l.toLowerCase().includes('woche 1') || l.toLowerCase().includes('week 1')) &&
    lines.some(
      (l) =>
        l.toLowerCase().includes('monthly budget') ||
        l.toLowerCase().includes('monthly expenses') ||
        l.toLowerCase().includes('week total')
    );

  if (isOverview) {
    return parseOverviewTable(lines, delimiter, targetMonth);
  }

  // 2. Check if it's a WEEK LOG file (e.g. "1;Groceries;Food (Flight School)..." and "Total weekly")
  const isWeekLog =
    lines.some((l) => l.toLowerCase().includes('total weekly')) ||
    lines.some((l) => l.toLowerCase().includes('proj. monthly'));

  if (isWeekLog) {
    return parseWeekLogTable(lines, delimiter, targetMonth);
  }

  // 3. Fallback: Parse generic or standard transaction CSV
  return parseGenericCSV(lines, delimiter, targetMonth);
}

/**
 * Parse an Overview table like Overview-Monthly_Budget_Calc.csv
 */
function parseOverviewTable(
  lines: string[],
  delimiter: string,
  targetMonth: string
): ParsedPlannerResult {
  const categoriesFound: string[] = [];
  const transactionsToCreate: ParsedPlannerResult['transactionsToCreate'] = [];
  const subscriptionsToCreate: ParsedPlannerResult['subscriptionsToCreate'] = [];
  let detectedMonthlyBudget: number | undefined;

  let inMonthlyExpenses = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const parts = splitCSVLine(rawLine, delimiter);
    if (parts.length === 0) continue;

    const firstCol = parts[0]?.trim() || '';
    const secondCol = parts[1]?.trim() || '';

    // Check Monthly Expenses Section
    if (
      firstCol.toLowerCase().includes('monthly expenses') ||
      secondCol.toLowerCase().includes('monthly expenses')
    ) {
      inMonthlyExpenses = true;
      continue;
    }

    if (inMonthlyExpenses) {
      if (
        firstCol.toLowerCase().includes('total monthly') ||
        secondCol.toLowerCase().includes('total monthly') ||
        firstCol.toLowerCase().includes('monthly proj')
      ) {
        inMonthlyExpenses = false;
      } else {
        // e.g. ;Rent;520;;
        const subName = firstCol || secondCol;
        const subAmountStr = firstCol ? parts[1] : parts[2];
        const subAmount = parseCSVNumber(subAmountStr);
        if (subName && subAmount > 0) {
          subscriptionsToCreate.push({
            name: subName,
            amount: subAmount,
          });
        }
        continue;
      }
    }

    // Check Monthly Budget row
    if (firstCol.toLowerCase().includes('monthly budget') && !firstCol.toLowerCase().includes('remaining')) {
      const budgetVal = parseCSVNumber(parts[1]);
      if (budgetVal > 0) {
        detectedMonthlyBudget = budgetVal;
      }
      continue;
    }

    // Stop at bottom summary rows
    if (
      firstCol.toLowerCase().includes('week total') ||
      firstCol.toLowerCase().includes('weekly budget') ||
      firstCol.toLowerCase().includes('total spent') ||
      firstCol.toLowerCase().includes('monthly proj') ||
      firstCol.toLowerCase().includes('avg. remaining') ||
      firstCol.toLowerCase().includes('woche 1') ||
      secondCol.toLowerCase().includes('woche 1')
    ) {
      continue;
    }

    // Normal category row: <CategoryName>;w1;w2;w3;w4
    if (firstCol && parts.length >= 2) {
      const catName = firstCol;
      categoriesFound.push(catName);

      const w1 = parseCSVNumber(parts[1]);
      const w2 = parseCSVNumber(parts[2]);
      const w3 = parseCSVNumber(parts[3]);
      const w4 = parseCSVNumber(parts[4]);

      // Create transaction for each non-zero week
      if (w1 > 0) {
        transactionsToCreate.push({
          categoryName: catName,
          amount: w1,
          date: `${targetMonth}-04`,
          note: `Woche 1 - ${catName}`,
        });
      }
      if (w2 > 0) {
        transactionsToCreate.push({
          categoryName: catName,
          amount: w2,
          date: `${targetMonth}-11`,
          note: `Woche 2 - ${catName}`,
        });
      }
      if (w3 > 0) {
        transactionsToCreate.push({
          categoryName: catName,
          amount: w3,
          date: `${targetMonth}-18`,
          note: `Woche 3 - ${catName}`,
        });
      }
      if (w4 > 0) {
        transactionsToCreate.push({
          categoryName: catName,
          amount: w4,
          date: `${targetMonth}-25`,
          note: `Woche 4 - ${catName}`,
        });
      }
    }
  }

  const totalAmount = transactionsToCreate.reduce((sum, t) => sum + t.amount, 0);

  return {
    valid: true,
    type: 'planner_overview',
    detectedMonth: targetMonth,
    detectedMonthlyBudget,
    categoriesFound,
    transactionsToCreate,
    subscriptionsToCreate,
    totalAmount,
    summaryText: `Detected Planner Overview: ${categoriesFound.length} categories, ${subscriptionsToCreate.length} fixed monthly expenses, and ${transactionsToCreate.length} weekly records totaling ${totalAmount.toFixed(2)}.`,
  };
}

/**
 * Parse a Week Log table like Week_1-Week_1.csv
 */
function parseWeekLogTable(
  lines: string[],
  delimiter: string,
  targetMonth: string
): ParsedPlannerResult {
  const headerParts = splitCSVLine(lines[0], delimiter);
  // First item might be week number e.g. "1" or "2"
  const rawWeekNum = parseInt(headerParts[0], 10);
  const weekNumber = !isNaN(rawWeekNum) && rawWeekNum >= 1 && rawWeekNum <= 4 ? rawWeekNum : 1;

  // Categories are the remaining columns until empty
  const categoryColumns: { index: number; name: string }[] = [];
  for (let i = 1; i < headerParts.length; i++) {
    const name = headerParts[i]?.trim();
    if (name && name.toLowerCase() !== 'total' && name !== '') {
      categoryColumns.push({ index: i, name });
    }
  }

  const categoriesFound = categoryColumns.map((c) => c.name);
  const transactionsToCreate: ParsedPlannerResult['transactionsToCreate'] = [];

  // Determine starting date for this week
  let dayOffset = 1;
  if (weekNumber === 2) dayOffset = 8;
  else if (weekNumber === 3) dayOffset = 15;
  else if (weekNumber === 4) dayOffset = 22;

  // Parse entry rows (starting at line 1, stopping before Total weekly)
  for (let r = 1; r < lines.length; r++) {
    const line = lines[r];
    if (
      line.toLowerCase().includes('total weekly') ||
      line.toLowerCase().includes('proj. monthly') ||
      line.toLowerCase().includes('total')
    ) {
      break;
    }

    const parts = splitCSVLine(line, delimiter);
    for (const col of categoryColumns) {
      const valStr = parts[col.index];
      if (valStr) {
        const amount = parseCSVNumber(valStr);
        if (amount > 0) {
          // Spread transactions naturally across the 7 days of the week
          const day = Math.min(28, dayOffset + (transactionsToCreate.length % 7));
          const dayStr = String(day).padStart(2, '0');
          transactionsToCreate.push({
            categoryName: col.name,
            amount,
            date: `${targetMonth}-${dayStr}`,
            note: `Week ${weekNumber} - ${col.name}`,
          });
        }
      }
    }
  }

  const totalAmount = transactionsToCreate.reduce((sum, t) => sum + t.amount, 0);

  return {
    valid: true,
    type: 'week_log',
    weekNumber,
    detectedMonth: targetMonth,
    categoriesFound,
    transactionsToCreate,
    subscriptionsToCreate: [],
    totalAmount,
    summaryText: `Detected Week ${weekNumber} Log: ${categoriesFound.length} categories, ${transactionsToCreate.length} transaction entries totaling ${totalAmount.toFixed(2)}.`,
  };
}

/**
 * Generic CSV fallback (e.g. Date, Category, Amount, Note)
 */
function parseGenericCSV(
  lines: string[],
  delimiter: string,
  targetMonth: string
): ParsedPlannerResult {
  const transactionsToCreate: ParsedPlannerResult['transactionsToCreate'] = [];
  const categoriesSet = new Set<string>();

  const header = splitCSVLine(lines[0], delimiter).map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) => h.includes('date') || h.includes('datum'));
  const catIdx = header.findIndex(
    (h) => h.includes('cat') || h.includes('kategorie') || h.includes('type')
  );
  const amtIdx = header.findIndex(
    (h) => h.includes('amount') || h.includes('betrag') || h.includes('preis') || h.includes('cost')
  );
  const noteIdx = header.findIndex(
    (h) => h.includes('note') || h.includes('memo') || h.includes('beschreibung')
  );

  for (let i = 1; i < lines.length; i++) {
    const parts = splitCSVLine(lines[i], delimiter);
    if (parts.length < 2) continue;

    const amount = amtIdx >= 0 ? parseCSVNumber(parts[amtIdx]) : parseCSVNumber(parts[parts.length - 1]);
    if (amount <= 0) continue;

    const catName = catIdx >= 0 && parts[catIdx] ? parts[catIdx].trim() : 'General';
    const date = dateIdx >= 0 && parts[dateIdx] ? parts[dateIdx].trim() : `${targetMonth}-01`;
    const note = noteIdx >= 0 && parts[noteIdx] ? parts[noteIdx].trim() : '';

    categoriesSet.add(catName);
    transactionsToCreate.push({
      categoryName: catName,
      amount,
      date,
      note,
    });
  }

  const categoriesFound = Array.from(categoriesSet);
  const totalAmount = transactionsToCreate.reduce((s, t) => s + t.amount, 0);

  return {
    valid: transactionsToCreate.length > 0,
    type: 'standard_csv',
    detectedMonth: targetMonth,
    categoriesFound,
    transactionsToCreate,
    subscriptionsToCreate: [],
    totalAmount,
    summaryText: `Detected ${transactionsToCreate.length} transactions across ${categoriesFound.length} categories.`,
  };
}

/**
 * Apply the parsed budget planner data into the specified user's vault
 */
export function importPlannerDataIntoUser(
  userId: string,
  parsed: ParsedPlannerResult,
  targetMonth: string
): { categoriesAdded: number; transactionsAdded: number; subscriptionsAdded: number } {
  const data = getUserData(userId);
  if (!data) throw new Error('User not found');

  let categoriesAdded = 0;
  let transactionsAdded = 0;
  let subscriptionsAdded = 0;

  // Category mapping
  const catMap = new Map<string, string>(); // lowercase name -> category id
  for (const c of data.categories) {
    catMap.set(c.name.trim().toLowerCase(), c.id);
  }

  // Auto-generate colors and icons for missing categories
  const PALETTE = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];
  const ICONS: Record<string, string> = {
    groceries: 'ShoppingCart',
    food: 'Utensils',
    eating: 'Utensils',
    dining: 'Utensils',
    clothes: 'Shirt',
    clothing: 'Shirt',
    flight: 'Plane',
    other: 'Tag',
    rent: 'Home',
    ticket: 'Car',
    travel: 'Plane',
    transport: 'Car',
  };

  const getSmartIcon = (name: string): string => {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return 'Tag';
  };

  // 1. Ensure all categories exist
  for (const catName of parsed.categoriesFound) {
    const lower = catName.trim().toLowerCase();
    if (!catMap.has(lower) && catName.trim().length > 0) {
      const newCat: Category = {
        id: `cat_csv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: catName.trim(),
        icon: getSmartIcon(catName),
        color: PALETTE[data.categories.length % PALETTE.length],
        type: 'expense',
        isCustom: true,
      };
      data.categories.push(newCat);
      catMap.set(lower, newCat.id);
      categoriesAdded++;
    }
  }

  // 2. Add subscriptions / recurring expenses if detected
  for (const sub of parsed.subscriptionsToCreate) {
    const exists = data.subscriptions.some(
      (s) => s.name.trim().toLowerCase() === sub.name.trim().toLowerCase()
    );
    if (!exists && sub.amount > 0) {
      const catId = catMap.get(sub.name.trim().toLowerCase()) || data.categories[0]?.id || 'cat_other';
      data.subscriptions.push({
        id: `sub_csv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        name: sub.name.trim(),
        amount: sub.amount,
        billingCycle: 'monthly',
        nextDueDate: `${targetMonth}-01`,
        categoryId: catId,
        isAutoPaid: true,
        active: true,
      });
      subscriptionsAdded++;
    }
  }

  // 3. Set monthly budget if detected
  if (parsed.detectedMonthlyBudget && parsed.detectedMonthlyBudget > 0) {
    const existingBudget = data.budgets[0];
    if (existingBudget) {
      existingBudget.monthlyLimit = parsed.detectedMonthlyBudget;
    } else if (data.categories.length > 0) {
      data.budgets.push({
        id: `bud_csv_${Date.now()}`,
        userId,
        categoryId: data.categories[0].id,
        monthlyLimit: parsed.detectedMonthlyBudget,
        period: 'monthly',
      });
    }
  }

  // 4. Add transactions
  for (const t of parsed.transactionsToCreate) {
    const catId = catMap.get(t.categoryName.trim().toLowerCase()) || data.categories[0]?.id || '';
    if (t.amount > 0 && catId) {
      let finalDate = t.date;
      if (targetMonth && !t.date.startsWith(targetMonth)) {
        const dayPart = t.date.split('-')[2] || '01';
        finalDate = `${targetMonth}-${dayPart}`;
      }

      data.transactions.push({
        id: `tx_csv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        type: 'expense',
        amount: t.amount,
        categoryId: catId,
        date: finalDate,
        time: '12:00',
        note: t.note || `Imported ${t.categoryName}`,
        createdAt: new Date().toISOString(),
      });
      transactionsAdded++;
    }
  }

  saveUserData(data);
  return { categoriesAdded, transactionsAdded, subscriptionsAdded };
}
