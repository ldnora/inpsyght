"use client";

import { useEffect, useState } from "react";

type Resposta = {
  perguntaId: number;
  resposta: number;
  feedback: string;
  area?: string;
};

type Registro = {
  data: string;
  modo: "completo" | "area";
  area?: string;
  respostas: Resposta[];
};

const opcoes = [
  "Discordo totalmente", // 1
  "Discordo parcialmente", // 2
  "Neutro", // 3
  "Concordo parcialmente", // 4
  "Concordo totalmente", // 5
];

export default function HistoricoPage() {
  const [historico, setHistorico] = useState<Registro[]>([]);

  useEffect(() => {
    const armazenado = localStorage.getItem("historico");
    if (armazenado) {
      setHistorico(JSON.parse(armazenado));
    }
  }, []);

  if (historico.length === 0) {
    return (
      <p className="text-center mt-10 text-gray-600">
        Nenhum teste encontrado no histórico.
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Histórico de Testes
      </h1>

      <div className="space-y-6">
        {historico.map((registro, idx) => (
          <div
            key={idx}
            className="p-4 border rounded-lg shadow-sm bg-gray-50"
          >
            <h2 className="font-semibold text-lg mb-2">
              Teste realizado em {registro.data}
            </h2>
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Modo:</span>{" "}
              {registro.modo === "completo"
                ? "Teste Completo"
                : `Por Área (${registro.area})`}
            </p>

            <p className="text-gray-700 mb-3">
              <span className="font-medium">Total de Perguntas:</span>{" "}
              {registro.respostas.length}
            </p>

            <details className="cursor-pointer">
              <summary className="text-blue-600 hover:underline">
                Ver Respostas
              </summary>
              <div className="mt-3 space-y-2">
                {registro.respostas.map((r, i) => (
                  <div
                    key={i}
                    className="p-2 border rounded bg-white shadow-sm"
                  >
                    <p className="text-gray-700">
                      <span className="font-medium">Resposta:</span>{" "}
                      {opcoes[r.resposta - 1]}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-medium">Feedback:</span>{" "}
                      {r.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
