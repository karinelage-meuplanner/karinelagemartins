
import React, { useState } from 'react';
import { 
  Plus, Trash2, Calendar, CheckCircle2, Circle, Target, 
  Heart, Briefcase, Home, ShieldCheck, ChevronDown, ChevronUp,
  BrainCircuit, List
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleCalendarEvent } from '../types';

interface Event {
  id: string;
  date: string;
  title: string;
  location: string;
  isGoogle?: boolean;
}

interface AnnualItem {
  id: string;
  text: string;
  completed: boolean;
}

interface CheckItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Props {
  calendarEvents: GoogleCalendarEvent[];
}

// Sub-componente para gerenciar listas (Active vs Completed)
const TaskManager = ({ 
    title, 
    icon: Icon, 
    items, 
    setItems, 
    colorClass = "text-stone-600", 
    bgClass = "bg-white",
    placeholder = "Adicionar novo item..."
}: { 
    title: string, 
    icon: any, 
    items: AnnualItem[], 
    setItems: (val: AnnualItem[]) => void, 
    colorClass?: string,
    bgClass?: string,
    placeholder?: string
}) => {
    const [newItem, setNewItem] = useState('');
    const [showCompleted, setShowCompleted] = useState(false);

    const activeItems = items.filter(i => !i.completed);
    const completedItems = items.filter(i => i.completed);

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        setItems([...items, { id: Date.now().toString(), text: newItem, completed: false }]);
        setNewItem('');
    };

    const toggleItem = (id: string) => {
        setItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    return (
        <div className={`${bgClass} p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col h-full`}>
            <h3 className={`font-serif text-lg font-medium mb-4 flex items-center gap-2 ${colorClass}`}>
                <Icon size={20} />
                {title}
            </h3>

            {/* Input Form */}
            <form onSubmit={addItem} className="flex gap-2 mb-4">
                <input 
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                />
                <button type="submit" className="bg-stone-100 text-stone-600 p-2 rounded-lg hover:bg-stone-200 transition-colors">
                    <Plus size={18} />
                </button>
            </form>

            {/* Active List */}
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
                {activeItems.map(item => (
                    <div key={item.id} className="flex items-start gap-3 group">
                        <button onClick={() => toggleItem(item.id)} className={`mt-0.5 transition-colors ${colorClass.replace('text-', 'text-opacity-50 hover:text-opacity-100 text-')}`}>
                            <Circle size={20} />
                        </button>
                        <span className="text-sm text-stone-700 flex-1 pt-0.5">{item.text}</span>
                        <button onClick={() => deleteItem(item.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {activeItems.length === 0 && <p className="text-xs text-stone-300 italic py-2">Lista vazia.</p>}
            </div>

            {/* Completed List (Folder) */}
            {completedItems.length > 0 && (
                <div className="mt-auto pt-4 border-t border-stone-100">
                    <button 
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                    >
                        {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Concluídas ({completedItems.length})
                    </button>
                    
                    {showCompleted && (
                        <div className="space-y-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg max-h-[150px] overflow-y-auto custom-scrollbar">
                            {completedItems.map(item => (
                                <div key={item.id} className="flex items-start gap-3 group opacity-60 hover:opacity-100 transition-opacity">
                                    <button onClick={() => toggleItem(item.id)} className="mt-0.5 text-stone-400">
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <span className="text-sm text-stone-500 flex-1 pt-0.5 line-through decoration-stone-300">{item.text}</span>
                                    <button onClick={() => deleteItem(item.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16} />
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

export const AnnualPlanner: React.FC<Props> = ({ calendarEvents = [] }) => {
  // Mudamos para _v2 para evitar conflito com dados antigos que eram strings simples
  const [reflections, setReflections] = useLocalStorage<AnnualItem[]>('planner_annual_reflections_v2', [
    { id: '1', text: 'Melhorar equilíbrio trabalho-vida', completed: false }
  ]);
  
  const [goals, setGoals] = useLocalStorage<AnnualItem[]>('planner_annual_goals_v2', [
    { id: '1', text: 'Viagem Internacional', completed: false },
    { id: '2', text: 'Reserva de Emergência completa', completed: false }
  ]);
  
  // Priorities State (Agora lista de objetos)
  const [prioritiesPersonal, setPrioritiesPersonal] = useLocalStorage<AnnualItem[]>('planner_annual_prio_personal_v2', []);
  const [prioritiesFamily, setPrioritiesFamily] = useLocalStorage<AnnualItem[]>('planner_annual_prio_family_v2', []);
  const [prioritiesWork, setPrioritiesWork] = useLocalStorage<AnnualItem[]>('planner_annual_prio_work_v2', []);

  // State for Manual Events (Persisted)
  const [manualEvents, setManualEvents] = useLocalStorage<Event[]>('planner_annual_events', [
    { id: '1', date: '2025-01-15', title: 'Aniversário Beatriz', location: 'Casa' },
    { id: '2', date: '2025-07-10', title: 'Férias em Família', location: 'Praia' }
  ]);
  const [newEvent, setNewEvent] = useState({ date: '', title: '', location: '' });

  // State for Health/Docs (Persisted)
  const [checks, setChecks] = useLocalStorage<CheckItem[]>('planner_annual_checks', [
    { id: '1', text: 'Check-up médico anual', completed: false },
    { id: '2', text: 'Renovar seguro do carro', completed: false },
    { id: '3', text: 'Dentista (Beatriz)', completed: false },
    { id: '4', text: 'Imposto de Renda', completed: true },
  ]);

  // Merge and Sort Events (Google + Manual)
  const allEvents = [
    ...manualEvents,
    ...calendarEvents.map(e => ({
        id: e.id,
        date: (e.start.dateTime || e.start.date || '').split('T')[0],
        title: e.summary,
        location: e.location || 'Google Calendar',
        isGoogle: true
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    setManualEvents([...manualEvents, { ...newEvent, id: Date.now().toString() }]);
    setNewEvent({ date: '', title: '', location: '' });
  };

  const removeEvent = (id: string) => {
    setManualEvents(manualEvents.filter(ev => ev.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Reflection & Main Goals Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TaskManager 
            title="Reflexão do Ano Anterior" 
            icon={BrainCircuit}
            items={reflections}
            setItems={setReflections}
            colorClass="text-stone-500"
            placeholder="O que funcionou? O que aprendi?"
          />
          
          <TaskManager 
            title="Metas Principais do Ano" 
            icon={Target}
            items={goals}
            setItems={setGoals}
            colorClass="text-accent"
            placeholder="Qual o grande objetivo?"
          />
      </div>

      {/* Priorities Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <TaskManager 
            title="Pessoal" 
            icon={Heart}
            items={prioritiesPersonal}
            setItems={setPrioritiesPersonal}
            colorClass="text-brand-personal"
            placeholder="Prioridade pessoal..."
         />

         <TaskManager 
            title="Família" 
            icon={Home}
            items={prioritiesFamily}
            setItems={setPrioritiesFamily}
            colorClass="text-brand-daughter"
            placeholder="Prioridade familiar..."
         />

         <TaskManager 
            title="Trabalho" 
            icon={Briefcase}
            items={prioritiesWork}
            setItems={setPrioritiesWork}
            colorClass="text-brand-work"
            placeholder="Meta profissional..."
         />
      </section>

      {/* Bottom Section: Events & Checks */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Important Events */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-[500px] flex flex-col">
              <h3 className="font-serif text-lg text-ink mb-6 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-500" /> 
                  Eventos Importantes & Google Agenda
              </h3>
              
              <div className="space-y-4 mb-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {allEvents.length === 0 && <p className="text-sm text-stone-400 italic">Nenhum evento adicionado.</p>}
                  {allEvents.map(event => (
                      <div key={event.id} className="flex items-start gap-4 group">
                          <div className={`rounded-lg px-3 py-1 text-center min-w-[60px] ${event.isGoogle ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-500'}`}>
                              <span className="block text-xs font-bold uppercase">{event.date ? new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' }) : '-'}</span>
                              <span className="block text-lg font-serif font-bold">{event.date ? new Date(event.date).getDate() : '-'}</span>
                          </div>
                          <div className="flex-1">
                              <p className={`font-medium ${event.isGoogle ? 'text-blue-900' : 'text-stone-800'}`}>{event.title}</p>
                              <p className="text-xs text-stone-500 flex items-center gap-1">
                                  {event.isGoogle && <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="GCal" className="w-3 h-3" />}
                                  {event.location}
                              </p>
                          </div>
                          {!event.isGoogle && (
                              <button onClick={() => removeEvent(event.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 size={16} />
                              </button>
                          )}
                      </div>
                  ))}
              </div>

              <form onSubmit={addEvent} className="flex gap-2 items-end pt-4 border-t border-stone-100 mt-auto">
                 <div className="flex-1 space-y-2">
                     <div className="flex gap-2">
                        <input 
                            type="date" 
                            value={newEvent.date}
                            onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs w-1/3 focus:outline-none focus:border-accent"
                        />
                        <input 
                            type="text" 
                            placeholder="Evento Manual"
                            value={newEvent.title}
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                            className="bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs flex-1 focus:outline-none focus:border-accent"
                        />
                     </div>
                 </div>
                 <button type="submit" className="bg-ink text-white p-2 rounded-lg hover:bg-stone-700 transition-colors mb-0.5">
                     <Plus size={16} />
                 </button>
              </form>
          </div>

          {/* Health & Documents Checklist - Updated to use TaskManager */}
          <TaskManager 
            title="Saúde & Documentos" 
            icon={ShieldCheck}
            items={checks}
            setItems={setChecks}
            colorClass="text-brand-finance"
            placeholder="Adicionar check-up ou documento..."
          />
      </section>
    </div>
  );
};
