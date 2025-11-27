import { User, GoogleCalendarEvent } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

// Helper to safely get env vars without crashing in browser
const getEnv = (key: string) => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env[key] : '';
  } catch {
    return '';
  }
};

const STORAGE_KEY_CLIENT_ID = 'plnr_google_client_id';

export const getStoredClientId = () => {
    if (typeof window !== 'undefined') {
        return window.localStorage.getItem(STORAGE_KEY_CLIENT_ID) || '';
    }
    return '';
}

export const saveClientId = (id: string) => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY_CLIENT_ID, id);
    }
}

// Default from env, fallback to stored, fallback to empty
const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID') || ''; 
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

export const initGoogleAuth = (callback: (user: User) => void, onError: (error: string) => void) => {
  if (typeof window === 'undefined' || !window.google) {
      onError("Google API não carregada.");
      return null;
  }

  // Prioritize stored ID (user input) over env var if env is empty or user overrode it
  const storedId = getStoredClientId();
  const finalClientId = storedId || GOOGLE_CLIENT_ID;

  if (!finalClientId) {
      console.warn("Client ID não configurado. O login será simulado.");
      return null;
  }

  try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: finalClientId,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              
              if (!userInfoResponse.ok) throw new Error('Falha ao obter perfil do usuário');
              
              const userInfo = await userInfoResponse.json();

              const user: User = {
                id: userInfo.sub,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                accessToken: tokenResponse.access_token,
              };
              
              callback(user);
            } catch (error) {
              console.error("Erro ao buscar dados do usuário Google:", error);
              onError("Erro ao validar credenciais do Google.");
            }
          }
        },
        error_callback: (err: any) => {
            console.error('Google Auth Error:', err);
            onError("Erro na autenticação Google. Verifique o Client ID e as origens autorizadas no console do Google Cloud.");
        }
      });
      return client;
  } catch (e) {
      console.error("Erro ao inicializar cliente Google:", e);
      return null;
  }
};

export const fetchCalendarEvents = async (accessToken: string): Promise<GoogleCalendarEvent[]> => {
  if (!accessToken || accessToken === 'mock-token') {
      return mockCalendarEvents();
  }

  const now = new Date();
  const startPeriod = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endPeriod = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startPeriod}&timeMax=${endPeriod}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!response.ok) {
        if (response.status === 401) {
            console.warn("Token expirado ou inválido.");
        }
        console.warn("Falha na API do Google Calendar, usando dados simulados.");
        return mockCalendarEvents(); 
    }

    const data = await response.json();
    if (data.items) {
      return data.items;
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar eventos do calendário:", error);
    return mockCalendarEvents();
  }
};

export const createCalendarEvent = async (event: Partial<GoogleCalendarEvent>, accessToken: string): Promise<boolean> => {
  if (!accessToken || accessToken === 'mock-token') {
    console.log("Modo Simulação: Evento criado localmente (não enviado ao Google).");
    return true; 
  }

  try {
    const eventBody = {
      summary: event.summary,
      description: event.description || 'Criado via Meu Planner',
      start: event.start,
      end: event.end,
      location: event.location
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error("Erro ao criar evento no Google:", err);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro de conexão ao criar evento:", error);
    return false;
  }
};

export const mockLogin = (email?: string, name?: string): User => ({
  id: 'mock-user-' + Date.now(),
  name: name || (email ? email.split('@')[0] : 'Usuário'),
  email: email || 'usuario@exemplo.com',
  picture: `https://ui-avatars.com/api/?name=${name || email || 'User'}&background=D98E73&color=fff&bold=true`,
  accessToken: 'mock-token'
});

export const mockCalendarEvents = (): GoogleCalendarEvent[] => {
    const today = new Date();
    const formatDate = (date: Date, hour: number, minute: number) => {
        const d = new Date(date);
        d.setHours(hour, minute, 0, 0);
        return d.toISOString();
    };

    return [
        {
            id: 'evt1',
            summary: 'Reunião de Planejamento (Exemplo)',
            start: { dateTime: formatDate(today, 9, 0) },
            end: { dateTime: formatDate(today, 10, 0) },
            description: 'Isto é um evento de exemplo pois a API não foi conectada.',
            location: 'Google Meet'
        },
        {
            id: 'evt2',
            summary: 'Almoço com Cliente (Exemplo)',
            start: { dateTime: formatDate(today, 12, 30) },
            end: { dateTime: formatDate(today, 13, 30) },
            location: 'Restaurante Central'
        },
        {
            id: 'evt3',
            summary: 'Consulta Dentista (Exemplo)',
            start: { dateTime: formatDate(today, 17, 0) },
            end: { dateTime: formatDate(today, 18, 0) },
            location: 'Clínica Sorriso'
        }
    ];
};