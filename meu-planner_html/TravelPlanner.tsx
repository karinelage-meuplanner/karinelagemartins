
import React, { useState, useMemo, useRef } from 'react';
import { 
  Plane, MapPin, Calendar, Luggage, CreditCard, 
  Sparkles, CheckCircle2, Circle, Plus, Trash2, FileText, Share2,
  ArrowLeft, MoreVertical, Palmtree, Tag, X, Save, ChevronDown, ChevronUp,
  Clock, Edit2, DollarSign, Settings, Upload, Download, Eye, ShoppingBag
} from 'lucide-react';
import { suggestTravelItinerary } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleCalendarEvent, FinanceEntry } from '../types';

interface PackingItem {
  id: string;
  text: string;
  category: string; 
  checked: boolean;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  url?: string; // Object URL for current session access
  dateAdded: string;
}

interface TravelShoppingItem {
  id: string;
  item: string;
  estimatedCost: number;
  plannedDate?: string;
  checked: boolean;
}

// Interface principal da Viagem
interface Trip {
  id: string;
  destination: string;
  dates: { start: string; end: string };
  budget: number;
  interests: string;
  itinerary: string;
  packingList: PackingItem[];
  packingCategories: string[]; 
  expenses: Expense[];
  expenseCategories: string[];
  documents: DocumentItem[];
  shoppingList: TravelShoppingItem[]; // New Shopping List
  coverColor: string; 
}

interface Props {
  calendarEvents?: GoogleCalendarEvent[];
  onAddEvent?: (event: GoogleCalendarEvent) => void;
}

const COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-orange-100 text-orange-700', 
  'bg-emerald-100 text-emerald-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700'
];

const DEFAULT_PACKING_CATEGORIES = [
    'Documentos', 'Roupas', 'Higiene', 'Eletrônicos', 
    'Medicamentos', 'Acessórios', 'Calçados', 'Cosméticos', 'Outros'
];

const DEFAULT_EXPENSE_CATEGORIES = [
    'Hospedagem', 'Alimentação', 'Ingressos', 'Transporte', 
    'Uber/Táxi', 'Aluguel de Carro', 'Compras', 'Seguro', 'Outros'
];

export const TravelPlanner: React.FC<Props> = ({ calendarEvents = [], onAddEvent }) => {
  // --- State: Lista de Viagens (Persisted) ---
  const [trips, setTrips] = useLocalStorage<Trip[]>('planner_travel_trips_v6', [
    {
      id: '1',
      destination: 'Paris, França',
      dates: { start: '2024-09-10', end: '2024-09-20' },
      budget: 15000,
      interests: 'Arte, Gastronomia',
      itinerary: '',
      packingList: [
        { id: '1', text: 'Passaporte', category: 'Documentos', checked: true },
        { id: '2', text: 'Adaptador Universal', category: 'Eletrônicos', checked: false }
      ],
      packingCategories: DEFAULT_PACKING_CATEGORIES,
      expenses: [
        { id: '1', description: 'Passagens Aéreas', amount: 4500, category: 'Transporte' }
      ],
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      documents: [
          { id: '1', name: 'Passaporte.pdf', type: 'application/pdf', dateAdded: '2024-05-20' } 
      ],
      shoppingList: [
          { id: '1', item: 'Perfume Duty Free', estimatedCost: 500, plannedDate: '2024-09-10', checked: false }
      ],
      coverColor: 'bg-sky-100 text-sky-700'
    }
  ]);

  // --- INTEGRAÇÃO COM FINANÇAS ---
  const [financeEntries, setFinanceEntries] = useLocalStorage<FinanceEntry[]>('planner_fin_entries', []);

  // --- State: Navegação e UI ---
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estados temporários para inputs
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Roupas');
  
  // Estado para nova categoria customizada (Mala)
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [showCompletedPacking, setShowCompletedPacking] = useState(false);

  // State para Despesas
  const [newExpense, setNewExpense] = useState({ desc: '', amount: '', category: '' });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingExpenseData, setEditingExpenseData] = useState({ desc: '', amount: '', category: '' });
  
  // Gestão de Categorias de Despesas
  const [isManagingExpenseCats, setIsManagingExpenseCats] = useState(false);
  const [newExpenseCategoryName, setNewExpenseCategoryName] = useState('');

  // State para Shopping (Wishlist)
  const [newShopItem, setNewShopItem] = useState({ item: '', cost: '', date: '' });
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editingShopData, setEditingShopData] = useState({ item: '', cost: '', date: '' });
  const [showCompletedShopping, setShowCompletedShopping] = useState(false);

  // Estado para Novo Evento da Viagem
  const [newTripEvent, setNewTripEvent] = useState({
      title: '',
      date: '',
      time: '10:00'
  });

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const activeTrip = useMemo(() => trips.find(t => t.id === activeTripId), [trips, activeTripId]);

  const updateActiveTrip = (updates: Partial<Trip>) => {
    if (!activeTripId) return;
    setTrips(trips.map(t => t.id === activeTripId ? { ...t, ...updates } : t));
  };

  // --- Handlers: Gerenciamento de Viagens ---
  
  const handleCreateTrip = () => {
    const newId = Date.now().toString();
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    const newTrip: Trip = {
      id: newId,
      destination: 'Nova Viagem',
      dates: { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] },
      budget: 5000,
      interests: '',
      itinerary: '',
      packingList: [],
      packingCategories: DEFAULT_PACKING_CATEGORIES,
      expenses: [],
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      documents: [],
      shoppingList: [],
      coverColor: randomColor
    };

    setTrips([...trips, newTrip]);
    setActiveTripId(newId); 
  };

  const handleDeleteTrip = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta viagem e todos os seus dados?')) {
      setTrips(trips.filter(t => t.id !== id));
      if (activeTripId === id) setActiveTripId(null);
    }
  };

  // --- Handlers: Documentos (Upload) ---
  
  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeTrip) return;
      const file = event.target.files?.[0];
      if (!file) return;

      const newDoc: DocumentItem = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file), // Create blob URL for immediate access
          dateAdded: new Date().toISOString().split('T')[0]
      };

      updateActiveTrip({ documents: [...(activeTrip.documents || []), newDoc] });
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteDocument = (docId: string) => {
      if (!activeTrip) return;
      if (confirm('Remover este documento da lista?')) {
          updateActiveTrip({ documents: activeTrip.documents.filter(d => d.id !== docId) });
      }
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
      if (doc.url) {
          window.open(doc.url, '_blank');
      } else {
          alert('Este documento foi salvo em uma sessão anterior. Por limitações de armazenamento do navegador, o arquivo original precisa ser enviado novamente para visualização.');
      }
  };

  // --- Handlers: Shopping Wishlist ---

  const addShoppingItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newShopItem.item || !activeTrip) return;

      const newItem: TravelShoppingItem = {
          id: Date.now().toString(),
          item: newShopItem.item,
          estimatedCost: parseFloat(newShopItem.cost) || 0,
          plannedDate: newShopItem.date,
          checked: false
      };

      updateActiveTrip({ shoppingList: [...(activeTrip.shoppingList || []), newItem] });
      
      // Integration with Calendar
      if (newShopItem.date && onAddEvent) {
          onAddEvent({
              id: `shop-${newItem.id}`,
              summary: `Comprar: ${newItem.item}`,
              description: `Viagem: ${activeTrip.destination}. Valor Est.: R$ ${newItem.estimatedCost}`,
              start: { date: newShopItem.date },
              end: { date: newShopItem.date },
              location: activeTrip.destination
          });
      }

      setNewShopItem({ item: '', cost: '', date: '' });
  };

  const toggleShoppingItem = (id: string) => {
      if (!activeTrip) return;
      const updatedList = (activeTrip.shoppingList || []).map(i => i.id === id ? { ...i, checked: !i.checked } : i);
      updateActiveTrip({ shoppingList: updatedList });
  };

  const deleteShoppingItem = (id: string) => {
      if (!activeTrip) return;
      if (confirm('Excluir este item da wishlist?')) {
          updateActiveTrip({ shoppingList: (activeTrip.shoppingList || []).filter(i => i.id !== id) });
      }
  };

  const startEditShopping = (item: TravelShoppingItem) => {
      setEditingShopId(item.id);
      setEditingShopData({ 
          item: item.item, 
          cost: item.estimatedCost.toString(), 
          date: item.plannedDate || '' 
      });
  };

  const saveEditShopping = () => {
      if (!activeTrip || !editingShopId) return;
      const updatedList = (activeTrip.shoppingList || []).map(i => {
          if (i.id === editingShopId) {
              const updatedItem = { 
                  ...i, 
                  item: editingShopData.item, 
                  estimatedCost: parseFloat(editingShopData.cost) || 0,
                  plannedDate: editingShopData.date 
              };
              
              // Update calendar event if date exists
              if (editingShopData.date && onAddEvent) {
                  onAddEvent({
                      id: `shop-${i.id}`,
                      summary: `Comprar: ${updatedItem.item}`,
                      description: `Viagem: ${activeTrip.destination}. Valor Est.: R$ ${updatedItem.estimatedCost}`,
                      start: { date: updatedItem.plannedDate },
                      end: { date: updatedItem.plannedDate },
                      location: activeTrip.destination
                  });
              }
              return updatedItem;
          }
          return i;
      });
      
      updateActiveTrip({ shoppingList: updatedList });
      setEditingShopId(null);
  };

  // --- Handlers: Itinerary, Packing, Expenses ---

  const handleGenerateItinerary = async () => {
    if (!activeTrip) return;
    if (!activeTrip.destination || activeTrip.destination === 'Nova Viagem') {
        alert('Por favor, defina o destino da viagem antes de gerar o roteiro.');
        return;
    }

    setIsGenerating(true);
    
    let durationStr = '3';
    if (activeTrip.dates.start && activeTrip.dates.end) {
        const start = new Date(activeTrip.dates.start).getTime();
        const end = new Date(activeTrip.dates.end).getTime();
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; 
        durationStr = days > 0 ? days.toString() : '3';
    }

    const result = await suggestTravelItinerary(
        activeTrip.destination, 
        durationStr, 
        `Orçamento total aprox: R$ ${activeTrip.budget}`, 
        activeTrip.interests || 'Pontos turísticos clássicos e cultura local'
    );
    
    updateActiveTrip({ itinerary: result });
    setIsGenerating(false);
  };

  const handleShareItinerary = async () => {
      if (!activeTrip?.itinerary) return;
      const text = `✈️ *Roteiro para ${activeTrip.destination}*\n\n${activeTrip.itinerary}`;

      if (navigator.share) {
          try {
              await navigator.share({ title: `Viagem ${activeTrip.destination}`, text });
          } catch (err) { console.log(err); }
      } else {
          navigator.clipboard.writeText(text);
          alert('Roteiro copiado!');
      }
  }

  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCustomCategory.trim() || !activeTrip) return;
      const updatedCategories = [...(activeTrip.packingCategories || DEFAULT_PACKING_CATEGORIES), newCustomCategory];
      updateActiveTrip({ packingCategories: updatedCategories });
      setNewCategory(newCustomCategory);
      setNewCustomCategory('');
      setIsAddingCategory(false);
  };

  const addPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !activeTrip) return;
    const newItemObj: PackingItem = { 
        id: Date.now().toString(), 
        text: newItem, 
        category: newCategory, 
        checked: false 
    };
    updateActiveTrip({ packingList: [...activeTrip.packingList, newItemObj] });
    setNewItem('');
  };

  const togglePackingItem = (id: string) => {
    if (!activeTrip) return;
    const newList = activeTrip.packingList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    updateActiveTrip({ packingList: newList });
  };

  const deletePackingItem = (id: string) => {
      if (!activeTrip) return;
      if (confirm('Excluir este item?')) {
          updateActiveTrip({ packingList: activeTrip.packingList.filter(i => i.id !== id) });
      }
  };

  const handleAddExpenseCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newExpenseCategoryName.trim() || !activeTrip) return;
      const currentCats = activeTrip.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
      updateActiveTrip({ expenseCategories: [...currentCats, newExpenseCategoryName] });
      setNewExpenseCategoryName('');
  };

  const handleDeleteExpenseCategory = (catToDelete: string) => {
      if (!activeTrip) return;
      if (confirm(`Excluir a categoria "${catToDelete}"?`)) {
          const currentCats = activeTrip.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
          updateActiveTrip({ expenseCategories: currentCats.filter(c => c !== catToDelete) });
      }
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.desc || !newExpense.amount || !activeTrip) return;
    const expenseId = Date.now().toString();
    const amountVal = parseFloat(newExpense.amount);
    const category = newExpense.category || 'Outros';

    const newExpObj: Expense = { 
        id: expenseId, 
        description: newExpense.desc, 
        amount: amountVal, 
        category: category 
    };
    updateActiveTrip({ expenses: [...activeTrip.expenses, newExpObj] });

    const financeEntry: FinanceEntry = {
        id: expenseId,
        type: 'expense',
        category: 'Lazer',
        subcategory: 'Viagens',
        amount: amountVal,
        description: `[${activeTrip.destination}] ${category}: ${newExpense.desc}`,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Outros'
    };
    setFinanceEntries([...financeEntries, financeEntry]);
    setNewExpense({ desc: '', amount: '', category: '' });
  };

  const startEditExpense = (exp: Expense) => {
      setEditingExpenseId(exp.id);
      setEditingExpenseData({ desc: exp.description, amount: exp.amount.toString(), category: exp.category });
  };

  const saveEditExpense = () => {
      if (!activeTrip || !editingExpenseId) return;
      const amountVal = parseFloat(editingExpenseData.amount);
      const category = editingExpenseData.category || 'Outros';

      const updatedExpenses = activeTrip.expenses.map(exp => 
          exp.id === editingExpenseId 
          ? { ...exp, description: editingExpenseData.desc, amount: amountVal, category: category }
          : exp
      );
      updateActiveTrip({ expenses: updatedExpenses });

      const updatedFinanceEntries = financeEntries.map(entry => 
          entry.id === editingExpenseId
          ? { 
              ...entry, 
              amount: amountVal, 
              description: `[${activeTrip.destination}] ${category}: ${editingExpenseData.desc}`
            }
          : entry
      );
      setFinanceEntries(updatedFinanceEntries);
      setEditingExpenseId(null);
  };

  const deleteExpense = (id: string) => {
      if (!activeTrip) return;
      if (confirm('Excluir esta despesa? Isso também removerá o registro em "Minhas Finanças".')) {
          updateActiveTrip({ expenses: activeTrip.expenses.filter(e => e.id !== id) });
          setFinanceEntries(financeEntries.filter(e => e.id !== id));
      }
  };

  const handleAddTripEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTripEvent.title || !newTripEvent.date || !activeTrip) return;

      if (onAddEvent) {
          const startDateTime = new Date(`${newTripEvent.date}T${newTripEvent.time}:00`);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

          const event: GoogleCalendarEvent = {
              id: 'manual-trip-' + Date.now(),
              summary: `${activeTrip.destination}: ${newTripEvent.title}`,
              description: 'Evento da Viagem',
              start: { dateTime: startDateTime.toISOString() },
              end: { dateTime: endDateTime.toISOString() },
              location: activeTrip.destination
          };
          
          onAddEvent(event);
          alert('Evento adicionado à Agenda Global!');
      }
      setNewTripEvent({ title: '', date: activeTrip.dates.start, time: '10:00' });
  };

  const tripEvents = useMemo(() => {
      if (!activeTrip) return [];
      const start = new Date(activeTrip.dates.start);
      const end = new Date(activeTrip.dates.end);
      end.setHours(23, 59, 59);

      return calendarEvents.filter(ev => {
          const evDate = new Date(ev.start.dateTime || ev.start.date || '');
          return evDate >= start && evDate <= end;
      }).sort((a, b) => (a.start.dateTime || '').localeCompare(b.start.dateTime || ''));
  }, [calendarEvents, activeTrip]);


  // --- RENDER: Trip Gallery ---
  if (!activeTripId || !activeTrip) {
    return (
      <div className="space-y-8 pb-12 animate-fade-in">
         <div className="flex justify-between items-center">
             <div>
                 <h2 className="font-serif text-2xl text-ink">Minhas Viagens</h2>
                 <p className="text-sm text-stone-500">Planeje sua próxima aventura.</p>
             </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <button 
                onClick={handleCreateTrip}
                className="min-h-[200px] border-2 border-dashed border-stone-300 rounded-xl flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all group"
             >
                 <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <Plus size={32} />
                 </div>
                 <span className="font-bold text-lg">Nova Aventura</span>
             </button>

             {trips.map(trip => {
                 const days = Math.ceil((new Date(trip.dates.end).getTime() - new Date(trip.dates.start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                 return (
                     <div 
                        key={trip.id} 
                        onClick={() => setActiveTripId(trip.id)}
                        className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group relative"
                     >
                         <div className={`h-24 ${trip.coverColor} flex items-center justify-center relative`}>
                             <Plane size={40} className="opacity-50" />
                             <button 
                                onClick={(e) => handleDeleteTrip(e, trip.id)}
                                className="absolute top-2 right-2 p-2 bg-white/50 rounded-full hover:bg-white text-stone-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                             >
                                 <Trash2 size={16} />
                             </button>
                         </div>
                         <div className="p-5">
                             <h3 className="font-serif text-xl text-ink font-bold truncate">{trip.destination}</h3>
                             <p className="text-xs text-stone-500 mb-4 uppercase tracking-wider font-bold">
                                 {new Date(trip.dates.start).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} • {days > 0 ? days : 1} Dias
                             </p>
                             
                             <div className="flex gap-4 text-sm text-stone-600">
                                 <div className="flex items-center gap-1">
                                     <Luggage size={14} /> {trip.packingList.filter(i => !i.checked).length} itens
                                 </div>
                                 <div className="flex items-center gap-1">
                                     <MapPin size={14} /> Roteiro {trip.itinerary ? 'Pronto' : 'Pendente'}
                                 </div>
                             </div>
                         </div>
                     </div>
                 );
             })}
         </div>
      </div>
    );
  }

  // --- RENDER: Trip Detail View ---
  const totalSpent = activeTrip.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = activeTrip.budget - totalSpent;
  const tripDuration = Math.ceil((new Date(activeTrip.dates.end).getTime() - new Date(activeTrip.dates.start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const packingCategoriesList = activeTrip.packingCategories || DEFAULT_PACKING_CATEGORIES;
  const completedPackingItems = activeTrip.packingList.filter(i => i.checked);
  const expenseCategoriesList = activeTrip.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
  const documentsList = activeTrip.documents || [];
  
  const shoppingList = activeTrip.shoppingList || [];
  const activeShopping = shoppingList.filter(i => !i.checked);
  const completedShopping = shoppingList.filter(i => i.checked);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Navigation Back */}
      <button 
        onClick={() => setActiveTripId(null)}
        className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-ink transition-colors mb-4"
      >
          <ArrowLeft size={16} /> Voltar para Minhas Viagens
      </button>

      {/* Hero Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 relative overflow-hidden">
         <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-20 -mt-20 pointer-events-none opacity-20 ${activeTrip.coverColor.split(' ')[0]}`}></div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex-1 w-full">
                <div className="flex items-center gap-2 text-stone-400 mb-2">
                    <Plane size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">Destino</span>
                </div>
                <input 
                    type="text" 
                    value={activeTrip.destination}
                    onChange={(e) => updateActiveTrip({ destination: e.target.value })}
                    className="text-4xl font-serif text-ink bg-transparent border-b-2 border-transparent hover:border-stone-200 focus:border-sky-500 focus:outline-none w-full transition-colors"
                />
                <div className="flex gap-4 mt-4">
                    <div className="flex flex-col">
                        <label className="text-[10px] text-stone-400 uppercase font-bold mb-1">Ida</label>
                        <input 
                            type="date" 
                            value={activeTrip.dates.start}
                            onChange={(e) => updateActiveTrip({ dates: { ...activeTrip.dates, start: e.target.value } })}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-sm text-stone-600 focus:outline-none focus:border-sky-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] text-stone-400 uppercase font-bold mb-1">Volta</label>
                        <input 
                            type="date" 
                            value={activeTrip.dates.end}
                            onChange={(e) => updateActiveTrip({ dates: { ...activeTrip.dates, end: e.target.value } })}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-sm text-stone-600 focus:outline-none focus:border-sky-500"
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex gap-8 text-right w-full md:w-auto justify-end">
                <div>
                    <p className="text-xs text-stone-400 font-bold uppercase">Duração</p>
                    <p className="text-2xl font-serif text-ink">{tripDuration > 0 ? tripDuration : '-'} Dias</p>
                </div>
                <div>
                    <p className="text-xs text-stone-400 font-bold uppercase">Orçamento Restante</p>
                    <p className={`text-2xl font-serif ${remainingBudget < 0 ? 'text-red-500' : 'text-ink'}`}>
                        R$ {(remainingBudget).toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Itinerary & Agenda */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Agenda Widget */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-xl text-ink flex items-center gap-2 mb-4">
                    <Calendar size={20} className="text-sky-500" />
                    Agenda da Viagem
                </h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                    {tripEvents.length === 0 && <p className="text-xs text-stone-400 italic">Nenhum evento agendado para o período da viagem.</p>}
                    {tripEvents.map(ev => (
                        <div key={ev.id} className="flex gap-3 items-start p-2 rounded-lg bg-sky-50/50 border border-sky-100">
                            <div className="text-center min-w-[40px] bg-white rounded border border-stone-200 py-1">
                                <span className="block text-[10px] font-bold text-stone-400 uppercase">
                                    {new Date(ev.start.dateTime || ev.start.date || '').toLocaleDateString('pt-BR', {weekday: 'short'})}
                                </span>
                                <span className="block text-sm font-bold text-stone-600">
                                    {new Date(ev.start.dateTime || ev.start.date || '').getDate()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-stone-700 truncate">{ev.summary}</p>
                                <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                                    <Clock size={10} />
                                    {ev.start.dateTime 
                                        ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                        : 'Dia Todo'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleAddTripEvent} className="border-t border-stone-100 pt-3">
                     <div className="space-y-2 mb-2">
                         <input 
                            type="text" 
                            placeholder="Novo Evento (Ex: Voo, Jantar)"
                            value={newTripEvent.title}
                            onChange={e => setNewTripEvent({...newTripEvent, title: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-400"
                         />
                         <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={newTripEvent.date || activeTrip.dates.start}
                                min={activeTrip.dates.start}
                                max={activeTrip.dates.end}
                                onChange={e => setNewTripEvent({...newTripEvent, date: e.target.value})}
                                className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-400"
                            />
                            <input 
                                type="time" 
                                value={newTripEvent.time}
                                onChange={e => setNewTripEvent({...newTripEvent, time: e.target.value})}
                                className="w-16 bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-sky-400"
                            />
                         </div>
                     </div>
                     <button type="submit" className="w-full bg-sky-600 text-white py-1.5 rounded text-xs font-bold hover:bg-sky-700 transition-colors flex items-center justify-center gap-1">
                        <Plus size={12} /> Sincronizar com Google
                     </button>
                </form>
            </div>

            {/* Itinerary AI */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                        <MapPin size={20} className="text-sky-500" />
                        Roteiro (IA)
                    </h3>
                    {activeTrip.itinerary && (
                        <button onClick={handleShareItinerary} className="text-sky-500 hover:bg-sky-50 p-2 rounded-full" title="Compartilhar">
                            <Share2 size={18} />
                        </button>
                    )}
                </div>
                
                <div className="bg-sky-50 p-4 rounded-lg border border-sky-100 mb-4">
                    <label className="block text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">Interesses & Estilo</label>
                    <textarea 
                        value={activeTrip.interests}
                        onChange={(e) => updateActiveTrip({ interests: e.target.value })}
                        placeholder="Ex: Museus, cafés, natureza, sem pressa..."
                        className="w-full bg-white text-sm border-stone-200 rounded-lg p-3 focus:ring-sky-300 focus:border-sky-500 h-20 resize-none"
                    />
                    <button 
                        onClick={handleGenerateItinerary}
                        disabled={isGenerating}
                        className="mt-3 w-full bg-sky-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        <Sparkles size={16} />
                        {isGenerating ? 'Gerando Roteiro...' : 'Gerar Roteiro'}
                    </button>
                </div>

                {activeTrip.itinerary ? (
                    <div className="flex-1 bg-stone-50 p-4 rounded-lg border border-stone-100 overflow-y-auto custom-scrollbar">
                        <div className="prose prose-stone prose-sm whitespace-pre-line">
                            {activeTrip.itinerary}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-100 rounded-lg p-8 text-center">
                        <MapPin size={40} className="mb-2 opacity-20" />
                        <p className="text-sm">Defina o destino e interesses, depois clique em "Gerar Roteiro".</p>
                    </div>
                )}
            </div>
        </div>

        {/* Column 2: Packing List */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                        <Luggage size={20} className="text-brand-personal" />
                        Mala & Docs
                    </h3>
                </div>

                {isAddingCategory ? (
                    <form onSubmit={handleAddCategory} className="mb-4 p-2 bg-brand-personal/5 rounded border border-brand-personal/20 flex gap-2">
                        <input 
                            autoFocus
                            value={newCustomCategory}
                            onChange={(e) => setNewCustomCategory(e.target.value)}
                            placeholder="Nome da nova categoria..."
                            className="flex-1 bg-white border border-stone-200 rounded px-2 py-1 text-sm focus:outline-none"
                        />
                        <button type="submit" className="bg-brand-personal text-white px-2 rounded"><Save size={14}/></button>
                        <button type="button" onClick={() => setIsAddingCategory(false)} className="text-stone-400 px-1"><X size={14}/></button>
                    </form>
                ) : null}

                <form onSubmit={addPackingItem} className="flex flex-col gap-2 mb-4 bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <div className="flex gap-2">
                        <input 
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Adicionar item..."
                            className="flex-1 bg-white border border-stone-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-personal"
                        />
                        <button type="submit" className="bg-stone-800 text-white px-3 rounded hover:bg-stone-700">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex gap-2 items-center">
                        <select 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="flex-1 bg-white border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none"
                        >
                            {packingCategoriesList.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <button 
                            type="button" 
                            onClick={() => setIsAddingCategory(true)}
                            className="text-xs font-bold text-brand-personal bg-white border border-brand-personal/20 px-2 py-1 rounded hover:bg-brand-personal/10 transition-colors"
                            title="Criar nova categoria"
                        >
                            + Categoria
                        </button>
                    </div>
                </form>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 mb-2 max-h-[500px]">
                    {packingCategoriesList.map(cat => {
                        const items = activeTrip.packingList.filter(i => i.category === cat && !i.checked);
                        if (items.length === 0 && cat !== newCustomCategory) return null;
                        
                        const catColor = cat === 'Documentos' ? 'text-red-500' : cat === 'Roupas' ? 'text-brand-personal' : 'text-stone-500';

                        return (
                            <div key={cat}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${catColor} border-b border-stone-100 pb-1 flex justify-between`}>
                                    {cat}
                                    <span className="text-stone-300 text-[10px]">{items.length}</span>
                                </h4>
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div 
                                            key={item.id}
                                            className="flex items-center gap-3 group"
                                        >
                                            <button 
                                                onClick={() => togglePackingItem(item.id)}
                                                className={`transition-colors text-stone-300 group-hover:text-stone-500 hover:text-stone-600`}
                                            >
                                                <Circle size={18} />
                                            </button>
                                            <span className="flex-1 text-sm text-stone-700">
                                                {item.text}
                                            </span>
                                            <button 
                                                onClick={() => deletePackingItem(item.id)} 
                                                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-opacity p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {items.length === 0 && <p className="text-[10px] text-stone-300 italic">Tudo pronto nesta categoria.</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {completedPackingItems.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedPacking(!showCompletedPacking)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                        >
                            {showCompletedPacking ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Concluídas ({completedPackingItems.length})
                        </button>
                        
                        {showCompletedPacking && (
                            <div className="space-y-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg max-h-[150px] overflow-y-auto custom-scrollbar">
                                {completedPackingItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => togglePackingItem(item.id)} className="text-stone-400">
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-bold text-stone-400 block">{item.category}</span>
                                            <span className="text-sm text-stone-500 line-through decoration-stone-300">{item.text}</span>
                                        </div>
                                        <button onClick={() => deletePackingItem(item.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Column 3: Budget, Shopping Wishlist & Quick Docs */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                        <CreditCard size={20} className="text-green-600" />
                        Orçamento
                    </h3>
                    <button 
                        onClick={() => setIsManagingExpenseCats(!isManagingExpenseCats)} 
                        className="text-stone-400 hover:text-ink p-1 rounded hover:bg-stone-50"
                        title="Gerenciar Categorias de Despesas"
                    >
                        <Settings size={16} />
                    </button>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 mb-6">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-stone-500">Gasto</span>
                        <span className="font-bold text-stone-700">R$ {totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-1">
                        <div 
                            className={`h-full rounded-full ${totalSpent > activeTrip.budget ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((totalSpent / activeTrip.budget) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 items-center">
                        <span>0</span>
                        <div className="flex items-center gap-1">
                            Meta: R$ 
                            <input 
                                type="number" 
                                value={activeTrip.budget}
                                onChange={(e) => updateActiveTrip({ budget: parseFloat(e.target.value) || 0 })}
                                className="w-16 bg-transparent border-b border-stone-300 text-right focus:outline-none focus:border-green-500"
                            />
                        </div>
                    </div>
                </div>

                {isManagingExpenseCats && (
                    <div className="bg-white border border-stone-200 rounded-lg p-3 mb-4 shadow-sm animate-fade-in">
                        <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Categorias de Gastos</h4>
                        <form onSubmit={handleAddExpenseCategory} className="flex gap-2 mb-3">
                            <input 
                                value={newExpenseCategoryName}
                                onChange={e => setNewExpenseCategoryName(e.target.value)}
                                placeholder="Nova Categoria..."
                                className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none"
                            />
                            <button type="submit" className="bg-green-600 text-white px-2 rounded hover:bg-green-700"><Plus size={14}/></button>
                        </form>
                        <div className="flex flex-wrap gap-2">
                            {expenseCategoriesList.map(cat => (
                                <span key={cat} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-1 rounded flex items-center gap-1 border border-stone-200">
                                    {cat}
                                    <button onClick={() => handleDeleteExpenseCategory(cat)} className="hover:text-red-500"><X size={10}/></button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {activeTrip.expenses.map(exp => (
                        <div key={exp.id} className="flex items-center justify-between p-2 border-b border-stone-50 last:border-0 hover:bg-stone-50 rounded transition-colors group">
                            {editingExpenseId === exp.id ? (
                                <div className="flex-1 flex gap-2 items-center flex-wrap">
                                    <input 
                                        value={editingExpenseData.desc}
                                        onChange={(e) => setEditingExpenseData({...editingExpenseData, desc: e.target.value})}
                                        className="flex-1 bg-white border border-stone-300 rounded px-2 py-1 text-xs w-full"
                                        placeholder="Descrição"
                                        autoFocus
                                    />
                                    <div className="flex gap-1 w-full">
                                        <select 
                                            value={editingExpenseData.category}
                                            onChange={e => setEditingExpenseData({...editingExpenseData, category: e.target.value})}
                                            className="bg-white border border-stone-300 rounded px-2 py-1 text-xs flex-1"
                                        >
                                            {expenseCategoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                        <input 
                                            type="number"
                                            value={editingExpenseData.amount}
                                            onChange={(e) => setEditingExpenseData({...editingExpenseData, amount: e.target.value})}
                                            className="w-16 bg-white border border-stone-300 rounded px-2 py-1 text-xs"
                                            placeholder="R$"
                                        />
                                        <button onClick={saveEditExpense} className="text-green-600"><Save size={14}/></button>
                                        <button onClick={() => setEditingExpenseId(null)} className="text-stone-400"><X size={14}/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-700 truncate">{exp.description}</p>
                                        <p className="text-[10px] text-stone-400 bg-stone-100 px-1 rounded w-fit mt-0.5">{exp.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-stone-700">R$ {exp.amount.toFixed(2)}</p>
                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEditExpense(exp)} className="text-stone-300 hover:text-blue-500 p-1"><Edit2 size={12}/></button>
                                            <button onClick={() => deleteExpense(exp.id)} className="text-stone-300 hover:text-red-400 p-1"><Trash2 size={12}/></button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {activeTrip.expenses.length === 0 && <p className="text-xs text-stone-300 italic text-center">Nenhuma despesa registrada.</p>}
                </div>

                <form onSubmit={addExpense} className="pt-4 border-t border-stone-100">
                    <div className="space-y-2 mb-2">
                        <input 
                            placeholder="Descrição"
                            value={newExpense.desc}
                            onChange={(e) => setNewExpense({...newExpense, desc: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs"
                        />
                        <div className="flex gap-2">
                            <select 
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                                className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none"
                            >
                                <option value="">Categoria...</option>
                                {expenseCategoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <input 
                                type="number"
                                placeholder="R$"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                                className="w-20 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-stone-100 text-stone-600 py-1.5 rounded text-xs font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-1">
                        <Plus size={12} /> Adicionar (+ Finanças)
                    </button>
                </form>
            </div>

            {/* Shopping Wishlist */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-xl text-ink flex items-center gap-2 mb-4">
                    <ShoppingBag size={20} className="text-orange-600" />
                    Wishlist de Compras
                </h3>

                <form onSubmit={addShoppingItem} className="mb-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                    <input 
                        value={newShopItem.item}
                        onChange={(e) => setNewShopItem({...newShopItem, item: e.target.value})}
                        placeholder="Item (ex: Souvenir)"
                        className="w-full bg-white border border-orange-200 rounded px-2 py-1.5 text-xs mb-2 focus:outline-none focus:border-orange-400"
                    />
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="number"
                            value={newShopItem.cost}
                            onChange={(e) => setNewShopItem({...newShopItem, cost: e.target.value})}
                            placeholder="Valor Est. (R$)"
                            className="flex-1 bg-white border border-orange-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                        />
                        <input 
                            type="date"
                            value={newShopItem.date}
                            min={activeTrip.dates.start}
                            max={activeTrip.dates.end}
                            onChange={(e) => setNewShopItem({...newShopItem, date: e.target.value})}
                            className="w-28 bg-white border border-orange-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                        />
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white py-1.5 rounded text-xs font-bold hover:bg-orange-600 transition-colors">
                        Adicionar + Agendar
                    </button>
                </form>

                <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {activeShopping.map(item => (
                        <div key={item.id} className="flex items-start gap-2 p-2 border border-stone-100 rounded bg-white group">
                            {editingShopId === item.id ? (
                                <div className="flex-1 space-y-2">
                                    <input 
                                        value={editingShopData.item}
                                        onChange={(e) => setEditingShopData({...editingShopData, item: e.target.value})}
                                        className="w-full border border-stone-300 rounded px-2 py-1 text-xs"
                                    />
                                    <div className="flex gap-2">
                                        <input 
                                            value={editingShopData.cost}
                                            onChange={(e) => setEditingShopData({...editingShopData, cost: e.target.value})}
                                            className="w-20 border border-stone-300 rounded px-2 py-1 text-xs"
                                        />
                                        <input 
                                            type="date"
                                            value={editingShopData.date}
                                            onChange={(e) => setEditingShopData({...editingShopData, date: e.target.value})}
                                            className="flex-1 border border-stone-300 rounded px-2 py-1 text-xs"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingShopId(null)} className="text-stone-400"><X size={14}/></button>
                                        <button onClick={saveEditShopping} className="text-green-600"><Save size={14}/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => toggleShoppingItem(item.id)} className="mt-0.5 text-stone-300 hover:text-orange-500">
                                        <Circle size={16} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-700 truncate">{item.item}</p>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-xs text-stone-500 font-bold">R$ {item.estimatedCost.toFixed(2)}</p>
                                            {item.plannedDate && (
                                                <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">
                                                    {new Date(item.plannedDate).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditShopping(item)} className="text-stone-300 hover:text-blue-500 p-0.5"><Edit2 size={12}/></button>
                                        <button onClick={() => deleteShoppingItem(item.id)} className="text-stone-300 hover:text-red-400 p-0.5"><Trash2 size={12}/></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {activeShopping.length === 0 && <p className="text-xs text-stone-300 italic text-center py-2">Nenhum item na wishlist.</p>}
                </div>

                {completedShopping.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedShopping(!showCompletedShopping)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider w-full"
                        >
                            {showCompletedShopping ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            Comprados ({completedShopping.length})
                        </button>
                        
                        {showCompletedShopping && (
                            <div className="space-y-1 mt-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg">
                                {completedShopping.map(item => (
                                    <div key={item.id} className="flex items-center gap-2 opacity-60">
                                        <button onClick={() => toggleShoppingItem(item.id)} className="text-stone-400">
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <span className="text-xs text-stone-500 line-through flex-1">{item.item}</span>
                                        <button onClick={() => deleteShoppingItem(item.id)} className="text-stone-300 hover:text-red-400 p-0.5"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Docs (File Upload Implementation) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-stone-400" />
                    Documentos Rápidos
                </h3>
                
                <div className="space-y-2 mb-4">
                    {documentsList.length === 0 && (
                        <p className="text-xs text-stone-400 italic text-center py-2">Nenhum documento salvo.</p>
                    )}
                    {documentsList.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-100 group">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="bg-white p-1 rounded text-stone-400">
                                    <FileText size={14} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-stone-600 truncate max-w-[120px]">{doc.name}</span>
                                    <span className="text-[9px] text-stone-400">{doc.dateAdded}</span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleDownloadDocument(doc)}
                                    className="p-1 text-stone-400 hover:text-blue-500 hover:bg-white rounded transition-colors"
                                    title={doc.url ? "Visualizar/Baixar" : "Arquivo Offline"}
                                >
                                    {doc.url ? <Eye size={14} /> : <Download size={14} />}
                                </button>
                                <button 
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="p-1 text-stone-400 hover:text-red-500 hover:bg-white rounded transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                />
                
                <button 
                    onClick={handleUploadClick}
                    className="w-full border border-dashed border-stone-300 rounded-lg py-3 text-xs text-stone-500 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                >
                    <Upload size={14} /> Fazer Upload (PDF/IMG)
                </button>
                <p className="text-[9px] text-stone-300 mt-2 text-center">
                    *Arquivos são salvos apenas para a sessão atual (simulação).
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};
