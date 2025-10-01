import "./globals.css";

export const metadata = {
  title: "Sistema Big Five – UFSM",
  description: "Aplicação de testes de personalidade Big Five",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="w-full bg-blue-900 py-6 shadow-md">
          <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Sistema Big Five – UFSM</h1>
            <img src="/logo-ufsm.png" alt="UFSM" className="h-12 w-auto" />
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="w-full bg-blue-900 py-4 mt-10">
          <div className="max-w-4xl mx-auto px-6 text-center text-white text-sm">
            © {new Date().getFullYear()} Universidade Federal de Santa Maria – Todos os direitos reservados.
          </div>
        </footer>
      </body>
    </html>
  );
}
