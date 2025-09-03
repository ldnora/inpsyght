import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Verifica se está acessando rota protegida
  const token = request.cookies.get("access-token");
  if (!token) {
    // Redireciona para login se não autenticado
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

// Define as rotas protegidas
export const config = {
  matcher: ["/administracao/:path*"],
};
