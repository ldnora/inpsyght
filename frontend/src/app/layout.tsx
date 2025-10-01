import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const metadata = {
  title: "Sistema Big Five – UFSM",
  description: "Questionário de personalidade baseado no modelo Big Five",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Cabeçalho */}
        <Header />

        {/* Conteúdo da página */}
        <main id="conteudo" className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>

        {/* Rodapé */}
        <Footer />
      </body>
    </html>
  );
}
