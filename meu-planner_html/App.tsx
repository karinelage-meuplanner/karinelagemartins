import React, { useState, useEffect, useMemo } from 'react';
import { Tab, WheelSegment, User, GoogleCalendarEvent, Project } from './types';
import { 
  LayoutDashboard, Calendar, CheckSquare, Briefcase, 
  DollarSign, Home, User as UserIcon, Heart, Settings, Menu, X, 
  FileText, Plane, Dumbbell, ShoppingBag, Target, LogOut
} from 'lucide-react';

import { DailyPlanner } from './components/DailyPlanner';
import { FinanceTracker } from './components/FinanceTracker';
import { AnnualPlanner } from './components/AnnualPlanner';
import { MonthlyPlanner } from './components/MonthlyPlanner';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { WorkPlanner } from './components/WorkPlanner';
import { HomePlanner } from './components/HomePlanner';
import { PersonalPlanner } from './components/PersonalPlanner';
import { DaughterPlanner } from './components/DaughterPlanner';
import { TravelPlanner } from './components/TravelPlanner';
import { ToolsPage } from './components/ToolsPage';
import { WheelOfLife } from './components/WheelOfLife';
import { LoginPage } from './components/LoginPage';
import { fetchCalendarEvents, mockCalendarEvents, createCalendarEvent } from './services/googleService';
import useLocalStorage from './hooks/useLocalStorage';

const App: React.FC = () => {
  // Auth State (Persisted)
  const [user, setUser] = useLocalStorage<User | null>('planner_user_session', null);
  
  // Google API Events (Fetched)
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  
  // Manual Events (Local Persisted) - added via Monthly Planner or others
  const [manualEvents, setManualEvents] = useLocalStorage<GoogleCalendarEvent[]>('planner_manual_events', []);

  // WORK PROJECTS STATE (Lifted from WorkPlanner to integrate deadlines)
  const [projects, setProjects] = useLocalStorage<Project[]>('planner_work_projects', [
    { 
      id: '1', 
      name: 'Lançamento Website Q1', 
      client: 'Interno', 
      status: 'in_progress', 
      progress: 65, 
      nextAction: 'Revisar copy da home',
      deadline: '2024-02-28',
      deadlineReminder: true,
      nextActionReminder: false,
      nextActionDate: '',
      subtasks: [
        { id: 'st1', text: 'Design da Home', completed: true },
        { id: 'st2', text: 'Aprovação de Texto', completed: false },
        { id: 'st3', text: 'Desenvolvimento Frontend', completed: false }
      ]
    },
    { 
      id: '2', 
      name: 'Relatório Financeiro Anual', 
      client: 'Diretoria', 
      status: 'on_hold', 
      progress: 30, 
      nextAction: 'Aguardando dados de vendas',
      deadline: '2024-03-15',
      deadlineReminder: false,
      nextActionReminder: true,
      nextActionDate: '2024-03-10',
      subtasks: [
        { id: 'st1', text: 'Coletar dados brutos', completed: true },
        { id: 'st2', text: 'Validar com contabilidade', completed: false }
      ]
    }
  ]);

  // Combined Events State passed to children
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);

  // UI State (Not persisted generally, but activeTab could be if desired)
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for Wheel of Life (Persisted)
  const [wheelData, setWheelData] = useLocalStorage<WheelSegment[]>('planner_wheel_of_life', [
    { label: 'Carreira', value: 7 },
    { label: 'Finanças', value: 5 },
    { label: 'Saúde', value: 6 },
    { label: 'Relações', value: 8 },
    { label: 'Lazer', value: 4 },
    { label: 'Crescimento', value: 6 },
    { label: 'Casa', value: 7 },
    { label: 'Espiritual', value: 5 },
  ]);

  // Load Google Calendar events when user logs in
  useEffect(() => {
    const loadEvents = async () => {
        if (user) {
            // Fetch events automatically upon login
            const events = await fetchCalendarEvents(user.accessToken || 'mock-token');
            setGoogleEvents(events);
        }
    };
    loadEvents();
  }, [user]);

  // 1. Convert Projects to Calendar Events
  const projectEvents = useMemo(() => {
    return projects
      .filter(p => p.status !== 'completed' && p.deadline)
      .map(p => ({
        id: `proj-${p.id}`,
        summary: `Prazo: ${p.name}`,
        description: `Cliente: ${p.client || 'N/A'} - Status: ${p.status}`,
        start: { date: p.deadline },
        end: { date: p.deadline },
        location: 'Work Planner'
      } as GoogleCalendarEvent));
  }, [projects]);

  // 2. Merge Google Events, Manual Events AND Project Events
  useEffect(() => {
    // Avoid duplicates if manual event was successfully synced to Google and returned in fetch
    // Simple de-duplication by ID
    const merged = [...manualEvents, ...googleEvents, ...projectEvents];
    const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
    
    // Sort by date
    unique.sort((a, b) => {
        const dateA = a.start.dateTime || a.start.date || '';
        const dateB = b.start.dateTime || b.start.date || '';
        return dateA.localeCompare(dateB);
    });

    setCalendarEvents(unique);
  }, [googleEvents, manualEvents, projectEvents]);

  const handleLogin = (userData: User) => {
      setUser(userData);
  };

  const handleLogout = () => {
      setUser(null);
      setGoogleEvents([]);
      setCalendarEvents([]);
      localStorage.removeItem('planner_user_session'); // Ensure cleanup
  };

  const handleAddEvent = async (newEvent: GoogleCalendarEvent) => {
      // 1. Save locally immediately
      setManualEvents(prev => [...prev, newEvent]);

      // 2. Try to sync with Google
      if (user?.accessToken) {
          const success = await createCalendarEvent(newEvent, user.accessToken);
          if (success && user.accessToken !== 'mock-token') {
             // If real success, we might want to refresh google events or mark manual event as synced
             // For simplicity in this demo, we keep the manual copy to ensure it shows up immediately
             console.log("Evento sincronizado com Google Calendar!");
          }
      }
  };

  const updateWheel = (index: number, newVal: number) => {
    const newData = [...wheelData];
    newData[index].value = newVal;
    setWheelData(newData);
  };

  const NavItem = ({ tab, label, icon: Icon, colorClass }: { tab: Tab, label: string, icon: any, colorClass?: string }) => (
    <button
      onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all duration-200
        ${activeTab === tab 
          ? 'bg-white shadow-sm text-ink font-medium border border-stone-100' 
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'}
        ${colorClass ? colorClass : ''}
      `}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  // Render Login Page if not authenticated
  if (!user) {
      return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-[#FDFBF7] text-[#4A4036] paper-texture">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full h-16 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200 flex items-center justify-between px-4 z-50">
        <h1 className="font-serif text-xl font-semibold text-ink">Meu Planner</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-stone-600">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#F9F5E3] border-r border-[#EBE5CE] transform transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 hidden lg:block">
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight">Meu Planner<span className="text-accent">.</span></h1>
          <p className="text-xs text-stone-500 mt-1">Organize sua vida com inteligência</p>
        </div>

        <nav className="px-4 py-2 space-y-1 mb-8 mt-16 lg:mt-0 flex-1">
            <p className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 mt-4">Planejamento</p>
            <NavItem tab="dashboard" label="Visão Geral" icon={LayoutDashboard} />
            <NavItem tab="annual" label="Anual" icon={Calendar} />
            <NavItem tab="monthly" label="Mensal" icon={Calendar} />
            <NavItem tab="weekly" label="Semanal" icon={Calendar} />
            <NavItem tab="daily" label="Planejamento Diário" icon={CheckSquare} />

            <p className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 mt-6">Áreas da Vida</p>
            <NavItem tab="work" label="Trabalho" icon={Briefcase} colorClass="hover:text-brand-work" />
            <NavItem tab="finance" label="Minhas Finanças" icon={DollarSign} colorClass="hover:text-brand-finance" />
            <NavItem tab="home" label="Casa" icon={Home} colorClass="hover:text-brand-home" />
            <NavItem tab="personal" label="Pessoal" icon={UserIcon} colorClass="hover:text-brand-personal" />
            <NavItem tab="daughter" label="Beatriz" icon={Heart} colorClass="hover:text-brand-daughter" />
            
            <p className="px-4 text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 mt-6">Ferramentas</p>
            <NavItem tab="travel" label="Viagens" icon={Plane} colorClass="hover:text-sky-600" />
            <NavItem tab="tools" label="Ferramentas" icon={Target} />
        </nav>

        {/* User Profile Sidebar Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50">
            <div className="flex items-center gap-3 mb-3">
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-stone-200" />
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-ink truncate">{user.name}</p>
                    <p className="text-xs text-stone-400 truncate">{user.email}</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-600 py-2 rounded-lg text-xs font-bold hover:bg-stone-100 transition-colors"
            >
                <LogOut size={14} /> Sair
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto pt-20 lg:pt-8 px-4 lg:px-10 pb-10 scroll-smooth">
        <div className="max-w-6xl mx-auto">
            
          {/* Header Context */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 className="text-3xl font-serif font-bold text-ink capitalize">
                    {activeTab === 'tools' ? 'Ferramentas & Recursos' : 
                     activeTab === 'travel' ? 'Planejador de Viagens' :
                     activeTab === 'daughter' ? 'Espaço da Beatriz' :
                     activeTab === 'dashboard' ? 'Visão Geral' :
                     activeTab === 'annual' ? 'Planejamento Anual' :
                     activeTab === 'monthly' ? 'Planejamento Mensal' :
                     activeTab === 'weekly' ? 'Planejamento Semanal' :
                     activeTab === 'daily' ? 'Planejamento Diário' :
                     activeTab === 'finance' ? 'Minhas Finanças' :
                     activeTab === 'work' ? 'Espaço de Trabalho' :
                     activeTab === 'home' ? 'Gestão da Casa' :
                     activeTab === 'personal' ? 'Espaço Pessoal' :
                     activeTab}
                </h2>
                <p className="text-stone-500 mt-1 text-sm">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
          </header>

          {/* Content Views - PASSING CALENDAR EVENTS GLOBALLY */}
          {activeTab === 'daily' && <DailyPlanner calendarEvents={calendarEvents} />}
          
          {activeTab === 'finance' && <FinanceTracker />}

          {activeTab === 'annual' && <AnnualPlanner calendarEvents={calendarEvents} />}

          {activeTab === 'monthly' && <MonthlyPlanner calendarEvents={calendarEvents} onAddEvent={handleAddEvent} />}

          {activeTab === 'weekly' && <WeeklyPlanner calendarEvents={calendarEvents} onAddEvent={handleAddEvent} />}

          {activeTab === 'work' && <WorkPlanner calendarEvents={calendarEvents} projects={projects} onUpdateProjects={setProjects} />}

          {activeTab === 'home' && <HomePlanner />}

          {activeTab === 'personal' && <PersonalPlanner calendarEvents={calendarEvents} onAddEvent={handleAddEvent} />}

          {activeTab === 'daughter' && <DaughterPlanner calendarEvents={calendarEvents} />}

          {activeTab === 'travel' && <TravelPlanner calendarEvents={calendarEvents} onAddEvent={handleAddEvent} />}

          {activeTab === 'tools' && <ToolsPage />}

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h3 className="font-serif text-xl mb-4">Resumo Rápido</h3>
                    <p className="text-stone-600 mb-4">Olá, {user.name.split(' ')[0]}! Você tem {calendarEvents.length} compromissos (incluindo prazos de trabalho) para os próximos dias.</p>
                    {calendarEvents.length > 0 && (
                        <div className="mb-6 space-y-2">
                             {calendarEvents.slice(0, 4).map(ev => (
                                 <div key={ev.id} className={`flex items-center gap-2 text-sm p-2 rounded ${ev.id.startsWith('proj') ? 'bg-slate-100 text-slate-700' : 'bg-stone-50 text-stone-600'}`}>
                                     {ev.id.startsWith('proj') ? <Briefcase size={14} className="text-brand-work" /> : <Calendar size={14} className="text-accent" />}
                                     <span className="font-bold min-w-[40px]">
                                         {ev.start.dateTime 
                                            ? new Date(ev.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                            : new Date(ev.start.date || '').getDate() + '/' + (new Date(ev.start.date || '').getMonth() + 1)}
                                     </span>
                                     <span className="truncate flex-1">{ev.summary}</span>
                                 </div>
                             ))}
                        </div>
                    )}
                    <button onClick={() => setActiveTab('daily')} className="text-accent font-medium hover:underline text-sm">Ir para o planejamento diário &rarr;</button>
                </div>
                <div className="flex flex-col h-full">
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-stone-200 p-2">
                        <WheelOfLife data={wheelData} onUpdate={updateWheel} />
                    </div>
                    <p className="text-center text-xs text-stone-400 mt-2">
                        Ajuste sua Roda da Vida com base na sua carga de trabalho e eventos atuais.
                    </p>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;