import Link from "next/link";
import ResultadoChart from "@/components/ResultadoChart";

export default function ResultadoPage() {
  // Mock dos resultados (0–100)
  const scores = [70, 85, 60, 75, 40];

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow text-center">
      <h2 className="text-xl font-bold mb-6">Seu Perfil de Personalidade</h2>
      
      <div className="mb-6">
        <ResultadoChart scores={scores} />
      </div>

      <div className="flex justify-around">
        <button className="px-4 py-2 border rounded hover:bg-gray-100">
          Exportar relatório
        </button>
        <Link href="/" className="px-4 py-2 border rounded hover:bg-gray-100">
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
