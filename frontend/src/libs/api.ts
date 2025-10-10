// src/lib/api.ts
import qs from "qs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

export async function getFormularios() {
  const query = qs.stringify(
    {
      fields: ["id_formulario", "Nome", "descricao"],
    },
    { encodeValuesOnly: true }
  );

  const res = await fetch(`${API_URL}/formularios?${query}`);
  return await res.json();
}

export async function getFormularioCompleto(id: string) {
  const query = qs.stringify(
    {
      populate: {
        fields: ["Nome", "descricao"],
        fators: {
          fields: ["nome"],
          populate: {
            facetas: {
              fields: ["nome"],
              populate: {
                perguntas: {
                  fields: [
                    "texto",
                    "feedback_baixo",
                    "feedback_medio",
                    "feedback_alto",
                    "pontuacao_reversa",
                  ],
                },
              },
            },
          },
        },
      },
    },
    { encodeValuesOnly: true }
  );


  const res = await fetch(`${API_URL}/formularios/${id}?${query}`);
  return await res.json();
}
