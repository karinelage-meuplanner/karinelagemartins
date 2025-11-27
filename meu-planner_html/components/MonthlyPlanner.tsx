
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Target, List, CheckSquare, 
  Droplets, Moon, Zap, Plus, Trash2, CheckCircle2, Circle,
  ChevronDown, ChevronUp, Calendar as CalendarIcon, Clock
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleCalendarEvent } from '../types';

interface Props {
  calendarEvents: GoogleCalendarEvent[];
  onAddEvent?: (event: GoogleCalendarEvent) => void;
}

interface MonthlyItem {
  id: string;
  text: string;
  completed: boolean;
}

export const MonthlyPlanner: React.FC<Props> = ({ calendarEvents = [], onAddEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for inputs (Persisted)
  const [goals, setGoals] = useLocalStorage<MonthlyItem[]>('planner_monthly_goals_v2', [
    { id: '1', text: 'Organizar finanças pessoais', completed: false },
    { id: '2', text: 'Iniciar curso novo', completed: false }
  ]);
  const [newGoal, setNewGoal] = useState('');
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);

  // Priorities V2 (Checklist System)
  const [priorities, setPriorities] = useLocalStorage<MonthlyItem[]>('planner_monthly_priorities_v2', [
    { id: '1', text: 'Finalizar projeto X', completed: false },
    { id: '2', text: 'Check-up médico', completed: false }
  ]);
  const [newPriority, setNewPriority] = useState('');
  const [showCompletedPriorities, setShowCompletedPriorities] = useState(false);

  // Action Plan V2 (Checklist System)
  const [actions, setActions] = useLocalStorage<MonthlyItem[]>('planner_monthly_actions_v2', [
    { id: '1', text: 'Definir escopo do projeto', completed: false },
    { id: '2', text: 'Reunião de alinhamento', completed: false },
    { id: '3', text: 'Comprar materiais', completed: false }
  ]);
  const [newAction, setNewAction] = useState('');
  const [showCompletedActions, setShowCompletedActions] = useState(false);
  
  // Mock Habit Data (31 days) (Persisted)
  const [habits, setHabits] = useLocalStorage('planner_monthly_habits', {
    water: Array(31).fill(false),
    sleep: Array(31).fill(false),
    exercise: Array(31).fill(false)
  });

  // State for New Event Form
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    description: ''
  });

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
  
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month); // 0 = Sunday
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const empties = Array.from({ length: startDay }, (_, i) => i);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const toggleHabit = (habit: 'water' | 'sleep' | 'exercise', dayIndex: number) => {
    setHabits(prev => ({
        ...prev,
        [habit]: prev[habit].map((val: boolean, idx: number) => idx === dayIndex ? !val : val)
    }));
  };

  const getEventsForDay = (day: number) => {
      // Cria a data localmente para comparação correta
      const targetDate = new Date(year, month, day);
      const dateStr = targetDate.toLocaleDateString('en-CA'); // YYYY-MM-DD local

      return calendarEvents.filter(ev => {
          let evDateStr = '';
          if (ev.start.dateTime) {
              evDateStr = new Date(ev.start.dateTime).toLocaleDateString('en-CA');
          } else if (ev.start.date) {
              evDateStr = ev.start.date;
          }
          return evDateStr === dateStr;
      });
  };

  const getEventsForCurrentMonth = () => {
    return calendarEvents.filter(ev => {
        let evDate: Date;
        if (ev.start.dateTime) evDate = new Date(ev.start.dateTime);
        else if (ev.start.date) evDate = new Date(ev.start.date + 'T12:00:00'); // midday to avoid timezone edge cases
        else return false;
        
        return evDate.getMonth() === month && evDate.getFullYear() === year;
    }).sort((a,b) => {
        const da = a.start.dateTime || a.start.date || '';
        const db = b.start.dateTime || b.start.date || '';
        return da.localeCompare(db);
    });
  };

  // --- Handlers para Metas (Goals) ---
  const addGoal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGoal.trim()) return;
      setGoals([...goals, { id: Date.now().toString(), text: newGoal, completed: false }]);
      setNewGoal('');
  };

  const toggleGoal = (id: string) => {
      setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = (id: string) => {
      setGoals(goals.filter(g => g.id !== id));
  };

  // --- Handlers para Prioridades (Priorities) ---
  const addPriority = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPriority.trim()) return;
      setPriorities([...priorities, { id: Date.now().toString(), text: newPriority, completed: false }]);
      setNewPriority('');
  };

  const togglePriority = (id: string) => {
      setPriorities(priorities.map(p => p.id === id ? { ...p, completed: !p.completed } : p));
  };

  const deletePriority = (id: string) => {
      setPriorities(priorities.filter(p => p.id !== id));
  };

  // --- Handlers para Plano de Ação (Actions) ---
  const addAction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAction.trim()) return;
      setActions([...actions, { id: Date.now().toString(), text: newAction, completed: false }]);
      setNewAction('');
  };

  const toggleAction = (id: string) => {
      setActions(actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const deleteAction = (id: string) => {
      setActions(actions.filter(a => a.id !== id));
  };

  // --- Handler para Adicionar Evento Importante ---
  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEvent.title || !newEvent.date) return;

      if (onAddEvent) {
          const startDateTime = new Date(`${newEvent.date}T${newEvent.time}:00`);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration default

          const event: GoogleCalendarEvent = {
              id: 'manual-' + Date.now(),
              summary: newEvent.title,
              description: newEvent.description,
              start: { dateTime: startDateTime.toISOString() },
              end: { dateTime: endDateTime.toISOString() },
              location: 'Meu Planner'
          };
          
          onAddEvent(event);
      }

      setNewEvent({
          title: '',
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          description: ''
      });
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoalsList = goals.filter(g => g.completed);

  const activePriorities = priorities.filter(p => !p.completed);
  const completedPrioritiesList = priorities.filter(p => p.completed);

  const activeActions = actions.filter(a => !a.completed);
  const completedActionsList = actions.filter(a => a.completed);

  const monthEvents = getEventsForCurrentMonth();

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-3xl text-ink capitalize">
            {monthNames[month]} <span className="text-stone-400">{year}</span>
        </h2>
        <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronLeft /></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronRight /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid (Left - 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col">
                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="text-xs font-bold text-stone-400 uppercase tracking-wider py-2">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2 auto-rows-fr flex-1">
                    {empties.map(e => <div key={`empty-${e}`} className="bg-transparent min-h-[80px]"></div>)}
                    {days.map(day => {
                        const dayEvents = getEventsForDay(day);
                        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                        
                        return (
                            <div key={day} className={`border rounded-lg p-2 transition-colors cursor-pointer relative group min-h-[80px] flex flex-col justify-between overflow-hidden
                                ${isToday ? 'border-accent bg-accent/5' : 'border-stone-100 hover:border-accent/50 bg-stone-50/30'}`}>
                                
                                <span className={`text-sm font-serif font-medium ${isToday ? 'text-accent' : 'text-stone-700'}`}>{day}</span>
                                
                                {/* Events Indicators */}
                                <div className="flex flex-col gap-1 mt-1">
                                    {dayEvents.slice(0, 2).map((ev, idx) => (
                                        <div key={idx} className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded truncate w-full border border-blue-100" title={ev.summary}>
                                            {ev.summary}
                                        </div>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <div className="text-[8px] text-stone-400 pl-1">
                                            +{dayEvents.length - 2} mais
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Important Events Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-500" />
                    Eventos Importantes do Mês
                </h3>
                
                {/* List of Month Events */}
                <div className="mb-6 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {monthEvents.length === 0 ? (
                        <p className="text-xs text-stone-400 italic">Nenhum evento neste mês.</p>
                    ) : (
                        monthEvents.map(ev => (
                            <div key={ev.id} className="flex gap-3 items-center p-2 bg-stone-50 rounded border border-stone-100">
                                <div className="text-center bg-white border border-stone-200 rounded px-2 py-1 min-w-[50px]">
                                    <span className="block text-xs font-bold text-stone-400 uppercase">
                                        {new Date(ev.start.dateTime || ev.start.date || '').getDate()}
                                    </span>
                                    <span className="block text-[10px] text-stone-300 uppercase">
                                         {new Date(ev.start.dateTime || ev.start.date || '').toLocaleDateString('pt-BR', {weekday: 'short'})}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-stone-700">{ev.summary}</p>
                                    <p className="text-xs text-stone-500 flex items-center gap-1">
                                        <Clock size={10} />
                                        {ev.start.dateTime 
                                            ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                            : 'Dia todo'}
                                        {ev.location && ` • ${ev.location}`}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add New Event Form */}
                <form onSubmit={handleAddEvent} className="border-t border-stone-100 pt-4">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Adicionar Novo Evento (Google Calendar)</p>
                    <div className="flex gap-2 mb-2">
                         <input 
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-2 text-xs w-1/3 focus:outline-none focus:border-blue-400"
                         />
                         <input 
                            type="time"
                            value={newEvent.time}
                            onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-2 text-xs w-1/4 focus:outline-none focus:border-blue-400"
                         />
                         <input 
                            type="text"
                            placeholder="Título do Evento"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
                         />
                    </div>
                    <button type="submit" className="w-full bg-stone-800 text-white py-2 rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2">
                        <Plus size={14} /> Adicionar ao Calendário
                    </button>
                    <p className="text-[10px] text-stone-400 mt-2 text-center">
                        Isso integrará o evento ao seu Google Calendar e aparecerá em todas as visões (Diária, Semanal, etc).
                    </p>
                </form>
            </div>
        </div>

        {/* Sidebar: Goals & Priorities */}
        <div className="space-y-6">
            {/* Monthly Goals */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col min-h-[300px]">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <Target size={18} className="text-accent" />
                    Metas do Mês
                </h3>
                
                {/* Add Form */}
                <form onSubmit={addGoal} className="flex gap-2 mb-4">
                    <input 
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="Adicionar meta..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    />
                    <button type="submit" className="bg-stone-100 text-stone-600 p-2 rounded-lg hover:bg-stone-200 transition-colors">
                        <Plus size={18} />
                    </button>
                </form>

                {/* Active List */}
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
                    {activeGoals.length === 0 && <p className="text-xs text-stone-300 italic py-2">Nenhuma meta ativa.</p>}
                    {activeGoals.map(goal => (
                        <div key={goal.id} className="flex items-start gap-3 group">
                            <button onClick={() => toggleGoal(goal.id)} className="mt-0.5 text-stone-300 hover:text-accent transition-colors">
                                <Circle size={20} />
                            </button>
                            <span className="text-sm text-stone-700 flex-1 pt-0.5">{goal.text}</span>
                            <button onClick={() => deleteGoal(goal.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Completed Folder */}
                {completedGoalsList.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedGoals(!showCompletedGoals)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                        >
                            {showCompletedGoals ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Concluídas ({completedGoalsList.length})
                        </button>
                        
                        {showCompletedGoals && (
                            <div className="space-y-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg max-h-[150px] overflow-y-auto custom-scrollbar">
                                {completedGoalsList.map(goal => (
                                    <div key={goal.id} className="flex items-start gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleGoal(goal.id)} className="mt-0.5 text-stone-400">
                                            <CheckCircle2 size={20} />
                                        </button>
                                        <span className="text-sm text-stone-500 flex-1 pt-0.5 line-through decoration-stone-300">{goal.text}</span>
                                        <button onClick={() => deleteGoal(goal.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Top 5 Priorities - Updated to Checklist System */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col min-h-[300px]">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <List size={18} className="text-brand-work" />
                    Top 5 Prioridades
                </h3>

                <form onSubmit={addPriority} className="flex gap-2 mb-4">
                    <input 
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        placeholder="Adicionar prioridade..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-work"
                    />
                    <button type="submit" className="bg-stone-100 text-stone-600 p-2 rounded-lg hover:bg-stone-200 transition-colors">
                        <Plus size={18} />
                    </button>
                </form>

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
                    {activePriorities.map(p => (
                        <div key={p.id} className="flex items-start gap-3 group">
                            <button onClick={() => togglePriority(p.id)} className="mt-0.5 text-stone-300 hover:text-brand-work transition-colors">
                                <Circle size={20} />
                            </button>
                            <span className="text-sm text-stone-700 flex-1 pt-0.5">{p.text}</span>
                            <button onClick={() => deletePriority(p.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {activePriorities.length === 0 && <p className="text-xs text-stone-300 italic py-2">Nenhuma prioridade ativa.</p>}
                </div>

                {completedPrioritiesList.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedPriorities(!showCompletedPriorities)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                        >
                            {showCompletedPriorities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Concluídas ({completedPrioritiesList.length})
                        </button>
                        
                        {showCompletedPriorities && (
                            <div className="space-y-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg max-h-[150px] overflow-y-auto custom-scrollbar">
                                {completedPrioritiesList.map(p => (
                                    <div key={p.id} className="flex items-start gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => togglePriority(p.id)} className="mt-0.5 text-stone-400">
                                            <CheckCircle2 size={20} />
                                        </button>
                                        <span className="text-sm text-stone-500 flex-1 pt-0.5 line-through decoration-stone-300">{p.text}</span>
                                        <button onClick={() => deletePriority(p.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

             {/* Action Plan - Updated */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col min-h-[300px]">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <CheckSquare size={18} className="text-brand-finance" />
                    Plano de Ação
                </h3>

                <form onSubmit={addAction} className="flex gap-2 mb-4">
                    <input 
                        value={newAction}
                        onChange={(e) => setNewAction(e.target.value)}
                        placeholder="Adicionar ação..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-finance"
                    />
                    <button type="submit" className="bg-stone-100 text-stone-600 p-2 rounded-lg hover:bg-stone-200 transition-colors">
                        <Plus size={18} />
                    </button>
                </form>

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
                    {activeActions.map(a => (
                        <div key={a.id} className="flex items-start gap-3 group">
                            <button onClick={() => toggleAction(a.id)} className="mt-0.5 text-stone-300 hover:text-brand-finance transition-colors">
                                <Circle size={20} />
                            </button>
                            <span className="text-sm text-stone-700 flex-1 pt-0.5">{a.text}</span>
                            <button onClick={() => deleteAction(a.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {activeActions.length === 0 && <p className="text-xs text-stone-300 italic py-2">Nenhuma ação planejada.</p>}
                </div>

                {completedActionsList.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedActions(!showCompletedActions)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                        >
                            {showCompletedActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Concluídas ({completedActionsList.length})
                        </button>
                        
                        {showCompletedActions && (
                            <div className="space-y-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg max-h-[150px] overflow-y-auto custom-scrollbar">
                                {completedActionsList.map(a => (
                                    <div key={a.id} className="flex items-start gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleAction(a.id)} className="mt-0.5 text-stone-400">
                                            <CheckCircle2 size={20} />
                                        </button>
                                        <span className="text-sm text-stone-500 flex-1 pt-0.5 line-through decoration-stone-300">{a.text}</span>
                                        <button onClick={() => deleteAction(a.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Habit Trackers */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 overflow-x-auto custom-scrollbar">
         <h3 className="font-serif text-lg text-ink mb-4">Rastreadores de Hábitos</h3>
         <div className="min-w-[800px]">
             {/* Header Days */}
             <div className="flex mb-2">
                 <div className="w-32 shrink-0"></div>
                 {days.map(d => (
                     <div key={d} className="flex-1 text-center text-[10px] text-stone-400">{d}</div>
                 ))}
             </div>
             
             {/* Water */}
             <div className="flex items-center mb-3 py-2 border-b border-stone-50">
                 <div className="w-32 shrink-0 flex items-center gap-2 font-medium text-sm text-blue-500">
                     <Droplets size={16} /> Água
                 </div>
                 {habits.water.map((checked: boolean, i: number) => (
                     <div key={i} className="flex-1 flex justify-center">
                        <button 
                            onClick={() => toggleHabit('water', i)}
                            className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${checked ? 'bg-blue-400 border-blue-400' : 'border-stone-200 hover:border-blue-300'}`}
                        >
                            {checked && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                     </div>
                 ))}
             </div>

             {/* Sleep */}
             <div className="flex items-center mb-3 py-2 border-b border-stone-50">
                 <div className="w-32 shrink-0 flex items-center gap-2 font-medium text-sm text-indigo-500">
                     <Moon size={16} /> Sono
                 </div>
                 {habits.sleep.map((checked: boolean, i: number) => (
                     <div key={i} className="flex-1 flex justify-center">
                        <button 
                            onClick={() => toggleHabit('sleep', i)}
                            className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-400 border-indigo-400' : 'border-stone-200 hover:border-indigo-300'}`}
                        >
                            {checked && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                     </div>
                 ))}
             </div>

             {/* Energy/Exercise */}
             <div className="flex items-center py-2">
                 <div className="w-32 shrink-0 flex items-center gap-2 font-medium text-sm text-orange-500">
                     <Zap size={16} /> Exercício
                 </div>
                 {habits.exercise.map((checked: boolean, i: number) => (
                     <div key={i} className="flex-1 flex justify-center">
                        <button 
                            onClick={() => toggleHabit('exercise', i)}
                            className={`w-5 h-5 rounded-sm border flex items-center justify-center transition-colors ${checked ? 'bg-orange-400 border-orange-400' : 'border-stone-200 hover:border-orange-300'}`}
                        >
                            {checked && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
};
