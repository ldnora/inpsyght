"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 py-20 px-6">
      {/* Título principal da página */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Bem-vindo ao Sistema Big Five – UFSM
      </h1>

      {/* Texto explicativo */}
      <p className="text-gray-700 text-center max-w-2xl mb-8 leading-relaxed">
        Responda ao questionário baseado no modelo dos 
        <strong> Cinco Grandes Fatores da Personalidade (Big Five)</strong> 
         e descubra mais sobre seus traços de personalidade.
      </p>

      {/* Ações principais */}
      <nav aria-label="Ações principais" className="flex space-x-6">
        <Link
          href="/formulario"
          className="bg-blue-900 hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none 
                     text-white px-6 py-3 rounded-lg shadow-md transition font-medium"
        >
          Iniciar Questionário
        </Link>
      </nav>
    </main>
  );
}
