import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FinanceEntry } from '../types';
import { 
  Plus, TrendingDown, TrendingUp, Sparkles, Eye, EyeOff, 
  ChevronLeft, ChevronRight, CreditCard, Wallet, Home, 
  ShoppingCart, Coffee, Zap, Car, Gift, MoreHorizontal,
  Landmark, X, Save, Download, UploadCloud, RefreshCw, CheckCircle2,
  Utensils, Tv, GraduationCap, Briefcase, Heart, User, Palmtree, 
  RotateCcw, DollarSign, Tags, Filter, Share2, Smartphone, Wifi, 
  Plane, Music, Book, Smile, Gamepad2, Hammer, Baby, FileText,
  MoreVertical, Edit2, Archive, Sliders, Trash2, PieChart as PieChartIcon,
  History, CalendarClock, Receipt, Calendar, CheckSquare
} from 'lucide-react';
import { analyzeFinances } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import useLocalStorage from '../hooks/useLocalStorage';

// --- Constants & Configuration ---

// Available icons for selection
const ICON_REGISTRY: Record<string, any> = {
  'Utensils': Utensils,
  'Car': Car,
  'Home': Home,
  'Tv': Tv,
  'CreditCard': CreditCard,
  'GraduationCap': GraduationCap,
  'Briefcase': Briefcase,
  'Heart': Heart,
  'User': User,
  'Palmtree': Palmtree,
  'ShoppingCart': ShoppingCart,
  'Coffee': Coffee,
  'Zap': Zap,
  'Gift': Gift,
  'Smartphone': Smartphone,
  'Wifi': Wifi,
  'Plane': Plane,
  'Music': Music,
  'Book': Book,
  'Smile': Smile,
  'Gamepad': Gamepad2,
  'Hammer': Hammer,
  'Baby': Baby,
  'DollarSign': DollarSign,
  'Wallet': Wallet,
  'RotateCcw': RotateCcw,
  'Sparkles': Sparkles,
};

const COLORS = ['#FF5252', '#448AFF', '#66BB6A', '#FFCA28', '#AB47BC', '#FF7043', '#8D6E63', '#26A69A', '#EC407A', '#78909C'];

const INITIAL_EXPENSE_STRUCTURE: Record<string, string[]> = {
  "Alimentação": ["Lanches", "Refeição", "Supermercado"],
  "Assinaturas": ["Google One", "Netflix"],
  "Carro": ["Gasolina", "IPVA", "Multa", "Passagem de ônibus", "Prestação Carro", "Revisão/Mecânico", "Seguro", "Uber"],
  "Casa": ["Água", "Celulares", "Energia", "Faxina", "Internet", "IPTU", "Manutenção Casa", "Prestação"],
  "Cartão de Crédito": ["Pagamento de Fatura"],
  "Crédito Saldo Karine": [],
  "Educação": ["Material Didático", "Material", "Mensalidade CESE", "Livros", "Custos Adicionais CESE"],
  "Empresa Ka": [],
  "Empréstimo": [],
  "Investimentos": [],
  "Lazer": ["Clube", "Passeios", "Restaurantes", "Viagens"],
  "Outros": [],
  "Pessoal": ["Cosméticos", "Itens Bia", "Presentes", "Salão", "Vestuário"],
  "Saúde": ["Academia", "Farmácia", "Fisioterapia", "Natação Bia"]
};

const INITIAL_INCOME_STRUCTURE: Record<string, string[]> = {
  "Crédito Saldo Karine": [],
  "Estorno Cartão": [],
  "Investimentos": ["Rendimentos BTG", "Rendimentos Mercado Pago", "Rendimentos XP", "Resgate Investimento"],
  "Outros Ganhos": [],
  "Presente": [],
  "Salários": ["Benefício Alimentação", "Salário 01", "Salário 02", "Salário Karine"],
  "Variáveis": ["13º salário", "Férias", "Férias Prêmio", "Recebimentos", "Restituição Imposto de Renda"]
};

// Map category names to Icon Registry Keys
const INITIAL_ICON_MAPPING: Record<string, string> = {
  'Alimentação': 'Utensils',
  'Assinaturas': 'Tv',
  'Carro': 'Car',
  'Casa': 'Home',
  'Cartão de Crédito': 'CreditCard',
  'Crédito Saldo Karine': 'CreditCard',
  'Educação': 'GraduationCap',
  'Empresa Ka': 'Briefcase',
  'Empréstimo': 'Landmark', // Fallback
  'Investimentos': 'TrendingUp', // Fallback to logic
  'Lazer': 'Palmtree',
  'Outros': 'MoreHorizontal',
  'Pessoal': 'User',
  'Saúde': 'Heart',
  'Estorno Cartão': 'RotateCcw',
  'Outros Ganhos': 'Sparkles',
  'Presente': 'Gift',
  'Salários': 'Wallet',
  'Salário': 'Wallet', 
  'Variáveis': 'DollarSign',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': 'bg-orange-100 text-orange-600',
  'Assinaturas': 'bg-purple-100 text-purple-600',
  'Carro': 'bg-red-100 text-red-600',
  'Casa': 'bg-blue-100 text-blue-600',
  'Cartão de Crédito': 'bg-indigo-100 text-indigo-600',
  'Crédito Saldo Karine': 'bg-indigo-100 text-indigo-600',
  'Educação': 'bg-pink-100 text-pink-600',
  'Empresa Ka': 'bg-slate-100 text-slate-600',
  'Empréstimo': 'bg-gray-100 text-gray-600',
  'Investimentos': 'bg-green-100 text-green-600',
  'Lazer': 'bg-yellow-100 text-yellow-600',
  'Outros': 'bg-stone-100 text-stone-600',
  'Pessoal': 'bg-teal-100 text-teal-600',
  'Saúde': 'bg-rose-100 text-rose-600',
  'Estorno Cartão': 'bg-gray-100 text-gray-600',
  'Outros Ganhos': 'bg-teal-100 text-teal-600',
  'Presente': 'bg-pink-100 text-pink-600',
  'Salários': 'bg-emerald-100 text-emerald-600',
  'Variáveis': 'bg-cyan-100 text-cyan-600',
};

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  color: string; 
}

interface CreditCardModel {
  id: string;
  name: string;
  limit: number;
  currentInvoice: number;
  closingDate: string;
  color: string; 
}

interface FilterState {
    startDate: string;
    endDate: string;
    paymentMethods: string[]; // Names of accounts or cards
    categories: string[];
    type: 'all' | 'income' | 'expense';
}

export const FinanceTracker: React.FC = () => {
  // --- State: Categories (Persisted) ---
  const [expenseCategories, setExpenseCategories] = useLocalStorage<Record<string, string[]>>('planner_fin_cats_expense', INITIAL_EXPENSE_STRUCTURE);
  const [incomeCategories, setIncomeCategories] = useLocalStorage<Record<string, string[]>>('planner_fin_cats_income', INITIAL_INCOME_STRUCTURE);
  const [categoryIconMap, setCategoryIconMap] = useLocalStorage<Record<string, string>>('planner_fin_cats_icons', INITIAL_ICON_MAPPING);

  // --- State: General ---
  const [showValues, setShowValues] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [modals, setModals] = useState({ 
      account: false, 
      card: false, 
      payInvoice: false,
      cardDetails: false,
      import: false,
      export: false,
      transaction: false,
      categories: false,
      filter: false,
      adjustBalance: false,
      incomeDetails: false,
      expenseDetails: false // New modal for expense extract
  });

  // --- State: Account & Card Menu Control ---
  const [activeMenuAccountId, setActiveMenuAccountId] = useState<string | null>(null);
  const [activeMenuCardId, setActiveMenuCardId] = useState<string | null>(null);
  
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardModel | null>(null);
  const [adjustBalanceData, setAdjustBalanceData] = useState<{ id: string, name: string, currentBalance: string }>({ id: '', name: '', currentBalance: '' });
  
  // State for Payment and Card Details
  const [selectedCardForAction, setSelectedCardForAction] = useState<CreditCardModel | null>(null);
  const [cardDetailsTab, setCardDetailsTab] = useState<'chart' | 'history' | 'fixed'>('chart');
  const [invoicePayment, setInvoicePayment] = useState({ amount: '', sourceAccountId: '', date: new Date().toISOString().split('T')[0] });

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);


  // --- State: Filters ---
  const [filters, setFilters] = useState<FilterState>({
      startDate: '',
      endDate: '',
      paymentMethods: [],
      categories: [],
      type: 'all'
  });

  // --- State: Accounts & Cards (Persisted) ---
  const [accounts, setAccounts] = useLocalStorage<BankAccount[]>('planner_fin_accounts', [
    { id: '1', name: 'Nubank', balance: 2500.50, color: 'bg-purple-600' },
    { id: '2', name: 'Itaú', balance: 1200.00, color: 'bg-orange-500' },
    { id: '3', name: 'Carteira', balance: 150.00, color: 'bg-green-500' },
  ]);

  const [creditCards, setCreditCards] = useLocalStorage<CreditCardModel[]>('planner_fin_cards', [
    { id: '1', name: 'Nubank Black', limit: 15000, currentInvoice: 1250, closingDate: '05', color: 'from-purple-800 to-purple-950' },
    { id: '2', name: 'XP Visa', limit: 20000, currentInvoice: 450, closingDate: '10', color: 'from-slate-700 to-slate-900' },
  ]);

  // --- State: Transactions (Persisted) ---
  const [entries, setEntries] = useLocalStorage<FinanceEntry[]>('planner_fin_entries', [
    { id: '1', type: 'income', category: 'Salários', subcategory: 'Salário 01', amount: 5500, date: '2024-05-01', description: 'Salário Mensal', paymentMethod: 'Itaú' },
    { id: '2', type: 'expense', category: 'Casa', subcategory: 'Prestação', amount: 1800, date: '2024-05-05', description: 'Aluguel + Condomínio', paymentMethod: 'Itaú' },
    { id: '3', type: 'expense', category: 'Alimentação', subcategory: 'Supermercado', amount: 850, date: '2024-05-07', description: 'Compras Semanais', paymentMethod: 'Nubank Black' },
    { id: '4', type: 'expense', category: 'Lazer', subcategory: 'Passeios', amount: 120, date: '2024-05-08', description: 'Cinema e Pipoca', paymentMethod: 'Nubank Black' },
    { id: '5', type: 'expense', category: 'Carro', subcategory: 'Gasolina', amount: 300, date: '2024-05-10', description: 'Abastecimento', paymentMethod: 'XP Visa' },
    { id: '6', type: 'expense', category: 'Casa', subcategory: 'Internet', amount: 120, date: '2024-05-15', description: 'Vivo Fibra', paymentMethod: 'Nubank' },
    { id: '7', type: 'expense', category: 'Saúde', subcategory: 'Natação Bia', amount: 250, date: '2024-05-16', description: 'Mensalidade Natação', paymentMethod: 'Itaú' },
  ]);

  // --- Forms State ---
  const [newAccount, setNewAccount] = useState({ name: '', balance: '' });
  const [newCard, setNewCard] = useState({ name: '', limit: '', currentInvoice: '', closingDate: '' });
  const [newTransaction, setNewTransaction] = useState<{
    type: 'income' | 'expense';
    amount: string;
    description: string;
    category: string;
    subcategory: string;
    date: string;
    paymentMethod: string;
  }>({
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: ''
  });

  // Category Management State
  const [categoryManager, setCategoryManager] = useState<{
    tab: 'expense' | 'income';
    newCategoryName: string;
    selectedIcon: string;
    targetCategory: string;
    newSubcategoryName: string;
  }>({
    tab: 'expense',
    newCategoryName: '',
    selectedIcon: 'MoreHorizontal',
    targetCategory: '',
    newSubcategoryName: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuAccountId && !(event.target as Element).closest('.account-menu-trigger')) {
        setActiveMenuAccountId(null);
      }
      if (activeMenuCardId && !(event.target as Element).closest('.card-menu-trigger')) {
        setActiveMenuCardId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuAccountId, activeMenuCardId]);

  // --- Derived Calculations & Filtering ---
  
  const filteredEntries = useMemo(() => {
      return entries.filter(entry => {
          // 1. Date Filter (Priority to Custom Date Range)
          let dateMatch = true;
          if (filters.startDate && filters.endDate) {
              dateMatch = entry.date >= filters.startDate && entry.date <= filters.endDate;
          } else {
              // Default: Current Month view
              const [entryYear, entryMonth] = entry.date.split('-').map(Number);
              dateMatch = (entryMonth - 1) === currentDate.getMonth() && 
                          entryYear === currentDate.getFullYear();
          }

          // 2. Source Filter (Multi-select: Payment Methods)
          let sourceMatch = true;
          if (filters.paymentMethods.length > 0) {
              sourceMatch = filters.paymentMethods.includes(entry.paymentMethod || '');
          }

          // 3. Category Filter (Multi-select)
          let categoryMatch = true;
          if ((filters.categories as string[]).length > 0) {
              categoryMatch = (filters.categories as string[]).includes(entry.category);
          }

          // 4. Type Filter
          let typeMatch = true;
          if (filters.type !== 'all') {
              typeMatch = entry.type === filters.type;
          }

          return dateMatch && sourceMatch && categoryMatch && typeMatch;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, currentDate, filters]);

  // Group entries by date for "Detailed History"
  const groupedEntries = useMemo((): Record<string, FinanceEntry[]> => {
      const groups: Record<string, FinanceEntry[]> = {};
      filteredEntries.forEach(entry => {
          const [y, m, d] = entry.date.split('-').map(Number);
          // Use local date construction to avoid timezone shift on labels
          const date = new Date(y, m - 1, d);
          // Format: "12 de Maio, Segunda-feira"
          const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' });
          if (!groups[dateStr]) groups[dateStr] = [];
          groups[dateStr].push(entry);
      });
      return groups;
  }, [filteredEntries]);

  // INCOME EXTRACT LOGIC (Specific for Income Modal)
  const incomeEntries = useMemo(() => {
      // Filter ONLY by Month (ignoring other filters to show full extract like Mobills)
      return entries.filter(entry => {
          const [entryYear, entryMonth] = entry.date.split('-').map(Number);
          const dateMatch = (entryMonth - 1) === currentDate.getMonth() && 
                            entryYear === currentDate.getFullYear();
          return dateMatch && entry.type === 'income';
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, currentDate]);

  const groupedIncomeEntries = useMemo((): Record<string, FinanceEntry[]> => {
    const groups: Record<string, FinanceEntry[]> = {};
    incomeEntries.forEach(entry => {
        const [y, m, d] = entry.date.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' });
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(entry);
    });
    return groups;
  }, [incomeEntries]);

  const totalIncomeForModal = incomeEntries.reduce((acc, curr) => acc + curr.amount, 0);

  // EXPENSE EXTRACT LOGIC (Specific for Expense Modal)
  const expenseEntries = useMemo(() => {
      // Filter ONLY by Month (ignoring other filters to show full extract like Mobills)
      return entries.filter(entry => {
          const [entryYear, entryMonth] = entry.date.split('-').map(Number);
          const dateMatch = (entryMonth - 1) === currentDate.getMonth() && 
                            entryYear === currentDate.getFullYear();
          return dateMatch && entry.type === 'expense';
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, currentDate]);

  const groupedExpenseEntries = useMemo((): Record<string, FinanceEntry[]> => {
    const groups: Record<string, FinanceEntry[]> = {};
    expenseEntries.forEach(entry => {
        const [y, m, d] = entry.date.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' });
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(entry);
    });
    return groups;
  }, [expenseEntries]);

  const totalExpenseForModal = expenseEntries.reduce((acc, curr) => acc + curr.amount, 0);


  const totalIncome = filteredEntries.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredEntries.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const consolidatedBalance = (accounts as BankAccount[]).reduce((acc, curr) => acc + curr.balance, 0);

  // Chart Data
  const expensesByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    filteredEntries.filter(e => e.type === 'expense').forEach(e => {
      if (!categoryMap[e.category]) categoryMap[e.category] = 0;
      categoryMap[e.category] += e.amount;
    });
    return Object.keys(categoryMap).map((key, index) => ({
      name: key,
      value: categoryMap[key],
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [filteredEntries]);

  // --- Handlers ---
  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const expenseSummary = filteredEntries
        .filter(e => e.type === 'expense')
        .map(e => `- ${e.category} (${e.subcategory || 'Geral'}): R$ ${e.amount}`)
        .join('\n');
        
    const promptMessage = expenseSummary.length > 0 
        ? expenseSummary 
        : "Nenhum gasto registrado neste período.";

    const result = await analyzeFinances(totalIncome, totalExpense, promptMessage);
    setAiAdvice(result);
    setIsAnalyzing(false);
  };

  const formatCurrency = (value: number) => {
    return showValues 
      ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '••••••';
  };
  
  const formatCurrencyRaw = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handleShare = async () => {
      const period = filters.startDate && filters.endDate 
          ? `${new Date(filters.startDate).toLocaleDateString('pt-BR')} a ${new Date(filters.endDate).toLocaleDateString('pt-BR')}` 
          : getMonthName(currentDate);

      const text = `📊 *Resumo Financeiro - ${period}*\n\n` +
                   `💰 Receitas: ${formatCurrencyRaw(totalIncome)}\n` +
                   `💸 Despesas: ${formatCurrencyRaw(totalExpense)}\n` +
                   `🏦 Saldo (Contas): ${formatCurrencyRaw(consolidatedBalance)}\n\n` +
                   `Gerado via Meu Planner`;

      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Resumo Financeiro',
                  text: text,
              });
          } catch (err) {
              console.log('Error sharing', err);
          }
      } else {
          navigator.clipboard.writeText(text);
          alert('Resumo copiado para a área de transferência!');
      }
  };

  // Export Handlers
  const handleExportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      accounts,
      creditCards,
      categories: { expense: expenseCategories, income: incomeCategories },
      transactions: entries
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_financeiro_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setModals(prev => ({ ...prev, export: false }));
  };

  const handleExportCSV = () => {
    const headers = ["Data", "Descrição", "Categoria", "Subcategoria", "Valor", "Tipo", "Conta/Cartão"];
    const rows = entries.map(e => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      e.category,
      e.subcategory || '',
      e.amount.toString().replace('.', ','),
      e.type === 'income' ? 'Receita' : 'Despesa',
      e.paymentMethod || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setModals(prev => ({ ...prev, export: false }));
  };

  // --- Account Logic ---

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name) return;

    if (editingAccount) {
        // Edit Mode
        setAccounts(accounts.map(acc => 
            acc.id === editingAccount.id 
                ? { ...acc, name: newAccount.name, balance: parseFloat(newAccount.balance) || 0 }
                : acc
        ));
    } else {
        // Create Mode
        setAccounts([...(accounts as BankAccount[]), {
            id: Date.now().toString(),
            name: newAccount.name,
            balance: parseFloat(newAccount.balance) || 0,
            color: 'bg-stone-600'
        }]);
    }
    
    setNewAccount({ name: '', balance: '' });
    setEditingAccount(null);
    setModals({ ...modals, account: false });
  };

  const openEditAccount = (account: BankAccount) => {
      setEditingAccount(account);
      setNewAccount({ name: account.name, balance: account.balance.toString() });
      setActiveMenuAccountId(null);
      setModals({...modals, account: true});
  };

  const handleDeleteAccount = (id: string) => {
      if (confirm('Tem certeza que deseja arquivar/excluir esta conta?')) {
          setAccounts(accounts.filter(acc => acc.id !== id));
      }
      setActiveMenuAccountId(null);
  };

  const openAccountTransaction = (account: BankAccount) => {
      setNewTransaction(prev => ({ ...prev, paymentMethod: account.name, type: 'expense' }));
      setActiveMenuAccountId(null);
      setModals({...modals, transaction: true});
  }

  const openAdjustBalance = (account: BankAccount) => {
      setAdjustBalanceData({
          id: account.id,
          name: account.name,
          currentBalance: account.balance.toString()
      });
      setActiveMenuAccountId(null);
      setModals({...modals, adjustBalance: true});
  }

  const handleSaveBalanceAdjustment = (e: React.FormEvent) => {
      e.preventDefault();
      const newBalance = parseFloat(adjustBalanceData.currentBalance);
      
      setAccounts(accounts.map(acc => 
          acc.id === adjustBalanceData.id 
            ? { ...acc, balance: isNaN(newBalance) ? 0 : newBalance }
            : acc
      ));
      setModals({...modals, adjustBalance: false});
  }

  const openNewQuickExpense = () => {
    setNewTransaction(prev => ({ 
        ...prev, 
        type: 'expense', 
        amount: '', 
        description: '', 
        category: '', 
        subcategory: '' 
    }));
    setModals({...modals, transaction: true, expenseDetails: false}); // Close extract modal if open
  }

  const openNewQuickIncome = () => {
    setNewTransaction(prev => ({ 
        ...prev, 
        type: 'income', 
        amount: '', 
        description: '', 
        category: '', 
        subcategory: '' 
    }));
    setModals({...modals, transaction: true, incomeDetails: false}); // Close extract modal if open
  }

  // --- Card & Transaction Logic ---

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.name) return;

    if (editingCard) {
      setCreditCards(creditCards.map(c => 
        c.id === editingCard.id ? { 
          ...c, 
          name: newCard.name, 
          limit: parseFloat(newCard.limit) || 0,
          closingDate: newCard.closingDate || '01'
        } : c
      ));
    } else {
      setCreditCards([...(creditCards as CreditCardModel[]), {
        id: Date.now().toString(),
        name: newCard.name,
        limit: parseFloat(newCard.limit) || 0,
        currentInvoice: parseFloat(newCard.currentInvoice) || 0,
        closingDate: newCard.closingDate || '01',
        color: 'from-stone-700 to-stone-900'
      }]);
    }

    setNewCard({ name: '', limit: '', currentInvoice: '', closingDate: '' });
    setEditingCard(null);
    setModals({ ...modals, card: false });
  };

  const handleAddTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTransaction.amount || !newTransaction.description || !newTransaction.category) return;

      const amountVal = parseFloat(newTransaction.amount);

      setEntries([{
          id: Date.now().toString(),
          type: newTransaction.type,
          amount: amountVal,
          description: newTransaction.description,
          category: newTransaction.category,
          subcategory: newTransaction.subcategory,
          date: newTransaction.date,
          paymentMethod: newTransaction.paymentMethod
      }, ...entries]);

      // Update account balance if it's a bank account
      const accIndex = accounts.findIndex(a => a.name === newTransaction.paymentMethod);
      if (accIndex >= 0) {
           const updatedAccounts = [...accounts];
           if (newTransaction.type === 'expense') {
               updatedAccounts[accIndex].balance -= amountVal;
           } else {
               updatedAccounts[accIndex].balance += amountVal;
           }
           setAccounts(updatedAccounts);
      }

      // Update card invoice if it's a credit card and it's an expense
      const cardIndex = creditCards.findIndex(c => c.name === newTransaction.paymentMethod);
      if (cardIndex >= 0 && newTransaction.type === 'expense') {
          const updatedCards = [...creditCards];
          updatedCards[cardIndex].currentInvoice += amountVal;
          setCreditCards(updatedCards);
      }

      setNewTransaction({
          type: 'expense',
          amount: '',
          description: '',
          category: '',
          subcategory: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: ''
      });
      setModals({...modals, transaction: false});
  }

  // --- Card Menu Actions ---

  const handleOpenPayInvoice = (card: CreditCardModel) => {
    setSelectedCardForAction(card);
    setInvoicePayment({
      amount: card.currentInvoice.toString(),
      sourceAccountId: accounts.length > 0 ? accounts[0].id : '',
      date: new Date().toISOString().split('T')[0]
    });
    setActiveMenuCardId(null);
    setModals({ ...modals, payInvoice: true });
  };

  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForAction || !invoicePayment.sourceAccountId || !invoicePayment.amount) return;

    const amount = parseFloat(invoicePayment.amount);
    const account = accounts.find(a => a.id === invoicePayment.sourceAccountId);

    if (account) {
      // 1. Create Transaction Record
      const newEntry: FinanceEntry = {
        id: Date.now().toString(),
        type: 'expense',
        category: 'Cartão de Crédito',
        subcategory: 'Pagamento de Fatura',
        amount: amount,
        date: invoicePayment.date,
        description: `Fatura ${selectedCardForAction.name}`,
        paymentMethod: account.name
      };
      setEntries([newEntry, ...entries]);

      // 2. Deduct from Bank Account
      setAccounts(accounts.map(a => a.id === account.id ? { ...a, balance: a.balance - amount } : a));

      // 3. Clear/Reduce Invoice on Card
      setCreditCards(creditCards.map(c => c.id === selectedCardForAction.id ? { ...c, currentInvoice: Math.max(0, c.currentInvoice - amount) } : c));
    }

    setModals({ ...modals, payInvoice: false });
    setSelectedCardForAction(null);
  };

  const openCardDetails = (card: CreditCardModel, tab: 'chart' | 'history' | 'fixed') => {
    setSelectedCardForAction(card);
    setCardDetailsTab(tab);
    setActiveMenuCardId(null);
    setModals({ ...modals, cardDetails: true });
  };

  const handleEditCard = (card: CreditCardModel) => {
    setEditingCard(card);
    setNewCard({
      name: card.name,
      limit: card.limit.toString(),
      currentInvoice: card.currentInvoice.toString(),
      closingDate: card.closingDate
    });
    setActiveMenuCardId(null);
    setModals({ ...modals, card: true });
  };

  const handleArchiveCard = (id: string) => {
    if (confirm('Tem certeza que deseja arquivar este cartão?')) {
      setCreditCards(creditCards.filter(c => c.id !== id));
    }
    setActiveMenuCardId(null);
  };

  // --- Helper for Card Details Data ---
  const getCardTransactions = (cardName: string) => {
    return entries.filter(e => e.paymentMethod === cardName).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getCardExpensesByCat = (cardName: string) => {
    const txs = getCardTransactions(cardName).filter(e => e.type === 'expense');
    const catMap: Record<string, number> = {};
    txs.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    return Object.keys(catMap).map((k, i) => ({ name: k, value: catMap[k], color: COLORS[i % COLORS.length] }));
  };

  const getFixedExpensesGuess = (cardName: string) => {
    // Simple heuristic: items with recurring-like names
    const recurringKeywords = ['netflix', 'spotify', 'amazon', 'assinatura', 'plano', 'mensalidade', 'internet', 'vivo', 'claro', 'gympass'];
    return getCardTransactions(cardName).filter(e => {
      const desc = e.description.toLowerCase();
      return recurringKeywords.some(kw => desc.includes(kw));
    });
  };

  const handleImportMobills = () => {
    setIsImporting(true);
    setTimeout(() => {
      const mobillsData: FinanceEntry[] = [
        { id: 'm1', type: 'expense', category: 'Assinaturas', subcategory: 'Netflix', amount: 45.90, date: '2024-05-18', description: 'Netflix Mensal', paymentMethod: 'Nubank Black' },
        { id: 'm2', type: 'expense', category: 'Carro', subcategory: 'Uber', amount: 24.50, date: '2024-05-19', description: 'Viagem Trabalho', paymentMethod: 'Nubank Black' },
        { id: 'm3', type: 'expense', category: 'Alimentação', subcategory: 'Supermercado', amount: 142.00, date: '2024-05-20', description: 'Carrefour Express', paymentMethod: 'Itaú' },
        { id: 'm4', type: 'expense', category: 'Casa', subcategory: 'Água', amount: 110.00, date: '2024-05-21', description: 'Conta de Água', paymentMethod: 'Itaú' },
      ];
      
      setEntries(prev => [...mobillsData, ...prev]);
      setIsImporting(false);
      setModals(prev => ({ ...prev, import: false }));
    }, 2500);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Simulate File Upload
    setIsImporting(true);
    setTimeout(() => {
        alert(`Arquivo "${file.name}" importado com sucesso! (Simulação)`);
        setIsImporting(false);
        setModals(prev => ({ ...prev, import: false }));
    }, 1500);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setModals({...modals, filter: false});
  };

  const clearFilters = () => {
      setFilters({ 
          startDate: '', 
          endDate: '', 
          paymentMethods: [], 
          categories: [], 
          type: 'all' 
      });
      setModals({...modals, filter: false});
  };
  
  const setQuickDateFilter = (type: 'today' | 'week' | 'month' | 'year') => {
      const now = new Date();
      let start = '';
      let end = '';

      if (type === 'today') {
          start = end = now.toISOString().split('T')[0];
      } else if (type === 'week') {
          const first = now.getDate() - now.getDay(); 
          const last = first + 6; 
          start = new Date(now.setDate(first)).toISOString().split('T')[0];
          end = new Date(now.setDate(last)).toISOString().split('T')[0];
      } else if (type === 'month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (type === 'year') {
          start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      }
      setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
  };
  
  const toggleFilterPaymentMethod = (name: string) => {
      setFilters(prev => {
          const exists = prev.paymentMethods.includes(name);
          return {
              ...prev,
              paymentMethods: exists 
                  ? prev.paymentMethods.filter(p => p !== name)
                  : [...prev.paymentMethods, name]
          };
      });
  };

  const toggleFilterCategory = (cat: string) => {
      setFilters(prev => {
          const exists = prev.categories.includes(cat);
          return {
              ...prev,
              categories: exists 
                  ? prev.categories.filter(c => c !== cat)
                  : [...prev.categories, cat]
          };
      });
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentDate(newDate);
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
  };

  // --- Category Management Handlers ---
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryManager.newCategoryName) return;
    
    if (categoryManager.tab === 'expense') {
        setExpenseCategories(prev => ({ ...prev, [categoryManager.newCategoryName]: [] }));
    } else {
        setIncomeCategories(prev => ({ ...prev, [categoryManager.newCategoryName]: [] }));
    }

    // Save Icon
    setCategoryIconMap(prev => ({
        ...prev,
        [categoryManager.newCategoryName]: categoryManager.selectedIcon
    }));

    setCategoryManager(prev => ({ ...prev, newCategoryName: '', selectedIcon: 'MoreHorizontal' }));
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryManager.targetCategory || !categoryManager.newSubcategoryName) return;

    if (categoryManager.tab === 'expense') {
        setExpenseCategories(prev => ({
            ...prev,
            [categoryManager.targetCategory]: [...(prev[categoryManager.targetCategory] || []), categoryManager.newSubcategoryName]
        }));
    } else {
        setIncomeCategories(prev => ({
            ...prev,
            [categoryManager.targetCategory]: [...(prev[categoryManager.targetCategory] || []), categoryManager.newSubcategoryName]
        }));
    }
    setCategoryManager(prev => ({ ...prev, newSubcategoryName: '' }));
  };

  const getActiveSubcategories = (): string[] => {
    if (!newTransaction.category) return [];
    if (newTransaction.type === 'expense') {
        return expenseCategories[newTransaction.category] || [];
    } else {
        return incomeCategories[newTransaction.category] || [];
    }
  };

  const formatDateStr = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
  }

  const activeSubcategories = getActiveSubcategories();
  const currentCategoryList = categoryManager.tab === 'expense' ? expenseCategories : incomeCategories;
  
  const headerTitle = (filters.startDate && filters.endDate) 
    ? `${formatDateStr(filters.startDate)} a ${formatDateStr(filters.endDate)}`
    : getMonthName(currentDate);

  // Helper for Dynamic Icons
  const getCategoryIconComponent = (categoryName: string) => {
      const iconKey = categoryIconMap[categoryName] || 'MoreHorizontal';
      return ICON_REGISTRY[iconKey] || MoreHorizontal;
  };
  
  // Calculate Daily Total Helper
  const getDailyTotal = (entries: FinanceEntry[]) => {
      return entries.reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      
      {/* Header Control Bar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500"><ChevronLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <span className="font-serif text-lg font-bold text-ink capitalize min-w-[180px] text-center">
                        {headerTitle}
                    </span>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500"><ChevronRight size={20} /></button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center">
                <button 
                    onClick={handleShare}
                    className="p-2 text-stone-400 hover:text-ink transition-colors"
                    title="Compartilhar Resumo"
                >
                    <Share2 size={20} />
                </button>
                <button 
                    onClick={() => setShowValues(!showValues)}
                    className="p-2 text-stone-400 hover:text-ink transition-colors"
                    title={showValues ? "Ocultar valores" : "Mostrar valores"}
                >
                    {showValues ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
                <button 
                    onClick={() => setModals({...modals, filter: true})}
                    className={`border px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm
                        ${(filters.paymentMethods.length > 0 || filters.startDate) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}
                    `}
                >
                    <Filter size={16} /> Filtrar
                </button>
                <button 
                    onClick={() => setModals({...modals, categories: true})}
                    className="bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-lg font-medium text-sm hover:bg-stone-50 flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Tags size={16} /> Categorias
                </button>
                <button 
                    onClick={() => setModals({...modals, export: true})}
                    className="bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-lg font-medium text-sm hover:bg-stone-50 flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Download size={16} /> Exportar
                </button>
                <button 
                    onClick={() => setModals({...modals, import: true})}
                    className="bg-white border border-stone-200 text-stone-600 px-3 py-2 rounded-lg font-medium text-sm hover:bg-stone-50 flex items-center gap-2 transition-colors shadow-sm"
                >
                    <UploadCloud size={16} /> Importar
                </button>
                <button 
                    onClick={() => setModals({...modals, transaction: true})}
                    className="bg-ink text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-stone-800 flex items-center gap-2 transition-colors shadow-md"
                >
                    <Plus size={16} /> Transação
                </button>
            </div>
        </div>

        {/* Active Filters Badges */}
        {(filters.startDate || filters.paymentMethods.length > 0 || (filters.categories as string[]).length > 0 || filters.type !== 'all') && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-400 py-1">Filtros Ativos:</span>
                
                {filters.startDate && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                        <Calendar size={10} /> {formatDateStr(filters.startDate)} - {formatDateStr(filters.endDate)}
                    </span>
                )}
                
                {filters.type !== 'all' && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100 capitalize">
                         Tipo: {filters.type === 'income' ? 'Receitas' : 'Despesas'}
                    </span>
                )}

                {filters.paymentMethods.map(pm => (
                    <span key={pm} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100">
                        {pm}
                    </span>
                ))}
                
                {(filters.categories as string[]).map(cat => (
                    <span key={cat} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                        {cat}
                    </span>
                ))}

                <button onClick={clearFilters} className="text-[10px] text-stone-400 hover:text-red-500 underline ml-2">
                    Limpar Filtros
                </button>
            </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col justify-between h-32">
          <p className="text-sm text-stone-500 font-medium">Saldo Acumulado (Contas)</p>
          <p className={`text-2xl font-bold ${consolidatedBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(consolidatedBalance)}
          </p>
        </div>

        {/* Income Card - Now Clickable */}
        <div 
            onClick={() => setModals({...modals, incomeDetails: true})}
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col justify-between h-32 cursor-pointer hover:bg-stone-50 hover:scale-[1.02] transition-all group relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-125 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <p className="text-sm text-stone-500 font-medium">Receitas {(filters.startDate || filters.paymentMethods.length > 0) ? 'do Período' : 'do Mês'}</p>
            <div className="bg-green-100 p-1.5 rounded-full text-green-600 group-hover:bg-green-200 transition-colors">
                <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600 relative z-10">{formatCurrency(totalIncome)}</p>
          <p className="text-[10px] text-stone-400 mt-1 relative z-10 font-medium flex items-center gap-1">
              Ver Extrato <ChevronRight size={10} />
          </p>
        </div>

        {/* Expense Card - Now Clickable */}
        <div 
             onClick={() => setModals({...modals, expenseDetails: true})}
            className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col justify-between h-32 cursor-pointer hover:bg-stone-50 hover:scale-[1.02] transition-all group relative overflow-hidden"
        >
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-125 transition-transform"></div>
           <div className="flex justify-between items-start relative z-10">
            <p className="text-sm text-stone-500 font-medium">Despesas {(filters.startDate || filters.paymentMethods.length > 0) ? 'do Período' : 'do Mês'}</p>
            <div className="bg-red-100 p-1.5 rounded-full text-red-600 group-hover:bg-red-200 transition-colors">
                <TrendingDown size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 relative z-10">{formatCurrency(totalExpense)}</p>
          <p className="text-[10px] text-stone-400 mt-1 relative z-10 font-medium flex items-center gap-1">
              Ver Extrato <ChevronRight size={10} />
          </p>
        </div>
      </div>

      {/* Main Grid: Accounts & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: My Accounts */}
        <div className="space-y-6">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                        <Landmark size={18} className="text-stone-600" />
                        Minhas Contas
                    </h3>
                    <button 
                        onClick={() => {
                            setEditingAccount(null);
                            setNewAccount({ name: '', balance: '' });
                            setModals({...modals, account: true});
                        }}
                        className="p-1 hover:bg-stone-100 rounded-full text-stone-500"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="space-y-3">
                    {(accounts as BankAccount[]).map(acc => (
                        <div key={acc.id} className="relative group">
                            <div className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition-colors border border-transparent hover:border-stone-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm ${acc.color}`}>
                                        {acc.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-stone-700 block">{acc.name}</span>
                                        <span className="text-[10px] text-stone-400 uppercase">Conta Corrente</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${acc.balance >= 0 ? 'text-stone-800' : 'text-red-500'}`}>
                                        {formatCurrency(acc.balance)}
                                    </span>
                                    {/* Action Menu Trigger */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveMenuAccountId(activeMenuAccountId === acc.id ? null : acc.id); }}
                                        className="p-1 text-stone-300 hover:text-stone-600 rounded-full hover:bg-stone-200 transition-colors account-menu-trigger"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Account Dropdown Menu */}
                            {activeMenuAccountId === acc.id && (
                                <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl border border-stone-100 z-20 w-48 py-1 animate-fade-in origin-top-right">
                                    <button 
                                        onClick={() => openEditAccount(acc)}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                                    >
                                        <Edit2 size={14} className="text-stone-400" /> Editar Conta
                                    </button>
                                    <button 
                                        onClick={() => openAccountTransaction(acc)}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                                    >
                                        <DollarSign size={14} className="text-stone-400" /> Transação
                                    </button>
                                    <button 
                                        onClick={() => openAdjustBalance(acc)}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 flex items-center gap-2"
                                    >
                                        <Sliders size={14} className="text-stone-400" /> Reajuste de Saldo
                                    </button>
                                    <div className="my-1 border-t border-stone-100"></div>
                                    <button 
                                        onClick={() => handleDeleteAccount(acc.id)}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Archive size={14} /> Arquivar/Excluir
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Advisor Widget */}
            <div className="bg-white/60 border border-accent/20 rounded-xl p-5">
                 <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
                        <Sparkles size={14} className="text-accent" />
                        Consultor IA
                    </h3>
                </div>
                <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                    {aiAdvice ? "Análise concluída." : "Toque para analisar seus gastos visíveis e receber dicas de economia."}
                </p>
                 {aiAdvice && (
                    <div className="bg-white p-3 rounded border border-stone-200 text-xs text-stone-600 mb-3 max-h-32 overflow-y-auto">
                        {aiAdvice}
                    </div>
                )}
                <button 
                    onClick={handleAIAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-white border border-stone-200 text-stone-600 py-2 rounded-lg text-xs font-bold hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                    {isAnalyzing ? 'Analisando...' : 'Gerar Análise'}
                </button>
            </div>
        </div>

        {/* Center/Right: Charts Section (Despesas por Categoria) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <h3 className="font-serif text-lg text-ink mb-6">Despesas por Categoria</h3>
            {expensesByCategory.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-1/2 h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expensesByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {expensesByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="block text-xs text-stone-400 font-bold uppercase">Total</span>
                            <span className="block text-lg font-bold text-stone-700">{formatCurrency(totalExpense)}</span>
                        </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {expensesByCategory.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-stone-600">{item.name}</p>
                                    <p className="text-xs text-stone-400">{((item.value / totalExpense) * 100).toFixed(0)}%</p>
                                </div>
                                <p className="text-xs font-bold text-stone-700">{formatCurrency(item.value)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-stone-400">
                    <p className="text-sm italic">Nenhuma despesa no período selecionado.</p>
                </div>
            )}
        </div>
      </div>

      {/* Credit Cards Scroll Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                <CreditCard size={20} className="text-indigo-600" />
                Cartões de Crédito
            </h3>
            <button 
                onClick={() => {
                  setEditingCard(null);
                  setNewCard({ name: '', limit: '', currentInvoice: '', closingDate: '' });
                  setModals({...modals, card: true});
                }}
                className="text-sm text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
                <Plus size={16} /> Adicionar Cartão
            </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {(creditCards as CreditCardModel[]).map(card => (
                <div key={card.id} className={`min-w-[320px] bg-gradient-to-br ${card.color} p-6 rounded-xl shadow-lg text-white relative overflow-hidden shrink-0 transform hover:-translate-y-1 transition-transform group`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    
                    {/* Menu Button */}
                    <div className="absolute top-4 right-4 z-20">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenuCardId(activeMenuCardId === card.id ? null : card.id); }}
                            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors card-menu-trigger"
                         >
                            <MoreVertical size={18} />
                         </button>

                         {/* Card Dropdown Menu */}
                         {activeMenuCardId === card.id && (
                             <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-stone-100 z-30 w-48 py-1 animate-fade-in origin-top-right text-stone-700">
                                <button 
                                    onClick={() => handleEditCard(card)}
                                    className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-stone-50 flex items-center gap-2"
                                >
                                    <Edit2 size={14} className="text-stone-400" /> Editar
                                </button>
                                <button 
                                    onClick={() => openCardDetails(card, 'fixed')}
                                    className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-stone-50 flex items-center gap-2"
                                >
                                    <Receipt size={14} className="text-stone-400" /> Despesas Fixas
                                </button>
                                <button 
                                    onClick={() => openCardDetails(card, 'chart')}
                                    className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-stone-50 flex items-center gap-2"
                                >
                                    <PieChartIcon size={14} className="text-stone-400" /> Gráfico de Despesas
                                </button>
                                <button 
                                    onClick={() => openCardDetails(card, 'history')}
                                    className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-stone-50 flex items-center gap-2"
                                >
                                    <History size={14} className="text-stone-400" /> Histórico de Faturas
                                </button>
                                <div className="my-1 border-t border-stone-100"></div>
                                <button 
                                    onClick={() => handleArchiveCard(card.id)}
                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Archive size={14} /> Arquivar
                                </button>
                             </div>
                         )}
                    </div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Cartão de Crédito</p>
                            <p className="font-serif text-xl">{card.name}</p>
                        </div>
                        <CreditCard className="text-white/50 mr-8" />
                    </div>
                    
                    <div className="mb-4 relative z-10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-white/70 mb-1">Fatura Atual (Vence dia {card.closingDate})</p>
                                <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(card.currentInvoice)}</p>
                            </div>
                            {card.currentInvoice > 0 && (
                                <button 
                                    onClick={() => handleOpenPayInvoice(card)}
                                    className="bg-white text-indigo-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-50 hover:scale-105 transition-all flex items-center gap-1"
                                >
                                    Pagar Fatura
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between text-[10px] text-white/70 mb-1">
                            <span>Limite usado</span>
                            <span>{formatCurrency(card.limit)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white/80 rounded-full" 
                                style={{ width: `${Math.min((card.currentInvoice / card.limit) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            ))}
            
            <button 
                onClick={() => {
                  setEditingCard(null);
                  setNewCard({ name: '', limit: '', currentInvoice: '', closingDate: '' });
                  setModals({...modals, card: true});
                }}
                className="min-w-[100px] bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-colors shrink-0"
            >
                <Plus size={24} />
                <span className="text-xs font-bold mt-2">Novo Cartão</span>
            </button>
        </div>
      </section>

      {/* Detailed Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
            <h3 className="font-serif text-lg text-ink">Histórico Detalhado</h3>
            {filteredEntries.length > 0 && (
                <span className="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-1 rounded-md">
                    {filteredEntries.length} lançamentos
                </span>
            )}
        </div>
        
        {Object.keys(groupedEntries).length === 0 ? (
             <div className="p-8 text-center text-stone-400">
                Nenhuma transação encontrada para este filtro.
            </div>
        ) : (
            <div className="divide-y divide-stone-100">
                {Object.entries(groupedEntries).map(([dateLabel, dateEntries]: [string, FinanceEntry[]]) => (
                    <div key={dateLabel}>
                        <div className="bg-stone-50 px-4 py-2 border-b border-stone-100 sticky top-0">
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{dateLabel}</p>
                        </div>
                        <div className="divide-y divide-stone-50">
                            {dateEntries.map(entry => {
                                const Icon = getCategoryIconComponent(entry.category);
                                const colorClass = CATEGORY_COLORS[entry.category] || 'bg-stone-100 text-stone-600';
                                
                                return (
                                    <div key={entry.id} className="p-4 flex items-center hover:bg-stone-50 transition-colors group">
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} mr-4 shrink-0`}>
                                            <Icon size={20} />
                                        </div>
                                        
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-sm font-bold text-stone-800 truncate">{entry.description}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs text-stone-500 font-medium bg-stone-100 px-1.5 py-0.5 rounded">{entry.category}</span>
                                                {entry.subcategory && (
                                                    <span className="text-xs text-stone-500 flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                                                        {entry.subcategory}
                                                    </span>
                                                )}
                                                {entry.paymentMethod && (
                                                    <span className="text-[10px] font-bold text-stone-400 border border-stone-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        {entry.paymentMethod}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className={`text-right pl-4 ${entry.type === 'income' ? 'text-green-600' : 'text-stone-800'}`}>
                                            <p className="font-bold whitespace-nowrap">
                                                {entry.type === 'expense' ? '-' : '+'} {formatCurrency(entry.amount)}
                                            </p>
                                            <p className="text-[10px] text-stone-400 font-medium">
                                                {entry.type === 'income' ? 'Receita' : 'Despesa'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Floating Action Button for Quick Expense (Mobills Style) */}
      <button 
          onClick={openNewQuickExpense}
          className="fixed bottom-6 right-6 w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-red-700 transition-all z-40 group"
          title="Adicionar Despesa Rápida"
      >
          <Plus size={32} />
          <span className="absolute right-full mr-4 bg-stone-800 text-white text-xs font-bold py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Nova Despesa
          </span>
      </button>

      {/* --- Modals --- */}

      {/* INCOME DETAILS MODAL (Extract) */}
      {modals.incomeDetails && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col relative">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white z-10 relative">
                    <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-600" />
                        Receitas
                    </h3>
                    <button onClick={() => setModals({...modals, incomeDetails: false})} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>

                {/* Month Navigator & Summary */}
                <div className="bg-stone-50 p-4 border-b border-stone-100">
                     <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-lg text-stone-500 shadow-sm border border-stone-100 hover:bg-stone-50"><ChevronLeft size={16} /></button>
                        <span className="font-serif font-bold text-stone-700 capitalize text-lg">{getMonthName(currentDate)}</span>
                        <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-lg text-stone-500 shadow-sm border border-stone-100 hover:bg-stone-50"><ChevronRight size={16} /></button>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Saldo do Mês</p>
                        <p className="text-3xl font-bold text-green-600 tracking-tight">{formatCurrency(totalIncomeForModal)}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-stone-50 p-4">
                     {Object.keys(groupedIncomeEntries).length === 0 ? (
                        <div className="text-center py-12 text-stone-400 flex flex-col items-center">
                            <Wallet size={48} className="mb-4 opacity-20" />
                            <p className="text-sm italic">Nenhuma receita registrada neste mês.</p>
                        </div>
                     ) : (
                         <div className="space-y-6 pb-20">
                             {Object.entries(groupedIncomeEntries).map(([dateLabel, entries]: [string, FinanceEntry[]]) => {
                                 const dailyTotal = getDailyTotal(entries);
                                 return (
                                     <div key={dateLabel}>
                                         <div className="flex justify-between items-end mb-2 px-1">
                                             <h4 className="text-xs font-bold text-stone-500 uppercase">{dateLabel}</h4>
                                             <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                                 + {formatCurrency(dailyTotal)}
                                             </span>
                                         </div>
                                         <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                                             {entries.map((entry, idx) => {
                                                 const Icon = getCategoryIconComponent(entry.category);
                                                 return (
                                                     <div key={entry.id} className={`p-4 flex items-center gap-3 hover:bg-stone-50/50 transition-colors ${idx !== entries.length - 1 ? 'border-b border-stone-50' : ''}`}>
                                                         {/* Icon Category */}
                                                         <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                                                             <Icon size={18} />
                                                         </div>
                                                         
                                                         {/* Details */}
                                                         <div className="flex-1 min-w-0">
                                                             <p className="text-sm font-bold text-stone-800 truncate">{entry.description}</p>
                                                             <div className="flex items-center gap-2 mt-0.5">
                                                                 <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wide bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">
                                                                    {entry.paymentMethod || 'Conta'}
                                                                 </span>
                                                                 <span className="text-xs text-stone-500 truncate">{entry.category}</span>
                                                             </div>
                                                         </div>

                                                         {/* Value */}
                                                         <p className="text-sm font-bold text-green-600 whitespace-nowrap">
                                                             + {formatCurrency(entry.amount)}
                                                         </p>
                                                     </div>
                                                 )
                                             })}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     )}
                </div>

                {/* Floating Add Button inside Modal */}
                <div className="absolute bottom-6 right-6">
                    <button 
                        onClick={openNewQuickIncome}
                        className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 hover:scale-105 transition-all group"
                        title="Nova Receita"
                    >
                        <Plus size={28} />
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* EXPENSE DETAILS MODAL (Extract) */}
      {modals.expenseDetails && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col relative">
                 <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white z-10 relative">
                    <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                        <TrendingDown size={20} className="text-red-600" />
                        Despesas
                    </h3>
                    <button onClick={() => setModals({...modals, expenseDetails: false})} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>

                {/* Month Navigator & Summary */}
                <div className="bg-stone-50 p-4 border-b border-stone-100">
                     <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-lg text-stone-500 shadow-sm border border-stone-100 hover:bg-stone-50"><ChevronLeft size={16} /></button>
                        <span className="font-serif font-bold text-stone-700 capitalize text-lg">{getMonthName(currentDate)}</span>
                        <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-lg text-stone-500 shadow-sm border border-stone-100 hover:bg-stone-50"><ChevronRight size={16} /></button>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total Gasto</p>
                        <p className="text-3xl font-bold text-red-600 tracking-tight">{formatCurrency(totalExpenseForModal)}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-stone-50 p-4">
                     {Object.keys(groupedExpenseEntries).length === 0 ? (
                        <div className="text-center py-12 text-stone-400 flex flex-col items-center">
                            <ShoppingCart size={48} className="mb-4 opacity-20" />
                            <p className="text-sm italic">Nenhuma despesa registrada neste mês.</p>
                        </div>
                     ) : (
                         <div className="space-y-6 pb-20">
                             {Object.entries(groupedExpenseEntries).map(([dateLabel, entries]: [string, FinanceEntry[]]) => {
                                 const dailyTotal = getDailyTotal(entries);
                                 return (
                                     <div key={dateLabel}>
                                         <div className="flex justify-between items-end mb-2 px-1">
                                             <h4 className="text-xs font-bold text-stone-500 uppercase">{dateLabel}</h4>
                                             <span className="text-[10px] font-bold text-stone-500 bg-stone-200/50 px-2 py-0.5 rounded border border-stone-200">
                                                 - {formatCurrency(dailyTotal)}
                                             </span>
                                         </div>
                                         <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                                             {entries.map((entry, idx) => {
                                                 const Icon = getCategoryIconComponent(entry.category);
                                                 const colorClass = CATEGORY_COLORS[entry.category] || 'bg-stone-100 text-stone-600';
                                                 
                                                 return (
                                                     <div key={entry.id} className={`p-4 flex items-center gap-3 hover:bg-stone-50/50 transition-colors ${idx !== entries.length - 1 ? 'border-b border-stone-50' : ''}`}>
                                                         {/* Icon Category */}
                                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                                             <Icon size={18} />
                                                         </div>
                                                         
                                                         {/* Details */}
                                                         <div className="flex-1 min-w-0">
                                                             <p className="text-sm font-bold text-stone-800 truncate">{entry.description}</p>
                                                             <div className="flex items-center gap-2 mt-0.5">
                                                                 <span className="text-[10px] text-stone-500 font-medium uppercase tracking-wide bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                                                    {entry.paymentMethod || 'Conta'}
                                                                 </span>
                                                                 <span className="text-xs text-stone-500 truncate">{entry.category}</span>
                                                             </div>
                                                         </div>

                                                         {/* Value */}
                                                         <p className="text-sm font-bold text-stone-800 whitespace-nowrap">
                                                             - {formatCurrency(entry.amount)}
                                                         </p>
                                                     </div>
                                                 )
                                             })}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     )}
                </div>

                {/* Floating Add Button inside Modal */}
                <div className="absolute bottom-6 right-6">
                    <button 
                        onClick={openNewQuickExpense}
                        className="w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 hover:scale-105 transition-all group"
                        title="Nova Despesa"
                    >
                        <Plus size={28} />
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* PAY INVOICE MODAL */}
      {modals.payInvoice && selectedCardForAction && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl text-ink">Pagar Fatura</h3>
                    <button onClick={() => setModals({...modals, payInvoice: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-center">
                    <p className="text-xs text-indigo-500 font-bold uppercase mb-1">Fatura Atual de {selectedCardForAction.name}</p>
                    <p className="text-2xl font-bold text-indigo-900">{formatCurrency(selectedCardForAction.currentInvoice)}</p>
                </div>

                <form onSubmit={handlePayInvoiceSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Valor do Pagamento</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={invoicePayment.amount}
                            onChange={e => setInvoicePayment({...invoicePayment, amount: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-lg font-bold focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Pagar com a Conta</label>
                        <select 
                            value={invoicePayment.sourceAccountId}
                            onChange={e => setInvoicePayment({...invoicePayment, sourceAccountId: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 focus:outline-none focus:border-indigo-500"
                            required
                        >
                            <option value="">Selecione uma conta...</option>
                            {(accounts as BankAccount[]).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (Saldo: {formatCurrency(acc.balance)})</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Data do Pagamento</label>
                        <input 
                            type="date"
                            value={invoicePayment.date}
                            onChange={e => setInvoicePayment({...invoicePayment, date: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} /> Confirmar Pagamento
                    </button>
                    <p className="text-[10px] text-stone-400 text-center">
                        O valor será debitado da conta selecionada e o limite do cartão será liberado.
                    </p>
                </form>
            </div>
        </div>
      )}

      {/* CARD DETAILS MODAL (Chart, History, Fixed) */}
      {modals.cardDetails && selectedCardForAction && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto flex flex-col">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                      <div>
                          <p className="text-xs text-stone-400 uppercase font-bold">Detalhes do Cartão</p>
                          <h3 className="font-serif text-xl text-ink">{selectedCardForAction.name}</h3>
                      </div>
                      <button onClick={() => setModals({...modals, cardDetails: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 shrink-0 bg-stone-100 p-1 rounded-lg">
                      <button 
                          onClick={() => setCardDetailsTab('chart')} 
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${cardDetailsTab === 'chart' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}
                      >
                          Gráfico
                      </button>
                      <button 
                          onClick={() => setCardDetailsTab('history')} 
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${cardDetailsTab === 'history' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}
                      >
                          Histórico
                      </button>
                      <button 
                          onClick={() => setCardDetailsTab('fixed')} 
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${cardDetailsTab === 'fixed' ? 'bg-white shadow text-stone-800' : 'text-stone-500'}`}
                      >
                          Fixas
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {cardDetailsTab === 'chart' && (
                          <div className="h-64 flex flex-col items-center justify-center">
                              {getCardTransactions(selectedCardForAction.name).filter(e => e.type === 'expense').length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                          <Pie
                                              data={getCardExpensesByCat(selectedCardForAction.name)}
                                              cx="50%"
                                              cy="50%"
                                              innerRadius={60}
                                              outerRadius={80}
                                              paddingAngle={5}
                                              dataKey="value"
                                          >
                                              {getCardExpensesByCat(selectedCardForAction.name).map((entry, index) => (
                                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                              ))}
                                          </Pie>
                                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                      </PieChart>
                                  </ResponsiveContainer>
                              ) : (
                                  <p className="text-stone-400 text-sm italic">Sem dados de despesa para este cartão.</p>
                              )}
                          </div>
                      )}

                      {cardDetailsTab === 'history' && (
                          <div className="space-y-2">
                              {getCardTransactions(selectedCardForAction.name).map(t => (
                                  <div key={t.id} className="flex justify-between items-center p-3 border border-stone-100 rounded-lg hover:bg-stone-50">
                                      <div>
                                          <p className="text-sm font-bold text-stone-700">{t.description}</p>
                                          <p className="text-xs text-stone-400">{t.date} • {t.category}</p>
                                      </div>
                                      <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-stone-800'}`}>
                                          {t.type === 'expense' ? '-' : '+'} {formatCurrency(t.amount)}
                                      </p>
                                  </div>
                              ))}
                              {getCardTransactions(selectedCardForAction.name).length === 0 && (
                                  <p className="text-center text-stone-400 text-sm py-4">Nenhuma transação registrada.</p>
                              )}
                          </div>
                      )}

                      {cardDetailsTab === 'fixed' && (
                          <div className="space-y-2">
                              <p className="text-xs text-stone-400 mb-2 italic">Identificamos estes gastos como possivelmente recorrentes:</p>
                              {getFixedExpensesGuess(selectedCardForAction.name).map(t => (
                                  <div key={t.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-100">
                                      <div className="flex items-center gap-3">
                                          <div className="bg-white p-2 rounded-full border border-stone-200 text-stone-400">
                                              <CalendarClock size={16} />
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-stone-700">{t.description}</p>
                                              <p className="text-xs text-stone-400">{t.category}</p>
                                          </div>
                                      </div>
                                      <p className="text-sm font-bold text-stone-800">{formatCurrency(t.amount)}</p>
                                  </div>
                              ))}
                               {getFixedExpensesGuess(selectedCardForAction.name).length === 0 && (
                                  <p className="text-center text-stone-400 text-sm py-4">Nenhuma despesa fixa identificada automaticamente.</p>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      
      {/* Filter Modal (Enhanced) */}
      {modals.filter && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                        <Filter size={20} /> Filtrar Transações
                    </h3>
                    <button onClick={() => setModals({...modals, filter: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleFilterSubmit} className="space-y-6">
                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Período</label>
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                            <button type="button" onClick={() => setQuickDateFilter('today')} className="whitespace-nowrap px-3 py-1.5 bg-stone-100 rounded-lg text-xs font-medium hover:bg-stone-200 text-stone-600">Hoje</button>
                            <button type="button" onClick={() => setQuickDateFilter('week')} className="whitespace-nowrap px-3 py-1.5 bg-stone-100 rounded-lg text-xs font-medium hover:bg-stone-200 text-stone-600">Esta Semana</button>
                            <button type="button" onClick={() => setQuickDateFilter('month')} className="whitespace-nowrap px-3 py-1.5 bg-stone-100 rounded-lg text-xs font-medium hover:bg-stone-200 text-stone-600">Este Mês</button>
                            <button type="button" onClick={() => setQuickDateFilter('year')} className="whitespace-nowrap px-3 py-1.5 bg-stone-100 rounded-lg text-xs font-medium hover:bg-stone-200 text-stone-600">Este Ano</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-[10px] text-stone-400 block mb-1">De</span>
                                <input 
                                    type="date" 
                                    value={filters.startDate}
                                    onChange={e => setFilters({...filters, startDate: e.target.value})}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <span className="text-[10px] text-stone-400 block mb-1">Até</span>
                                <input 
                                    type="date" 
                                    value={filters.endDate}
                                    onChange={e => setFilters({...filters, endDate: e.target.value})}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Transaction Type */}
                     <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Tipo de Lançamento</label>
                        <div className="flex gap-2 bg-stone-50 p-1 rounded-lg">
                            {(['all', 'income', 'expense'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFilters({...filters, type})}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded capitalize transition-all ${filters.type === type ? 'bg-white shadow text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                                >
                                    {type === 'all' ? 'Todos' : type === 'income' ? 'Receitas' : 'Despesas'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accounts & Cards (Multi-select) */}
                    <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Contas e Cartões</label>
                         <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                             {(accounts as BankAccount[]).map(acc => (
                                 <button 
                                     key={acc.id}
                                     type="button"
                                     onClick={() => toggleFilterPaymentMethod(acc.name)}
                                     className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                                         filters.paymentMethods.includes(acc.name) 
                                         ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                         : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                     }`}
                                 >
                                     <Landmark size={12} /> {acc.name}
                                 </button>
                             ))}
                              {(creditCards as CreditCardModel[]).map(card => (
                                 <button 
                                     key={card.id}
                                     type="button"
                                     onClick={() => toggleFilterPaymentMethod(card.name)}
                                     className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                                         filters.paymentMethods.includes(card.name) 
                                         ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                         : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                     }`}
                                 >
                                     <CreditCard size={12} /> {card.name}
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Categories (Multi-select) */}
                    <div>
                         <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Categorias</label>
                         <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1 bg-stone-50/50 rounded-lg">
                             {([...new Set([...Object.keys(expenseCategories || {}), ...Object.keys(incomeCategories || {})])] as string[]).sort().map(cat => (
                                 <button 
                                     key={cat}
                                     type="button"
                                     onClick={() => toggleFilterCategory(cat)}
                                     className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                         (filters.categories as string[]).includes(cat) 
                                         ? 'bg-green-50 border-green-200 text-green-700' 
                                         : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                     }`}
                                 >
                                     {cat}
                                 </button>
                             ))}
                         </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={clearFilters}
                            className="flex-1 bg-stone-100 text-stone-600 py-3 rounded-lg font-bold text-sm hover:bg-stone-200 transition-colors"
                        >
                            Limpar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-[2] bg-ink text-white py-3 rounded-lg font-bold text-sm hover:bg-stone-800 transition-colors"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* Export Modal */}
      {modals.export && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif text-xl text-ink">Exportar Dados</h3>
                      <button onClick={() => setModals(prev => ({...prev, export: false}))} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                  </div>
                  <div className="space-y-3">
                      <p className="text-sm text-stone-600 mb-4">Escolha o formato para baixar seus dados financeiros.</p>
                      
                      <button 
                          onClick={handleExportCSV}
                          className="w-full flex items-center gap-3 p-4 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-left group"
                      >
                          <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-200 transition-colors">
                              <FileText size={24} />
                          </div>
                          <div>
                              <span className="block font-bold text-stone-800">Exportar Transações (CSV)</span>
                              <span className="block text-xs text-stone-500">Ideal para Excel ou Google Sheets.</span>
                          </div>
                      </button>

                      <button 
                          onClick={handleExportJSON}
                          className="w-full flex items-center gap-3 p-4 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-left group"
                      >
                          <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors">
                              <Save size={24} />
                          </div>
                          <div>
                              <span className="block font-bold text-stone-800">Backup Completo (JSON)</span>
                              <span className="block text-xs text-stone-500">Salva contas, cartões e categorias.</span>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Category Management Modal */}
      {modals.categories && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif text-xl text-ink">Gerenciar Categorias</h3>
                      <button onClick={() => setModals({...modals, categories: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                  </div>

                  <div className="flex gap-2 mb-6 border-b border-stone-100 pb-1">
                      <button 
                          onClick={() => setCategoryManager({...categoryManager, tab: 'expense', targetCategory: ''})}
                          className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${categoryManager.tab === 'expense' ? 'border-red-500 text-red-600' : 'border-transparent text-stone-400'}`}
                      >
                          Despesas
                      </button>
                      <button 
                           onClick={() => setCategoryManager({...categoryManager, tab: 'income', targetCategory: ''})}
                           className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${categoryManager.tab === 'income' ? 'border-green-500 text-green-600' : 'border-transparent text-stone-400'}`}
                      >
                          Receitas
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 pr-2">
                      {/* Add New Category Form */}
                      <form onSubmit={handleCreateCategory} className="bg-stone-50 p-4 rounded-lg border border-stone-200 mb-6">
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Nova Categoria Principal</label>
                          <div className="flex gap-2 mb-3">
                              <input 
                                  value={categoryManager.newCategoryName}
                                  onChange={e => setCategoryManager({...categoryManager, newCategoryName: e.target.value})}
                                  placeholder="Ex: Games, Pet, Hobbies..."
                                  className="flex-1 bg-white border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                              />
                              <button type="submit" className="bg-stone-800 text-white px-4 py-2 rounded font-bold text-xs hover:bg-stone-700">
                                  Criar
                              </button>
                          </div>
                          
                          {/* Icon Selector */}
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Ícone da Categoria</label>
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-white rounded border border-stone-100">
                             {Object.entries(ICON_REGISTRY).map(([key, IconComponent]) => (
                                 <button
                                    key={key}
                                    type="button"
                                    onClick={() => setCategoryManager({...categoryManager, selectedIcon: key})}
                                    className={`p-2 rounded hover:bg-stone-100 transition-colors ${categoryManager.selectedIcon === key ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-300' : 'text-stone-500'}`}
                                    title={key}
                                 >
                                     <IconComponent size={18} />
                                 </button>
                             ))}
                          </div>
                      </form>

                      {/* Add Subcategory Form */}
                       <form onSubmit={handleCreateSubcategory} className="bg-stone-50 p-4 rounded-lg border border-stone-200 mb-6">
                          <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Nova Subcategoria</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                <select 
                                    value={categoryManager.targetCategory}
                                    onChange={e => setCategoryManager({...categoryManager, targetCategory: e.target.value})}
                                    className="bg-white border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                >
                                    <option value="">Selecione a Categoria Pai</option>
                                    {Object.keys(currentCategoryList).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <input 
                                    value={categoryManager.newSubcategoryName}
                                    onChange={e => setCategoryManager({...categoryManager, newSubcategoryName: e.target.value})}
                                    placeholder="Ex: Passagens Aéreas"
                                    className="bg-white border border-stone-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                    disabled={!categoryManager.targetCategory}
                                />
                          </div>
                          <button type="submit" disabled={!categoryManager.targetCategory} className="w-full bg-stone-200 text-stone-600 px-4 py-2 rounded font-bold text-xs hover:bg-stone-300 disabled:opacity-50">
                              Adicionar Subcategoria
                          </button>
                      </form>

                      {/* Current List */}
                      <h4 className="text-sm font-bold text-stone-600 mb-3">Categorias Atuais</h4>
                      <div className="space-y-2">
                          {Object.keys(currentCategoryList).map((cat) => {
                              const subList: string[] = currentCategoryList[cat] || [];
                              const Icon = getCategoryIconComponent(cat);
                              return (
                                <div key={cat} className="border border-stone-100 rounded-lg overflow-hidden">
                                    <div className="bg-stone-50 px-4 py-2 font-bold text-sm text-stone-700 flex items-center gap-2">
                                        <Icon size={16} className="text-stone-400" />
                                        {cat}
                                    </div>
                                    {subList && subList.length > 0 ? (
                                        <div className="p-3 flex flex-wrap gap-2 bg-white">
                                            {subList.map((sub: string) => (
                                                <span key={sub} className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full border border-stone-200">
                                                    {sub}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-white text-xs text-stone-300 italic">Sem subcategorias</div>
                                    )}
                                </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add/Edit Account Modal */}
      {modals.account && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl text-ink">
                        {editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
                    </h3>
                    <button onClick={() => setModals({...modals, account: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveAccount} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome do Banco/Carteira</label>
                        <input 
                            value={newAccount.name}
                            onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                            placeholder="Ex: Banco Inter"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Saldo Inicial (R$)</label>
                        <input 
                            type="number"
                            value={newAccount.balance}
                            onChange={e => setNewAccount({...newAccount, balance: e.target.value})}
                            placeholder="0.00"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-ink text-white py-3 rounded-lg font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} /> {editingAccount ? 'Atualizar Conta' : 'Salvar Conta'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {modals.adjustBalance && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                         <Sliders size={20} className="text-stone-500" /> Reajuste de Saldo
                    </h3>
                    <button onClick={() => setModals({...modals, adjustBalance: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                    Defina o saldo atual real da conta <strong>{adjustBalanceData.name}</strong>. Isso não criará uma transação, apenas atualizará o valor exibido.
                </p>
                <form onSubmit={handleSaveBalanceAdjustment} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Novo Saldo (R$)</label>
                        <input 
                            type="number"
                            step="0.01"
                            value={adjustBalanceData.currentBalance}
                            onChange={e => setAdjustBalanceData({...adjustBalanceData, currentBalance: e.target.value})}
                            placeholder="0.00"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-lg font-bold focus:outline-none focus:border-blue-500 text-stone-700"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} /> Confirmar Reajuste
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Add Card Modal */}
      {modals.card && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl text-ink">{editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}</h3>
                    <button onClick={() => setModals({...modals, card: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveCard} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome do Cartão</label>
                        <input 
                            value={newCard.name}
                            onChange={e => setNewCard({...newCard, name: e.target.value})}
                            placeholder="Ex: Nubank Platinum"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Limite (R$)</label>
                            <input 
                                type="number"
                                value={newCard.limit}
                                onChange={e => setNewCard({...newCard, limit: e.target.value})}
                                placeholder="10000"
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        {!editingCard && (
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Fatura Atual</label>
                              <input 
                                  type="number"
                                  value={newCard.currentInvoice}
                                  onChange={e => setNewCard({...newCard, currentInvoice: e.target.value})}
                                  placeholder="0.00"
                                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                              />
                          </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Dia Vencimento</label>
                        <input 
                            type="number"
                            min="1" max="31"
                            value={newCard.closingDate}
                            onChange={e => setNewCard({...newCard, closingDate: e.target.value})}
                            placeholder="Dia (ex: 10)"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button type="submit" className="w-full bg-ink text-white py-3 rounded-lg font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
                        <Save size={18} /> {editingCard ? 'Atualizar Cartão' : 'Salvar Cartão'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Import Mobills Data Modal */}
      {modals.import && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-serif text-xl text-ink">Resgatar Dados</h3>
                        <p className="text-xs text-stone-500 mt-1">Importe seus dados do Mobills ou outros apps.</p>
                    </div>
                    <button onClick={() => setModals(prev => ({...prev, import: false}))} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                    <div className="border border-stone-200 rounded-xl p-4 hover:border-purple-400 transition-colors bg-purple-50/30">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                                <RefreshCw size={20} className={isImporting ? "animate-spin" : ""} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-stone-800">Conectar conta Mobills</h4>
                                <p className="text-xs text-stone-500 mb-3">Sincronize transações e categorias automaticamente.</p>
                                <button 
                                    onClick={handleImportMobills}
                                    disabled={isImporting}
                                    className="text-xs font-bold bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition-colors disabled:opacity-70"
                                >
                                    {isImporting ? 'Sincronizando...' : 'Conectar & Importar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-stone-200"></div>
                        <span className="flex-shrink-0 mx-4 text-xs text-stone-400 font-bold uppercase">Ou</span>
                        <div className="flex-grow border-t border-stone-200"></div>
                    </div>

                    <div 
                        onClick={handleFileUploadClick}
                        className="border-2 border-dashed border-stone-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-stone-50 transition-colors cursor-pointer group"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".csv,.ofx,.xls,.xlsx,.json" 
                            onChange={handleFileChange}
                        />
                        <UploadCloud size={32} className="text-stone-300 group-hover:text-stone-500 mb-2 transition-colors" />
                        <p className="text-sm font-medium text-stone-600">Upload de Arquivo</p>
                        <p className="text-xs text-stone-400 mt-1">Arraste seu arquivo .CSV, .OFX ou Excel aqui</p>
                        <button type="button" className="mt-3 text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1.5 rounded hover:bg-stone-200 pointer-events-none">
                            Selecionar Arquivo
                        </button>
                    </div>
                </div>

                <div className="mt-6 bg-blue-50 p-3 rounded-lg flex gap-3 items-start">
                    <div className="text-blue-500 mt-0.5"><CheckCircle2 size={16} /></div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                        Seus dados serão mesclados com os registros atuais. Categorias similares serão unificadas automaticamente.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* ADD TRANSACTION MODAL */}
      {modals.transaction && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif text-xl text-ink">
                          {newTransaction.type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
                      </h3>
                      <button onClick={() => setModals({...modals, transaction: false})} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                  </div>
                  
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                      <div className="flex p-1 bg-stone-100 rounded-lg">
                          <button 
                              type="button"
                              onClick={() => setNewTransaction({...newTransaction, type: 'expense', category: '', subcategory: ''})}
                              className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${newTransaction.type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-stone-500'}`}
                          >
                              Despesa
                          </button>
                          <button 
                              type="button"
                              onClick={() => setNewTransaction({...newTransaction, type: 'income', category: '', subcategory: ''})}
                              className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${newTransaction.type === 'income' ? 'bg-white text-green-500 shadow-sm' : 'text-stone-500'}`}
                          >
                              Receita
                          </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Valor (R$)</label>
                              <input 
                                  type="number" 
                                  step="0.01"
                                  value={newTransaction.amount}
                                  onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                  placeholder="0,00"
                                  autoFocus
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Data</label>
                              <input 
                                  type="date" 
                                  value={newTransaction.date}
                                  onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                              />
                          </div>
                      </div>

                      <div>
                           <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Descrição</label>
                           <input 
                              type="text" 
                              value={newTransaction.description}
                              onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                              placeholder="Ex: Compras da Semana"
                          />
                      </div>

                       <div>
                           <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Conta / Cartão</label>
                           <select 
                              value={newTransaction.paymentMethod}
                              onChange={e => setNewTransaction({...newTransaction, paymentMethod: e.target.value})}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 text-sm"
                           >
                              <option value="">Selecione a origem</option>
                              <optgroup label="Contas">
                                  {(accounts as BankAccount[]).map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                              </optgroup>
                              <optgroup label="Cartões">
                                  {(creditCards as CreditCardModel[]).map(card => <option key={card.id} value={card.name}>{card.name}</option>)}
                              </optgroup>
                           </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Categoria</label>
                              <select 
                                  value={newTransaction.category}
                                  onChange={e => setNewTransaction({...newTransaction, category: e.target.value, subcategory: ''})}
                                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 text-sm"
                              >
                                  <option value="">Selecione</option>
                                  {(newTransaction.type === 'expense' 
                                      ? Object.keys(expenseCategories)
                                      : Object.keys(incomeCategories)
                                  ).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Subcategoria</label>
                            <select 
                                value={newTransaction.subcategory}
                                onChange={e => setNewTransaction({...newTransaction, subcategory: e.target.value})}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 text-sm"
                                disabled={!newTransaction.category || activeSubcategories.length === 0}
                            >
                                <option value="">{activeSubcategories.length ? 'Selecione' : '-'}</option>
                                {activeSubcategories.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                      </div>

                      <button 
                          type="submit" 
                          className={`w-full py-3 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 mt-2
                             ${newTransaction.type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                          `}
                      >
                          <Plus size={18} /> 
                          {newTransaction.type === 'expense' ? 'Adicionar Despesa' : 'Adicionar Receita'}
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};