"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="w-full bg-blue-900 text-white shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        {/* Marca do sistema */}
        <h1 className="text-lg font-bold">
          <Link href="/" aria-label="Página inicial do Sistema Big Five – UFSM">
            Sistema Big Five – UFSM
          </Link>
        </h1>

        {/* Navegação principal */}
        <nav aria-label="Menu principal">
          <ul className="flex space-x-6">
            <li>
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-400 px-2 py-1 rounded 
                  ${pathname === "/" ? "font-semibold underline" : ""}`}
              >
                Início
              </Link>
            </li>
            <li>
              <Link
                href="/formulario"
                aria-current={pathname === "/formulario" ? "page" : undefined}
                className={`hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-400 px-2 py-1 rounded 
                  ${
                    pathname === "/formulario" ? "font-semibold underline" : ""
                  }`}
              >
                Questionário
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
