import { GoogleGenAI } from "@google/genai";

// Helper to safely get env vars
const getApiKey = () => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
  } catch {
    return '';
  }
};

const getClient = () => {
    const apiKey = getApiKey();
    // Fallback to allow app to run (will error on actual generation if key missing)
    return new GoogleGenAI({ apiKey: apiKey || 'DEMO_KEY' });
};

export const generateDailyPlan = async (todos: string[], events: string[], mood: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
        Atue como um assistente pessoal empático e eficiente.
        Aqui estão minhas tarefas para hoje: ${todos.join(', ')}.
        Aqui estão meus compromissos: ${events.join(', ')}.
        Meu humor/energia hoje está: ${mood}.

        Por favor, crie um plano de ação sugerido para o meu dia, priorizando o que é importante e sugerindo pausas se minha energia estiver baixa. Mantenha o tom calmo e motivador. Formate a resposta em Markdown leve.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Não foi possível gerar o plano no momento.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Desculpe, ocorreu um erro ao conectar com a inteligência do planner. Verifique sua chave de API.";
    }
};

export const analyzeFinances = async (income: number, expenses: number, expenseList: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
        Sou seu consultor financeiro pessoal.
        Minha renda mensal: R$ ${income}.
        Meus gastos totais: R$ ${expenses}.
        Lista de gastos:
        ${expenseList}

        Forneça uma análise curta (max 3 parágrafos) sobre minha saúde financeira e 3 dicas práticas para economizar.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "Você é um consultor financeiro experiente, direto e prático."
            }
        });

        return response.text || "Análise indisponível.";
    } catch (error) {
        console.error(error);
        return "Erro ao analisar finanças. Verifique sua conexão.";
    }
};

export const suggestMealPlan = async (preferences: string): Promise<string> => {
     try {
        const ai = getClient();
        const prompt = `
        Crie um plano de refeições simples para 3 dias baseado nestas preferências: "${preferences}".
        
        Formate assim:
        ## Dia 1
        - Café: ...
        - Almoço: ...
        - Jantar: ...
        
        (Repita para os outros dias)
        
        ## Lista de Compras Resumida
        - Item 1
        - Item 2
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Sugestão indisponível.";
    } catch (error) {
        console.error(error);
        return `## Sugestão de Exemplo (Offline)\n\nNão consegui conectar à IA, mas aqui está uma ideia baseada em "${preferences}":\n\n### Dia 1\n- **Café:** Ovos mexidos e frutas.\n- **Almoço:** Frango grelhado com salada.\n- **Jantar:** Sopa de legumes.\n\n*(Verifique sua chave de API para sugestões personalizadas)*`;
    }
}

export const suggestTravelItinerary = async (destination: string, days: string, budget: string, interests: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
        Atue como um guia de viagens local e experiente.
        Crie um roteiro de viagem incrível e detalhado para: ${destination}.
        Duração: ${days} dias.
        Estilo/Orçamento: ${budget}.
        Interesses principais: ${interests}.
        
        Estrutura da resposta (use Markdown):
        
        ### 🌍 Visão Geral
        Um breve parágrafo sobre o que esperar.

        ### 📅 Roteiro Dia a Dia
        
        **Dia 1: [Título do Dia]**
        *   🌅 **Manhã:** Atividade sugerida.
        *   ☀️ **Tarde:** Atividade sugerida + Dica de almoço.
        *   🌙 **Noite:** Atividade sugerida + Dica de jantar.
        
        (Repita para os ${days} dias)

        ### 💡 Dicas Extras
        *   Transporte
        *   Segurança
        *   Melhor época
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Não foi possível gerar o roteiro.";
    } catch (error) {
        console.error("Erro Gemini Travel:", error);
        
        // Fallback Mock para demonstração se a API falhar
        return `### 🌍 Roteiro Sugerido para ${destination} (Modo Offline)
        
*Nota: Não foi possível conectar à IA em tempo real. Este é um exemplo estruturado.*

### 📅 Roteiro Dia a Dia

**Dia 1: Chegada e Exploração**
*   🌅 **Manhã:** Chegada e check-in no hotel. Caminhada leve pelo centro histórico para aclimatação.
*   ☀️ **Tarde:** Almoço em um restaurante local tradicional. Visita aos principais pontos turísticos próximos.
*   🌙 **Noite:** Jantar com vista para a cidade e descanso.

**Dia 2: Cultura e História**
*   🌅 **Manhã:** Visita a museus ou monumentos históricos principais.
*   ☀️ **Tarde:** Passeio em parques ou compras em feiras locais.
*   🌙 **Noite:** Espetáculo cultural ou barzinho típico.

### 💡 Dicas Extras
*   **Transporte:** Utilize aplicativos locais ou transporte público para economizar.
*   **Alimentação:** Experimente a comida de rua, geralmente é deliciosa e barata.

*(Para um roteiro personalizado real, verifique sua Chave de API do Google Gemini)*`;
    }
}