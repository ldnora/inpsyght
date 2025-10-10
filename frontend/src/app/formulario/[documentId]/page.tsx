"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getFormularioCompleto } from "@/libs/api";
import { salvarResposta, carregarRespostas } from "@/libs/storage";

type RichTextChild = {
  text: string;
};

type RichTextBlock = {
  type: string; // ex: "paragraph"
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

// Tipos internos da página
type Pergunta = {
  id: string;
  texto: string;
  feedback_baixo: string;
  feedback_medio: string;
  feedback_alto: string;
  pontuacao_reversa?: boolean;
  facetId?: string;
  factorId?: string;
  nomeFaceta?: string;
  nomeFator?: string;
};

type Resposta = {
  perguntaId: string;
  texto: string;
  valor: number;
  feedback: string;
  facetId?: string;
  factorId?: string;
};

type CacheRespostas = {
  respostas: Resposta[];
};

export default function FormularioPage() {
  const { documentId } = useParams();
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [index, setIndex] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Função para extrair perguntas do JSON da API
  function extrairPerguntas(formData: FormularioResponse): Pergunta[] {
    const todasPerguntas: Pergunta[] = [];
    const fators = formData.data.fators || [];

    fators.forEach((f) => {
      const factorId = f.id;
      const nomeFator = f.nome;

      f.facetas?.forEach((fa) => {
        const facetId = fa.id;
        const nomeFaceta = fa.nome;

        fa.perguntas?.forEach((p) => {
          let fbBaixo = "";
          if (Array.isArray(p.feedback_baixo)) {
            fbBaixo = p.feedback_baixo
              .map((block) =>
                block.children?.map((child) => child.text).join(" ")
              )
              .join("\n");
          } else {
            fbBaixo = p.feedback_baixo || "";
          }

          todasPerguntas.push({
            id: p.id,
            texto: p.texto,
            feedback_baixo: fbBaixo,
            feedback_medio: p.feedback_medio,
            feedback_alto: p.feedback_alto,
            pontuacao_reversa: p.pontuacao_reversa,
            facetId,
            factorId,
            nomeFaceta,
            nomeFator,
          });
        });
      });
    });

    return todasPerguntas;
  }

  useEffect(() => {
    async function carregar() {
      if (!documentId) return;

      try {
        const formData: FormularioResponse = await getFormularioCompleto(
          documentId as string
        );
        const perguntasExtraidas = extrairPerguntas(formData);
        setPerguntas(perguntasExtraidas);

        const cache: CacheRespostas = await carregarRespostas(
          documentId as string
        );
        if (cache.respostas.length > 0) {
          setIndex(cache.respostas.length);
        }
      } catch (err) {
        console.error("Erro ao carregar formulário:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [documentId]);

  if (carregando)
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Carregando formulário...</p>
      </main>
    );

  if (perguntas.length === 0)
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Nenhuma pergunta encontrada.</p>
      </main>
    );

  const perguntaAtual = perguntas[index];
  const progresso = ((index + 1) / perguntas.length) * 100;

  const legenda: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: "Discordo totalmente",
    2: "Discordo",
    3: "Neutro",
    4: "Concordo",
    5: "Concordo totalmente",
  };

  const handleResposta = async (valor: number) => {
    setSelecionada(valor);

    let feedback = "";
    if (valor <= 2) feedback = perguntaAtual.feedback_baixo;
    else if (valor === 3) feedback = perguntaAtual.feedback_medio;
    else feedback = perguntaAtual.feedback_alto;

    await salvarResposta(documentId as string, {
      perguntaId: perguntaAtual.id,
      texto: perguntaAtual.texto,
      valor,
      feedback,
      facetId: perguntaAtual.facetId,
      factorId: perguntaAtual.factorId,
    });

    setTimeout(() => {
      if (index < perguntas.length - 1) {
        setIndex(index + 1);
        setSelecionada(null);
      } else {
        window.location.href = `/resultado/${documentId}`;
      }
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-xl">
          {/* Barra de progresso */}
          <div
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={perguntas.length}
            aria-label={`Progresso: pergunta ${index + 1} de ${
              perguntas.length
            }`}
          >
            <div
              className="bg-green-500 h-3 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <form>
            <fieldset>
              <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">
                Pergunta {index + 1} de {perguntas.length}
              </legend>

              {/* Nome do Fator */}
              <h2 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Fator: {perguntaAtual.nomeFator}
              </h2>

              {/* Nome da Faceta */}
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
                Faceta: {perguntaAtual.nomeFaceta}
              </h3>

              {/* Texto da pergunta */}
              <p className="text-xl text-gray-700 dark:text-gray-200 mb-6">
                {perguntaAtual.texto}
              </p>

              {/* Opções de resposta */}
              <div
                className="grid grid-cols-5 gap-4 text-center"
                role="radiogroup"
              >
                {[1, 2, 3, 4, 5].map((valor) => (
                  <label
                    key={valor}
                    className={`flex flex-col items-center py-3 px-2 rounded-lg font-semibold border cursor-pointer transition focus-within:ring-2 focus-within:ring-green-500
                      ${
                        selecionada === valor
                          ? "bg-green-500 text-white border-green-600"
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                  >
                    <input
                      type="radio"
                      name={`pergunta-${perguntaAtual.id}`}
                      value={valor}
                      checked={selecionada === valor}
                      onChange={() => handleResposta(valor)}
                      className="sr-only"
                      aria-label={`${valor} - ${
                        legenda[valor as 1 | 2 | 3 | 4 | 5]
                      }`}
                    />
                    <span className="text-lg">{valor}</span>
                    <span className="text-xs mt-2">
                      {legenda[valor as 1 | 2 | 3 | 4 | 5]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        </div>
      </main>
    </div>
  );
}
