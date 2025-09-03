"use client";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="w-full bg-blue-600 text-white px-6 py-3 shadow-md sticky top-0 z-20">
      <div className="flex justify-between items-center">
        {/* Logo / Título */}
        <Link href="/" className="text-lg font-bold hover:underline">
          Big Five UFSM
        </Link>

        {/* Links Desktop */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" className="hover:underline">
            Início
          </Link>
          <Link href="/formulario" className="hover:underline">
            Formulário
          </Link>
          <Link href="/historico" className="hover:underline">
            Histórico
          </Link>
          <Link href="/resultado" className="hover:underline">
            Resultado
          </Link>
        </div>

        {/* Botão Menu Mobile */}
        <button
          className="md:hidden text-white"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          {isMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="flex flex-col mt-3 space-y-3 md:hidden">
          <Link href="/" onClick={closeMenu} className="hover:underline">
            Início
          </Link>
          <Link href="/formulario" onClick={closeMenu} className="hover:underline">
            Formulário
          </Link>
          <Link href="/historico" onClick={closeMenu} className="hover:underline">
            Histórico
          </Link>
          <Link href="/resultado" onClick={closeMenu} className="hover:underline">
            Resultado
          </Link>
        </div>
      )}
    </nav>
  );
}
