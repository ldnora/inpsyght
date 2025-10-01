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

  const legendaRespostas: { [key: number]: string } = {
    1: "Discordo totalmente",
    2: "Discordo",
    3: "Neutro",
    4: "Concordo",
    5: "Concordo totalmente",
  };

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
        localStorage.setItem("respostas", JSON.stringify(novasRespostas));
        window.location.href = "/resultado";
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-xl">
          {/* Barra de progresso acessível */}
          <div
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={perguntas.length}
            aria-label={`Progresso: pergunta ${index + 1} de ${perguntas.length}`}
          >
            <div
              className="bg-green-500 h-3 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <form>
            <fieldset>
              <legend
                className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6"
                id="pergunta-legenda"
              >
                Pergunta {index + 1} de {perguntas.length}
              </legend>
              <p className="text-xl text-gray-700 dark:text-gray-200 mb-6">
                {perguntaAtual.texto}
              </p>

              {/* Escala de 1 a 5 com legenda */}
              <div
                className="grid grid-cols-5 gap-4 text-center"
                role="radiogroup"
                aria-labelledby="pergunta-legenda"
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
                      aria-label={`${valor} - ${legendaRespostas[valor]}`}
                    />
                    <span className="text-lg">{valor}</span>
                    <span className="text-xs mt-2">{legendaRespostas[valor]}</span>
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
