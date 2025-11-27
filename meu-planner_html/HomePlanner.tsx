
import React, { useState, useMemo } from 'react';
import { 
  Utensils, ShoppingCart, Home as HomeIcon, Plus, Trash2, Sparkles, 
  CheckCircle2, Circle, Droplets, ChefHat, Coffee, Share2, 
  ChevronLeft, ChevronRight, Calendar, Save, X, Edit2, ChevronDown, ChevronUp
} from 'lucide-react';
import { suggestMealPlan } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';

interface Chore {
  id: string;
  text: string;
  zone: string;
  completed: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
}

interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
}

// Interface para o Cronograma Semanal
interface DailyChorePlan {
    tasks: string[]; // IDs das tarefas ou texto livre
}

export const HomePlanner: React.FC = () => {
  // --- States Globais (Persisted) ---
  
  // 1. Lista Mestra de Tarefas (Rotina da Casa)
  const [chores, setChores] = useLocalStorage<Chore[]>('planner_home_chores_v2', [
    { id: '1', text: 'Lavar a louça', zone: 'Cozinha', completed: false, frequency: 'daily' },
    { id: '2', text: 'Regar plantas', zone: 'Sala', completed: false, frequency: 'weekly' },
    { id: '3', text: 'Trocar lençóis', zone: 'Quartos', completed: false, frequency: 'weekly' },
    { id: '4', text: 'Limpeza pesada', zone: 'Banheiros', completed: true, frequency: 'weekly' },
  ]);

  // 2. Lista de Compras
  const [shoppingList, setShoppingList] = useLocalStorage<ShoppingItem[]>('planner_home_shopping', [
    { id: '1', text: 'Detergente', checked: false },
    { id: '2', text: 'Esponja', checked: true },
  ]);

  // 3. Cronograma Semanal (Persisted por Semana)
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0,0,0,0);
    return monday;
  };
  
  const startOfWeek = getMonday(new Date(currentDate));
  const weekKey = startOfWeek.toLocaleDateString('en-CA'); // Chave: YYYY-MM-DD da segunda-feira

  // Armazena o plano de cada dia para cada semana
  const [weeklySchedule, setWeeklySchedule] = useLocalStorage<Record<string, Record<string, string[]>>>('planner_home_weekly_schedule', {});

  // 4. Planejamento de Refeições
  const [preferences, setPreferences] = useLocalStorage('planner_home_meal_pref', '');
  const [mealPlan, setMealPlan] = useLocalStorage<string>('planner_home_meal_plan', '');
  
  // --- States Locais (UI) ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [newShoppingItem, setNewShoppingItem] = useState('');
  
  // States para "Rotina da Casa" (Adicionar/Editar)
  const [newChore, setNewChore] = useState({ text: '', zone: '', frequency: 'weekly' as const });
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [editingChoreData, setEditingChoreData] = useState({ text: '', zone: '', frequency: 'weekly' as const });
  const [showCompletedChores, setShowCompletedChores] = useState(false);

  // --- Helpers de Data ---
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekRangeStr = `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  // --- Handlers: Rotina da Casa (CRUD Completo) ---

  const addChore = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newChore.text.trim()) return;
      
      setChores([...chores, {
          id: Date.now().toString(),
          text: newChore.text,
          zone: newChore.zone || 'Geral',
          frequency: newChore.frequency,
          completed: false
      }]);
      setNewChore({ text: '', zone: '', frequency: 'weekly' });
  };

  const toggleChore = (id: string) => {
      setChores(chores.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const deleteChore = (id: string) => {
      if(confirm("Excluir esta tarefa permanentemente?")) {
          setChores(chores.filter(c => c.id !== id));
      }
  };

  const startEditChore = (chore: Chore) => {
      setEditingChoreId(chore.id);
      setEditingChoreData({ text: chore.text, zone: chore.zone, frequency: chore.frequency });
  };

  const saveChoreEdit = () => {
      if (editingChoreId) {
          setChores(chores.map(c => c.id === editingChoreId ? { ...c, ...editingChoreData } : c));
          setEditingChoreId(null);
      }
  };

  const cancelEditChore = () => {
      setEditingChoreId(null);
  };

  // --- Handlers: Cronograma Semanal ---
  
  const getTasksForDay = (dateKey: string) => {
      // Estrutura: { "2024-05-20": { "Mon": ["Task 1", "Task 2"] } }
      // Simplificando: vamos usar weekKey -> dateKey -> array
      const currentWeekData = weeklySchedule[weekKey] || {};
      return currentWeekData[dateKey] || [];
  };

  const addTaskToDay = (date: Date, taskText: string) => {
      if (!taskText.trim()) return;
      const dateKey = date.toLocaleDateString('en-CA');
      
      const currentWeekData = weeklySchedule[weekKey] || {};
      const currentDayTasks = currentWeekData[dateKey] || [];
      
      setWeeklySchedule({
          ...weeklySchedule,
          [weekKey]: {
              ...currentWeekData,
              [dateKey]: [...currentDayTasks, taskText]
          }
      });
  };

  const removeTaskFromDay = (date: Date, taskIndex: number) => {
      const dateKey = date.toLocaleDateString('en-CA');
      const currentWeekData = weeklySchedule[weekKey] || {};
      const currentDayTasks = currentWeekData[dateKey] || [];
      
      const newTasks = currentDayTasks.filter((_, i) => i !== taskIndex);
      
      setWeeklySchedule({
          ...weeklySchedule,
          [weekKey]: {
              ...currentWeekData,
              [dateKey]: newTasks
          }
      });
  };

  const generateRoutine = () => {
      if (!confirm("Isso irá preencher a semana atual com base na frequência das suas tarefas da 'Rotina da Casa'. Deseja continuar?")) return;

      const newWeekData: Record<string, string[]> = {};
      
      // Distribuição simples baseada na frequência
      const dailyChores = chores.filter(c => c.frequency === 'daily' && !c.completed).map(c => c.text);
      const weeklyChores = chores.filter(c => c.frequency === 'weekly' && !c.completed).map(c => c.text);
      
      weekDates.forEach((date, index) => {
          const dateKey = date.toLocaleDateString('en-CA');
          // Adiciona diárias
          let tasks = [...dailyChores];
          
          // Distribui semanais (simples round-robin)
          if (weeklyChores.length > 0) {
              // Ex: tarefa 0 vai no dia 0, tarefa 1 no dia 1...
              const taskForToday = weeklyChores.filter((_, i) => i % 7 === index);
              tasks = [...tasks, ...taskForToday];
          }
          
          newWeekData[dateKey] = tasks;
      });

      setWeeklySchedule({
          ...weeklySchedule,
          [weekKey]: newWeekData
      });
  };

  // --- Handlers: Outros ---
  
  const addShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;
    setShoppingList([...shoppingList, { id: Date.now().toString(), text: newShoppingItem, checked: false }]);
    setNewShoppingItem('');
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(shoppingList.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList(shoppingList.filter(item => item.id !== id));
  };

  const handleMealGen = async () => {
    setIsGenerating(true);
    const suggestion = await suggestMealPlan(preferences || "Saudável e prático");
    setMealPlan(suggestion);
    setIsGenerating(false);
  };

  // Filtros para a Rotina da Casa
  const activeChores = chores.filter(c => !c.completed);
  const completedChores = chores.filter(c => c.completed);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* --- Section 1: Weekly Schedule Navigation --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-4">
                  <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronLeft size={20} /></button>
                  <div className="text-center">
                      <h2 className="font-serif text-xl text-ink font-bold flex items-center gap-2 justify-center">
                          <Calendar size={20} className="text-brand-home" /> Cronograma de Limpeza
                      </h2>
                      <p className="text-xs text-stone-500 font-medium">{weekRangeStr}</p>
                  </div>
                  <button onClick={() => changeWeek(1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronRight size={20} /></button>
              </div>
              
              <button 
                  onClick={generateRoutine}
                  className="bg-brand-home/10 text-brand-home px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-home/20 transition-colors flex items-center gap-2"
                  title="Preenche automaticamente com base na Rotina Mestra"
              >
                  <Sparkles size={14} /> Gerar Rotina Padrão
              </button>
          </div>

          {/* Weekly Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDates.map((date, i) => {
                  const dateKey = date.toLocaleDateString('en-CA');
                  const tasks = getTasksForDay(dateKey);
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                      <div key={i} className={`min-h-[120px] p-2 rounded-lg border flex flex-col gap-2 ${isToday ? 'bg-brand-home/5 border-brand-home/30' : 'bg-stone-50 border-stone-100'}`}>
                          <div className="text-center border-b border-stone-200/50 pb-1">
                              <span className="text-[10px] font-bold text-stone-400 uppercase block">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                              <span className={`text-sm font-serif font-bold ${isToday ? 'text-brand-home' : 'text-stone-600'}`}>{date.getDate()}</span>
                          </div>
                          
                          <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar max-h-[100px]">
                              {tasks.map((t, idx) => (
                                  <div key={idx} className="text-[10px] bg-white p-1.5 rounded shadow-sm border border-stone-100 flex justify-between items-center group">
                                      <span className="truncate">{t}</span>
                                      <button 
                                          onClick={() => removeTaskFromDay(date, idx)}
                                          className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                      >
                                          <X size={10} />
                                      </button>
                                  </div>
                              ))}
                          </div>

                          <input 
                              type="text" 
                              placeholder="+"
                              className="w-full bg-white text-[10px] border border-stone-200 rounded px-1 py-1 focus:outline-none focus:border-brand-home"
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      addTaskToDay(date, (e.target as HTMLInputElement).value);
                                      (e.target as HTMLInputElement).value = '';
                                  }
                              }}
                          />
                      </div>
                  )
              })}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- Column 1: Rotina da Casa (Master List / Backlog) --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-xl text-ink mb-4 flex items-center gap-2">
                    <HomeIcon size={20} className="text-blue-500" />
                    Rotina da Casa (Mestra)
                </h3>
                <p className="text-xs text-stone-500 mb-4">Liste todas as tarefas recorrentes aqui. Use o botão "Gerar" acima para distribuir na semana.</p>

                {/* Add Form */}
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 mb-4">
                    <div className="flex flex-col gap-2">
                        <input 
                            value={newChore.text}
                            onChange={(e) => setNewChore({...newChore, text: e.target.value})}
                            placeholder="Nova tarefa..."
                            className="bg-white border border-stone-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-brand-home"
                        />
                        <div className="flex gap-2">
                            <input 
                                value={newChore.zone}
                                onChange={(e) => setNewChore({...newChore, zone: e.target.value})}
                                placeholder="Cômodo"
                                className="flex-1 bg-white border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-home"
                            />
                            <select 
                                value={newChore.frequency}
                                onChange={(e) => setNewChore({...newChore, frequency: e.target.value as any})}
                                className="bg-white border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand-home"
                            >
                                <option value="daily">Diário</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensal</option>
                            </select>
                            <button 
                                onClick={addChore}
                                className="bg-brand-home text-white p-1.5 rounded hover:bg-brand-home/90 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Chores List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {activeChores.map(chore => (
                        <div key={chore.id} className="group bg-white border border-stone-100 p-2 rounded-lg hover:border-stone-300 transition-all">
                            {editingChoreId === chore.id ? (
                                // Edit Mode
                                <div className="space-y-2">
                                    <input 
                                        value={editingChoreData.text}
                                        onChange={(e) => setEditingChoreData({...editingChoreData, text: e.target.value})}
                                        className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                                    />
                                    <div className="flex gap-2">
                                        <input 
                                            value={editingChoreData.zone}
                                            onChange={(e) => setEditingChoreData({...editingChoreData, zone: e.target.value})}
                                            className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs"
                                        />
                                        <select 
                                            value={editingChoreData.frequency}
                                            onChange={(e) => setEditingChoreData({...editingChoreData, frequency: e.target.value as any})}
                                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs"
                                        >
                                            <option value="daily">Diário</option>
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensal</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-1">
                                        <button onClick={cancelEditChore} className="text-stone-400 hover:text-stone-600 p-1"><X size={14} /></button>
                                        <button onClick={saveChoreEdit} className="text-green-600 hover:text-green-700 p-1"><Save size={14} /></button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <div className="flex items-start gap-2">
                                    <button onClick={() => toggleChore(chore.id)} className="mt-0.5 text-stone-300 hover:text-brand-home transition-colors">
                                        <Circle size={18} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-700 truncate">{chore.text}</p>
                                        <div className="flex gap-2 mt-0.5">
                                            <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{chore.zone}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                chore.frequency === 'daily' ? 'bg-blue-50 text-blue-600' : 
                                                chore.frequency === 'weekly' ? 'bg-orange-50 text-orange-600' : 
                                                'bg-purple-50 text-purple-600'
                                            }`}>
                                                {chore.frequency === 'daily' ? 'Diário' : chore.frequency === 'weekly' ? 'Semanal' : 'Mensal'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                        <button onClick={() => startEditChore(chore)} className="text-stone-400 hover:text-blue-500 p-1"><Edit2 size={14} /></button>
                                        <button onClick={() => deleteChore(chore.id)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {activeChores.length === 0 && <p className="text-xs text-stone-300 italic text-center py-4">Lista vazia.</p>}
                </div>

                {/* Completed Folder */}
                {completedChores.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedChores(!showCompletedChores)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                        >
                            {showCompletedChores ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Concluídas ({completedChores.length})
                        </button>
                        
                        {showCompletedChores && (
                            <div className="space-y-2 bg-stone-50/50 p-2 rounded-lg animate-fade-in max-h-[200px] overflow-y-auto custom-scrollbar">
                                {completedChores.map(chore => (
                                    <div key={chore.id} className="flex items-center gap-2 p-2 opacity-60 hover:opacity-100 transition-opacity group">
                                        <button onClick={() => toggleChore(chore.id)} className="text-stone-400 shrink-0">
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-stone-500 line-through block">{chore.text}</span>
                                        </div>
                                        <button onClick={() => deleteChore(chore.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1">
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

        {/* --- Column 2: Meal Planner (AI) --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full flex flex-col">
                <h3 className="font-serif text-xl text-ink mb-4 flex items-center gap-2">
                    <Utensils size={20} className="text-brand-home" />
                    Planejamento de Refeições
                </h3>
                
                <div className="bg-brand-home/5 p-4 rounded-lg border border-brand-home/10 mb-4">
                    <label className="block text-xs font-bold text-brand-home uppercase tracking-wider mb-2">Preferências da Semana</label>
                    <textarea 
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        placeholder="Ex: Segunda sem carne, jantares rápidos, culinária italiana no sábado..."
                        className="w-full bg-white text-sm border-stone-200 rounded-lg p-3 focus:ring-brand-home/30 focus:border-brand-home h-24 resize-none"
                    />
                    <button 
                        onClick={handleMealGen}
                        disabled={isGenerating}
                        className="mt-3 w-full bg-brand-home text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-home/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        <Sparkles size={16} />
                        {isGenerating ? 'Criando Cardápio...' : 'Sugerir Cardápio com IA'}
                    </button>
                </div>

                {mealPlan ? (
                    <div className="flex-1 bg-stone-50 p-4 rounded-lg border border-stone-100 overflow-y-auto custom-scrollbar max-h-[500px]">
                        <div className="prose prose-stone prose-sm whitespace-pre-line">
                            {mealPlan}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-100 rounded-lg p-8">
                        <ChefHat size={40} className="mb-2 opacity-20" />
                        <p className="text-sm text-center">Defina suas preferências e deixe a IA organizar sua semana alimentar.</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- Column 3: Shopping List --- */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 relative overflow-hidden h-full flex flex-col">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                        <ShoppingCart size={20} className="text-yellow-600" />
                        Lista de Compras
                    </h3>
                    <button 
                        onClick={() => {
                            const items = shoppingList.filter(i => !i.checked).map(i => `- [ ] ${i.text}`).join('\n');
                            navigator.clipboard.writeText(`🛒 *Lista de Compras*\n\n${items || 'Lista vazia!'}`);
                            alert('Copiado!');
                        }}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                        title="Copiar Lista"
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                <form onSubmit={addShoppingItem} className="flex gap-2 mb-6 relative z-10">
                    <input 
                        type="text"
                        value={newShoppingItem}
                        onChange={(e) => setNewShoppingItem(e.target.value)}
                        placeholder="Adicionar item..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    />
                    <button type="submit" className="bg-yellow-600 text-white p-2 rounded-lg hover:bg-yellow-700 transition-colors">
                        <Plus size={20} />
                    </button>
                </form>

                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1 relative z-10 max-h-[500px]">
                    {shoppingList.map(item => (
                        <div key={item.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-stone-50 transition-colors">
                            <button 
                                onClick={() => toggleShoppingItem(item.id)}
                                className={`${item.checked ? 'text-yellow-600' : 'text-stone-300 hover:text-yellow-600'} transition-colors`}
                            >
                                {item.checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>
                            <span className={`flex-1 text-sm font-medium ${item.checked ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                                {item.text}
                            </span>
                            <button 
                                onClick={() => removeShoppingItem(item.id)}
                                className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                     {shoppingList.length === 0 && (
                        <div className="text-center py-8 text-stone-400">
                            <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Sua lista está vazia.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
