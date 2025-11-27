
import React, { useState, useMemo } from 'react';
import { 
  Heart, GraduationCap, Stethoscope, Ruler, Camera, 
  Gift, Calendar, Plus, Trash2, Clock, Music, Activity,
  ChevronLeft, ChevronRight, Edit2, Save, X, ChevronDown, ChevronUp, CheckCircle2, Circle,
  AlertTriangle, ArrowRight
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleCalendarEvent } from '../types';

interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  activity: string;
  category: 'school' | 'sport' | 'art' | 'other';
}

interface HealthItem {
  id: string;
  title: string; // ex: Pediatra, Vacina, Vitamina
  details: string; // ex: Dra. Ana
  day: string;
  completed: boolean;
}

interface Memory {
  id: string;
  date: string;
  text: string;
  completed: boolean;
}

interface Props {
  calendarEvents: GoogleCalendarEvent[];
  onAddEvent?: (event: GoogleCalendarEvent) => void;
}

export const DaughterPlanner: React.FC<Props> = ({ calendarEvents = [], onAddEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation Logic
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0,0,0,0);
    return monday;
  };
  
  const startOfWeek = getMonday(new Date(currentDate));
  const weekKey = startOfWeek.toLocaleDateString('en-CA');

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  const weekRangeStr = `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${new Date(startOfWeek.getTime() + 6*86400000).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;
  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // --- Schedule State (Persisted PER WEEK) ---
  const [weeklySchedule, setWeeklySchedule] = useLocalStorage<Record<string, ScheduleItem[]>>('planner_daughter_schedule_weekly', {});
  const currentWeekSchedule = weeklySchedule[weekKey] || [];

  // Form State for Schedule
  const [newActivity, setNewActivity] = useState<{
      day: string; 
      time: string; 
      activity: string; 
      category: 'school' | 'sport' | 'art' | 'other';
      editingId?: string; 
  }>({
      day: 'Segunda',
      time: '14:00',
      activity: '',
      category: 'school'
  });

  // --- School Tasks (Persisted PER WEEK) ---
  const [weeklyTasks, setWeeklyTasks] = useLocalStorage<Record<string, any[]>>('planner_daughter_tasks_weekly', {});
  const currentTasks = weeklyTasks[weekKey] || [];
  const [newTask, setNewTask] = useState('');
  
  // States for Task Editing
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // --- Health & Appointments (Persisted PER WEEK) ---
  // Changed from global 'appointments' to weekly to allow history and clearing
  const [weeklyHealth, setWeeklyHealth] = useLocalStorage<Record<string, HealthItem[]>>('planner_daughter_health_weekly_v2', {});
  const currentHealthItems = weeklyHealth[weekKey] || [];
  
  const [newHealth, setNewHealth] = useState({ title: '', details: '', day: 'Segunda' });
  const [editingHealthId, setEditingHealthId] = useState<string | null>(null);
  const [editingHealthData, setEditingHealthData] = useState({ title: '', details: '', day: 'Segunda' });
  const [showCompletedHealth, setShowCompletedHealth] = useState(false);

  // --- Global States (Stats & Memories) ---
  const [stats, setStats] = useLocalStorage('planner_daughter_stats', { height: '110', weight: '18.5' });

  // Memories V2 (Global with Checklist)
  const [memories, setMemories] = useLocalStorage<Memory[]>('planner_daughter_memories_v2', [
    { id: '1', date: '2024-05-10', text: 'Caiu o primeiro dentinho!', completed: false },
  ]);
  const [newMemory, setNewMemory] = useState({ text: '', date: new Date().toISOString().split('T')[0] });
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryText, setEditingMemoryText] = useState('');
  const [showCompletedMemories, setShowCompletedMemories] = useState(false);

  // --- Handlers ---

  // --- Schedule Handlers ---
  const addScheduleItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newActivity.activity) return;

      if (newActivity.editingId) {
          // Edit Mode
          setWeeklySchedule({
              ...weeklySchedule,
              [weekKey]: currentWeekSchedule.map(item => 
                  item.id === newActivity.editingId 
                  ? { ...item, day: newActivity.day, time: newActivity.time, activity: newActivity.activity, category: newActivity.category }
                  : item
              )
          });
      } else {
          // Create Mode
          const newItem: ScheduleItem = { 
              id: Date.now().toString(),
              day: newActivity.day,
              time: newActivity.time,
              activity: newActivity.activity,
              category: newActivity.category
          };
          setWeeklySchedule({
              ...weeklySchedule,
              [weekKey]: [...currentWeekSchedule, newItem]
          });
      }

      // Reset form
      setNewActivity({ day: 'Segunda', time: '14:00', activity: '', category: 'school' });
  };

  const editScheduleItem = (item: ScheduleItem) => {
      setNewActivity({
          day: item.day,
          time: item.time,
          activity: item.activity,
          category: item.category,
          editingId: item.id
      });
  };

  const removeScheduleItem = (id: string) => {
      if(confirm("Remover esta atividade?")) {
          setWeeklySchedule({
              ...weeklySchedule,
              [weekKey]: currentWeekSchedule.filter(i => i.id !== id)
          });
      }
  };

  const syncActivityToGoogle = (item: ScheduleItem) => {
      if (!onAddEvent) return;

      const dayIndex = daysOfWeek.indexOf(item.day);
      if (dayIndex === -1) return;

      const activityDate = new Date(startOfWeek);
      activityDate.setDate(activityDate.getDate() + dayIndex);
      const dateStr = activityDate.toISOString().split('T')[0];

      const startDateTime = new Date(`${dateStr}T${item.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); 

      const event: GoogleCalendarEvent = {
          id: 'manual-activity-' + Date.now(),
          summary: `Beatriz: ${item.activity}`,
          description: `Categoria: ${item.category}`,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          location: 'Atividade Escolar/Extra'
      };
      
      onAddEvent(event);
      alert(`Atividade "${item.activity}" sincronizada com a Agenda!`);
  };

  // --- Task Handlers ---
  const addTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTask.trim()) return;
      setWeeklyTasks({
          ...weeklyTasks,
          [weekKey]: [...currentTasks, { id: Date.now(), text: newTask, done: false }]
      });
      setNewTask('');
  };

  const toggleTask = (id: number) => {
      setWeeklyTasks({
          ...weeklyTasks,
          [weekKey]: currentTasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
      });
  };

  const deleteTask = (id: number) => {
      setWeeklyTasks({
          ...weeklyTasks,
          [weekKey]: currentTasks.filter(t => t.id !== id)
      });
  };

  const startEditTask = (task: any) => {
      setEditingTaskId(task.id);
      setEditingTaskText(task.text);
  };

  const saveEditTask = () => {
      if (editingTaskId && editingTaskText.trim()) {
          setWeeklyTasks({
              ...weeklyTasks,
              [weekKey]: currentTasks.map(t => t.id === editingTaskId ? { ...t, text: editingTaskText } : t)
          });
          setEditingTaskId(null);
          setEditingTaskText('');
      }
  };

  const cancelEditTask = () => {
      setEditingTaskId(null);
      setEditingTaskText('');
  };

  // --- Health Handlers (New Logic) ---
  const addHealthItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newHealth.title.trim()) return;
      
      const newItem: HealthItem = {
          id: Date.now().toString(),
          title: newHealth.title,
          details: newHealth.details,
          day: newHealth.day,
          completed: false
      };

      setWeeklyHealth({
          ...weeklyHealth,
          [weekKey]: [...currentHealthItems, newItem]
      });
      setNewHealth({ title: '', details: '', day: 'Segunda' });
  };

  const toggleHealthItem = (id: string) => {
      setWeeklyHealth({
          ...weeklyHealth,
          [weekKey]: currentHealthItems.map(h => h.id === id ? { ...h, completed: !h.completed } : h)
      });
  };

  const deleteHealthItem = (id: string) => {
      if (confirm("Excluir este item de saúde?")) {
          setWeeklyHealth({
              ...weeklyHealth,
              [weekKey]: currentHealthItems.filter(h => h.id !== id)
          });
      }
  };

  const startEditHealth = (item: HealthItem) => {
      setEditingHealthId(item.id);
      setEditingHealthData({ title: item.title, details: item.details, day: item.day });
  };

  const saveEditHealth = () => {
      if (editingHealthId) {
          setWeeklyHealth({
              ...weeklyHealth,
              [weekKey]: currentHealthItems.map(h => h.id === editingHealthId ? { ...h, ...editingHealthData } : h)
          });
          setEditingHealthId(null);
      }
  };

  const cancelEditHealth = () => {
      setEditingHealthId(null);
  };

  const syncHealthToGoogle = (item: HealthItem) => {
      if (!onAddEvent) return;
      
      const dayIndex = daysOfWeek.indexOf(item.day);
      if (dayIndex === -1) return;

      const itemDate = new Date(startOfWeek);
      itemDate.setDate(itemDate.getDate() + dayIndex);
      const dateStr = itemDate.toISOString().split('T')[0];

      const event: GoogleCalendarEvent = {
          id: 'manual-health-' + Date.now(),
          summary: `Beatriz: ${item.title}`,
          description: item.details,
          start: { date: dateStr }, // All day event usually for loose appointments
          end: { date: dateStr },
          location: 'Saúde'
      };
      onAddEvent(event);
      alert('Item sincronizado com a agenda!');
  }

  // --- Memories Handlers (Updated) ---
  const addMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.text.trim()) return;
    
    setMemories([{ 
        id: Date.now().toString(), 
        date: newMemory.date, 
        text: newMemory.text, 
        completed: false 
    }, ...memories]);
    
    setNewMemory({ ...newMemory, text: '' });
  };

  const toggleMemory = (id: string) => {
      setMemories(memories.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const deleteMemory = (id: string) => {
      if(confirm("Excluir esta memória?")) {
          setMemories(memories.filter(m => m.id !== id));
      }
  };

  const startEditMemory = (memory: Memory) => {
      setEditingMemoryId(memory.id);
      setEditingMemoryText(memory.text);
  };

  const saveEditMemory = () => {
      if (editingMemoryId && editingMemoryText.trim()) {
          setMemories(memories.map(m => m.id === editingMemoryId ? { ...m, text: editingMemoryText } : m));
          setEditingMemoryId(null);
          setEditingMemoryText('');
      }
  };

  const cancelEditMemory = () => {
      setEditingMemoryId(null);
      setEditingMemoryText('');
  };

  // Filter Tasks & Health & Memories
  const activeTasks = currentTasks.filter(t => !t.done);
  const completedTasks = currentTasks.filter(t => t.done);

  const activeHealth = currentHealthItems.filter(h => !h.completed);
  const completedHealth = currentHealthItems.filter(h => h.completed);

  const activeMemories = memories.filter(m => !m.completed);
  const completedMemories = memories.filter(m => m.completed);

  // --- ALERTS & QUICK ACCESS LOGIC ---
  const combinedAlerts = useMemo(() => {
      const alerts: any[] = [];
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);

      // 1. Health Items (Weekly Specific)
      activeHealth.forEach(app => {
          const dayIndex = daysOfWeek.indexOf(app.day);
          if (dayIndex >= 0) {
              const appDate = new Date(startOfWeek);
              appDate.setDate(appDate.getDate() + dayIndex);
              appDate.setHours(0,0,0,0);
              
              // Only show if today or future (within this week)
              if (appDate >= todayDate) {
                  const isToday = appDate.getTime() === todayDate.getTime();
                  alerts.push({
                      id: app.id,
                      type: 'appointment',
                      date: appDate.toISOString().split('T')[0],
                      title: app.title,
                      subtitle: app.details || 'Saúde',
                      isToday: isToday,
                      icon: Stethoscope,
                      color: 'text-green-600 bg-green-50'
                  });
              }
          }
      });

      // 2. Weekly Schedule (Upcoming in this week)
      currentWeekSchedule.forEach(item => {
          const dayIndex = daysOfWeek.indexOf(item.day);
          if (dayIndex >= 0) {
              const itemDate = new Date(startOfWeek);
              itemDate.setDate(itemDate.getDate() + dayIndex);
              itemDate.setHours(0,0,0,0); 

              if (itemDate >= todayDate) {
                  const isToday = itemDate.getTime() === todayDate.getTime();
                  alerts.push({
                      id: item.id,
                      type: 'activity',
                      date: itemDate.toISOString().split('T')[0],
                      time: item.time,
                      title: item.activity,
                      subtitle: item.day,
                      isToday: isToday,
                      icon: Activity,
                      color: 'text-blue-600 bg-blue-50'
                  });
              }
          }
      });

      // 3. Pending Weekly Tasks
      activeTasks.forEach((task: any) => {
          alerts.push({
              id: task.id,
              type: 'task',
              title: task.text,
              subtitle: 'Pendente da Semana',
              isToday: false, 
              icon: GraduationCap,
              color: 'text-pink-600 bg-pink-50'
          });
      });

      // Sort
      return alerts.sort((a, b) => {
          if (a.isToday && !b.isToday) return -1;
          if (!a.isToday && b.isToday) return 1;
          if (a.date && b.date) return a.date.localeCompare(b.date);
          return 0;
      });
  }, [activeHealth, currentWeekSchedule, activeTasks, startOfWeek]);


  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Header / Quick Stats & Navigation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-daughter/10 flex items-center justify-center text-brand-daughter border-2 border-brand-daughter/20">
                    <Heart size={32} fill="#BE185D" fillOpacity={0.2} />
                </div>
                <div>
                    <h2 className="font-serif text-2xl text-ink">Espaço da Beatriz</h2>
                    <p className="text-stone-500 text-sm">Acompanhando cada passo.</p>
                </div>
             </div>
             
             <div className="flex gap-4 text-sm">
                <div className="bg-stone-50 px-4 py-2 rounded-lg border border-stone-100 text-center group hover:border-brand-daughter/30 transition-colors">
                    <span className="block text-xs text-stone-400 uppercase font-bold mb-1">Altura (cm)</span>
                    <div className="flex items-center justify-center gap-1">
                        <input 
                            type="text" 
                            value={stats.height}
                            onChange={(e) => setStats({...stats, height: e.target.value})}
                            className="font-serif font-bold text-brand-daughter text-lg bg-transparent text-center w-16 focus:outline-none focus:border-b focus:border-brand-daughter"
                        />
                    </div>
                </div>
                <div className="bg-stone-50 px-4 py-2 rounded-lg border border-stone-100 text-center group hover:border-brand-daughter/30 transition-colors">
                    <span className="block text-xs text-stone-400 uppercase font-bold mb-1">Peso (kg)</span>
                    <div className="flex items-center justify-center gap-1">
                        <input 
                            type="text" 
                            value={stats.weight}
                            onChange={(e) => setStats({...stats, weight: e.target.value})}
                            className="font-serif font-bold text-brand-daughter text-lg bg-transparent text-center w-16 focus:outline-none focus:border-b focus:border-brand-daughter"
                        />
                    </div>
                </div>
             </div>
         </div>

         {/* Weekly Navigation */}
         <div className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-100">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white rounded-md text-stone-500 transition-colors"><ChevronLeft size={18}/></button>
            <span className="font-bold text-stone-700 text-sm">Semana: {weekRangeStr}</span>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white rounded-md text-stone-500 transition-colors"><ChevronRight size={18}/></button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Weekly Routine */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                        <Activity size={18} className="text-brand-daughter" />
                        Cronograma da Semana
                    </h3>
                    {newActivity.editingId && (
                        <button 
                            onClick={() => setNewActivity({ day: 'Segunda', time: '14:00', activity: '', category: 'school' })}
                            className="text-xs text-stone-400 hover:text-stone-600"
                        >
                            Cancelar Edição
                        </button>
                    )}
                </div>
                
                {/* Add/Edit Activity Form */}
                <form onSubmit={addScheduleItem} className={`p-3 rounded-lg border mb-4 transition-colors ${newActivity.editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-stone-50 border-stone-100'}`}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <select 
                            value={newActivity.day}
                            onChange={e => setNewActivity({...newActivity, day: e.target.value})}
                            className="bg-white border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none"
                        >
                            {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input 
                            type="time"
                            value={newActivity.time}
                            onChange={e => setNewActivity({...newActivity, time: e.target.value})}
                            className="bg-white border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            placeholder="Atividade (ex: Ballet)"
                            value={newActivity.activity}
                            onChange={e => setNewActivity({...newActivity, activity: e.target.value})}
                            className="flex-1 bg-white border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none"
                        />
                        <button type="submit" className="bg-brand-daughter text-white p-1 rounded hover:bg-brand-daughter/80">
                            {newActivity.editingId ? <Save size={16} /> : <Plus size={16} />}
                        </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {['school', 'sport', 'art', 'other'].map(cat => (
                            <button 
                                key={cat}
                                type="button"
                                onClick={() => setNewActivity({...newActivity, category: cat as any})}
                                className={`flex-1 h-1.5 rounded-full transition-all ${newActivity.category === cat ? 'bg-brand-daughter' : 'bg-stone-200'}`}
                            />
                        ))}
                    </div>
                </form>

                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                    {daysOfWeek.map(day => {
                        const dayActivities = currentWeekSchedule.filter(s => s.day === day).sort((a,b) => a.time.localeCompare(b.time));
                        if (dayActivities.length === 0) return null;

                        return (
                            <div key={day} className="border-b border-stone-50 pb-2 last:border-0">
                                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{day}</h4>
                                <div className="space-y-2">
                                    {dayActivities.map(act => (
                                        <div key={act.id} className="flex items-center gap-3 bg-stone-50 p-2 rounded-lg group relative hover:bg-stone-100 transition-colors">
                                            <div className={`p-1.5 rounded ${
                                                act.category === 'school' ? 'bg-blue-100 text-blue-600' : 
                                                act.category === 'sport' ? 'bg-green-100 text-green-600' :
                                                act.category === 'art' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
                                            }`}>
                                                {act.category === 'school' ? <GraduationCap size={14} /> : 
                                                    act.category === 'sport' ? <Activity size={14} /> :
                                                    act.category === 'art' ? <Music size={14} /> : <Clock size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => editScheduleItem(act)}>
                                                <p className="text-sm font-medium text-stone-700 truncate" title="Clique para editar">{act.activity}</p>
                                                <p className="text-[10px] text-stone-500">{act.time}</p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => syncActivityToGoogle(act)}
                                                    className="text-stone-300 hover:text-blue-500 p-1"
                                                    title="Sincronizar com Agenda"
                                                >
                                                    <Calendar size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => removeScheduleItem(act.id)}
                                                    className="text-stone-300 hover:text-red-400 p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {currentWeekSchedule.length === 0 && <p className="text-xs text-stone-300 italic text-center py-4">Nenhuma atividade nesta semana.</p>}
                </div>
            </div>
        </div>

        {/* Column 2: School & Health */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* School Tasks (Weekly) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col min-h-[400px]">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <GraduationCap size={18} className="text-blue-500" />
                    Escola & Tarefas
                </h3>
                
                <form onSubmit={addTask} className="flex gap-2 mb-4">
                    <input 
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Prova / Trabalho..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                    />
                    <button type="submit" className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Plus size={16}/></button>
                </form>

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {activeTasks.map((task: any) => (
                        <div 
                            key={task.id} 
                            className="flex items-center gap-2 p-2 rounded-lg border border-stone-100 hover:border-blue-200 transition-colors group bg-white"
                        >
                            {editingTaskId === task.id ? (
                                <div className="flex-1 flex gap-2 items-center">
                                    <input 
                                        value={editingTaskText}
                                        onChange={(e) => setEditingTaskText(e.target.value)}
                                        className="flex-1 bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                                        autoFocus
                                    />
                                    <button onClick={saveEditTask} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={14}/></button>
                                    <button onClick={cancelEditTask} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    <button onClick={() => toggleTask(task.id)} className="text-stone-300 hover:text-blue-500 transition-colors">
                                        <Circle size={16} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-700 truncate">{task.text}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditTask(task)} className="text-stone-300 hover:text-blue-500 p-1">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => deleteTask(task.id)} className="text-stone-300 hover:text-red-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {activeTasks.length === 0 && <p className="text-xs text-stone-300 italic text-center py-4">Nada pendente.</p>}
                </div>

                {completedTasks.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                        >
                            {showCompletedTasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Concluídas ({completedTasks.length})
                        </button>
                        
                        {showCompletedTasks && (
                            <div className="space-y-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg max-h-[150px] overflow-y-auto custom-scrollbar">
                                {completedTasks.map((task: any) => (
                                    <div key={task.id} className="flex items-center gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleTask(task.id)} className="text-stone-400">
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <span className="text-sm text-stone-500 flex-1 pt-0.5 line-through decoration-stone-300">{task.text}</span>
                                        <button onClick={() => deleteTask(task.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Health Card (Week Specific + History) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <Stethoscope size={18} className="text-green-500" />
                    Saúde & Cuidados (Semanal)
                </h3>
                
                <form onSubmit={addHealthItem} className="bg-green-50/30 p-3 rounded-lg border border-green-100 mb-4">
                    <div className="flex flex-col gap-2">
                        <input 
                            value={newHealth.title}
                            onChange={(e) => setNewHealth({...newHealth, title: e.target.value})}
                            placeholder="O que? (Ex: Pediatra, Vitamina)"
                            className="w-full bg-white border border-green-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-green-400"
                        />
                        <div className="flex gap-2">
                            <select 
                                value={newHealth.day}
                                onChange={(e) => setNewHealth({...newHealth, day: e.target.value})}
                                className="bg-white border border-green-200 rounded px-2 py-1.5 text-xs focus:outline-none"
                            >
                                {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <input 
                                value={newHealth.details}
                                onChange={(e) => setNewHealth({...newHealth, details: e.target.value})}
                                placeholder="Detalhes (Dr...)"
                                className="flex-1 bg-white border border-green-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-green-400"
                            />
                            <button type="submit" className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </form>

                {/* Active Health Items */}
                <div className="space-y-2 mb-2">
                     {activeHealth.map(item => (
                         <div key={item.id} className="p-2 rounded-lg border border-stone-100 hover:border-green-200 transition-colors bg-white group">
                             {editingHealthId === item.id ? (
                                 <div className="space-y-2">
                                     <input 
                                        value={editingHealthData.title}
                                        onChange={(e) => setEditingHealthData({...editingHealthData, title: e.target.value})}
                                        className="w-full bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs"
                                     />
                                     <div className="flex gap-2">
                                         <select 
                                            value={editingHealthData.day}
                                            onChange={(e) => setEditingHealthData({...editingHealthData, day: e.target.value})}
                                            className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs"
                                         >
                                             {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                                         </select>
                                         <input 
                                            value={editingHealthData.details}
                                            onChange={(e) => setEditingHealthData({...editingHealthData, details: e.target.value})}
                                            className="flex-1 bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs"
                                         />
                                     </div>
                                     <div className="flex justify-end gap-2">
                                         <button onClick={cancelEditHealth} className="text-stone-400"><X size={14}/></button>
                                         <button onClick={saveEditHealth} className="text-green-600"><Save size={14}/></button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="flex items-start gap-2">
                                     <button onClick={() => toggleHealthItem(item.id)} className="mt-0.5 text-stone-300 hover:text-green-500">
                                         <Circle size={16} />
                                     </button>
                                     <div className="flex-1 min-w-0">
                                         <p className="text-sm font-bold text-stone-700">{item.title}</p>
                                         <p className="text-xs text-stone-500">{item.day} • {item.details}</p>
                                     </div>
                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={() => syncHealthToGoogle(item)} className="text-stone-300 hover:text-blue-500 p-1" title="Sync Agenda"><Calendar size={12}/></button>
                                         <button onClick={() => startEditHealth(item)} className="text-stone-300 hover:text-blue-500 p-1"><Edit2 size={12}/></button>
                                         <button onClick={() => deleteHealthItem(item.id)} className="text-stone-300 hover:text-red-400 p-1"><Trash2 size={12}/></button>
                                     </div>
                                 </div>
                             )}
                         </div>
                     ))}
                     {activeHealth.length === 0 && <p className="text-xs text-stone-300 italic text-center py-2">Nenhum item pendente.</p>}
                </div>

                {/* Completed Health Items */}
                {completedHealth.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedHealth(!showCompletedHealth)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider w-full mb-2"
                        >
                            {showCompletedHealth ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            Realizados ({completedHealth.length})
                        </button>
                        
                        {showCompletedHealth && (
                            <div className="space-y-2 animate-fade-in bg-green-50/20 p-2 rounded-lg">
                                {completedHealth.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleHealthItem(item.id)} className="text-green-500">
                                            <CheckCircle2 size={16} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-stone-500 line-through block">{item.title}</span>
                                            <span className="text-[10px] text-stone-400 block">{item.day}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Column 3: Quick Access Alerts & Memories */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Access & Alerts Widget */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-brand-daughter" />
                    Acesso Rápido & Alertas
                </h3>
                
                <div className="space-y-3">
                    {combinedAlerts.length === 0 ? (
                        <p className="text-xs text-stone-400 italic text-center py-4">Tudo tranquilo! Nenhuma pendência próxima.</p>
                    ) : (
                        combinedAlerts.map((alert: any) => (
                            <div key={alert.id} className={`flex gap-3 items-start border-l-2 pl-3 ${alert.isToday ? 'border-red-400' : 'border-stone-200'}`}>
                                <div className={`p-1.5 rounded shrink-0 ${alert.color}`}>
                                    <alert.icon size={14} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-sm font-bold ${alert.isToday ? 'text-red-600' : 'text-stone-700'}`}>
                                            {alert.title}
                                        </p>
                                        {alert.isToday && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-0.5">
                                        <span className="text-xs text-stone-500">{alert.subtitle}</span>
                                        <span className={`text-[10px] ${alert.isToday ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                                            {alert.type === 'task' ? 'Esta Semana' : 
                                             alert.time ? `${alert.time} h` :
                                             alert.date ? new Date(alert.date).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'}) : ''
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Memories (Global with Checklist) - Updated */}
            <div className="bg-[#FFF0F5] p-6 rounded-xl shadow-sm border border-pink-100 flex flex-col">
                <h3 className="font-serif text-lg text-pink-800 mb-4 flex items-center gap-2">
                    <Camera size={18} className="text-pink-500" />
                    Diário de Memórias
                </h3>
                
                <form onSubmit={addMemory} className="mb-4 relative bg-white p-3 rounded-lg border border-pink-100">
                    <div className="flex flex-col gap-2">
                        <input 
                            type="date"
                            value={newMemory.date}
                            onChange={(e) => setNewMemory({...newMemory, date: e.target.value})}
                            className="text-xs text-pink-400 bg-transparent border-none focus:outline-none"
                        />
                        <textarea 
                            value={newMemory.text}
                            onChange={(e) => setNewMemory({...newMemory, text: e.target.value})}
                            placeholder="O que aconteceu de especial?"
                            className="w-full bg-transparent border-none text-sm focus:ring-0 outline-none resize-none h-16 placeholder:text-pink-200"
                        />
                    </div>
                    <button type="submit" className="absolute bottom-3 right-3 bg-pink-500 text-white p-1.5 rounded-md hover:bg-pink-600 transition-colors">
                        <Plus size={16} />
                    </button>
                </form>

                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-[300px] pr-1 mb-4">
                    {activeMemories.length === 0 && <p className="text-xs text-pink-300 italic text-center py-4">Nenhuma memória salva ainda.</p>}
                    {activeMemories.map(mem => (
                        <div key={mem.id} className="bg-white p-3 rounded-lg border border-pink-100 shadow-sm relative group hover:border-pink-300 transition-colors">
                            {editingMemoryId === mem.id ? (
                                <div className="space-y-2">
                                    <textarea 
                                        value={editingMemoryText}
                                        onChange={(e) => setEditingMemoryText(e.target.value)}
                                        className="w-full bg-pink-50/50 border border-pink-200 rounded p-2 text-sm focus:outline-none resize-none h-20"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={cancelEditMemory} className="text-stone-400"><X size={14}/></button>
                                        <button onClick={saveEditMemory} className="text-pink-600"><Save size={14}/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute -left-1.5 top-4 w-3 h-3 bg-pink-200 rounded-full border-2 border-white"></div>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs text-pink-400 font-bold">{new Date(mem.date).toLocaleDateString('pt-BR')}</p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEditMemory(mem)} className="text-stone-300 hover:text-blue-500 p-1"><Edit2 size={12}/></button>
                                            <button onClick={() => deleteMemory(mem.id)} className="text-stone-300 hover:text-red-400 p-1"><Trash2 size={12}/></button>
                                            <button onClick={() => toggleMemory(mem.id)} className="text-stone-300 hover:text-pink-500 p-1" title="Marcar como concluído/arquivado"><Circle size={12}/></button>
                                        </div>
                                    </div>
                                    <p className="text-stone-700 text-sm leading-relaxed font-serif italic">"{mem.text}"</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Completed Memories (Folder) */}
                {completedMemories.length > 0 && (
                    <div className="border-t border-pink-100 pt-2">
                        <button 
                            onClick={() => setShowCompletedMemories(!showCompletedMemories)}
                            className="flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-600 uppercase tracking-wider w-full mb-2"
                        >
                            {showCompletedMemories ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            Arquivadas ({completedMemories.length})
                        </button>
                        
                        {showCompletedMemories && (
                            <div className="space-y-2 animate-fade-in max-h-[150px] overflow-y-auto custom-scrollbar">
                                {completedMemories.map(mem => (
                                    <div key={mem.id} className="bg-white/50 p-2 rounded border border-pink-50 flex gap-2 items-start opacity-70 hover:opacity-100 transition-opacity">
                                        <button onClick={() => toggleMemory(mem.id)} className="mt-0.5 text-pink-300 hover:text-pink-500">
                                            <CheckCircle2 size={14} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-pink-300">{new Date(mem.date).toLocaleDateString('pt-BR')}</p>
                                            <p className="text-xs text-stone-500 line-through truncate">{mem.text}</p>
                                        </div>
                                        <button onClick={() => deleteMemory(mem.id)} className="text-stone-300 hover:text-red-400 p-1">
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

      </div>
    </div>
  );
};
