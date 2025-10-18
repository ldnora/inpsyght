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
          console.log("Nenhuma resposta encontrada, redirecionando para o formulário...");
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
        console.log("Resultados calculados:", resultadosCalculados.length, "fatores");
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
        const somaFator = facetasResultado.reduce(
          (acc, f) => acc + f.media,
          0
        );
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
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Esconder os botões temporariamente
      const botoesContainer = relatorioRef.current.querySelector('.print\\:hidden');
      if (botoesContainer) {
        (botoesContainer as HTMLElement).style.display = 'none';
      }

      // Aguardar um pouco para garantir que o DOM está pronto
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(relatorioRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f3f4f6",
        ignoreElements: (element) => {
          // Ignorar elementos com classes que causam problemas
          return element.classList.contains('print:hidden') || 
                 element.tagName === 'BUTTON';
        },
        onclone: (clonedDoc) => {
          // Forçar cores RGB em vez de oklch
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color-scheme: light !important;
            }
            .dark\\:bg-gray-800 { background-color: #1f2937 !important; }
            .dark\\:bg-gray-900 { background-color: #111827 !important; }
            .dark\\:bg-gray-700 { background-color: #374151 !important; }
            .dark\\:text-gray-100 { color: #f3f4f6 !important; }
            .dark\\:text-gray-200 { color: #e5e7eb !important; }
            .dark\\:text-gray-300 { color: #d1d5db !important; }
            .dark\\:border-gray-700 { border-color: #374151 !important; }
            .bg-green-500 { background-color: #10b981 !important; }
            .text-green-500 { color: #10b981 !important; }
            .bg-blue-50 { background-color: #eff6ff !important; }
            .border-blue-500 { border-color: #3b82f6 !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Restaurar os botões
      if (botoesContainer) {
        (botoesContainer as HTMLElement).style.display = '';
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      const totalPages = Math.ceil((imgHeight * ratio) / pdfHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY - (i * pdfHeight),
          imgWidth * ratio,
          imgHeight * ratio
        );
      }

      const nomeArquivo = `Resultado_${formulario?.Nome.replace(/\s+/g, '_') || "Formulario"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(nomeArquivo);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Por favor, tente novamente ou use a função de impressão do navegador (Ctrl+P).");
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
      {/* Estilos inline para garantir compatibilidade com html2canvas */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print, (prefers-color-scheme: light) {
            .pdf-safe-bg-white { background-color: #ffffff !important; }
            .pdf-safe-bg-gray-50 { background-color: #f9fafb !important; }
            .pdf-safe-bg-gray-100 { background-color: #f3f4f6 !important; }
            .pdf-safe-bg-blue-50 { background-color: #eff6ff !important; }
            .pdf-safe-bg-green-500 { background-color: #10b981 !important; }
            .pdf-safe-text-gray-800 { color: #1f2937 !important; }
            .pdf-safe-text-gray-700 { color: #374151 !important; }
            .pdf-safe-text-gray-600 { color: #4b5563 !important; }
            .pdf-safe-text-gray-500 { color: #6b7280 !important; }
            .pdf-safe-text-green-500 { color: #10b981 !important; }
            .pdf-safe-border-gray-200 { border-color: #e5e7eb !important; }
            .pdf-safe-border-blue-500 { border-color: #3b82f6 !important; }
          }
        `
      }} />
      <div className="max-w-4xl mx-auto" ref={relatorioRef} data-pdf-content>
        {/* Cabeçalho */}
        <div className="pdf-safe-bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 mb-6">
          <h1 className="text-3xl font-bold pdf-safe-text-gray-800 dark:text-gray-100 mb-2">
            Resultados: {formulario.Nome}
          </h1>
          {formulario.descricao && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {formulario.descricao}
            </p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Relatório gerado em: {new Date().toLocaleDateString("pt-BR", {
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