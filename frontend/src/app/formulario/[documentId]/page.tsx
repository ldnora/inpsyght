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
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const relatorioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function carregar() {
      if (!documentId) return;

      try {
        // Carregar formulário e respostas
        const formData: FormularioResponse = await getFormularioCompleto(
          documentId as string
        );
        const cache = await carregarRespostas(documentId as string);

        if (cache.respostas.length === 0) {
          router.push(`/formulario/${documentId}`);
          return;
        }

        setFormulario(formData.data);
        setRespostas(cache.respostas);

        // Calcular resultados
        const resultadosCalculados = calcularResultados(
          formData.data,
          cache.respostas
        );
        setResultados(resultadosCalculados);
      } catch (err) {
        console.error("Erro ao carregar resultados:", err);
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
      // Importar as bibliotecas dinamicamente
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const elemento = relatorioRef.current;

      // Configurações para melhor qualidade
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f3f4f6",
      });

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

      // Calcular quantas páginas são necessárias
      const totalPages = Math.ceil((imgHeight * ratio) / pdfHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const sourceY = (i * pdfHeight) / ratio;
        const sourceHeight = Math.min(imgHeight - sourceY, pdfHeight / ratio);

        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY - i * pdfHeight,
          imgWidth * ratio,
          imgHeight * ratio
        );
      }

      // Nome do arquivo
      const nomeArquivo = `Resultado_${formulario?.Nome || "Formulario"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(nomeArquivo);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGerandoPDF(false);
    }
  };

  if (carregando) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Carregando resultados...</p>
      </main>
    );
  }

  if (!formulario) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Formulário não encontrado.</p>
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
            <p className="text-gray-600 dark:text-gray-300">
              {formulario.descricao}
            </p>
          )}
          <div className="mt-4 flex gap-4 print:hidden">
            <button
              onClick={handleGerarPDF}
              disabled={gerandoPDF}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-lg transition"
            >
              {gerandoPDF ? "Gerando PDF..." : "Baixar PDF"}
            </button>
            <button
              onClick={handleRefazer}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
            >
              Refazer Formulário
            </button>
          </div>
        </div>

        {/* Gráfico Radar dos Fatores */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Visão Geral dos Fatores
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart
              data={resultados.map((f) => ({ nome: f.nome, media: f.media }))}
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
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Resultados por Fator */}
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
            {fator.facetas.map((faceta) => (
              <div
                key={faceta.id}
                className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  {faceta.nome}
                </h3>
                <div className="mb-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    Média da faceta:
                  </span>
                  <span className="ml-2 text-lg font-bold text-green-500">
                    {faceta.media}
                  </span>
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
