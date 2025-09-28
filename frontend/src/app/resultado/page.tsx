"use client";
import { useEffect, useState } from "react";

interface Resposta {
  perguntaId: number;
  texto: string;
  resposta: number;
  feedback: string;
}

export default function ResultadoPage() {
  const [respostas, setRespostas] = useState<Resposta[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("respostas");
    if (saved) setRespostas(JSON.parse(saved));
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Resultado</h2>

      {respostas.map((r, i) => (
        <div key={i} className="mb-6">
          <p className="font-semibold">
            Pergunta {i + 1}: {r.texto}
          </p>
          <p className="text-gray-700">Sua resposta: {r.resposta}</p>
          <div className="mt-2 p-3 bg-gray-100 rounded">
            <p className="italic text-blue-800">{r.feedback}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
