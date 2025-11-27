import React, { useState } from 'react';
import { initGoogleAuth, mockLogin, saveClientId, getStoredClientId } from '../services/googleService';
import { User } from '../types';
import { Layout, ArrowRight, AlertCircle, CheckCircle2, Mail, Loader2, ShieldCheck, RefreshCw, Settings, X, Save, ExternalLink } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Estados para o fluxo de "Link de Verificação"
  const [verificationSent, setVerificationSent] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Configurações de Client ID
  const [showSettings, setShowSettings] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(getStoredClientId());

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError('');
    
    // Tenta inicializar o cliente Google Real
    const client = initGoogleAuth(
        (user) => {
            onLogin(user);
            setGoogleLoading(false);
        }, 
        (err) => {
            // Se falhar, mostramos o erro mas oferecemos o mock se for erro de config
            if (err.includes("Client ID")) {
                if(confirm("Não foi possível conectar ao Google real (Client ID ausente ou inválido). Deseja entrar no modo Simulação?")) {
                    setTimeout(() => {
                        const user = mockLogin('usuario.google@gmail.com', 'Usuário Google');
                        onLogin(user);
                        setGoogleLoading(false);
                    }, 1000);
                } else {
                    setGoogleLoading(false);
                    setShowSettings(true); // Abre configs para o usuário arrumar
                }
            } else {
                alert(err);
                setGoogleLoading(false);
            }
        }
    );

    if (client) {
        client.requestAccessToken();
    } else {
        // Se initGoogleAuth retornar null, é pq não tem client ID configurado
        if(confirm("Integração Google não configurada. Deseja entrar no modo Simulação? (Para configurar o Google Calendar real, clique em cancelar e depois no ícone de engrenagem)")) {
             setTimeout(() => {
                const user = mockLogin('usuario.google@gmail.com', 'Usuário Google');
                onLogin(user);
                setGoogleLoading(false);
            }, 1500);
        } else {
            setGoogleLoading(false);
            setShowSettings(true);
        }
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
        setError('Por favor, insira um e-mail válido.');
        return;
    }

    // Inicia o fluxo de "Verificação de E-mail"
    setLoading(true);
    
    // Simula envio do link
    setTimeout(() => {
        setLoading(false);
        setVerificationSent(true);
    }, 1500);
  };

  const confirmVerificationLink = () => {
      setVerifyingCode(true);
      // Simula a validação do token do link
      setTimeout(() => {
          const user = mockLogin(email, name);
          onLogin(user);
      }, 2000);
  }

  const handleSaveSettings = () => {
      saveClientId(clientIdInput);
      setShowSettings(false);
      alert('Configuração salva! Tente fazer login com Google novamente.');
  }

  // Se o link foi "enviado", mostra a tela de verificação
  if (verificationSent) {
      return (
        <div className="min-h-screen w-full bg-[#FDFBF7] flex items-center justify-center paper-texture p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-stone-200 text-center relative">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 animate-pulse">
                    <Mail size={32} />
                </div>
                <h2 className="font-serif text-2xl font-bold text-ink mb-2">Verifique seu E-mail</h2>
                <p className="text-stone-500 mb-6 text-sm">
                    Enviamos um link de acesso seguro para:<br/>
                    <span className="font-bold text-ink">{email}</span>
                </p>
                
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 text-xs text-stone-500 mb-6 text-left">
                    <p className="font-bold mb-1 flex items-center gap-2"><ShieldCheck size={14}/> Segurança:</p>
                    <p>O link expira em 15 minutos. Certifique-se de que o remetente é <strong>noreply@meuplanner.com</strong>.</p>
                </div>

                <div className="border-t border-stone-100 pt-6">
                    <p className="text-xs text-stone-400 mb-4 uppercase font-bold tracking-wider">Simulação de Acesso</p>
                    <button 
                        onClick={confirmVerificationLink}
                        disabled={verifyingCode}
                        className="w-full flex items-center justify-center gap-2 bg-ink text-white font-medium py-3 px-4 rounded-xl hover:bg-stone-800 transition-all shadow-md disabled:opacity-70 group"
                    >
                        {verifyingCode ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Validando Token...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={18} className="text-green-400 group-hover:text-green-300" /> Confirmar e Entrar
                            </>
                        )}
                    </button>
                </div>
                
                <button 
                    onClick={() => { setVerificationSent(false); setEmail(''); }}
                    className="mt-4 text-xs text-stone-400 hover:text-stone-600 underline flex items-center gap-1 justify-center w-full"
                >
                    <RefreshCw size={10} /> Tentar outro e-mail
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex items-center justify-center paper-texture p-4">
      
      {/* Settings Button */}
      <div className="absolute top-4 right-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-stone-400 hover:text-ink hover:bg-white rounded-full transition-colors shadow-sm bg-white/50"
            title="Configurar Integração Google"
          >
              <Settings size={20} />
          </button>
      </div>

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-stone-200 text-center relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-brand-home"></div>
        
        <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-accent shadow-inner">
                <Layout size={40} />
            </div>
        </div>

        <h1 className="font-serif text-3xl font-bold text-ink mb-2">Meu Planner</h1>
        <p className="text-stone-500 mb-8 text-sm">Organize sua vida com a inteligência do Gemini.</p>

        <div className="space-y-4 text-left">
            {/* Google Login Button */}
            <button 
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-70 group relative overflow-hidden"
            >
                {googleLoading ? (
                    <Loader2 size={20} className="animate-spin text-stone-400" />
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                )}
                {googleLoading ? "Conectando ao Google..." : "Entrar com Google"}
            </button>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest">Ou via E-mail</span>
                <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-3 animate-fade-in">
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1 ml-1">Seu Nome (Opcional)</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como gostaria de ser chamado?"
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 focus:outline-none focus:border-accent transition-colors text-sm"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1 ml-1">E-mail Corporativo ou Pessoal</label>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        placeholder="seu@email.com"
                        className={`w-full bg-stone-50 border rounded-lg p-3 focus:outline-none transition-colors text-sm ${error ? 'border-red-300 focus:border-red-400 bg-red-50' : 'border-stone-200 focus:border-accent'}`}
                        disabled={loading}
                    />
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-xs mt-1 bg-red-50 p-2 rounded">
                        <AlertCircle size={12} /> {error}
                    </div>
                )}
                <button 
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full flex items-center justify-center gap-2 bg-ink text-white font-medium py-3 px-4 rounded-xl hover:bg-stone-800 transition-all shadow-sm disabled:opacity-70 mt-2"
                >
                    {loading ? "Enviando Link Mágico..." : "Receber Link de Acesso"} <ArrowRight size={16} />
                </button>
            </form>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100">
             <div className="flex items-start gap-3 text-left bg-stone-50 p-3 rounded-lg border border-stone-100">
                <CheckCircle2 size={16} className="text-stone-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-stone-500 leading-relaxed">
                    Utilizamos autenticação sem senha (Passwordless). Um link único e seguro será enviado ao seu e-mail para validar sua identidade automaticamente.
                </p>
             </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif text-xl text-ink">Configuração Google</h3>
                      <button onClick={() => setShowSettings(false)} className="text-stone-400 hover:text-ink"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 leading-relaxed">
                          Para integrar com sua <strong>Google Agenda Real</strong>, você precisa de um <strong>Client ID</strong>.
                          Sem isso, o aplicativo usa dados de simulação (Mock).
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Google OAuth Client ID</label>
                          <input 
                              value={clientIdInput}
                              onChange={(e) => setClientIdInput(e.target.value)}
                              placeholder="Ex: 123456...apps.googleusercontent.com"
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:outline-none focus:border-accent font-mono text-stone-600"
                          />
                      </div>

                      <a 
                        href="https://console.cloud.google.com/apis/credentials" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 hover:underline"
                      >
                          <ExternalLink size={12} /> Obter ID no Google Cloud Console
                      </a>

                      <button 
                          onClick={handleSaveSettings}
                          className="w-full bg-ink text-white py-2 rounded-lg font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                          <Save size={16} /> Salvar & Recarregar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};