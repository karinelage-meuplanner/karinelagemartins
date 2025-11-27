
import React, { useState } from 'react';
import { 
  Sun, Moon, BookOpen, Heart, Smile, Plus, Trash2, 
  CheckCircle2, Circle, Coffee, Film, Music, PenTool,
  Calendar, Clock, ChevronLeft, ChevronRight, Edit2, Save, X, ChevronDown, ChevronUp,
  Share2, Eye, RotateCcw
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleCalendarEvent } from '../types';

interface MediaItem {
  id: string;
  title: string;
  type: 'book' | 'movie' | 'series';
  status: 'todo' | 'doing' | 'done';
}

interface RitualItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Props {
  calendarEvents?: GoogleCalendarEvent[];
  onAddEvent?: (event: GoogleCalendarEvent) => void;
}

// --- Reusable Ritual Section Component with CRUD & Folder ---
const RitualSection: React.FC<{
  title: string;
  icon: any;
  items: RitualItem[];
  onUpdate: (items: RitualItem[]) => void;
  colorTheme: 'orange' | 'slate';
}> = ({ title, icon: Icon, items, onUpdate, colorTheme }) => {
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Visual Styles based on theme
  const theme = colorTheme === 'orange' ? {
    bg: 'bg-[#FFFBF0]',
    border: 'border-orange-100',
    text: 'text-orange-800',
    icon: 'text-orange-500',
    inputBorder: 'focus:border-orange-300',
    check: 'text-orange-500',
    checkHover: 'text-orange-400',
    hoverBg: 'hover:bg-orange-50'
  } : {
    bg: 'bg-[#F3F4F6]',
    border: 'border-slate-200',
    text: 'text-slate-800',
    icon: 'text-slate-500',
    inputBorder: 'focus:border-slate-400',
    check: 'text-slate-500',
    checkHover: 'text-slate-400',
    hoverBg: 'hover:bg-slate-100'
  };

  const activeItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    onUpdate([...items, { id: Date.now().toString(), text: newItem, completed: false }]);
    setNewItem('');
  };

  const handleToggle = (id: string) => {
    onUpdate(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  const handleDelete = (id: string) => {
    if(confirm('Remover este item?')) {
        onUpdate(items.filter(i => i.id !== id));
    }
  };

  const startEdit = (item: RitualItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (editingId) {
        onUpdate(items.map(i => i.id === editingId ? { ...i, text: editText } : i));
        setEditingId(null);
    }
  };

  return (
    <div className={`${theme.bg} p-6 rounded-xl shadow-sm border ${theme.border}`}>
      <h3 className={`font-serif text-lg ${theme.text} mb-4 flex items-center gap-2`}>
        <Icon size={20} className={theme.icon} />
        {title}
      </h3>

      {/* Active Items List */}
      <div className="space-y-2 mb-4">
        {activeItems.map(item => (
          <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg transition-colors group ${theme.hoverBg}`}>
            {editingId === item.id ? (
                <div className="flex-1 flex gap-2 items-center">
                    <input 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 bg-white border border-stone-300 rounded px-2 py-1 text-sm focus:outline-none"
                        autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-600"><Save size={16}/></button>
                    <button onClick={() => setEditingId(null)} className="text-red-500"><X size={16}/></button>
                </div>
            ) : (
                <>
                    <button onClick={() => handleToggle(item.id)} className={`mt-0.5 transition-colors text-stone-300 hover:${theme.checkHover}`}>
                        <Circle size={20} />
                    </button>
                    <span className={`text-sm font-medium flex-1 ${theme.text}`}>
                        {item.text}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="text-stone-400 hover:text-blue-500 p-1"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(item.id)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                    </div>
                </>
            )}
          </div>
        ))}
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Adicionar atividade..."
            className={`flex-1 bg-white/50 border border-stone-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 ${theme.inputBorder}`}
          />
          <button type="submit" className={`p-1.5 rounded bg-white text-stone-500 shadow-sm hover:text-stone-700`}>
              <Plus size={16} />
          </button>
      </form>

      {/* Completed Folder */}
      {completedItems.length > 0 && (
        <div className="pt-3 border-t border-stone-200/50">
            <button 
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-2 w-full"
            >
                {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Concluídas ({completedItems.length})
            </button>
            
            {showCompleted && (
                <div className="space-y-1 pl-2 animate-fade-in">
                    {completedItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-1 opacity-60 hover:opacity-100 transition-opacity group">
                            <button onClick={() => handleToggle(item.id)} className={`text-stone-400 hover:${theme.check}`}>
                                <CheckCircle2 size={18} />
                            </button>
                            <span className="text-sm font-medium text-stone-500 line-through flex-1">
                                {item.text}
                            </span>
                            <button onClick={() => handleDelete(item.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1">
                                <Trash2 size={14} />
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

export const PersonalPlanner: React.FC<Props> = ({ calendarEvents = [], onAddEvent }) => {
  // Navigation / Date State
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
  const weekKey = startOfWeek.toLocaleDateString('en-CA');

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });
  
  const weekRangeStr = `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;

  // Rituals State (Persisted per Week)
  const [weeklyRituals, setWeeklyRituals] = useLocalStorage<Record<string, { am: RitualItem[], pm: RitualItem[] }>>('planner_personal_rituals_weekly_v2', {});

  const defaultAMRituals = [
    { id: '1', text: 'Beber 500ml de água', completed: false },
    { id: '2', text: 'Meditação (10min)', completed: false },
    { id: '3', text: 'Alongamento', completed: false },
    { id: '4', text: 'Skin Care', completed: false },
  ];

  const defaultPMRituals = [
    { id: '1', text: 'Leitura (20min)', completed: false },
    { id: '2', text: 'Sem telas 1h antes de dormir', completed: false },
    { id: '3', text: 'Planejar o dia seguinte', completed: false },
  ];

  const currentWeekRituals = weeklyRituals[weekKey] || { am: defaultAMRituals, pm: defaultPMRituals };

  // Journal State (Persisted per Week)
  const [weeklyJournal, setWeeklyJournal] = useLocalStorage<Record<string, { gratitude: string, mood: number | null }>>('planner_personal_journal_weekly', {});
  
  const currentJournal = weeklyJournal[weekKey] || { gratitude: '', mood: null };

  // Media State (Global - Not per week)
  const [mediaList, setMediaList] = useLocalStorage<MediaItem[]>('planner_personal_media', [
    { id: '1', title: 'Hábitos Atômicos', type: 'book', status: 'doing' },
    { id: '2', title: 'Interestelar', type: 'movie', status: 'todo' },
    { id: '3', title: 'Succession', type: 'series', status: 'done' },
  ]);
  const [newItem, setNewItem] = useState('');
  const [newType, setNewType] = useState<'book' | 'movie' | 'series'>('book');
  const [showCompletedMedia, setShowCompletedMedia] = useState(false);

  // Event State
  const [newEvent, setNewEvent] = useState({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00'
  });

  // Handlers
  const updateRituals = (type: 'am' | 'pm', newRituals: RitualItem[]) => {
      setWeeklyRituals({
          ...weeklyRituals,
          [weekKey]: {
              ...currentWeekRituals,
              [type]: newRituals
          }
      });
  };

  const updateJournal = (field: 'gratitude' | 'mood', value: any) => {
      setWeeklyJournal({
          ...weeklyJournal,
          [weekKey]: {
              ...currentJournal,
              [field]: value
          }
      });
  };

  const handleShareJournal = async () => {
      if (!currentJournal.gratitude) {
          alert('Escreva algo no diário antes de compartilhar!');
          return;
      }
      
      const moodEmojis = ['😔', '😕', '😐', '🙂', '😁'];
      const moodStr = currentJournal.mood ? moodEmojis[currentJournal.mood - 1] : '';
      
      const text = `✨ *Diário de Gratidão*\nSemana: ${weekRangeStr}\n\n${currentJournal.gratitude}\n\nHumor da semana: ${moodStr}`;
      
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Meu Diário de Gratidão',
                  text: text,
              });
          } catch (err) {
              console.log('Error sharing', err);
          }
      } else {
          navigator.clipboard.writeText(text);
          alert('Diário copiado para a área de transferência!');
      }
  };

  const addMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setMediaList([...mediaList, { id: Date.now().toString(), title: newItem, type: newType, status: 'todo' }]);
    setNewItem('');
  };

  const deleteMedia = (id: string) => {
    if(confirm('Excluir este item da lista?')) {
        setMediaList(mediaList.filter(item => item.id !== id));
    }
  };

  const updateMediaStatus = (id: string) => {
    setMediaList(mediaList.map(item => {
        if (item.id !== id) return item;
        const next = item.status === 'todo' ? 'doing' : item.status === 'doing' ? 'done' : 'todo';
        return { ...item, status: next };
    }));
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
              description: 'Compromisso Pessoal',
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

  // Filter for upcoming personal events (simple logic: all upcoming)
  const upcomingEvents = calendarEvents
    .filter(e => {
        const evDate = new Date(e.start.dateTime || e.start.date || '');
        const today = new Date();
        today.setHours(0,0,0,0);
        return evDate >= today;
    })
    .slice(0, 5); // Show next 5

  // Filter Media Items
  const activeMedia = mediaList.filter(m => m.status !== 'done');
  const completedMedia = mediaList.filter(m => m.status === 'done');

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Weekly Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
           <div className="flex items-center gap-4">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronLeft size={20} /></button>
                <div className="text-center">
                    <h2 className="font-serif text-xl text-ink font-bold flex items-center gap-2 justify-center">
                        Semana de {weekRangeStr}
                    </h2>
                </div>
                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-stone-100 rounded-full text-stone-600"><ChevronRight size={20} /></button>
           </div>

           <div className="flex items-center gap-3">
                <span className="text-sm text-stone-500">Humor da Semana:</span>
                <div className="flex gap-2 bg-stone-50 p-1 rounded-full border border-stone-100">
                    {[1, 2, 3, 4, 5].map((m) => (
                        <button 
                            key={m}
                            onClick={() => updateJournal('mood', m)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all text-sm ${currentJournal.mood === m ? 'bg-brand-personal text-white shadow-md scale-110' : 'text-stone-400 hover:bg-stone-200'}`}
                        >
                            {m === 1 ? '😔' : m === 2 ? '😕' : m === 3 ? '😐' : m === 4 ? '🙂' : '😁'}
                        </button>
                    ))}
                </div>
           </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Appointments & Rituals */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Personal Appointments Widget (Google Calendar) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-accent" />
                    Compromissos Pessoais
                </h3>
                
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                    {upcomingEvents.length === 0 && <p className="text-xs text-stone-400 italic">Sem compromissos próximos.</p>}
                    {upcomingEvents.map(ev => (
                        <div key={ev.id} className="flex gap-3 items-start p-2 rounded-lg bg-stone-50 border border-stone-100">
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

                <form onSubmit={handleAddEvent} className="border-t border-stone-100 pt-3">
                     <div className="space-y-2 mb-2">
                         <input 
                            type="text" 
                            placeholder="Novo Compromisso (Ex: Terapia)"
                            value={newEvent.title}
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
                         />
                         <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={newEvent.date}
                                onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
                            />
                            <input 
                                type="time" 
                                value={newEvent.time}
                                onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                className="w-16 bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
                            />
                         </div>
                     </div>
                     <button type="submit" className="w-full bg-stone-800 text-white py-1.5 rounded text-xs font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-1">
                        <Plus size={12} /> Agendar
                     </button>
                </form>
            </div>

            {/* Morning Ritual Section */}
            <RitualSection 
                title="Ritual da Manhã" 
                icon={Sun} 
                items={currentWeekRituals.am} 
                onUpdate={(newItems) => updateRituals('am', newItems)}
                colorTheme="orange"
            />

            {/* Evening Ritual Section */}
            <RitualSection 
                title="Ritual da Noite" 
                icon={Moon} 
                items={currentWeekRituals.pm} 
                onUpdate={(newItems) => updateRituals('pm', newItems)}
                colorTheme="slate"
            />
        </div>

        {/* Column 2: Journaling (Weekly Specific) */}
        <div className="lg:col-span-1 space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-brand-personal/50"></div>
                
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-lg text-ink flex items-center gap-2">
                        <PenTool size={18} className="text-brand-personal" />
                        Diário de Gratidão
                    </h3>
                    <button 
                        onClick={handleShareJournal}
                        className="p-2 text-stone-400 hover:text-brand-personal hover:bg-stone-50 rounded-full transition-colors"
                        title="Compartilhar Diário"
                    >
                        <Share2 size={18} />
                    </button>
                </div>
                
                <div className="flex-1 flex flex-col bg-stone-50 rounded-lg border border-stone-100 p-4">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">3 coisas pelas quais sou grata esta semana:</label>
                    <textarea 
                        value={currentJournal.gratitude}
                        onChange={(e) => updateJournal('gratitude', e.target.value)}
                        className="flex-1 w-full bg-transparent border-none resize-none outline-none text-stone-700 leading-loose placeholder:text-stone-300 text-sm"
                        placeholder={`1. O café quente pela manhã...\n2. O sorriso da Beatriz...\n3. Ter saúde para trabalhar...`}
                        style={{ backgroundImage: 'linear-gradient(transparent 1.9em, #e5e7eb 1.9em)', backgroundSize: '100% 2em', lineHeight: '2em' }}
                    />
                </div>
                
                <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                    <p className="text-xs text-stone-400 italic">"A gratidão transforma o que temos em suficiente."</p>
                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Salvo
                    </span>
                </div>
             </div>
        </div>

        {/* Column 3: Culture Tracker (Global) - UPDATED WITH COMPLETED SECTION */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full flex flex-col">
                <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                    <BookOpen size={18} className="text-brand-personal" />
                    Livros, Filmes & Séries
                </h3>

                <form onSubmit={addMedia} className="flex flex-col gap-2 mb-4">
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Título..."
                            className="flex-1 bg-stone-50 border border-stone-200 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-brand-personal/50 focus:border-brand-personal outline-none"
                        />
                        <button type="submit" className="bg-brand-personal text-white px-3 rounded hover:bg-brand-personal/90">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {['book', 'movie', 'series'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setNewType(t as any)}
                                className={`flex-1 text-[10px] uppercase font-bold py-1 rounded border ${newType === t ? 'bg-brand-personal/10 border-brand-personal text-brand-personal' : 'bg-transparent border-stone-100 text-stone-400'}`}
                            >
                                {t === 'book' ? 'Livro' : t === 'movie' ? 'Filme' : 'Série'}
                            </button>
                        ))}
                    </div>
                </form>

                {/* Active Media List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[400px] pr-1">
                    {activeMedia.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 border border-stone-100 rounded-lg bg-stone-50 hover:border-brand-personal/30 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="text-stone-400 shrink-0">
                                    {item.type === 'book' && <BookOpen size={16} />}
                                    {item.type === 'movie' && <Film size={16} />}
                                    {item.type === 'series' && <Music size={16} />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate text-stone-700">
                                        {item.title}
                                    </span>
                                    <button 
                                        onClick={() => updateMediaStatus(item.id)}
                                        className={`text-[10px] uppercase font-bold w-fit px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity
                                        ${item.status === 'todo' ? 'bg-stone-200 text-stone-500' : 
                                          'bg-yellow-100 text-yellow-700'}`}
                                    >
                                        {item.status === 'todo' ? 'Para ler/ver' : 'Lendo/Vendo'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => updateMediaStatus(item.id)} className="p-1 text-stone-300 hover:text-brand-personal" title="Avançar Status">
                                    <CheckCircle2 size={16} />
                                </button>
                                <button onClick={() => deleteMedia(item.id)} className="p-1 text-stone-300 hover:text-red-400" title="Remover">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {activeMedia.length === 0 && <p className="text-xs text-stone-400 italic text-center py-4">Nada na lista ativa.</p>}
                </div>

                {/* Completed Media Folder */}
                {completedMedia.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <button 
                            onClick={() => setShowCompletedMedia(!showCompletedMedia)}
                            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider mb-3 w-full"
                        >
                            {showCompletedMedia ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            Concluídos ({completedMedia.length})
                        </button>
                        
                        {showCompletedMedia && (
                            <div className="space-y-2 animate-fade-in bg-stone-50/50 p-2 rounded-lg max-h-[200px] overflow-y-auto custom-scrollbar">
                                {completedMedia.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 opacity-60 hover:opacity-100 transition-opacity group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="text-stone-400 shrink-0">
                                                {item.type === 'book' && <BookOpen size={14} />}
                                                {item.type === 'movie' && <Film size={14} />}
                                                {item.type === 'series' && <Music size={14} />}
                                            </div>
                                            <span className="text-xs font-medium truncate text-stone-500 line-through">
                                                {item.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => updateMediaStatus(item.id)} className="p-1 text-green-500 hover:text-yellow-500" title="Resgatar para Lendo/Vendo">
                                                <RotateCcw size={14} />
                                            </button>
                                            <button onClick={() => deleteMedia(item.id)} className="p-1 text-stone-300 hover:text-red-400" title="Remover">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
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
