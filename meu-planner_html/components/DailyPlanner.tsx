import React, { useState, useMemo } from 'react';
import { TodoItem, GoogleCalendarEvent } from '../types';
import { 
  CheckCircle2, Circle, Plus, Download, Sparkles, Calendar as CalendarIcon, 
  Share2, Clock, Briefcase, DollarSign, Home, Heart, Plane, User, Target, 
  AlertCircle, Trophy, ArrowRight, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { generateDailyPlan } from '../services/geminiService';
import useLocalStorage from '../hooks/useLocalStorage';

interface Props {
  calendarEvents?: GoogleCalendarEvent[];
}

// Configuração visual das categorias
const CATEGORIES: Record<string, { label: string, color: string, icon: any, bg: string }> = {
  work: { label: 'Trabalho', color: 'text-slate-600', bg: 'bg-slate-100', icon: Briefcase },
  finance: { label: 'Finanças', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: DollarSign },
  home: { label: 'Casa', color: 'text-orange-600', bg: 'bg-orange-100', icon: Home },
  personal: { label: 'Pessoal', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: User },
  daughter: { label: 'Beatriz', color: 'text-pink-600', bg: 'bg-pink-100', icon: Heart },
  travel: { label: 'Viagens', color: 'text-sky-600', bg: 'bg-sky-100', icon: Plane },
  other: { label: 'Geral', color: 'text-stone-600', bg: 'bg-stone-100', icon: Circle },
};

export const DailyPlanner: React.FC<Props> = ({ calendarEvents = [] }) => {
  // --- Local State ---
  const [todos, setTodos] = useLocalStorage<TodoItem[]>('planner_daily_todos', [
    { id: '1', text: 'Revisar orçamento mensal', completed: false, priority: 'high', category: 'finance' },
    { id: '2', text: 'Brincar com Beatriz no parque', completed: false, priority: 'high', category: 'daughter' },
    { id: '3', text: 'Enviar relatório semanal', completed: true, priority: 'medium', category: 'work' },
  ]);
  
  const [newTodo, setNewTodo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('work');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showCompleted, setShowCompleted] = useState(false);
  
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- External Data Integration (Read-Only) ---
  // Lendo dados salvos pelas outras páginas para criar o "Alinhamento Estratégico"
  const [annualEvents] = useLocalStorage<any[]>('planner_annual_events', []);
  const [monthlyPriorities] = useLocalStorage<any[]>('planner_monthly_priorities_v2', []);
  const [weeklyTasks] = useLocalStorage<any[]>('planner_weekly_tasks', []);

  // --- Derived Data ---
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD para comparação
  const todayDisplay = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Filter Tasks
  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  const pendingHighPriority = pendingTodos.filter(t => t.priority === 'high');
  const pendingOther = pendingTodos.filter(t => t.priority !== 'high');

  // 1. Eventos do Planejador Anual para hoje
  const todayAnnualEvents = useMemo(() => {
    return annualEvents.filter(e => e.date === todayStr);
  }, [annualEvents, todayStr]);

  // 2. Prioridades do Mês (Top 3)
  const topMonthlyPriorities = useMemo(() => {
    // Handle both new Object array and old String array structure gracefully
    return monthlyPriorities
        .filter((p: any) => {
             if (typeof p === 'string') return p && p.trim() !== '';
             return p && !p.completed && p.text;
        })
        .map((p: any) => typeof p === 'string' ? p : p.text)
        .slice(0, 3);
  }, [monthlyPriorities]);

  // 3. Tarefas da Semana pendentes (Top 2)
  const urgentWeeklyTasks = useMemo(() => {
    return weeklyTasks.filter(t => !t.done).slice(0, 2);
  }, [weeklyTasks]);

  // --- Handlers ---
  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  }

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { 
      id: Date.now().toString(), 
      text: newTodo, 
      completed: false, 
      priority: selectedPriority,
      category: selectedCategory
    }]);
    setNewTodo('');
  };

  const handleAiPlan = async () => {
    setIsGenerating(true);
    const activeTodos = pendingTodos.map(t => `${t.text} (${t.category})`);
    const eventsSummary = calendarEvents.map(e => `${e.summary} (${new Date(e.start.dateTime || '').toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})})`);
    const context = `Prioridade do mês: ${topMonthlyPriorities[0] || 'Nenhuma'}. Evento Anual Hoje: ${todayAnnualEvents.map(e=>e.title).join(', ') || 'Nenhum'}.`;
    
    const plan = await generateDailyPlan(activeTodos, eventsSummary.length ? eventsSummary : ["Sem compromissos"], `Focado. Contexto: ${context}`);
    setAiSuggestion(plan);
    setIsGenerating(false);
  };

  const handleExportCalendar = () => {
    const headers = "Subject,Start Date,Start Time,Description\n";
    const dateStr = new Date().toISOString().split('T')[0];
    const rows = pendingTodos.map(t => `"${t.text}","${dateStr}","09:00","[${t.category?.toUpperCase()}] Prioridade: ${t.priority}"`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planner_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventsForHour = (hour: number) => {
      return calendarEvents.filter(event => {
          if (!event.start.dateTime) return false;
          const eventDate = new Date(event.start.dateTime);
          return eventDate.getHours() === hour;
      });
  };

  // Renderiza um item de tarefa
  const renderTodoItem = (t: TodoItem) => {
      const catConfig = CATEGORIES[t.category || 'other'] || CATEGORIES['other'];
      return (
        <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${t.completed ? 'bg-stone-50 border-stone-100 opacity-70' : 'bg-white border-stone-100 hover:border-stone-300'} ${t.priority === 'high' && !t.completed ? 'bg-red-50/50 border-red-100' : ''}`}>
            <button 
                onClick={() => toggleTodo(t.id)} 
                className={`${t.completed ? 'text-stone-400' : t.priority === 'high' ? 'text-red-500 hover:text-red-600' : 'text-stone-300 hover:text-accent'} transition-colors`}
            >
                {t.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
            <div className="flex-1 min-w-0">
                <span className={`block text-sm ${t.completed ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}`}>{t.text}</span>
                <div className="flex items-center gap-2 mt-0.5">
                    {t.priority === 'high' && !t.completed && (
                         <span className="text-[10px] font-bold bg-white text-red-500 px-1.5 rounded border border-red-100 shadow-sm">TOP PRIORIDADE</span>
                    )}
                    <span className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded ${catConfig.bg} ${catConfig.color} border border-transparent`}>
                        <catConfig.icon size={10} /> {catConfig.label}
                    </span>
                </div>
            </div>
            <button onClick={() => deleteTodo(t.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={16} className="w-4 h-4" />
            </button>
        </div>
      );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Left Column: Strategic Context & Quick Add (4 Cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Strategic Alignment Card */}
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2 relative z-10">
                <Target className="text-accent" size={20} />
                Alinhamento Estratégico
            </h3>

            <div className="space-y-4 relative z-10">
                {/* Annual Match */}
                {todayAnnualEvents.length > 0 && (
                    <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <p className="text-[10px] text-accent uppercase font-bold tracking-wider mb-1">Evento Anual (Hoje)</p>
                        {todayAnnualEvents.map(e => (
                             <p key={e.id} className="font-medium text-sm flex items-center gap-2">
                                <CalendarIcon size={14} /> {e.title}
                             </p>
                        ))}
                    </div>
                )}

                {/* Monthly Priorities */}
                <div>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-2">Prioridades do Mês (Top 3)</p>
                    {topMonthlyPriorities.length > 0 ? (
                        <ul className="space-y-2">
                            {topMonthlyPriorities.map((p: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <span className="bg-accent text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>
                                    <span className="text-stone-200">{p}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-stone-500 italic">Nenhuma prioridade definida no Planejamento Mensal.</p>
                    )}
                </div>

                {/* Weekly Context */}
                {urgentWeeklyTasks.length > 0 && (
                     <div className="pt-2 border-t border-white/10">
                        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mb-1">Pendente da Semana</p>
                        {urgentWeeklyTasks.map((t: any, i: number) => (
                             <p key={i} className="text-xs text-stone-300 flex items-center gap-2 truncate">
                                <ArrowRight size={10} /> {t.text}
                             </p>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Gemini Integration */}
        {aiSuggestion && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-accent/30 animate-fade-in">
                 <h3 className="font-serif text-lg mb-2 text-ink flex items-center gap-2">
                    <Sparkles size={18} className="text-accent" /> Sugestão IA
                </h3>
                <div className="text-sm text-stone-600 prose prose-stone leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar">
                    {aiSuggestion}
                </div>
            </div>
        )}

        {/* Categories Legend */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
             <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Categorias Integradas</h4>
             <div className="flex flex-wrap gap-2">
                 {Object.entries(CATEGORIES).map(([key, config]) => (
                     <span key={key} className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 ${config.bg} ${config.color} border-transparent`}>
                         <config.icon size={10} /> {config.label}
                     </span>
                 ))}
             </div>
        </div>
      </div>

      {/* Center Column: Task Management (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 min-h-[600px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-serif text-2xl text-ink">Tarefas de Hoje</h3>
                    <p className="text-xs text-stone-400 capitalize">{todayDisplay}</p>
                </div>
                <div className="flex gap-1">
                    <button onClick={handleAiPlan} disabled={isGenerating} className="p-2 text-accent hover:bg-accent/10 rounded-full transition-colors" title="Gerar Plano com IA">
                        <Sparkles size={20} />
                    </button>
                    <button onClick={handleExportCalendar} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors" title="Exportar CSV">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Add Task Form */}
            <form onSubmit={addTodo} className="bg-stone-50 p-4 rounded-xl border border-stone-100 mb-6 shadow-inner">
                <input 
                    type="text" 
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="O que precisa ser feito?"
                    className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm font-medium"
                />
                
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    {/* Category Selector */}
                    <div className="flex gap-1 overflow-x-auto max-w-full pb-1 custom-scrollbar">
                         {Object.entries(CATEGORIES).map(([key, config]) => (
                             <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedCategory(key)}
                                className={`p-2 rounded-lg transition-all ${selectedCategory === key ? `${config.bg} ${config.color} ring-1 ring-offset-1 ring-stone-300 scale-105` : 'text-stone-300 hover:bg-stone-100'}`}
                                title={config.label}
                             >
                                 <config.icon size={18} />
                             </button>
                         ))}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value as any)}
                            className="bg-white border border-stone-200 text-xs rounded-lg px-2 py-2 focus:outline-none"
                        >
                            <option value="high">Alta Prioridade</option>
                            <option value="medium">Média</option>
                            <option value="low">Baixa</option>
                        </select>
                        <button type="submit" className="bg-ink text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors shadow-sm">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </form>

            {/* Tasks List Container */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* 1. Pending Tasks Section */}
                <div className="space-y-4">
                    
                    {/* High Priority Subsection */}
                    {pendingHighPriority.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <AlertCircle size={12} /> Top Prioridades
                            </h4>
                            <div className="space-y-2">
                                {pendingHighPriority.map(t => renderTodoItem(t))}
                            </div>
                        </div>
                    )}

                    {/* Other Tasks Subsection */}
                    <div>
                        {pendingHighPriority.length > 0 && pendingOther.length > 0 && (
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 mt-4">Outras</h4>
                        )}
                        <div className="space-y-2">
                            {pendingOther.map(t => renderTodoItem(t))}
                            
                            {pendingTodos.length === 0 && (
                                <div className="text-center py-10 text-stone-400">
                                    <CheckCircle2 size={40} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Tudo feito por enquanto!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Completed Tasks Section (Collapsible like Google Tasks) */}
                {completedTodos.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-700 transition-colors mb-3 group"
                        >
                            {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            Concluídas ({completedTodos.length})
                        </button>
                        
                        {showCompleted && (
                            <div className="space-y-2 animate-fade-in">
                                {completedTodos.map(t => renderTodoItem(t))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Right Column: Time Blocking & Schedule (3 Cols) */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-500" /> Agenda
                </h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{calendarEvents.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-stone-100"></div>
                
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(hour => {
                    const hourEvents = getEventsForHour(hour);
                    return (
                        <div key={hour} className="flex gap-3 mb-4 relative z-10 group">
                            <span className="text-xs font-mono text-stone-400 w-8 text-right shrink-0 pt-1">{hour}:00</span>
                            <div className="flex-1 min-h-[30px]">
                                {hourEvents.length > 0 ? (
                                    hourEvents.map(ev => (
                                        <div key={ev.id} className="bg-white border-l-2 border-blue-500 p-2 shadow-sm rounded-r mb-2 hover:bg-blue-50 transition-colors">
                                            <p className="font-bold text-xs text-stone-800 truncate">{ev.summary}</p>
                                            <div className="flex items-center gap-1 text-stone-500 text-[10px] mt-0.5">
                                                <Clock size={10} />
                                                {new Date(ev.start.dateTime || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                {' - '}
                                                {new Date(ev.end.dateTime || '').toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-0 border-b border-stone-100 w-full mt-2.5 opacity-50 group-hover:opacity-100"></div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

    </div>
  );
};