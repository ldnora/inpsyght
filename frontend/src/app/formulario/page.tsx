"use client";
import { useState, useEffect } from "react";
import { fetchPerguntas } from "@/libs/api";

type Pergunta = {
  id: number;
  texto: string;
  area: string;
  feedback_baixo: string;
  feedback_medio: string;
  feedback_alto: string;
  pontuacao_reversa?: boolean;
};

type Resposta = {
  perguntaId: number;
  pergunta: string;
  resposta: number;
  feedback: string;
  area: string;
};

export default function Formulario() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [index, setIndex] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerguntas() {
      const data = await fetchPerguntas();
      setPerguntas(data);
      setCarregando(false);
    }
    carregarPerguntas();
  }, []);

  if (carregando)
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Carregando perguntas...</p>
      </main>
    );

  if (perguntas.length === 0)
    return (
      <main className="flex h-screen items-center justify-center">
        <p>Nenhuma pergunta encontrada.</p>
      </main>
    );

  const perguntaAtual = perguntas[index];
  const progresso = ((index + 1) / perguntas.length) * 100;

  const legendaRespostas: { [key: number]: string } = {
    1: "Discordo totalmente",
    2: "Discordo",
    3: "Neutro",
    4: "Concordo",
    5: "Concordo totalmente",
  };

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

    setTimeout(async () => {
      if (index < perguntas.length - 1) {
        setIndex(index + 1);
        setSelecionada(null);
      } else {
        localStorage.setItem("respostas", JSON.stringify(novasRespostas));
        requestAnimationFrame(() => {
          window.location.href = "/resultado";
        });
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-xl">
          {/* Barra de progresso */}
          <div
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={perguntas.length}
            aria-label={`Progresso: pergunta ${index + 1} de ${
              perguntas.length
            }`}
          >
            <div
              className="bg-green-500 h-3 transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <form>
            <fieldset>
              <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">
                Pergunta {index + 1} de {perguntas.length}
              </legend>
              <p className="text-xl text-gray-700 dark:text-gray-200 mb-6">
                {perguntaAtual.texto}
              </p>

              <div
                className="grid grid-cols-5 gap-4 text-center"
                role="radiogroup"
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
                    <span className="text-xs mt-2">
                      {legendaRespostas[valor]}
                    </span>
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
