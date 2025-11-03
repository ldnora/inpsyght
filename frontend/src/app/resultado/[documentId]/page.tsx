"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFormularioCompleto } from "@/libs/api";
import { carregarRespostas, limparRespostas, Resposta } from "@/libs/storage";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

type CacheRespostas = {
  respostas: Resposta[];
};

// Tipos de Resultados (médias ainda são calculadas para o gráfico)
type ResultadoFaceta = {
  id: string;
  nome: string;
  media: number;
  respostas: Resposta[];
};

type ResultadoFator = {
  id: string;
  nome: string;
  media: number;
  facetas: ResultadoFaceta[];
};

// --- Fim de todos os Tipos ---

export default function ResultadoPage() {
  const { documentId } = useParams();
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [formulario, setFormulario] = useState<FormularioAPI | null>(null);
  const [resultados, setResultados] = useState<ResultadoFator[]>([]);
  const relatorioRef = useRef<HTMLDivElement>(null);

  // 'calcularResultados' (sem alterações)
  const calcularResultados = useCallback(
    (form: FormularioAPI, respostas: Resposta[]): ResultadoFator[] => {
      const resultados: ResultadoFator[] = [];

      const allPerguntasMap = new Map<string, PerguntaAPI>();
      form.fators?.forEach((f) => {
        f.facetas?.forEach((fa) => {
          fa.perguntas?.forEach((p) => {
            allPerguntasMap.set(p.id, p);
          });
        });
      });

      const getValorCorrigido = (r: Resposta): number => {
        const pergunta = allPerguntasMap.get(r.perguntaId);
        if (pergunta?.pontuacao_reversa) {
          return 6 - r.valor;
        }
        return r.valor;
      };

      form.fators?.forEach((fator) => {
        const facetasResultado: ResultadoFaceta[] = [];
        const respostasFator: Resposta[] = [];

        fator.facetas?.forEach((faceta) => {
          const respostasFaceta = respostas.filter(
            (r) => r.facetId === faceta.id
          );

          if (respostasFaceta.length > 0) {
            respostasFator.push(...respostasFaceta);

            const somaFaceta = respostasFaceta.reduce(
              (acc, r) => acc + getValorCorrigido(r),
              0
            );
            const mediaFaceta = somaFaceta / respostasFaceta.length;

            facetasResultado.push({
              id: faceta.id,
              nome: faceta.nome,
              media: Number(mediaFaceta.toFixed(2)),
              respostas: respostasFaceta,
            });
          }
        });

        if (respostasFator.length > 0) {
          const somaFator = respostasFator.reduce(
            (acc, r) => acc + getValorCorrigido(r),
            0
          );
          const mediaFator = somaFator / respostasFator.length;

          resultados.push({
            id: fator.id,
            nome: fator.nome,
            media: Number(mediaFator.toFixed(2)),
            facetas: facetasResultado,
          });
        }
      });

      return resultados;
    },
    []
  );

  // useEffect (sem alterações)
  useEffect(() => {
    async function carregar() {
      if (!documentId) return;

      try {
        console.log("Carregando dados para documentId:", documentId);

        const [formData, cache]: [FormularioResponse, CacheRespostas] =
          await Promise.all([
            getFormularioCompleto(documentId as string),
            carregarRespostas(documentId as string),
          ]);

        console.log("Formulário carregado:", formData.data.Nome);
        console.log("Respostas encontradas:", cache.respostas.length);

        if (!cache || cache.respostas.length === 0) {
          console.log(
            "Nenhuma resposta encontrada, redirecionando para o formulário..."
          );
          setTimeout(() => {
            router.push(`/formulario/${documentId}`);
          }, 100);
          return;
        }

        setFormulario(formData.data);
        const resultadosCalculados = calcularResultados(
          formData.data,
          cache.respostas
        );
        console.log(
          "Resultados calculados:",
          resultadosCalculados.length,
          "fatores"
        );
        setResultados(resultadosCalculados);
      } catch (err) {
        console.error("Erro ao carregar resultados:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [documentId, router, calcularResultados]);

  // handleRefazer (sem alterações)
  const handleRefazer = useCallback(async () => {
    if (documentId) {
      await limparRespostas(documentId as string);
      router.push(`/formulario/${documentId}`);
    }
  }, [documentId, router]);

  // handleGerarPDF (sem alterações)
  const handleGerarPDF = useCallback(async () => {
    if (!relatorioRef.current) return;

    setGerandoPDF(true);

    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Por favor, permita pop-ups para gerar o PDF.");
        setGerandoPDF(false);
        return;
      }

      const content = relatorioRef.current.cloneNode(true) as HTMLElement;

      const buttons = content.querySelectorAll("button, .print\\:hidden");
      buttons.forEach((btn) => btn.remove());

      // CSS (permanece o mesmo, já estava correto para impressão)
      const css = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; background: #f3f4f6; padding: 20px; }
          .max-w-4xl { max-width: 56rem; margin: 0 auto; }
          .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .rounded-xl { border-radius: 0.75rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .p-8 { padding: 2rem; }
          .p-4 { padding: 1rem; }
          .p-3 { padding: 0.75rem; }
          .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
          .gap-4 { gap: 1rem; }
          .gap-2 { gap: 0.5rem; }
          .space-y-3 > * + * { margin-top: 0.75rem; }
          .bg-white { background-color: #ffffff; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-blue-50 { background-color: #eff6ff; }
          .bg-green-100 { background-color: #d1fae5; }
          .bg-green-500 { background-color: #10b981; }
          .text-gray-800 { color: #1f2937; }
          .text-gray-700 { color: #374151; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-green-500 { color: #10b981; }
          .text-green-700 { color: #047857; }
          .text-blue-600 { color: #2563eb; }
          .border { border-width: 1px; }
          .border-b { border-bottom-width: 1px; }
          .border-l-4 { border-left-width: 4px; }
          .border-gray-200 { border-color: #e5e7eb; }
          .border-blue-500 { border-color: #3b82f6; }
          .rounded { border-radius: 0.25rem; }
          .rounded-lg { border-radius: 0.5rem; }
          .rounded-full { border-radius: 9999px; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
          .text-2xl { font-size: 1.5rem; line-height: 2rem; }
          .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
          .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .text-xs { font-size: 0.75rem; line-height: 1rem; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .items-baseline { align-items: baseline; }
          .grid { display: grid; }
          .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .h-2 { height: 0.5rem; }
          .w-full { width: 100%; }
          .max-w-xs { max-width: 20rem; }
          .flex-1 { flex: 1 1 0%; }
          @media print {
            body { background: white; }
            .shadow-lg { box-shadow: none; }
          }
          @media (min-width: 768px) {
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
        </style>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Resultados - ${formulario?.Nome || "Formulário"}</title>
            ${css}
          </head>
          <body>
            ${content.outerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 100);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert(
        "Erro ao preparar impressão. Use Ctrl+P ou Cmd+P para imprimir diretamente."
      );
    } finally {
      setGerandoPDF(false);
    }
  }, [relatorioRef, formulario]);

  // --- JSX (Renderização) ---
  
  // MUDANÇA: Fundo claro para loading
  if (carregando) {
    return (
      <main className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-700">
            Carregando resultados...
          </p>
        </div>
      </main>
    );
  }

  // MUDANÇA: Fundo claro para erro
  if (!formulario || resultados.length === 0) {
    return (
      <main className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-700 mb-4">
            Nenhum resultado encontrado ou formulário não disponível.
          </p>
          <button
            onClick={() => router.push(`/formulario/${documentId}`)}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
          >
            Ir para o Formulário
          </button>
        </div>
      </main>
    );
  }

  return (
    // MUDANÇA: Fundo principal claro
    <div className="min-h-screen bg-gray-100 py-8 px-6">
      <div className="max-w-4xl mx-auto" ref={relatorioRef}>
        
        {/* MUDANÇA: Card branco, texto escuro */}
        <div className="bg-white shadow-lg rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Resultados: {formulario.Nome}
          </h1>
          {formulario.descricao && (
            <p className="text-gray-600 mb-4">
              {formulario.descricao}
            </p>
          )}
          <div className="text-sm text-gray-500 mb-4">
            Relatório gerado em:{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="flex gap-4 print:hidden">
            <button
              onClick={handleGerarPDF}
              disabled={gerandoPDF}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-lg transition flex items-center gap-2"
            >
              {gerandoPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Baixar PDF
                </>
              )}
            </button>
            <button
              onClick={handleRefazer}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refazer Formulário
            </button>
          </div>
        </div>

        {/* MUDANÇA: Card branco, texto escuro */}
        {resultados.length > 0 && (
          <div className="bg-white shadow-lg rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Visão Geral dos Fatores
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart
                data={resultados.map((f) => ({
                  nome: f.nome,
                  media: f.media,
                }))}
              >
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="nome"
                  tick={{ fill: "#6b7280", fontSize: 12 }} // text-gray-500
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fill: "#6b7280" }} // text-gray-500
                />
                <Radar
                  name="Média"
                  dataKey="media"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* MUDANÇA: Card branco, texto escuro */}
        {resultados.map((fator) => (
          <div
            key={fator.id}
            className="bg-white shadow-lg rounded-xl p-8 mb-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {fator.nome}
              </h2>
            </div>

            {/* Facetas do Fator */}
            {fator.facetas.map((faceta, facetaIndex) => (
              <div
                key={faceta.id}
                className={`mb-6 pb-6 ${
                  facetaIndex < fator.facetas.length - 1
                    ? "border-b border-gray-200" // Borda clara
                    : ""
                }`}
              >
                <h3 className="text-xl font-semibold text-gray-700 mb-3">
                  {faceta.nome}
                </h3>

                {/* Respostas da Faceta */}
                <div className="space-y-3">
                  {faceta.respostas.map((resposta) => (
                    // MUDANÇA: Fundo da resposta claro
                    <div
                      key={resposta.perguntaId}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {resposta.texto}
                      </p>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-xs text-gray-500">
                          Resposta:
                        </span>
                        {/* MUDANÇA: Cor do texto da "bolha" de resposta */}
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {resposta.valor}
                        </span>
                      </div>
                      {resposta.feedback && (
                        // MUDANÇA: Fundo do feedback claro
                        <div className="mt-2 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                          <p className="text-sm text-gray-700">
                            <strong className="text-blue-600">
                              Feedback:
                            </strong>{" "}
                            {resposta.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}