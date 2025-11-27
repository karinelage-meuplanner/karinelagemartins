
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, CheckCircle2, Circle, Heart, 
  Home, DollarSign, Sparkles, Layout, CheckSquare, Clock, Plus, 
  Edit2, Trash2, X, Save, ChevronDown, ChevronUp, ArrowDownCircle
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleCalendarEvent } from '../types';

interface Props {
  calendarEvents: GoogleCalendarEvent[];
  onAddEvent?: (event: GoogleCalendarEvent) => void;
}

interface WeeklyTask {
  id: number | string;
  text: string;
  done: boolean;
}

// Interface para os dados salvos POR DIA (Planejamento)
interface DayPlan {
  top3: string[];
  morning: string;
  afternoon: string;
  evening: string;
}

// Interface para os dados salvos POR SEMANA (Revisão)
interface WeeklyReviewData {
  wins: string;
  improvements: string;
  nextPriorities: string;
  mood: number;
  balance: {
    leisure: boolean;
    family: boolean;
    work: boolean;
    health: boolean;
  };
}

// --- Sub-componente para gerenciar listas com edição e pasta de concluídos ---
const TaskSection: React.FC<{
  title: string;
  icon: any;
  tasks: WeeklyTask[];
  setTasks: (tasks: WeeklyTask[]) => void;
  colorClass: string;
  placeholder?: string;
}> = ({ title, icon: Icon, tasks, setTasks, colorClass, placeholder = "Adicionar tarefa..." }) => {
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editText, setEditText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Filtros
  const activeTasks = tasks.filter(t => !t.done);
  const completedTasks = tasks.filter(t => t.done);

  // Handlers
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newItem, done: false }]);
    setNewItem('');
  };

  const handleToggle = (id: string | number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDelete = (id: string | number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const startEdit = (task: WeeklyTask) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    if (editingId !== null && editText.trim()) {
      setTasks(tasks.map(t => t.id === editingId ? { ...t, text: editText } : t));
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
      <h3 className={`font-serif text-lg mb-3 flex items-center gap-2 ${colorClass}`}>
        <Icon size={18} />
        {title}
      </h3>

      {/* Lista de Ativas */}
      <div className="space-y-2 mb-3">
        {activeTasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-2 p-2 hover:bg-stone-50 rounded-lg transition-colors">
            {editingId === task.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input 
                  type="text" 
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 bg-white border border-stone-300 rounded px-2 py-1 text-sm focus:border-accent outline-none"
                  autoFocus
                />
                <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16}/></button>
                <button onClick={cancelEdit} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={16}/></button>
              </div>
            ) : (
              <>
                <button onClick={() => handleToggle(task.id)} className={`shrink-0 ${colorClass.replace('text-', 'text-opacity-50 hover:text-opacity-100 text-')}`}>
                  <Circle size={18} />
                </button>
                <span className="text-sm text-stone-700 flex-1 break-all">{task.text}</span>
                
                {/* Ações (Edit/Delete) - Visíveis no Hover */}
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  <button onClick={() => startEdit(task)} className="text-stone-400 hover:text-blue-500 p-1">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-stone-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Input de Adicionar */}
      <form onSubmit={handleAdd} className="relative mb-4">
        <input 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder} 
          className="w-full text-xs bg-stone-50 border border-stone-100 p-2 pr-8 rounded focus:ring-1 focus:ring-stone-200 focus:border-stone-300 outline-none" 
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
          <Plus size={16} />
        </button>
      </form>

      {/* Pasta de Concluídas */}
      {completedTasks.length > 0 && (
        <div className="border-t border-stone-100 pt-2">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider w-full mb-2"
          >
            {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Concluídas ({completedTasks.length})
          </button>
          
          {showCompleted && (
            <div className="space-y-1 bg-stone-50/50 p-2 rounded-lg animate-fade-in">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 p-1 opacity-60 hover:opacity-100 transition-opacity group">
                  <button onClick={() => handleToggle(task.id)} className="text-stone-400 shrink-0">
                    <CheckCircle2 size={16} />
                  </button>
                  <span className="text-xs text-stone-500 line-through flex-1">{task.text}</span>
                  <button onClick={() => handleDelete(task.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export const WeeklyPlanner: React.FC<Props> = ({ calendarEvents = [], onAddEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'plan' | 'review'>('plan');
  
  // Helper to get start of week (Monday)
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0,0,0,0);
    return monday;
  };

  const startOfWeek = getMonday(new Date(currentDate));
  const weekKey = startOfWeek.toLocaleDateString('en-CA'); // Chave única para a semana (YYYY-MM-DD da segunda-feira)
  
  // Armazena os inputs de planejamento POR DIA. 
  // Chave: 'YYYY-MM-DD', Valor: DayPlan
  const [allDaysPlans, setAllDaysPlans] = useLocalStorage<Record<string, DayPlan>>('planner_weekly_day_inputs', {});

  // Armazena as Revisões Semanais POR SEMANA
  // Chave: 'YYYY-MM-DD' (Segunda-feira), Valor: WeeklyReviewData
  const [allReviews, setAllReviews] = useLocalStorage<Record<string, WeeklyReviewData>>('planner_weekly_reviews_db', {});

  const defaultReview: WeeklyReviewData = {
    wins: '',
    improvements: '',
    nextPriorities: '',
    mood: 3,
    balance: { leisure: false, family: false, work: false, health: false }
  };

  // Sidebar Data State (Persisted) - GLOBAL (Tasks pool)
  const [weeklyTasks, setWeeklyTasks] = useLocalStorage<WeeklyTask[]>('planner_weekly_tasks', [
    { id: 1, text: 'Agendar médico', done: false },
    { id: 2, text: 'Comprar presente mãe', done: true },
    { id: 3, text: 'Reunião Escolar', done: false }
  ]);
  
  const [beatrizTime, setBeatrizTime] = useLocalStorage('planner_weekly_beatriz', '');
  
  const [homeChores, setHomeChores] = useLocalStorage<WeeklyTask[]>('planner_weekly_home', [
    { id: 1, text: 'Lavar cortinas', done: false },
    { id: 2, text: 'Organizar despensa', done: false }
  ]);
  
  const [financeDue, setFinanceDue] = useLocalStorage<WeeklyTask[]>('planner_weekly_finance', [
    { id: 1, text: 'Internet (dia 15)', done: false },
    { id: 2, text: 'Cartão (dia 20)', done: false }
  ]);

  // State for New Event
  const [newEvent, setNewEvent] = useState({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00'
  });

  // Gera os 7 dias da semana atual para renderização
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  // Funções Auxiliares de Data
  const getDateKey = (date: Date) => date.toLocaleDateString('en-CA'); // YYYY-MM-DD

  // Obtem o plano salvo ou retorna vazio (clean slate)
  const getPlanForDate = (date: Date): DayPlan => {
      const key = getDateKey(date);
      return allDaysPlans[key] || { top3: ['', '', ''], morning: '', afternoon: '', evening: '' };
  };

  // Obtem a revisão da semana atual ou vazia
  const currentReview = allReviews[weekKey] || defaultReview;

  // Atualiza o plano de um dia específico
  const updateDayPlan = (date: Date, field: keyof DayPlan, value: any, index?: number) => {
      const key = getDateKey(date);
      const currentPlan = allDaysPlans[key] || { top3: ['', '', ''], morning: '', afternoon: '', evening: '' };
      
      let updatedPlan = { ...currentPlan };

      if (field === 'top3' && typeof index === 'number') {
          const newTop3 = [...currentPlan.top3];
          newTop3[index] = value;
          updatedPlan.top3 = newTop3;
      } else {
          updatedPlan = { ...updatedPlan, [field]: value };
      }

      setAllDaysPlans({
          ...allDaysPlans,
          [key]: updatedPlan
      });
  };

  // Atualiza a Revisão Semanal da semana atual
  const updateReview = (field: keyof WeeklyReviewData, value: any) => {
      setAllReviews(prev => ({
          ...prev,
          [weekKey]: {
              ...(prev[weekKey] || defaultReview),
              [field]: value
          }
      }));
  };

  // Função para importar tarefas pendentes para a revisão
  const importPendingTasks = () => {
    const pending = weeklyTasks.filter(t => !t.done).map(t => `- ${t.text}`).join('\n');
    if (!pending) return;
    
    const currentText = currentReview.nextPriorities;
    const newText = currentText ? `${currentText}\n\n[Pendências Importadas]:\n${pending}` : `[Pendências Importadas]:\n${pending}`;
    
    updateReview('nextPriorities', newText);
  };

  const getEventsForDate = (date: Date) => {
      const dateStr = getDateKey(date);
      return calendarEvents.filter(ev => {
          let evDate = '';
          if (ev.start.dateTime) evDate = new Date(ev.start.dateTime).toLocaleDateString('en-CA');
          else if (ev.start.date) evDate = ev.start.date;
          return evDate === dateStr;
      }).sort((a,b) => (a.start.dateTime || '').localeCompare(b.start.dateTime || ''));
  };

  const getEventsForWeek = () => {
      const start = new Date(startOfWeek);
      const end = new Date(startOfWeek);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59);

      return calendarEvents.filter(ev => {
          const evDate = new Date(ev.start.dateTime || ev.start.date || '');
          return evDate >= start && evDate <= end;
      }).sort((a,b) => (a.start.dateTime || '').localeCompare(b.start.dateTime || ''));
  };

  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEvent.title || !newEvent.date) return;

      if (onAddEvent) {
          const startDateTime = new Date(`${newEvent.date}T${newEvent.time}:00`);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration default

          const event: GoogleCalendarEvent = {
              id: 'manual-' + Date.now(),
              summary: newEvent.title,
              description: 'Criado no Planejamento Semanal',
              start: { dateTime: startDateTime.toISOString() },
              end: { dateTime: endDateTime.toISOString() },
              location: 'Meu Planner'
          };
          
          onAddEvent(event);
      }

      setNewEvent({
          title: '',
          date: new Date().toISOString().split('T')[0],
          time: '09:00'
      });
  };

  const weekRangeStr = `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;
  const weekEvents = getEventsForWeek();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Navigation & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center justify-between w-full md:w-auto bg-white p-1 rounded-xl shadow-sm border border-stone-200">
           <button 
              onClick={() => changeWeek(-1)} 
              className="flex items-center gap-1 px-3 py-2 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors text-sm font-medium"
           >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Semana Anterior</span>
           </button>
           
           <div className="flex items-center gap-2 px-4 font-serif font-bold text-ink text-lg border-l border-r border-stone-100 mx-1">
              <Calendar size={18} className="text-accent" />
              <span className="whitespace-nowrap">{weekRangeStr}</span>
           </div>

           <button 
              onClick={() => changeWeek(1)} 
              className="flex items-center gap-1 px-3 py-2 text-stone-600 hover:bg-stone-50 rounded-lg transition-colors text-sm font-medium"
           >
              <span className="hidden sm:inline">Próxima Semana</span>
              <ChevronRight size={16} />
           </button>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-lg self-start md:self-auto">
            <button 
                onClick={() => setViewMode('plan')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'plan' ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
                <Layout size={16} /> Planejamento
            </button>
            <button 
                onClick={() => setViewMode('review')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'review' ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
                <Sparkles size={16} /> Revisão Semanal
            </button>
        </div>
      </div>

      {viewMode === 'plan' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Weekly Grid (Days) */}
            <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                    {weekDates.map((date, i) => {
                        const dayEvents = getEventsForDate(date);
                        const dayPlan = getPlanForDate(date); // Obtém dados salvos ou vazio
                        
                        return (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col gap-3 group hover:border-stone-300 transition-colors relative overflow-hidden">
                            {/* Day Header */}
                            <div className="flex items-baseline justify-between border-b border-stone-50 pb-2">
                                <span className="font-serif font-bold text-ink capitalize">
                                    {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                    date.toDateString() === new Date().toDateString() ? 'bg-accent text-white' : 'bg-stone-100 text-stone-500'
                                }`}>
                                    {date.getDate()}
                                </span>
                            </div>

                            {/* Google Calendar Events Integration */}
                            {dayEvents.length > 0 && (
                                <div className="bg-blue-50/50 rounded-lg p-2 border border-blue-100 space-y-1">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> Google Agenda
                                    </p>
                                    {dayEvents.map(ev => (
                                        <div key={ev.id} className="flex gap-2 text-xs text-blue-800 items-start">
                                            <span className="font-bold min-w-[35px] text-right text-blue-600">
                                                {ev.start.dateTime 
                                                  ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                                  : 'Dia todo'}
                                            </span>
                                            <span className="truncate">{ev.summary}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Top 3 */}
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Top 3 Prioridades</label>
                                {[0, 1, 2].map(idx => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-stone-300">{idx+1}</span>
                                        <input 
                                            value={dayPlan.top3[idx]}
                                            onChange={(e) => updateDayPlan(date, 'top3', e.target.value, idx)}
                                            className="flex-1 bg-stone-50 text-xs border-none rounded px-2 py-1 focus:ring-1 focus:ring-accent/30" 
                                            placeholder="Prioridade..." 
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Time Blocks */}
                            <div className="grid grid-cols-1 gap-2 mt-1">
                                <div>
                                    <label className="text-[10px] text-stone-400 font-semibold block mb-0.5">Manhã</label>
                                    <textarea 
                                        rows={2} 
                                        value={dayPlan.morning}
                                        onChange={(e) => updateDayPlan(date, 'morning', e.target.value)}
                                        className="w-full bg-stone-50/50 text-xs border border-stone-100 rounded p-2 resize-none focus:border-accent/50 outline-none" 
                                        placeholder="Compromissos..." 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-stone-400 font-semibold block mb-0.5">Tarde</label>
                                    <textarea 
                                        rows={2} 
                                        value={dayPlan.afternoon}
                                        onChange={(e) => updateDayPlan(date, 'afternoon', e.target.value)}
                                        className="w-full bg-stone-50/50 text-xs border border-stone-100 rounded p-2 resize-none focus:border-accent/50 outline-none" 
                                        placeholder="Compromissos..." 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-stone-400 font-semibold block mb-0.5">Noite</label>
                                    <textarea 
                                        rows={1} 
                                        value={dayPlan.evening}
                                        onChange={(e) => updateDayPlan(date, 'evening', e.target.value)}
                                        className="w-full bg-stone-50/50 text-xs border border-stone-100 rounded p-2 resize-none focus:border-accent/50 outline-none" 
                                        placeholder="Lazer/Descanso..." 
                                    />
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            {/* Sidebar Context Areas */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Important Events Widget */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                    <h3 className="font-serif text-lg text-ink mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" />
                        Eventos Importantes
                    </h3>
                    
                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                        {weekEvents.length === 0 ? (
                            <p className="text-xs text-stone-400 italic">Sem eventos esta semana.</p>
                        ) : (
                            weekEvents.map(ev => (
                                <div key={ev.id} className="flex items-start gap-2 text-xs p-2 bg-stone-50 rounded border border-stone-100">
                                    <div className="font-bold text-stone-500 min-w-[30px]">
                                        {new Date(ev.start.dateTime || ev.start.date || '').toLocaleDateString('pt-BR', {weekday: 'short'}).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-stone-700">{ev.summary}</p>
                                        <p className="text-[10px] text-stone-400">
                                            {ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Dia Todo'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddEvent} className="border-t border-stone-100 pt-3">
                         <div className="space-y-2 mb-2">
                             <input 
                                type="text" 
                                placeholder="Novo Evento"
                                value={newEvent.title}
                                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                             />
                             <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                    className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                                />
                                <input 
                                    type="time" 
                                    value={newEvent.time}
                                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                    className="w-16 bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                                />
                             </div>
                         </div>
                         <button type="submit" className="w-full bg-stone-800 text-white py-1.5 rounded text-xs font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-1">
                            <Plus size={12} /> Adicionar ao Calendário
                         </button>
                    </form>
                </div>

                {/* Weekly Tasks - Com nova funcionalidade de edição e pasta concluída */}
                <TaskSection 
                  title="Tarefas da Semana" 
                  icon={CheckSquare}
                  tasks={weeklyTasks}
                  setTasks={setWeeklyTasks}
                  colorClass="text-ink"
                  placeholder="+ Tarefa da semana"
                />

                {/* Beatriz Time */}
                <div className="bg-brand-daughter/5 p-5 rounded-xl border border-brand-daughter/10">
                    <h3 className="font-serif text-lg text-brand-daughter mb-3 flex items-center gap-2">
                        <Heart size={18} />
                        Tempo com Beatriz
                    </h3>
                    <p className="text-xs text-stone-500 mb-2">Planeje uma atividade especial:</p>
                    <textarea 
                        value={beatrizTime}
                        onChange={e => setBeatrizTime(e.target.value)}
                        className="w-full bg-white text-sm border-brand-daughter/10 rounded-lg p-3 focus:ring-brand-daughter/30 focus:border-brand-daughter placeholder:text-brand-daughter/30 min-h-[80px]" 
                        placeholder="Ex: Ir ao parque, leitura antes de dormir..."
                    />
                </div>

                {/* Home Chores - Com nova funcionalidade */}
                <TaskSection 
                  title="Casa" 
                  icon={Home}
                  tasks={homeChores}
                  setTasks={setHomeChores}
                  colorClass="text-brand-home"
                  placeholder="+ Tarefa doméstica"
                />

                 {/* Quick Finance - Com nova funcionalidade */}
                 <TaskSection 
                  title="Financeiro Rápido" 
                  icon={DollarSign}
                  tasks={financeDue}
                  setTasks={setFinanceDue}
                  colorClass="text-brand-finance"
                  placeholder="+ Conta ou pagamento"
                />

            </div>
          </div>
      ) : (
        /* Review Mode */
        <div className="max-w-3xl mx-auto space-y-8 bg-white p-8 rounded-xl shadow-sm border border-stone-200">
            <div className="text-center mb-8">
                <h2 className="font-serif text-3xl text-ink mb-2">Revisão Semanal</h2>
                <p className="text-stone-500">
                   {weekRangeStr}. Um momento para calibrar a bússola.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="block font-serif text-lg text-brand-finance">O que deu certo?</label>
                    <textarea 
                        value={currentReview.wins} 
                        onChange={e => updateReview('wins', e.target.value)}
                        className="w-full h-32 bg-stone-50 border border-stone-200 rounded-lg p-4 focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none resize-none"
                        placeholder="Vitórias, momentos felizes, tarefas concluídas..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="block font-serif text-lg text-brand-daughter">O que ajustar?</label>
                    <textarea 
                         value={currentReview.improvements} 
                         onChange={e => updateReview('improvements', e.target.value)}
                        className="w-full h-32 bg-stone-50 border border-stone-200 rounded-lg p-4 focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none resize-none"
                        placeholder="O que ficou pendente? O que drenou energia?"
                    />
                </div>
            </div>

            <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="block font-serif text-lg text-ink">Prioridades da Próxima Semana</label>
                    <button 
                        onClick={importPendingTasks}
                        className="text-xs flex items-center gap-1 text-stone-500 hover:text-accent transition-colors bg-stone-50 hover:bg-stone-100 px-2 py-1 rounded border border-stone-200"
                        title="Importar tarefas não concluídas da semana"
                    >
                        <ArrowDownCircle size={14} /> Importar Pendências
                    </button>
                 </div>
                 <textarea 
                    value={currentReview.nextPriorities} 
                    onChange={e => updateReview('nextPriorities', e.target.value)}
                    className="w-full h-24 bg-stone-50 border border-stone-200 rounded-lg p-4 focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none resize-none"
                    placeholder="Focar em..."
                 />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-stone-100">
                <div>
                    <label className="block font-serif text-lg text-ink mb-4">Humor & Energia (1-5)</label>
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button 
                                key={n}
                                onClick={() => updateReview('mood', n)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentReview.mood === n ? 'bg-accent text-white scale-110' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                     <label className="block font-serif text-lg text-ink mb-4">Equilíbrio da Semana</label>
                     <div className="grid grid-cols-2 gap-3">
                         {Object.entries(currentReview.balance).map(([key, val]) => (
                             <label key={key} className="flex items-center gap-2 cursor-pointer p-2 border border-stone-100 rounded hover:bg-stone-50">
                                 <input 
                                    type="checkbox" 
                                    checked={val}
                                    onChange={() => updateReview('balance', { ...currentReview.balance, [key]: !val })}
                                    className="rounded text-accent focus:ring-accent"
                                 />
                                 <span className="capitalize text-stone-600">{key === 'work' ? 'Trabalho' : key === 'health' ? 'Saúde' : key === 'family' ? 'Família' : 'Lazer'}</span>
                             </label>
                         ))}
                     </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
