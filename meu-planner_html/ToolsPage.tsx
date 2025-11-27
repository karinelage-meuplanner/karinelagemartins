
import React, { useState } from 'react';
import { 
  Dumbbell, ShoppingBag, FileText, Plus, Trash2, 
  CheckCircle2, Circle, Calendar, Link as LinkIcon, 
  X, Flame, Timer, TrendingUp, Edit2, Save, ChevronDown, ChevronUp
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';

// --- Types ---
type SubTab = 'fitness' | 'shopping' | 'notes';

interface Workout {
  id: string;
  activity: string;
  duration: number; // minutes
  calories: number;
  date: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sport';
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priority: 'high' | 'medium' | 'low';
  url?: string;
  bought: boolean;
  category: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  color: string; // tailwind class
  date: string;
  completed: boolean;
}

export const ToolsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('fitness');

  // --- Fitness State (Persisted) ---
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('planner_tools_workouts', [
    { id: '1', activity: 'Corrida no Parque', duration: 45, calories: 400, date: '2024-05-20', type: 'cardio' },
    { id: '2', activity: 'Musculação Superior', duration: 60, calories: 350, date: '2024-05-22', type: 'strength' },
    { id: '3', activity: 'Yoga Matinal', duration: 30, calories: 120, date: '2024-05-23', type: 'flexibility' },
  ]);
  const [newWorkout, setNewWorkout] = useState({ activity: '', duration: '', calories: '', type: 'cardio' });

  // --- Shopping State (Persisted) ---
  const [wishlist, setWishlist] = useLocalStorage<WishlistItem[]>('planner_tools_wishlist', [
    { id: '1', name: 'Fone de Ouvido Noise Cancelling', price: 1200, priority: 'high', category: 'Tech', bought: false },
    { id: '2', name: 'Tênis de Corrida Novo', price: 600, priority: 'medium', category: 'Fitness', bought: false },
    { id: '3', name: 'Livro de Receitas', price: 80, priority: 'low', category: 'Livros', bought: true },
  ]);
  const [newItem, setNewItem] = useState({ name: '', price: '', priority: 'medium', category: 'Geral', url: '' });

  // --- Notes State (Persisted) ---
  const [notes, setNotes] = useLocalStorage<Note[]>('planner_tools_notes_v2', [
    { id: '1', title: 'Ideias de Presente', content: 'Mãe: Colar novo ou Spa day.\nPai: Kit churrasco.', color: 'bg-yellow-100', date: '2024-05-15', completed: false },
    { id: '2', title: 'Filmes para ver', content: '- Duna Parte 2\n- Pobres Criaturas\n- Vidas Passadas', color: 'bg-blue-100', date: '2024-05-18', completed: false },
  ]);
  const [newNote, setNewNote] = useState({ title: '', content: '', color: 'bg-yellow-100' });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showCompletedNotes, setShowCompletedNotes] = useState(false);

  // Edit State for Notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteData, setEditingNoteData] = useState({ title: '', content: '', date: '' });

  // --- Handlers ---

  // Fitness
  const addWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkout.activity || !newWorkout.duration) return;
    setWorkouts([{
      id: Date.now().toString(),
      activity: newWorkout.activity,
      duration: parseInt(newWorkout.duration),
      calories: parseInt(newWorkout.calories) || 0,
      date: new Date().toISOString().split('T')[0],
      type: newWorkout.type as any
    }, ...workouts]);
    setNewWorkout({ activity: '', duration: '', calories: '', type: 'cardio' });
  };

  const deleteWorkout = (id: string) => setWorkouts(workouts.filter(w => w.id !== id));

  // Shopping
  const addWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    setWishlist([...wishlist, {
      id: Date.now().toString(),
      name: newItem.name,
      price: parseFloat(newItem.price) || 0,
      priority: newItem.priority as any,
      category: newItem.category || 'Geral',
      url: newItem.url,
      bought: false
    }]);
    setNewItem({ name: '', price: '', priority: 'medium', category: 'Geral', url: '' });
  };

  const toggleBought = (id: string) => {
    setWishlist(wishlist.map(i => i.id === id ? { ...i, bought: !i.bought } : i));
  };

  const deleteItem = (id: string) => setWishlist(wishlist.filter(i => i.id !== id));

  // Notes
  const addNote = () => {
    if (!newNote.title && !newNote.content) return;
    setNotes([{
      id: Date.now().toString(),
      title: newNote.title || 'Sem título',
      content: newNote.content,
      color: newNote.color,
      date: new Date().toISOString().split('T')[0], // Use ISO format for date inputs
      completed: false
    }, ...notes]);
    setNewNote({ title: '', content: '', color: 'bg-yellow-100' });
    setIsAddingNote(false);
  };

  const toggleNoteComplete = (id: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, completed: !n.completed } : n));
  };

  const deleteNote = (id: string) => setNotes(notes.filter(n => n.id !== id));

  const startEditNote = (note: Note) => {
      setEditingNoteId(note.id);
      // Ensure date is in YYYY-MM-DD format for input
      let formattedDate = note.date;
      if (note.date.includes('/')) {
          // Convert DD/MM/YYYY to YYYY-MM-DD if legacy format
          const parts = note.date.split('/');
          if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      setEditingNoteData({ title: note.title, content: note.content, date: formattedDate });
  };

  const saveEditNote = () => {
      if (editingNoteId) {
          setNotes(notes.map(n => n.id === editingNoteId ? { 
              ...n, 
              title: editingNoteData.title, 
              content: editingNoteData.content,
              date: editingNoteData.date 
          } : n));
          setEditingNoteId(null);
      }
  };

  const activeNotes = notes.filter(n => !n.completed);
  const completedNotes = notes.filter(n => n.completed);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Sub Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-stone-100 p-1 rounded-xl shadow-inner">
          <button 
            onClick={() => setActiveSubTab('fitness')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'fitness' ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <Dumbbell size={16} className={activeSubTab === 'fitness' ? 'text-orange-500' : ''} />
            Fitness
          </button>
          <button 
            onClick={() => setActiveSubTab('shopping')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'shopping' ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <ShoppingBag size={16} className={activeSubTab === 'shopping' ? 'text-blue-500' : ''} />
            Compras
          </button>
          <button 
            onClick={() => setActiveSubTab('notes')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeSubTab === 'notes' ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <FileText size={16} className={activeSubTab === 'notes' ? 'text-yellow-500' : ''} />
            Notas
          </button>
        </div>
      </div>

      {/* --- FITNESS TAB --- */}
      {activeSubTab === 'fitness' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workout Log */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                   <Dumbbell size={20} className="text-orange-500" />
                   Registro de Treinos
                 </h3>
                 <div className="text-xs text-stone-500 bg-stone-50 px-3 py-1 rounded-full border border-stone-100">
                   Esta semana: {workouts.length} treinos
                 </div>
               </div>

               <div className="space-y-3">
                 {workouts.map(workout => (
                   <div key={workout.id} className="flex items-center p-3 rounded-lg border border-stone-100 hover:border-orange-200 transition-colors group bg-stone-50/30">
                      <div className={`p-3 rounded-lg mr-4 ${
                        workout.type === 'cardio' ? 'bg-red-100 text-red-600' :
                        workout.type === 'strength' ? 'bg-slate-100 text-slate-600' :
                        workout.type === 'flexibility' ? 'bg-teal-100 text-teal-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {workout.type === 'cardio' ? <Flame size={20} /> : 
                         workout.type === 'strength' ? <Dumbbell size={20} /> : <Timer size={20} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-stone-800">{workout.activity}</h4>
                        <div className="flex gap-3 text-xs text-stone-500 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(workout.date).toLocaleDateString('pt-BR')}</span>
                          <span className="flex items-center gap-1"><Timer size={12}/> {workout.duration} min</span>
                          <span className="flex items-center gap-1"><Flame size={12}/> {workout.calories} kcal</span>
                        </div>
                      </div>
                      <button onClick={() => deleteWorkout(workout.id)} className="p-2 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Add Workout Sidebar */}
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="font-serif text-lg text-ink mb-4">Novo Treino</h3>
                <form onSubmit={addWorkout} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Atividade</label>
                    <input 
                      value={newWorkout.activity}
                      onChange={(e) => setNewWorkout({...newWorkout, activity: e.target.value})}
                      placeholder="Ex: Corrida 5km"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Duração (min)</label>
                      <input 
                        type="number"
                        value={newWorkout.duration}
                        onChange={(e) => setNewWorkout({...newWorkout, duration: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Kcal</label>
                      <input 
                        type="number"
                        value={newWorkout.calories}
                        onChange={(e) => setNewWorkout({...newWorkout, calories: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Tipo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['cardio', 'strength', 'flexibility', 'sport'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewWorkout({...newWorkout, type: type as any})}
                          className={`text-xs py-2 rounded border transition-colors capitalize ${
                            newWorkout.type === type 
                              ? 'bg-orange-50 border-orange-400 text-orange-700 font-medium' 
                              : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          {type === 'strength' ? 'Força' : type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                    <Plus size={18} /> Adicionar
                  </button>
                </form>
             </div>

             <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-orange-600" size={24} />
                  <span className="font-serif text-lg text-orange-800">Estatísticas</span>
                </div>
                <p className="text-sm text-stone-600 mb-4">Resumo da sua semana ativa.</p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-orange-500">{workouts.reduce((acc, w) => acc + w.duration, 0)}</p>
                    <p className="text-[10px] text-stone-400 uppercase font-bold">Minutos</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-orange-500">{workouts.reduce((acc, w) => acc + w.calories, 0)}</p>
                    <p className="text-[10px] text-stone-400 uppercase font-bold">Calorias</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- SHOPPING TAB --- */}
      {activeSubTab === 'shopping' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                  <ShoppingBag size={20} className="text-blue-500" />
                  Wishlist & Compras
                </h3>
                <span className="text-sm font-medium text-stone-500">
                  Total: R$ {wishlist.filter(i => !i.bought).reduce((acc, i) => acc + i.price, 0).toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                {wishlist.length === 0 && <p className="text-stone-400 italic text-center py-8">Sua lista de desejos está vazia.</p>}
                {wishlist.map(item => (
                  <div key={item.id} className={`flex items-center p-4 rounded-xl border transition-all group ${item.bought ? 'bg-stone-50 border-stone-100 opacity-75' : 'bg-white border-stone-200 hover:border-blue-300 hover:shadow-sm'}`}>
                    <button onClick={() => toggleBought(item.id)} className={`mr-4 transition-colors ${item.bought ? 'text-blue-500' : 'text-stone-300 hover:text-blue-400'}`}>
                      {item.bought ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-lg ${item.bought ? 'line-through text-stone-400' : 'text-stone-800'}`}>{item.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide
                          ${item.priority === 'high' ? 'bg-red-100 text-red-600' : item.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}
                        `}>
                          {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                        <span className="bg-stone-100 px-2 rounded text-xs">{item.category}</span>
                        <span className="font-medium text-stone-700">R$ {item.price.toFixed(2)}</span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-xs">
                            <LinkIcon size={12} /> Link
                          </a>
                        )}
                      </div>
                    </div>

                    <button onClick={() => deleteItem(item.id)} className="p-2 text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Item Sidebar */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 sticky top-8">
               <h3 className="font-serif text-lg text-ink mb-4">Adicionar Item</h3>
               <form onSubmit={addWishlistItem} className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Nome do Item</label>
                   <input 
                     value={newItem.name}
                     onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                     placeholder="Ex: Cafeteira Nova"
                     className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-400"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Preço (R$)</label>
                      <input 
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Categoria</label>
                      <input 
                        value={newItem.category}
                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                        placeholder="Ex: Casa"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Prioridade</label>
                   <div className="flex bg-stone-50 p-1 rounded-lg">
                     {['low', 'medium', 'high'].map(p => (
                       <button
                         key={p}
                         type="button"
                         onClick={() => setNewItem({...newItem, priority: p as any})}
                         className={`flex-1 text-xs py-1.5 rounded capitalize transition-colors ${
                           newItem.priority === p 
                             ? (p === 'high' ? 'bg-red-100 text-red-700 font-bold shadow-sm' : p === 'medium' ? 'bg-yellow-100 text-yellow-700 font-bold shadow-sm' : 'bg-green-100 text-green-700 font-bold shadow-sm') 
                             : 'text-stone-400 hover:text-stone-600'
                         }`}
                       >
                         {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                    <Plus size={18} /> Adicionar
                 </button>
               </form>
             </div>
          </div>
        </div>
      )}

      {/* --- NOTES TAB (Updated with CRUD & Checklist logic) --- */}
      {activeSubTab === 'notes' && (
        <div className="space-y-8">
            
            {/* Active Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Add Note Button */}
                <button 
                    onClick={() => setIsAddingNote(true)} 
                    className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50/50 transition-all group"
                >
                    <div className="bg-stone-100 p-4 rounded-full mb-2 group-hover:bg-yellow-100 transition-colors">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold">Nova Nota</span>
                </button>
                
                {/* Active Notes List */}
                {activeNotes.map(note => (
                    <div key={note.id} className={`p-6 rounded-xl shadow-sm relative group h-64 flex flex-col ${note.color} transition-transform hover:-translate-y-1 border border-stone-100`}>
                        {editingNoteId === note.id ? (
                            // Edit Mode
                            <div className="flex flex-col h-full gap-2">
                                <input 
                                    value={editingNoteData.title}
                                    onChange={(e) => setEditingNoteData({...editingNoteData, title: e.target.value})}
                                    className="bg-white/50 border border-stone-300 rounded px-2 py-1 font-bold text-lg focus:outline-none"
                                    placeholder="Título"
                                />
                                <input 
                                    type="date"
                                    value={editingNoteData.date}
                                    onChange={(e) => setEditingNoteData({...editingNoteData, date: e.target.value})}
                                    className="bg-white/50 border border-stone-300 rounded px-2 py-1 text-xs focus:outline-none w-full"
                                />
                                <textarea 
                                    value={editingNoteData.content}
                                    onChange={(e) => setEditingNoteData({...editingNoteData, content: e.target.value})}
                                    className="flex-1 bg-white/50 border border-stone-300 rounded p-2 text-sm focus:outline-none resize-none"
                                    placeholder="Conteúdo..."
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingNoteId(null)} className="text-stone-500 hover:text-red-500 bg-white/50 p-1 rounded"><X size={16}/></button>
                                    <button onClick={saveEditNote} className="text-green-600 hover:text-green-700 bg-white/50 p-1 rounded"><Save size={16}/></button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => toggleNoteComplete(note.id)}
                                            className="text-stone-400 hover:text-green-600 transition-colors"
                                            title="Concluir / Arquivar"
                                        >
                                            <Circle size={20} />
                                        </button>
                                        <h3 className="font-bold text-lg text-stone-800 line-clamp-1">{note.title}</h3>
                                    </div>
                                    
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => startEditNote(note)}
                                            className="p-1 text-stone-400 hover:text-blue-500"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                            className="p-1 text-stone-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-stone-500 mb-3 flex items-center gap-1">
                                    <Calendar size={10} /> {note.date ? new Date(note.date).toLocaleDateString('pt-BR') : '-'}
                                </p>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Completed Notes Folder */}
            {completedNotes.length > 0 && (
                <div className="border-t border-stone-200 pt-6">
                    <button 
                        onClick={() => setShowCompletedNotes(!showCompletedNotes)}
                        className="flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-700 uppercase tracking-wider mb-4 w-full"
                    >
                        {showCompletedNotes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Notas Arquivadas / Concluídas ({completedNotes.length})
                    </button>
                    
                    {showCompletedNotes && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                            {completedNotes.map(note => (
                                <div key={note.id} className="p-6 rounded-xl shadow-sm bg-stone-100 border border-stone-200 h-48 flex flex-col relative opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => toggleNoteComplete(note.id)}
                                                className="text-stone-400 hover:text-green-600 transition-colors"
                                                title="Resgatar Nota"
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                            <h3 className="font-bold text-lg text-stone-600 line-through line-clamp-1">{note.title}</h3>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                            className="p-1 text-stone-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-stone-400 mb-3 flex items-center gap-1">
                                        <Calendar size={10} /> {note.date ? new Date(note.date).toLocaleDateString('pt-BR') : '-'}
                                    </p>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <p className="text-sm text-stone-500 whitespace-pre-wrap leading-relaxed line-through">{note.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Note Modal Overlay */}
            {isAddingNote && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif text-xl">Criar Nota</h3>
                    <button onClick={() => setIsAddingNote(false)} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                    <input 
                        value={newNote.title}
                        onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                        placeholder="Título"
                        className="w-full text-lg font-bold border-none focus:ring-0 p-0 placeholder:text-stone-300"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        {['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-red-100', 'bg-purple-100'].map(color => (
                        <button
                            key={color}
                            onClick={() => setNewNote({...newNote, color})}
                            className={`w-6 h-6 rounded-full border border-stone-200 ${color} ${newNote.color === color ? 'ring-2 ring-stone-400' : ''}`}
                        />
                        ))}
                    </div>
                    <textarea 
                        value={newNote.content}
                        onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                        placeholder="Escreva aqui..."
                        className={`w-full h-40 rounded-lg p-4 resize-none focus:outline-none ${newNote.color}`}
                    />
                    <button 
                        onClick={addNote}
                        className="w-full bg-ink text-white py-2 rounded-lg font-bold hover:bg-stone-700 transition-colors"
                    >
                        Salvar Nota
                    </button>
                    </div>
                </div>
                </div>
            )}
        </div>
      )}

    </div>
  );
};
