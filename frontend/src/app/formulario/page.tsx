"use client";
import { useState } from "react";

const perguntas = [
  "Alguma vez eu me vejo a uma festa sozinho",
  "Eu gosto de experimentar coisas novas",
  "Tenho facilidade em organizar minhas tarefas",
];

const opcoes = [
  "Discordo totalmente",
  "Discordo parcialmente",
  "Neutro",
  "Concordo parcialmente",
  "Concordo totalmente",
];

export default function FormularioPage() {
  const [index, setIndex] = useState(0);

  const proxima = () => {
    if (index < perguntas.length - 1) setIndex(index + 1);
    else window.location.href = "/resultado";
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">
        Pergunta {index + 1} de {perguntas.length}
      </h2>
      <p className="mb-6">{perguntas[index]}</p>

      <div className="flex flex-col space-y-3">
        {opcoes.map((opcao, i) => (
          <button
            key={i}
            className="px-4 py-2 border rounded hover:bg-gray-100"
            onClick={proxima}
          >
            {opcao}
          </button>
        ))}
      </div>
    </div>
  );
}
