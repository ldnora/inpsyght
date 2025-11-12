"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFormularioCompleto } from "@/libs/api";
import { salvarResposta, carregarRespostas, Resposta } from "@/libs/storage";

// --- Início de todos os Tipos ---
type RichTextChild = {
  text: string;
};

type RichTextBlock = {
  type: string;
  children?: RichTextChild[];
};

// Tipos da API
type PerguntaAPI = {
  id: string;
  texto: string;
  feedback_baixo: RichTextBlock[] | string;
  feedback_medio: string;
  feedback_alto: string;
  pontuacao_reversa?: boolean;
};

type FacetaAPI = {
  id: string;
  nome: string;
  perguntas?: PerguntaAPI[];
};

type FatorAPI = {
  id: string;
  nome: string;
  facetas?: FacetaAPI[];
};

type FormularioAPI = {
  id: string;
  Nome: string;
  descricao?: string;
  fators?: FatorAPI[];
};

type FormularioResponse = {
  data: FormularioAPI;
};

// Tipo local para o cache
type CacheRespostas = {
  respostas: Resposta[];
};

// Tipo para a lista de perguntas "plana"
type PerguntaPlana = {
  id: string;
  texto: string;
  pontuacao_reversa?: boolean;
  facetId?: string;
  factorId?: string;
  nomeFaceta?: string;
  nomeFator?: string;
  feedback_baixo: string;
  feedback_medio: string;
  feedback_alto: string;
  fatorIndex: number;
  facetaIndex: number;
  perguntaIndex: number;
};
// --- Fim de todos os Tipos ---


// --- Funções Auxiliares ---

function parseFeedback(fb: RichTextBlock[] | string): string {
  if (Array.isArray(fb)) {
    return fb
      .map((block) => block.children?.map((child) => child.text).join(" "))
      .join("\n");
  }
  return fb || "";
}

function getPerguntasPlanas(fators: FatorAPI[]): PerguntaPlana[] {
  const perguntasPlanas: PerguntaPlana[] = [];
  
  (fators ?? []).forEach((f, fatorIndex) => {
    (f.facetas ?? []).forEach((fa, facetaIndex) => {
      (fa.perguntas ?? []).forEach((p, perguntaIndex) => {
        perguntasPlanas.push({
          id: p.id,
          texto: p.texto,
          feedback_baixo: parseFeedback(p.feedback_baixo),
          feedback_medio: p.feedback_medio,
          feedback_alto: p.feedback_alto,
          pontuacao_reversa: p.pontuacao_reversa,
          facetId: fa.id,
          factorId: f.id,
          nomeFaceta: fa.nome,
          nomeFator: f.nome,
          fatorIndex,
          facetaIndex,
          perguntaIndex,
        });
      });
    });
  });
  return perguntasPlanas;
}

// --- Componente Principal ---
export default function FormularioPage() {
  const { documentId } = useParams();
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);

  // Estados de navegação e dados
  const [nomeFormulario, setNomeFormulario] = useState<string>("");
  const [fators, setFators] = useState<FatorAPI[]>([]);
  const [indices, setIndices] = useState({ fator: 0, faceta: 0, pergunta: 0 });
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});

  const perguntasPlanas = useMemo(() => getPerguntasPlanas(fators), [fators]);

  // Carregamento de dados
  useEffect(() => {
    async function carregar() {
      if (!documentId) return;

      try {
        const formData: FormularioResponse = await getFormularioCompleto(
          documentId as string
        );
        
        const fatorsCarregados = formData.data.fators ?? [];
        const perguntasPlanas = getPerguntasPlanas(fatorsCarregados);

        setNomeFormulario(formData.data.Nome);
        setFators(fatorsCarregados);
        
        if (perguntasPlanas.length === 0) {
            setCarregando(false);
            return;
        }

        const cache: CacheRespostas = await carregarRespostas(
          documentId as string
        );
        const respostasMap = cache.respostas.reduce(
          (acc: Record<string, Resposta>, r) => {
            acc[r.perguntaId] = r;
            return acc;
          },
          {}
        );
        setRespostas(respostasMap);

        let startIndices = { fator: 0, faceta: 0, pergunta: 0 };
        let allAnswered = true;
        for (const p of perguntasPlanas) {
          if (!respostasMap[p.id]) {
            startIndices = { fator: p.fatorIndex, faceta: p.facetaIndex, pergunta: p.perguntaIndex };
            allAnswered = false;
            break;
          }
        }
        
        if (allAnswered && perguntasPlanas.length > 0) {
          const ultimoP = perguntasPlanas[perguntasPlanas.length - 1];
          setIndices({fator: ultimoP.fatorIndex, faceta: ultimoP.facetaIndex, pergunta: ultimoP.perguntaIndex });
        } else {
          setIndices(startIndices);
        }

      } catch (err) {
        console.error("Erro ao carregar formulário:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [documentId]);

  const handleSelecao = async (valor: number) => {
    if (!documentId) return;

    const { fator, faceta, pergunta } = indices;
    const perguntaAtualAPI = (fators[fator]?.facetas ?? [])[faceta]?.perguntas?.[pergunta];
    if (!perguntaAtualAPI) return;

    const f = fators[fator];
    const fa = (f.facetas ?? [])[faceta];

    const perguntaPlana = perguntasPlanas.find(p => p.id === perguntaAtualAPI.id);
    if (!perguntaPlana) return;

    let feedback = "";
    if (valor <= 2) feedback = perguntaPlana.feedback_baixo;
    else if (valor === 3) feedback = perguntaPlana.feedback_medio;
    else feedback = perguntaPlana.feedback_alto;

    const novaResposta: Resposta = {
      perguntaId: perguntaAtualAPI.id,
      texto: perguntaAtualAPI.texto,
      valor,
      feedback,
      facetId: fa?.id,
      factorId: f?.id,
    };

    setRespostas((prev) => ({ ...prev, [perguntaAtualAPI.id]: novaResposta }));
    await salvarResposta(documentId as string, novaResposta);
  };

  const handleProximo = () => {
    const { fator, faceta, pergunta } = indices;
    
    const facetaAtual = (fators[fator]?.facetas ?? [])[faceta];
    const fatorAtual = fators[fator];

    if (!facetaAtual || !fatorAtual) return;

    const numPerguntas = (facetaAtual.perguntas ?? []).length;
    if (pergunta < numPerguntas - 1) {
      setIndices({ ...indices, pergunta: pergunta + 1 });
      return;
    }
    
    const numFacetas = (fatorAtual.facetas ?? []).length;
    if (faceta < numFacetas - 1) {
      setIndices({ fator: fator, faceta: faceta + 1, pergunta: 0 });
      return;
    }

    if (fator < fators.length - 1) {
      setIndices({ fator: fator + 1, faceta: 0, pergunta: 0 });
      return;
    }
    
    router.push(`/resultado/${documentId}`);
  };

  const handleAnterior = () => {
    const { fator, faceta, pergunta } = indices;

    if (pergunta > 0) {
      setIndices({ ...indices, pergunta: pergunta - 1 });
      return;
    }

    if (faceta > 0) {
      const facetaAnterior = (fators[fator]?.facetas ?? [])[faceta - 1];
      const numPerguntas = (facetaAnterior?.perguntas ?? []).length;
      setIndices({ fator: fator, faceta: faceta - 1, pergunta: numPerguntas > 0 ? numPerguntas - 1 : 0 });
      return;
    }

    if (fator > 0) {
      const fatorAnterior = fators[fator - 1];
      const numFacetas = (fatorAnterior?.facetas ?? []).length;
      const facetaAnterior = (fatorAnterior?.facetas ?? [])[numFacetas > 0 ? numFacetas - 1 : 0];
      const numPerguntas = (facetaAnterior?.perguntas ?? []).length;
      setIndices({ fator: fator - 1, faceta: numFacetas > 0 ? numFacetas - 1 : 0, pergunta: numPerguntas > 0 ? numPerguntas - 1 : 0 });
      return;
    }
  };

  if (carregando)
    return (
      <main className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-700">Carregando formulário...</p>
      </main>
    );

  if (fators.length === 0 || perguntasPlanas.length === 0)
    return (
      <main className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-700">Nenhuma pergunta encontrada.</p>
      </main>
    );

  const { fator: fatorIndex, faceta: facetaIndex, pergunta: perguntaIndex } = indices;
  const fatorAtual = fators[fatorIndex];
  const facetaAtual = (fatorAtual?.facetas ?? [])[facetaIndex];
  const perguntaAtualAPI = (facetaAtual?.perguntas ?? [])[perguntaIndex];

  if (!perguntaAtualAPI) {
     return (
      <main className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-700">Erro ao carregar a pergunta.</p>
      </main>
    );
  }

  const totalPerguntas = perguntasPlanas.length;
  const linearIndex = perguntasPlanas.findIndex(p => p.id === perguntaAtualAPI.id);
  const progresso = totalPerguntas > 0 ? ((linearIndex + 1) / totalPerguntas) * 100 : 0;
  
  const valorSelecionado = respostas[perguntaAtualAPI.id]?.valor;
  const isRespondida = valorSelecionado != null;
  const isUltimaPergunta = linearIndex === totalPerguntas - 1;

  const legenda: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "Discordo totalmente",
    2: "Discordo",
    3: "Neutro",
    4: "Concordo",
    5: "Concordo totalmente",
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-2xl">
          
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {nomeFormulario}
          </h1>

          {/* Abas de Fator */}
          <div className="flex flex-wrap mb-4">
            {fators.map((f, idx) => (
              <button
                key={f.id}
                onClick={() => setIndices({ fator: idx, faceta: 0, pergunta: 0 })}
                className={`px-3 py-2 text-sm font-semibold rounded-md mr-2 mb-2 border ${
                  idx === fatorIndex
                    ? "bg-green-500 text-white border-green-600" // ATIVA
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100" // INATIVA
                }`}
              >
                {f.nome}
              </button>
            ))}
          </div>

          {/* Abas de Faceta */}
          <div className="flex flex-wrap mb-6">
            {(fatorAtual?.facetas ?? []).map((fa, idx) => (
              <button
                key={fa.id}
                onClick={() => setIndices({ ...indices, faceta: idx, pergunta: 0 })}
                className={`px-3 py-1 text-xs font-semibold rounded-md mr-2 mb-2 border ${
                  idx === facetaIndex
                    ? "bg-green-500 text-white border-green-600" // ATIVA
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100" // INATIVA
                }`}
              >
                {fa.nome}
              </button>
            ))}
          </div>

          {/* Barra de progresso */}
          <div
            className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden"
            role="progressbar"
            aria-valuenow={linearIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalPerguntas}
            aria-label={`Progresso: pergunta ${linearIndex + 1} de ${totalPerguntas}`}
          >
            <div
              className="bg-green-500 h-3 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset>
              <legend className="text-lg font-semibold text-gray-800 mb-6">
                Pergunta {linearIndex + 1} de {totalPerguntas}
              </legend>

              <p className="text-xl text-gray-700 mb-8 min-h-[6rem]">
                {perguntaAtualAPI.texto}
              </p>

              {/* Opções de resposta */}
              <div
                className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center"
                role="radiogroup"
              >
                {[1, 2, 3, 4, 5].map((valor) => (
                  <label
                    key={valor}
                    className={`flex flex-col justify-center items-center py-3 px-2 rounded-lg font-semibold border cursor-pointer transition focus-within:ring-2 focus-within:ring-green-500 min-h-[5rem]
                      ${
                        valorSelecionado === valor
                          ? "bg-green-500 text-white border-green-600" // Ativo
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100" // Inativo
                      }`}
                  >
                    <input
                      type="radio"
                      name={`pergunta-${perguntaAtualAPI.id}`}
                      value={valor}
                      checked={valorSelecionado === valor}
                      onChange={() => handleSelecao(valor)}
                      className="sr-only"
                      aria-label={`${valor} - ${
                        legenda[valor as 1 | 2 | 3 | 4 | 5]
                      }`}
                    />
                    <span className="text-sm text-center">
                      {legenda[valor as 1 | 2 | 3 | 4 | 5]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Botões de navegação */}
            <div className="flex justify-between mt-10">
              <button
                type="button"
                onClick={handleAnterior}
                disabled={linearIndex === 0}
                className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Voltar
              </button>
              
              <button
                type="button"
                onClick={handleProximo}
                disabled={!isRespondida}
                className="px-6 py-2 rounded-lg font-semibold text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUltimaPergunta ? "Finalizar" : "Próximo"}
              </button>
            </div>
            
          </form>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="w-full text-center p-4 text-xs text-gray-500 bg-gray-100">
        <p>
          Este formulário é uma ferramenta de autoavaliação. 
          Suas respostas não são armazenadas em nossos servidores e ficam salvas apenas no seu navegador.
        </p>
      </footer>
    </div>
  );
}