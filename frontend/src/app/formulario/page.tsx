"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getFormularios } from "@/libs/api";

type Formulario = {
  id: number;
  documentId: string;
  Nome: string;
  descricao?: string;
};

export default function FormularioPage() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getFormularios();
        setFormularios(response.data);
      } catch (error) {
        console.error("Erro ao buscar formulários:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

  }, []);

  return (
    <main className="flex flex-col items-center justify-center flex-1 py-20 px-6">
      {/* Título principal da página */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Selecione um Formulário
      </h1>

      {/* Texto explicativo */}
      <p className="text-gray-700 text-center max-w-2xl mb-8 leading-relaxed">
        Escolha abaixo qual formulário deseja responder. Cada formulário contém
        perguntas sobre os cinco grandes fatores da personalidade, suas facetas
        e características. O formulário foi criado com o objetivo de ser uma
        ferramenta de autoconhecimento para os alunos dos diversos centros da
        UFSM.
      </p>

      {loading ? (
        <p className="text-gray-600">Carregando formulários...</p>
      ) : formularios.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {formularios.map((form) => (
            <li key={form.documentId}>
              <Link
                href={`/formulario/${form.documentId}`}
                className="block bg-blue-900 hover:bg-blue-800 text-white text-center px-6 py-4 
                           rounded-lg shadow-md transition transform hover:-translate-y-1"
              >
                {form.Nome}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">Nenhum formulário encontrado.</p>
      )}

      <nav aria-label="Ações principais" className="flex space-x-6 mt-10">
        <Link
          href="/"
          className="bg-gray-200 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none
                     text-gray-900 px-6 py-3 rounded-lg shadow-md transition font-medium"
        >
          Voltar para Início
        </Link>
      </nav>
    </main>
  );
}
