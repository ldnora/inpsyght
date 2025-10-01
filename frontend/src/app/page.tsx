"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Bem-vindo ao Sistema Big Five – UFSM
      </h2>
      <p className="text-gray-600 text-center max-w-2xl mb-8">
        Responda ao questionário baseado no modelo dos Cinco Grandes Fatores da
        Personalidade (Big Five) e descubra mais sobre seus traços de
        personalidade.
      </p>
      <div className="flex space-x-6">
        <Link
          href="/formulario"
          className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg shadow-md transition"
        >
          Iniciar Questionário
        </Link>
        <Link
          href="/historico"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg shadow-md transition"
        >
          Ver Histórico
        </Link>
      </div>
    </div>
  );
}
