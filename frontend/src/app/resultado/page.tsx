"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Resposta = {
  perguntaId: number;
  pergunta?: string;
  resposta: number;
  feedback: string;
  area: string;
};

export default function Resultado() {
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [resumo, setResumo] = useState<{ [area: string]: number }>({});

  useEffect(() => {
    const armazenadas = localStorage.getItem("respostas");
    if (!armazenadas) return;

    try {
      const parsed: Resposta[] = JSON.parse(armazenadas);
      setRespostas(parsed);

      const agrupado: { [area: string]: number[] } = {};
      parsed.forEach((r) => {
        const a = r.area ?? "Sem Área";
        if (!agrupado[a]) agrupado[a] = [];
        agrupado[a].push(Number(r.resposta));
      });

      const medias: { [area: string]: number } = {};
      Object.keys(agrupado).forEach((area) => {
        const soma = agrupado[area].reduce((a, b) => a + b, 0);
        const media = soma / agrupado[area].length;
        medias[area] = media;
      });

      setResumo(medias);
    } catch (err) {
      console.error("Erro ao ler respostas do localStorage:", err);
    }
  }, []);

  if (respostas.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <p
          className="text-gray-600 text-lg"
          role="status"
          aria-live="polite"
        >
          Nenhuma resposta encontrada.
        </p>
      </main>
    );
  }

  const axisLabels = [
    "Abertura",
    "Conscienciosidade",
    "Extroversão",
    "Amabilidade",
    "Neuroticismo",
  ];

  const dadosRadar = axisLabels.map((label) => {
    const chaveEncontrada = Object.keys(resumo).find(
      (k) =>
        k.toLowerCase().includes(label.toLowerCase()) ||
        label.toLowerCase().includes(k.toLowerCase())
    );
    const media = chaveEncontrada ? resumo[chaveEncontrada] : 0;
    const percentual = (media / 5) * 100;
    return { area: label, valor: Number(percentual.toFixed(2)) };
  });

  const strokeColor = "#22c55e";
  const fillColor = "#bbf7d0";

  const respostaTexto: { [key: number]: string } = {
    1: "Discordo totalmente",
    2: "Discordo",
    3: "Neutro",
    4: "Concordo",
    5: "Concordo totalmente",
  };

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-10">
      <article
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-5xl border dark:bg-gray-900 dark:text-gray-100"
        aria-labelledby="titulo-resultado"
      >
        <h2
          id="titulo-resultado"
          className="text-2xl font-bold mb-6 text-center"
        >
          Seu Perfil de Personalidade
        </h2>

        {/* Radar chart */}
        <section
          className="w-full h-96 mb-10"
          aria-label="Gráfico radar dos traços de personalidade"
        >
          <ResponsiveContainer>
            <RadarChart data={dadosRadar} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="area" />
              <PolarRadiusAxis domain={[0, 100]} tickCount={6} />
              <Radar
                name="Seus Resultados"
                dataKey="valor"
                stroke={strokeColor}
                fill={fillColor}
                fillOpacity={0.6}
              />
              <Legend
                verticalAlign="top"
                align="center"
                payload={[
                  {
                    value: "Seus Resultados",
                    type: "square",
                    color: strokeColor,
                  },
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>
          {/* Texto alternativo para leitores de tela */}
          <p className="sr-only">
            O gráfico mostra os níveis de Abertura, Conscienciosidade,
            Extroversão, Amabilidade e Neuroticismo em porcentagem.
          </p>
        </section>

        {/* Legenda intuitiva abaixo do gráfico */}
        <section
          aria-label="Legenda dos percentuais de personalidade"
          className="mt-6 mb-10"
        >
          <h3 className="text-lg font-semibold text-center mb-4">
            Interpretação dos Resultados
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {dadosRadar.map((d, idx) => {
              let nivel = "";
              if (d.valor < 40) nivel = "Baixo";
              else if (d.valor < 70) nivel = "Médio";
              else nivel = "Alto";

              return (
                <li
                  key={idx}
                  className="p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800 flex flex-col items-center"
                >
                  <span className="font-bold text-lg">{d.area}</span>
                  <span className="text-xl text-green-600 dark:text-green-400 font-semibold">
                    {d.valor}%
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300 italic">
                    {nivel}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Tabela de respostas */}
        <section aria-labelledby="titulo-respostas">
          <h3
            id="titulo-respostas"
            className="text-xl font-semibold mb-4"
          >
            Suas Respostas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <th scope="col" className="border p-3 text-left w-2/5">
                    Pergunta
                  </th>
                  <th scope="col" className="border p-3 text-center">
                    Sua Resposta
                  </th>
                  <th scope="col" className="border p-3 text-center">
                    Feedback Futuro
                  </th>
                </tr>
              </thead>
              <tbody>
                {respostas.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="border p-3">
                      {r.pergunta ?? `Pergunta ${r.perguntaId}`}
                    </td>
                    <td className="border p-3 text-center">
                      {respostaTexto[r.resposta] ?? r.resposta}
                    </td>
                    <td className="border p-3 text-center text-gray-400 italic dark:text-gray-500">
                      {r.feedback || "A ser preenchido futuramente"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Botões */}
        <nav
          className="flex justify-center gap-6 mt-8"
          aria-label="Ações de resultado"
        >
          <button
            onClick={() =>
              alert("Exportar relatório: implementar export conforme necessário.")
            }
            className="px-6 py-3 border rounded text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Exportar relatório
          </button>
          <Link
            href="/"
            className="px-6 py-3 border rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Voltar ao Início
          </Link>
        </nav>
      </article>
    </main>
  );
}
