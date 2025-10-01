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
  pergunta?: string; // adicionei opcional para salvar a pergunta junto
  resposta: number;  // 1..5
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

      // Agrupa por área
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
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-600 text-lg">Nenhuma resposta encontrada.</p>
      </div>
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

  // mapa de resposta numérica para texto
  const respostaTexto: { [key: number]: string } = {
    1: "Discordo totalmente",
    2: "Discordo",
    3: "Neutro",
    4: "Concordo",
    5: "Concordo totalmente",
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-5xl border">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Seu Perfil de Personalidade
        </h2>

        {/* Radar chart */}
        <div className="w-full h-96 mb-10">
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
        </div>

        {/* Tabela de respostas */}
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          Suas Respostas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border p-3 text-left w-2/5">Pergunta</th>
                <th className="border p-3 text-center">Sua Resposta</th>
                <th className="border p-3 text-center">Feedback Futuro</th>
              </tr>
            </thead>
            <tbody>
              {respostas.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border p-3">
                    {r.pergunta ?? `Pergunta ${r.perguntaId}`}
                  </td>
                  <td className="border p-3 text-center">
                    {respostaTexto[r.resposta] ?? r.resposta}
                  </td>
                  <td className="border p-3 text-center text-gray-400 italic">
                    {r.feedback || "A ser preenchido futuramente"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botões */}
        <div className="flex justify-center gap-6 mt-8">
          <button
            onClick={() => {
              alert("Exportar relatório: implementar export conforme necessário.");
            }}
            className="px-6 py-3 border rounded text-gray-800 hover:bg-gray-100"
          >
            Exportar relatório
          </button>
         <Link
            href="/"
            className="px-6 py-3 border rounded bg-white text-gray-800 hover:bg-gray-50"
          >
            Voltar ao Início
          </Link>

        </div>
      </div>
    </div>
  );
}
