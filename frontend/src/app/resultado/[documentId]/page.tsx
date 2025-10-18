"use client";

import { useState, useEffect, useRef } from "react";
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

type RichTextChild = {
  text: string;
};

type RichTextBlock = {
  type: string;
  children?: RichTextChild[];
};

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

export default function ResultadoPage() {
  const { documentId } = useParams();
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [formulario, setFormulario] = useState<FormularioAPI | null>(null);
  const [resultados, setResultados] = useState<ResultadoFator[]>([]);
  const relatorioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function carregar() {
      if (!documentId) return;

      try {
        console.log("Carregando dados para documentId:", documentId);

        // Carregar formulário e respostas em paralelo
        const [formData, cache] = await Promise.all([
          getFormularioCompleto(documentId as string),
          carregarRespostas(documentId as string),
        ]);

        console.log("Formulário carregado:", formData.data.Nome);
        console.log("Respostas encontradas:", cache.respostas.length);

        // Verificar se há respostas antes de prosseguir
        if (!cache || cache.respostas.length === 0) {
          console.log(
            "Nenhuma resposta encontrada, redirecionando para o formulário..."
          );
          // Usar setTimeout para garantir que o redirecionamento aconteça
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
        // Não redirecionar em caso de erro de rede, mostrar mensagem
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [documentId, router]);

  function calcularResultados(
    form: FormularioAPI,
    respostas: Resposta[]
  ): ResultadoFator[] {
    const resultados: ResultadoFator[] = [];

    form.fators?.forEach((fator) => {
      const facetasResultado: ResultadoFaceta[] = [];

      fator.facetas?.forEach((faceta) => {
        const respostasFaceta = respostas.filter(
          (r) => r.facetId === faceta.id
        );

        if (respostasFaceta.length > 0) {
          const soma = respostasFaceta.reduce((acc, r) => acc + r.valor, 0);
          const media = soma / respostasFaceta.length;

          facetasResultado.push({
            id: faceta.id,
            nome: faceta.nome,
            media: Number(media.toFixed(2)),
            respostas: respostasFaceta,
          });
        }
      });

      if (facetasResultado.length > 0) {
        const somaFator = facetasResultado.reduce((acc, f) => acc + f.media, 0);
        const mediaFator = somaFator / facetasResultado.length;

        resultados.push({
          id: fator.id,
          nome: fator.nome,
          media: Number(mediaFator.toFixed(2)),
          facetas: facetasResultado,
        });
      }
    });

    return resultados;
  }

  const handleRefazer = async () => {
    if (documentId) {
      await limparRespostas(documentId as string);
      router.push(`/formulario/${documentId}`);
    }
  };

  const handleGerarPDF = async () => {
    if (!relatorioRef.current) return;

    setGerandoPDF(true);

    try {
      // Usar window.print() é mais confiável que html2canvas
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Por favor, permita pop-ups para gerar o PDF.");
        return;
      }

      const content = relatorioRef.current.cloneNode(true) as HTMLElement;

      // Remover botões
      const buttons = content.querySelectorAll("button, .print\\:hidden");
      buttons.forEach((btn) => btn.remove());

      const css = `
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #f3f4f6;
            padding: 20px;
          }
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
  };

  if (carregando) {
    return (
      <main className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300">
            Carregando resultados...
          </p>
        </div>
      </main>
    );
  }

  if (!formulario || resultados.length === 0) {
    return (
      <main className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-6">
      <div className="max-w-4xl mx-auto" ref={relatorioRef}>
        {/* Cabeçalho */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Resultados: {formulario.Nome}
          </h1>
          {formulario.descricao && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {formulario.descricao}
            </p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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

        {/* Gráfico Radar dos Fatores */}
        {resultados.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
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
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fill: "#6b7280" }}
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

        {/* Resumo das Médias */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Resumo das Pontuações
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultados.map((fator) => (
              <div
                key={fator.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {fator.nome}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-500">
                    {fator.media}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    / 5.0
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(fator.media / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resultados Detalhados por Fator */}
        {resultados.map((fator) => (
          <div
            key={fator.id}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 mb-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {fator.nome}
              </h2>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-lg text-gray-600 dark:text-gray-300">
                  Média geral:
                </span>
                <span className="text-2xl font-bold text-green-500">
                  {fator.media}
                </span>
              </div>
            </div>

            {/* Facetas do Fator */}
            {fator.facetas.map((faceta, facetaIndex) => (
              <div
                key={faceta.id}
                className={`mb-6 pb-6 ${
                  facetaIndex < fator.facetas.length - 1
                    ? "border-b border-gray-200 dark:border-gray-700"
                    : ""
                }`}
              >
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  {faceta.nome}
                </h3>
                <div className="mb-4 flex items-center gap-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    Média da faceta:
                  </span>
                  <span className="text-lg font-bold text-green-500">
                    {faceta.media}
                  </span>
                  <div className="flex-1 max-w-xs">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(faceta.media / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Respostas da Faceta */}
                <div className="space-y-3">
                  {faceta.respostas.map((resposta) => (
                    <div
                      key={resposta.perguntaId}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {resposta.texto}
                      </p>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Resposta:
                        </span>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                          {resposta.valor}
                        </span>
                      </div>
                      {resposta.feedback && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border-l-4 border-blue-500">
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            <strong className="text-blue-600 dark:text-blue-400">
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
