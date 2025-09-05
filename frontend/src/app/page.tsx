import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center mt-20 space-y-6">
      <h1 className="text-3xl font-bold">Sistema Big Five – UFSM</h1>

      <div className="flex flex-col space-y-4 w-64">
        <Link href="/formulario" className="bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-500">
          Responder Teste Completo
        </Link>
        <Link href="/formulario?modo=area" className="bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-500">
          Responder por Área
        </Link>
        <Link href="/historico" className="bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-500">
          Histórico de Testes
        </Link>
      </div>
    </div>
  );
}
