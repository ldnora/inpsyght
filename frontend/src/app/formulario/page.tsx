"use client";
import { useState } from "react";

type Pergunta = {
  id: number;
  texto: string;
  area: string;
  feedback_baixo: string;
  feedback_medio: string;
  feedback_alto: string;
};

type Resposta = {
  perguntaId: number;
  pergunta: string;
  resposta: number;
  feedback: string;
  area: string;
};

export default function Formulario() {
  const [index, setIndex] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [selecionada, setSelecionada] = useState<number | null>(null);

  const perguntas: Pergunta[] = [
    {
      id: 1,
      texto: "Gosto de estar rodeado de pessoas.",
      area: "Extroversão",
      feedback_baixo: "Você tende a ser mais reservado.",
      feedback_medio: "Você é equilibrado entre momentos sociais e pessoais.",
      feedback_alto: "Você é muito sociável e comunicativo.",
    },
    {
      id: 2,
      texto: "Costumo planejar minhas atividades com antecedência.",
      area: "Conscienciosidade",
      feedback_baixo: "Pode ter dificuldade em organização.",
      feedback_medio: "Você mantém algum equilíbrio entre flexibilidade e organização.",
      feedback_alto: "Você é altamente organizado e disciplinado.",
    },
    {
      id: 3,
      texto: "Tenho facilidade em me adaptar a novas ideias.",
      area: "Abertura à Experiência",
      feedback_baixo: "Prefere seguir rotinas e tradições.",
      feedback_medio: "Equilibra novidades com estabilidade.",
      feedback_alto: "Gosta muito de novidades e criatividade.",
    },
  ];

  const perguntaAtual = perguntas[index];
  const progresso = ((index + 1) / perguntas.length) * 100;

  const handleResposta = (resposta: number) => {
    setSelecionada(resposta);

    let feedback = "";
    if (resposta <= 2) feedback = perguntaAtual.feedback_baixo;
    else if (resposta === 3) feedback = perguntaAtual.feedback_medio;
    else feedback = perguntaAtual.feedback_alto;

    const novaResposta: Resposta = {
      perguntaId: perguntaAtual.id,
      pergunta: perguntaAtual.texto,
      resposta,
      feedback,
      area: perguntaAtual.area,
    };

    const novasRespostas = [...respostas, novaResposta];
    setRespostas(novasRespostas);

    setTimeout(() => {
      if (index < perguntas.length - 1) {
        setIndex(index + 1);
        setSelecionada(null);
      } else {
        // Salva no localStorage
        localStorage.setItem("respostas", JSON.stringify(novasRespostas));
        window.location.href = "/resultado";
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Conteúdo */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-xl">
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
            <div
              className="bg-green-500 h-3 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            ></div>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Pergunta {index + 1} de {perguntas.length}
          </h2>
          <p className="text-gray-700 text-center text-xl font-medium mb-10">
            {perguntaAtual.texto}
          </p>

          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((valor) => (
              <button
                key={valor}
                onClick={() => handleResposta(valor)}
                className={`py-3 rounded-lg font-semibold transition border 
                  ${
                    selecionada === valor
                      ? "bg-green-500 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
              >
                {valor}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
