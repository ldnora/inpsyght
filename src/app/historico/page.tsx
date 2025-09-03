export default function HistoricoPage() {
  const testes = [
    { data: "01/08/2023", id: 1 },
    { data: "14/07/2023", id: 2 },
    { data: "02/06/2023", id: 3 },
  ];

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Histórico</h2>
      <div className="flex flex-col space-y-3">
        {testes.map((teste) => (
          <a
            key={teste.id}
            href={`/resultado?id=${teste.id}`}
            className="px-4 py-2 border rounded hover:bg-gray-100 flex justify-between"
          >
            <span>{teste.data}</span>
            <span>→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
