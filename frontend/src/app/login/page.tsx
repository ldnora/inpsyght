"use client";
import { login } from '@/actions/auth.action';
import { useActionState, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setStatusMessage(message);
    }
  }, [searchParams]);

  useEffect(() => {
    if (state?.success) {
      router.push('/administracao');
    }
  }, [state, router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 py-6 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-6">Login de administrador</h1>
        
        {/* Simple success message */}
        {statusMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-center text-sm">
            {statusMessage}
          </div>
        )}
        <form action={formAction} className="bg-white p-6 sm:p-8 rounded shadow-md w-full">
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 font-semibold text-sm sm:text-base">E-mail</label>
            <input type="email" name="email" id="email" placeholder="E-mail" required className="w-full px-3 py-2 border rounded text-sm sm:text-base" />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block mb-1 font-semibold text-sm sm:text-base">Senha</label>
            <input type="password" name="password" id="password" placeholder="Senha" required className="w-full px-3 py-2 border rounded text-sm sm:text-base" />
          </div>
          <button type="submit" disabled={pending} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition text-sm sm:text-base">
            {pending ? "Entrando..." : "Entrar"}
          </button>
          {!state?.success && state?.error && <p className="mt-4 text-red-600 text-center text-sm">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}