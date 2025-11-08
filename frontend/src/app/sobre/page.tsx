"use client";

export default function SobrePage() {

  return (
    <main className="flex flex-col items-center justify-center flex-1 py-20 px-6">
      {/* Título principal da página */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Sobre
      </h1>

      {/* Texto explicativo */}
      <p className="text-gray-700 text-center max-w-2xl mb-8 leading-relaxed">
        Informações sobre a CAED e o sistema Big Five - UFSM.
      </p>

    </main>
  );
}
