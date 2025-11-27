
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, Plus, Clock, Target, MoreHorizontal, 
  Play, Pause, Calendar, Bell, Settings, RotateCcw,
  Edit2, Trash2, X, Save, TrendingUp, CheckCircle2, Circle, ListChecks,
  CheckSquare, ArrowRight, AlertTriangle, Flag
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { GoogleCalendarEvent, Project, OKR, Subtask } from '../types';

interface Props {
  calendarEvents: GoogleCalendarEvent[];
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
}

const PROJECT_STATUSES = {
  open: { label: 'Aberto', color: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500' },
  on_hold: { label: 'Paralisado', color: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
  validated: { label: 'Validado', color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-600', dot: 'bg-green-500' }
};

export const WorkPlanner: React.FC<Props> = ({ calendarEvents = [], projects, onUpdateProjects }) => {
  // --- PROJECT STATE ---
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<{
    name: string;
    client: string;
    deadline: string;
    status: Project['status'];
    progress: number;
    nextAction: string;
    subtasks: Subtask[];
  }>({
    name: '',
    client: '',
    deadline: new Date().toISOString().split('T')[0],
    status: 'open',
    progress: 0,
    nextAction: '',
    subtasks: []
  });

  const [newSubtaskText, setNewSubtaskText] = useState('');

  // --- OKR STATE ---
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);
  const [editingOKRId, setEditingOKRId] = useState<string | null>(null);
  const [okrs, setOkrs] = useLocalStorage<OKR[]>('planner_work_okrs', [
    { 
      id: '1', 
      objective: 'Aumentar eficiência da equipe', 
      keyResult: 'Reduzir tempo de reunião em 20%', 
      progress: 40,
      subtasks: [
        { id: 'kr1', text: 'Implementar pautas obrigatórias', completed: true },
        { id: 'kr2', text: 'Cortar reuniões de status desnecessárias', completed: false },
        { id: 'kr3', text: 'Adotar comunicação assíncrona', completed: false }
      ]
    },
    { 
      id: '2', 
      objective: 'Desenvolvimento Pessoal', 
      keyResult: 'Completar curso de Liderança', 
      progress: 10,
      subtasks: [
        { id: 'kr1', text: 'Assistir Módulo 1', completed: true },
        { id: 'kr2', text: 'Assistir Módulo 2', completed: false },
        { id: 'kr3', text: 'Fazer prova final', completed: false }
      ]
    }
  ]);
  
  const [okrForm, setOkrForm] = useState<{
    objective: string;
    keyResult: string;
    progress: number;
    subtasks: Subtask[];
  }>({
    objective: '',
    keyResult: '',
    progress: 0,
    subtasks: []
  });
  const [newOKRSubtaskText, setNewOKRSubtaskText] = useState('');

  // --- TIMER STATE ---
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerTime, setTimerTime] = useState(25 * 60); // seconds
  const [initialTime, setInitialTime] = useState(25 * 60); // seconds
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);

  const [notes, setNotes] = useLocalStorage('planner_work_notes', '');

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerTime > 0) {
      interval = setInterval(() => {
        setTimerTime((prev) => prev - 1);
      }, 1000);
    } else if (timerTime === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerTime]);

  // --- HELPER FUNCTIONS: Projects ---
  const updateProjectProgress = (id: string, newProgress: number) => {
    onUpdateProjects(projects.map(p => p.id === id ? { ...p, progress: newProgress } : p));
  };

  const toggleDeadlineReminder = (id: string) => {
    onUpdateProjects(projects.map(p => p.id === id ? { ...p, deadlineReminder: !p.deadlineReminder } : p));
  };

  const toggleNextActionReminder = (id: string) => {
    onUpdateProjects(projects.map(p => {
      if (p.id === id) {
        const newStatus = !p.nextActionReminder;
        const newDate = (newStatus && !p.nextActionDate) 
          ? new Date().toISOString().split('T')[0] 
          : p.nextActionDate;
          
        return { ...p, nextActionReminder: newStatus, nextActionDate: newDate };
      }
      return p;
    }));
  };

  const updateNextActionDate = (id: string, date: string) => {
    onUpdateProjects(projects.map(p => p.id === id ? { ...p, nextActionDate: date } : p));
  };

  const completeNextAction = (id: string) => {
      // Quando completar a ação no widget de acesso rápido
      onUpdateProjects(projects.map(p => {
          if (p.id === id) {
              return { 
                  ...p, 
                  nextAction: '', // Limpa a ação
                  nextActionDate: '', 
                  nextActionReminder: false,
                  // Opcional: Incrementar progresso automaticamente?
                  progress: Math.min(p.progress + 5, 100) 
              };
          }
          return p;
      }));
  }

  const handleToggleSubtask = (projectId: string, subtaskId: string) => {
    onUpdateProjects(projects.map(p => {
      if (p.id === projectId && p.subtasks) {
        const updatedSubtasks = p.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
        const completedCount = updatedSubtasks.filter(st => st.completed).length;
        const totalCount = updatedSubtasks.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : p.progress;
        return { ...p, subtasks: updatedSubtasks, progress: newProgress };
      }
      return p;
    }));
  };

  // --- PROJECT CRUD HANDLERS ---
  const handleOpenNewProject = () => {
    setEditingProjectId(null);
    setProjectForm({
      name: '',
      client: '',
      deadline: new Date().toISOString().split('T')[0],
      status: 'open',
      progress: 0,
      nextAction: '',
      subtasks: []
    });
    setNewSubtaskText('');
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setProjectForm({
      name: project.name,
      client: project.client || '',
      deadline: project.deadline,
      status: project.status,
      progress: project.progress,
      nextAction: project.nextAction,
      subtasks: project.subtasks || []
    });
    setNewSubtaskText('');
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      onUpdateProjects(projects.filter(p => p.id !== id));
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;

    if (editingProjectId) {
      onUpdateProjects(projects.map(p => p.id === editingProjectId ? { ...p, ...projectForm } : p));
    } else {
      onUpdateProjects([...projects, {
        id: Date.now().toString(),
        ...projectForm,
        deadlineReminder: false,
        nextActionReminder: false,
        nextActionDate: ''
      }]);
    }
    setIsProjectModalOpen(false);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setProjectForm(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: Date.now().toString(), text: newSubtaskText, completed: false }]
    }));
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setProjectForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== id)
    }));
  };

  const handleToggleSubtaskInModal = (id: string) => {
    setProjectForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st)
    }));
  };

  // --- OKR HELPER FUNCTIONS ---
  const calculateOKRProgress = (subtasks: Subtask[], currentProgress: number): number => {
      if (!subtasks || subtasks.length === 0) return currentProgress;
      const completed = subtasks.filter(s => s.completed).length;
      return Math.round((completed / subtasks.length) * 100);
  };

  const handleToggleOKRSubtask = (okrId: string, subtaskId: string) => {
      setOkrs(okrs.map(okr => {
          if (okr.id === okrId && okr.subtasks) {
              const updatedSubtasks = okr.subtasks.map(s => s.id === subtaskId ? {...s, completed: !s.completed} : s);
              const newProgress = calculateOKRProgress(updatedSubtasks, okr.progress);
              return { ...okr, subtasks: updatedSubtasks, progress: newProgress };
          }
          return okr;
      }));
  };

  // --- OKR CRUD HANDLERS ---
  const handleOpenNewOKR = () => {
    setEditingOKRId(null);
    setOkrForm({
        objective: '',
        keyResult: '',
        progress: 0,
        subtasks: []
    });
    setNewOKRSubtaskText('');
    setIsOKRModalOpen(true);
  };

  const handleOpenEditOKR = (okr: OKR) => {
    setEditingOKRId(okr.id);
    setOkrForm({
        objective: okr.objective,
        keyResult: okr.keyResult,
        progress: okr.progress,
        subtasks: okr.subtasks || []
    });
    setNewOKRSubtaskText('');
    setIsOKRModalOpen(true);
  };

  const handleDeleteOKR = (id: string) => {
      if(confirm("Deseja excluir este Objetivo?")) {
          setOkrs(okrs.filter(o => o.id !== id));
      }
  };

  const handleSaveOKR = (e: React.FormEvent) => {
      e.preventDefault();
      if (!okrForm.objective) return;

      if (editingOKRId) {
          setOkrs(okrs.map(o => o.id === editingOKRId ? { ...o, ...okrForm } : o));
      } else {
          setOkrs([...okrs, { id: Date.now().toString(), ...okrForm }]);
      }
      setIsOKRModalOpen(false);
  };

  const handleAddOKRSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newOKRSubtaskText.trim()) return;
      setOkrForm(prev => ({
          ...prev,
          subtasks: [...prev.subtasks, { id: Date.now().toString(), text: newOKRSubtaskText, completed: false }]
      }));
      setNewOKRSubtaskText('');
  };

  const handleRemoveOKRSubtask = (id: string) => {
      setOkrForm(prev => ({
          ...prev,
          subtasks: prev.subtasks.filter(s => s.id !== id)
      }));
  };

  const handleToggleOKRSubtaskInModal = (id: string) => {
      setOkrForm(prev => ({
          ...prev,
          subtasks: prev.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
      }));
  };

  // --- TIMER HANDLERS ---
  const handleSetTimer = () => {
    const newTime = customMinutes * 60;
    setTimerTime(newTime);
    setInitialTime(newTime);
    setIsTimerRunning(false);
    setShowTimerSettings(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerTime(initialTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- COMBINED AGENDA (Quick Access) ---
  const combinedAgenda = useMemo(() => {
    const list: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Calendar Events (excluding auto-generated project ones to avoid double generic listing)
    calendarEvents.forEach(ev => {
        if (!ev.id.startsWith('proj-')) {
             list.push({
                 id: ev.id,
                 type: 'event',
                 date: ev.start.dateTime || ev.start.date,
                 title: ev.summary,
                 subtitle: ev.location || 'Reunião / Evento',
                 isOverdue: false // Calendar events pass, they don't get "overdue" in the same way for action
             });
        }
    });

    // 2. Project Alerts (Deadlines & Next Actions)
    projects.forEach(p => {
        if (p.status === 'completed' || p.status === 'on_hold') return;

        // Deadline Alert
        if (p.deadline) {
            const isOverdue = p.deadline < today;
            const isToday = p.deadline === today;
            // Add if overdue, today, or in future.
            list.push({
                id: `deadline-${p.id}`,
                type: 'deadline',
                date: p.deadline,
                title: `Prazo: ${p.name}`,
                subtitle: p.client ? `Cliente: ${p.client}` : 'Projeto Interno',
                isOverdue: isOverdue || isToday,
                projectId: p.id
            });
        }

        // Next Action Alert
        if (p.nextAction && p.nextActionDate) {
             const isOverdue = p.nextActionDate < today;
             const isToday = p.nextActionDate === today;
             list.push({
                id: `action-${p.id}`,
                type: 'action',
                date: p.nextActionDate,
                title: p.nextAction,
                subtitle: `Projeto: ${p.name}`,
                isOverdue: isOverdue || isToday,
                projectId: p.id,
                action: true // Marker for interaction
            });
        }
    });

    // Sort by Date
    return list.sort((a, b) => {
        // Prioritize overdue items at the top
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
    });
  }, [calendarEvents, projects]);


  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* Top Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Projetos Ativos</p>
            <p className="text-2xl font-serif font-bold text-brand-work">{projects.filter(p => p.status === 'in_progress').length}</p>
          </div>
          <Briefcase className="text-brand-work opacity-20" size={32} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Reuniões Hoje</p>
            <p className="text-2xl font-serif font-bold text-orange-500">
                {calendarEvents.filter(e => {
                    if (e.id.startsWith('proj-')) return false; // Don't count deadlines as meetings
                    const today = new Date().toISOString().split('T')[0];
                    const eventStart = (e.start.dateTime || e.start.date || '').split('T')[0];
                    return eventStart === today;
                }).length}
            </p>
          </div>
          <Calendar className="text-orange-500 opacity-20" size={32} />
        </div>
        
        {/* Deep Work Timer Widget */}
        <div className="col-span-1 md:col-span-2 bg-brand-work text-white p-4 rounded-xl shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Sessão de Foco</p>
                <button 
                    onClick={() => setShowTimerSettings(!showTimerSettings)} 
                    className="text-white/40 hover:text-white transition-colors p-1"
                    title="Configurar tempo"
                >
                    <Settings size={14} />
                </button>
            </div>
            
            {showTimerSettings ? (
                <div className="flex items-center gap-2 animate-fade-in">
                    <label className="text-sm text-white/80">Duração:</label>
                    <input 
                        type="number" 
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-white/50 text-center"
                        min="1"
                    />
                    <span className="text-xs text-white/60">min</span>
                    <button 
                        onClick={handleSetTimer} 
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs font-bold ml-2 transition-colors"
                    >
                        Definir
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <span className="text-3xl font-mono font-medium w-24">{formatTime(timerTime)}</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                        >
                            {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button 
                            onClick={handleResetTimer}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors text-white/70 hover:text-white"
                            title="Reiniciar"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>
            )}
          </div>
          <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none" size={80} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                <Briefcase size={20} className="text-brand-work" />
                Projetos & Entregas
              </h3>
              <button 
                onClick={handleOpenNewProject}
                className="text-xs flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg transition-colors font-bold"
              >
                <Plus size={14} /> Novo Projeto
              </button>
            </div>

            <div className="space-y-4">
              {projects.map(project => {
                const statusConfig = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.open;
                return (
                  <div key={project.id} className="border border-stone-100 rounded-xl p-4 hover:border-brand-work/30 transition-all bg-stone-50/30 group relative">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-stone-800 text-lg">{project.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-stone-500 font-medium">{project.client}</p>
                          <div className="flex items-center gap-2 bg-stone-100/50 px-2 py-0.5 rounded">
                              <span className={`text-xs transition-colors ${project.deadlineReminder ? 'text-orange-600 font-bold' : 'text-stone-500'}`}>
                                  Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
                              </span>
                              <button 
                                  onClick={() => toggleDeadlineReminder(project.id)} 
                                  className={`transition-colors p-1 rounded-full hover:bg-stone-200 ${project.deadlineReminder ? 'text-orange-500' : 'text-stone-300'}`}
                                  title={project.deadlineReminder ? "Remover lembrete de prazo" : "Definir lembrete de prazo"}
                              >
                                  <Bell size={12} fill={project.deadlineReminder ? "currentColor" : "none"} />
                              </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                          <button 
                              onClick={() => handleOpenEditProject(project)} 
                              className="p-2 text-stone-400 hover:text-blue-500 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Editar Projeto"
                          >
                              <Edit2 size={16} />
                          </button>
                          <button 
                              onClick={() => handleDeleteProject(project.id)} 
                              className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Excluir Projeto"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                    </div>

                    {/* Checklist / Subtasks Preview */}
                    {project.subtasks && project.subtasks.length > 0 && (
                      <div className="mb-4 bg-white rounded-lg border border-stone-100 p-3">
                         <div className="flex items-center justify-between mb-2">
                             <p className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                               <ListChecks size={12} /> Checklist
                             </p>
                             <span className="text-[10px] text-stone-400">
                               {project.subtasks.filter(s => s.completed).length}/{project.subtasks.length}
                             </span>
                         </div>
                         <div className="space-y-1.5">
                           {project.subtasks.map(subtask => (
                             <div 
                               key={subtask.id} 
                               onClick={() => handleToggleSubtask(project.id, subtask.id)}
                               className="flex items-center gap-2 cursor-pointer group/task hover:bg-stone-50 p-1 rounded -mx-1"
                             >
                               <div className={`transition-colors ${subtask.completed ? 'text-brand-work' : 'text-stone-300 group-hover/task:text-brand-work'}`}>
                                 {subtask.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                               </div>
                               <span className={`text-xs ${subtask.completed ? 'text-stone-400 line-through' : 'text-stone-600'}`}>
                                 {subtask.text}
                               </span>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${project.status === 'on_hold' ? 'bg-red-400' : 'bg-brand-work'}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono text-stone-500 w-8 text-right">{project.progress}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" step="5"
                      value={project.progress}
                      onChange={(e) => updateProjectProgress(project.id, parseInt(e.target.value))}
                      className="w-full opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto cursor-pointer mb-2 accent-brand-work"
                      title="Arrastar para ajustar progresso manualmente"
                    />

                    {/* Next Action */}
                    <div className={`flex items-center gap-2 bg-white p-2 rounded border text-sm text-stone-600 transition-all duration-200 ${project.nextActionReminder ? 'border-orange-200 bg-orange-50/30 shadow-sm' : 'border-stone-100'}`}>
                      <span className="text-xs font-bold text-brand-work uppercase shrink-0">Próximo Passo:</span>
                      <input 
                        value={project.nextAction}
                        onChange={(e) => {
                          onUpdateProjects(projects.map(p => p.id === project.id ? { ...p, nextAction: e.target.value } : p));
                        }}
                        className="flex-1 bg-transparent outline-none text-sm text-stone-700"
                        placeholder="Descreva a próxima ação"
                      />
                      
                      {/* Date Input for Next Action Reminder */}
                      {project.nextActionReminder && (
                          <input 
                              type="date" 
                              value={project.nextActionDate || ''}
                              onChange={(e) => updateNextActionDate(project.id, e.target.value)}
                              className="bg-white border border-orange-200 rounded px-2 py-1 text-xs text-stone-600 focus:outline-none focus:border-orange-400 max-w-[110px]"
                          />
                      )}

                      <button 
                          onClick={() => toggleNextActionReminder(project.id)} 
                          className={`transition-colors p-1.5 rounded-md hover:bg-black/5 ${project.nextActionReminder ? 'text-orange-500' : 'text-stone-300'}`}
                          title={project.nextActionReminder ? "Lembrete ativo" : "Ativar lembrete"}
                      >
                          <Bell size={14} fill={project.nextActionReminder ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                  <div className="text-center py-10 text-stone-400">
                      <Briefcase size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum projeto ativo.</p>
                      <button onClick={handleOpenNewProject} className="text-xs text-brand-work hover:underline mt-2">Criar primeiro projeto</button>
                  </div>
              )}
            </div>
          </div>

           {/* OKRs Section */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                    <Target size={20} className="text-brand-work" />
                    Objetivos Trimestrais (OKRs)
                </h3>
                <button 
                    onClick={handleOpenNewOKR}
                    className="text-xs flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg transition-colors font-bold"
                >
                    <Plus size={14} /> Novo Objetivo
                </button>
             </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {okrs.map(okr => (
                  <div key={okr.id} className="p-4 bg-stone-50 rounded-lg border border-stone-100 group relative hover:shadow-sm transition-all hover:border-brand-work/20">
                    <div className="flex justify-between items-start mb-2">
                         <div>
                            <p className="font-bold text-stone-700 text-sm mb-1">{okr.objective}</p>
                            <p className="text-xs text-stone-500 mb-3 flex items-start gap-1">
                                <ArrowRight size={12} className="mt-0.5 shrink-0" /> {okr.keyResult}
                            </p>
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleOpenEditOKR(okr)} className="text-stone-400 hover:text-blue-500 p-1"><Edit2 size={14} /></button>
                             <button onClick={() => handleDeleteOKR(okr.id)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                         </div>
                    </div>
                    
                    {/* Checklist for Measurement */}
                    {okr.subtasks && okr.subtasks.length > 0 && (
                         <div className="bg-white rounded border border-stone-100 p-2 mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                             <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">Checklist de Resultados</p>
                             <div className="space-y-1">
                                 {okr.subtasks.map(task => (
                                     <div 
                                        key={task.id} 
                                        onClick={() => handleToggleOKRSubtask(okr.id, task.id)}
                                        className="flex items-center gap-2 cursor-pointer group/okr hover:bg-stone-50 rounded p-0.5"
                                     >
                                         <div className={`${task.completed ? 'text-green-500' : 'text-stone-300 group-hover/okr:text-green-400'}`}>
                                            {task.completed ? <CheckSquare size={12} /> : <Circle size={12} />}
                                         </div>
                                         <span className={`text-xs ${task.completed ? 'text-stone-400 line-through' : 'text-stone-600'}`}>{task.text}</span>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${okr.progress}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-stone-500 w-8 text-right">{okr.progress}%</span>
                    </div>
                  </div>
                ))}
                {okrs.length === 0 && (
                    <div className="col-span-2 text-center py-6 text-stone-400 text-sm">Nenhum objetivo definido.</div>
                )}
              </div>
           </div>
        </div>

        {/* Right Column: Notes & Quick Tasks (Agenda) */}
        <div className="space-y-6">
            
           {/* Agenda Widget - NOW WITH PROJECT TASKS */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <h3 className="font-serif text-lg text-ink mb-4 flex items-center gap-2">
                   <Calendar size={18} className="text-stone-400" />
                   Acesso Rápido & Alertas
               </h3>
               {combinedAgenda.length > 0 ? (
                   <div className="space-y-3">
                       {combinedAgenda.map(item => (
                           <div key={item.id} className={`flex gap-3 items-start border-l-2 pl-3 group ${item.isOverdue ? 'border-red-400' : item.type === 'event' ? 'border-blue-300' : 'border-brand-work'}`}>
                               <div className="flex-1">
                                   <div className="flex items-center justify-between">
                                        <p className={`font-bold text-sm ${item.isOverdue ? 'text-red-600' : 'text-stone-700'}`}>
                                            {item.title}
                                        </p>
                                        {item.isOverdue && <AlertTriangle size={12} className="text-red-500" />}
                                   </div>
                                   
                                   <div className="flex justify-between items-center mt-0.5">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-stone-500">{item.subtitle}</span>
                                            <span className={`text-[10px] ${item.isOverdue ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                                                {item.type === 'event' 
                                                    ? new Date(item.date).toLocaleString('pt-BR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
                                                    : new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
                                                }
                                            </span>
                                        </div>
                                        
                                        {/* Quick Action for "Next Action" Items */}
                                        {item.type === 'action' && (
                                            <button 
                                                onClick={() => completeNextAction(item.projectId)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-100 hover:bg-green-100 text-stone-400 hover:text-green-600 p-1 rounded"
                                                title="Concluir Ação"
                                            >
                                                <CheckCircle2 size={16} />
                                            </button>
                                        )}
                                        {item.type === 'deadline' && (
                                            <span className="opacity-0 group-hover:opacity-100 text-stone-300" title="Prazo Final">
                                                <Flag size={14} />
                                            </span>
                                        )}
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               ) : (
                   <div className="text-center py-6">
                       <p className="text-xs text-stone-400 italic">Sem alertas ou reuniões próximas.</p>
                       <p className="text-[10px] text-stone-300 mt-1">Configure prazos e 'próximas ações' nos projetos.</p>
                   </div>
               )}
           </div>

           {/* Meeting Scratchpad */}
           <div className="bg-[#FFFBEB] p-6 rounded-xl shadow-sm border border-[#FCD34D]/30 h-96 flex flex-col relative transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#FCD34D]/40 rounded-sm"></div>
              <h3 className="font-serif text-lg text-yellow-800 mb-4">Bloco de Notas</h3>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none resize-none text-stone-700 leading-relaxed custom-scrollbar text-sm"
                placeholder="Rascunhos, ideias de reuniões, lembretes rápidos..."
                style={{ backgroundImage: 'linear-gradient(transparent 1.5em, #FDE68A 1.5em)', backgroundSize: '100% 1.52em', lineHeight: '1.52em' }}
              />
           </div>
        </div>
      </div>

      {/* --- Project Modal (Create/Edit) --- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl text-ink">
                {editingProjectId ? 'Editar Projeto' : 'Novo Projeto'}
              </h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-stone-400 hover:text-ink"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveProject} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome do Projeto</label>
                    <input 
                      value={projectForm.name}
                      onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-work"
                      placeholder="Ex: Website Q1"
                      autoFocus
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Cliente / Solicitante</label>
                    <input 
                      value={projectForm.client}
                      onChange={e => setProjectForm({...projectForm, client: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-work"
                      placeholder="Ex: Marketing Interno"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Prazo</label>
                    <input 
                      type="date"
                      value={projectForm.deadline}
                      onChange={e => setProjectForm({...projectForm, deadline: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-work"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Status</label>
                    <select 
                        value={projectForm.status}
                        onChange={e => setProjectForm({...projectForm, status: e.target.value as any})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-work"
                    >
                      {Object.entries(PROJECT_STATUSES).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
              </div>

              {/* Subtasks Section in Modal */}
              <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/50">
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2 flex items-center gap-1">
                  <ListChecks size={14} /> Checklist / Subtarefas
                </label>
                
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    placeholder="Adicionar passo..."
                    className="flex-1 bg-white border border-stone-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-work"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask(e);
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSubtask}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-600 px-3 rounded text-sm font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {projectForm.subtasks.length === 0 && <p className="text-xs text-stone-400 italic">Nenhum item na lista.</p>}
                  {projectForm.subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2 bg-white p-2 rounded border border-stone-100">
                      <button 
                        type="button"
                        onClick={() => handleToggleSubtaskInModal(st.id)}
                        className={`text-stone-300 hover:text-brand-work ${st.completed ? 'text-brand-work' : ''}`}
                      >
                         {st.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                      <span className={`flex-1 text-sm ${st.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{st.text}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSubtask(st.id)}
                        className="text-stone-300 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Progresso Inicial ({projectForm.progress}%)</label>
                <input 
                  type="range"
                  min="0" max="100" step="5"
                  value={projectForm.progress}
                  onChange={e => setProjectForm({...projectForm, progress: parseInt(e.target.value)})}
                  className="w-full accent-brand-work"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Próxima Ação</label>
                <input 
                  value={projectForm.nextAction}
                  onChange={e => setProjectForm({...projectForm, nextAction: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-work"
                  placeholder="O que deve ser feito a seguir?"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-brand-work text-white py-3 rounded-lg font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> {editingProjectId ? 'Atualizar Projeto' : 'Criar Projeto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- OKR Modal (Create/Edit) --- */}
      {isOKRModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-serif text-xl text-ink">
                          {editingOKRId ? 'Editar Objetivo' : 'Novo Objetivo (OKR)'}
                      </h3>
                      <button onClick={() => setIsOKRModalOpen(false)} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                  </div>

                  <form onSubmit={handleSaveOKR} className="space-y-5">
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Objetivo Principal (Objective)</label>
                          <input 
                              value={okrForm.objective}
                              onChange={e => setOkrForm({...okrForm, objective: e.target.value})}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-work"
                              placeholder="Ex: Crescer receita da empresa"
                              autoFocus
                          />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Resultado Chave Macro (Key Result)</label>
                          <input 
                              value={okrForm.keyResult}
                              onChange={e => setOkrForm({...okrForm, keyResult: e.target.value})}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-work"
                              placeholder="Ex: Atingir R$ 100k em vendas"
                          />
                      </div>

                       {/* Checklist OKR Section */}
                      <div className="border border-stone-200 rounded-lg p-4 bg-stone-50/50">
                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2 flex items-center gap-1">
                          <ListChecks size={14} /> Resultados-Chave (Checklist para Mensuração)
                        </label>
                        
                        <div className="flex gap-2 mb-3">
                          <input 
                            type="text"
                            value={newOKRSubtaskText}
                            onChange={(e) => setNewOKRSubtaskText(e.target.value)}
                            placeholder="Adicionar KR específico..."
                            className="flex-1 bg-white border border-stone-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-work"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddOKRSubtask(e);
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={handleAddOKRSubtask}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-600 px-3 rounded text-sm font-bold"
                          >
                            Add
                          </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {okrForm.subtasks.length === 0 && <p className="text-xs text-stone-400 italic">Sem itens. O progresso será manual.</p>}
                          {okrForm.subtasks.map(st => (
                            <div key={st.id} className="flex items-center gap-2 bg-white p-2 rounded border border-stone-100">
                              <button 
                                type="button"
                                onClick={() => handleToggleOKRSubtaskInModal(st.id)}
                                className={`text-stone-300 hover:text-brand-work ${st.completed ? 'text-brand-work' : ''}`}
                              >
                                {st.completed ? <CheckSquare size={16} /> : <Circle size={16} />}
                              </button>
                              <span className={`flex-1 text-sm ${st.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{st.text}</span>
                              <button 
                                type="button"
                                onClick={() => handleRemoveOKRSubtask(st.id)}
                                className="text-stone-300 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
                              Progresso ({okrForm.progress}%)
                              {okrForm.subtasks.length > 0 && <span className="ml-1 text-stone-400 font-normal">(Calculado automaticamente pelo checklist)</span>}
                          </label>
                          <input 
                              type="range"
                              min="0" max="100" step="5"
                              value={okrForm.progress}
                              disabled={okrForm.subtasks.length > 0}
                              onChange={e => setOkrForm({...okrForm, progress: parseInt(e.target.value)})}
                              className={`w-full accent-brand-work ${okrForm.subtasks.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                      </div>

                      <button 
                          type="submit" 
                          className="w-full bg-brand-work text-white py-3 rounded-lg font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
                      >
                          <Save size={18} /> {editingOKRId ? 'Salvar Objetivo' : 'Criar Objetivo'}
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};
