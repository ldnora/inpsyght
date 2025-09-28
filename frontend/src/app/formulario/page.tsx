"use client";

import { useEffect, useState } from "react";

type Pergunta = {
  id: number;
  texto: string;
  feedback_baixo: string;
  feedback_medio: string;
  feedback_alto: string;
};

const opcoes = [
  "Discordo totalmente", // 1
  "Discordo parcialmente", // 2
  "Neutro", // 3
  "Concordo parcialmente", // 4
  "Concordo totalmente", // 5
];

export default function FormularioPage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [index, setIndex] = useState(0);
  const [respostas, setRespostas] = useState<
    { perguntaId: number; resposta: number; feedback: string }[]
  >([]);

  useEffect(() => {
    const fetchPerguntas = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/perguntas`
        );
        const data = await res.json();

        setPerguntas(
          data.data.map((item: any) => ({
            id: item.id,
            texto: item.attributes.texto,
            feedback_baixo: item.attributes.feedback_baixo,
            feedback_medio: item.attributes.feedback_medio,
            feedback_alto: item.attributes.feedback_alto,
          }))
        );
      } catch (error) {
        console.error("Erro ao buscar perguntas:", error);
      }
    };

    fetchPerguntas();
  }, []);

  const handleResposta = (resposta: number) => {
    const perguntaAtual = perguntas[index];
    let feedback = "";

    if (resposta <= 2) {
      feedback = perguntaAtual.feedback_baixo;
    } else if (resposta === 3) {
      feedback = perguntaAtual.feedback_medio;
    } else {
      feedback = perguntaAtual.feedback_alto;
    }

    setRespostas([
      ...respostas,
      { perguntaId: perguntaAtual.id, resposta, feedback },
    ]);

    if (index < perguntas.length - 1) {
      setIndex(index + 1);
    } else {
      // Redireciona para a página de resultado
      localStorage.setItem("respostas", JSON.stringify(respostas));
      window.location.href = "/resultado";
    }
  };

  if (perguntas.length === 0) {
    return <p className="text-center mt-10">Carregando perguntas...</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">
        Pergunta {index + 1} de {perguntas.length}
      </h2>
      <p className="mb-6">{perguntas[index].texto}</p>

      <div className="flex flex-col space-y-3">
        {opcoes.map((opcao, i) => (
          <button
            key={i}
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={() => handleResposta(i + 1)} // resposta vai de 1 a 5
          >
            {opcao}
          </button>
        ))}
      </div>
    </div>
  );
}
