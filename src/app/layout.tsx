import "./globals.css";
import Navbar from "../components/NavBar";

export const metadata = {
  title: "Big Five UFSM",
  description: "Sistema de formulários Big Five",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>
        <Navbar />
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
