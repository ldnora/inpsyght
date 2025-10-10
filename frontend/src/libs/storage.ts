import localforage from "localforage";

localforage.config({
  name: "BigFiveApp",
  storeName: "formularios_cache",
});

export type Resposta = {
  perguntaId: string;
  texto: string;
  valor: number;
  feedback: string;
  facetId?: string;
  factorId?: string;
};

type CacheRespostas = {
  respostas: Resposta[];
};

export async function salvarResposta(formId: string, resposta: Resposta) {
  const key = `formulario_respostas_${formId}`;
  const data: CacheRespostas = (await localforage.getItem(key)) || {
    respostas: [],
  };

  const index = data.respostas.findIndex(
    (r) => r.perguntaId === resposta.perguntaId
  );
  if (index >= 0) data.respostas[index] = resposta;
  else data.respostas.push(resposta);

  await localforage.setItem(key, data);
}

export async function carregarRespostas(
  formId: string
): Promise<CacheRespostas> {
  const key = `formulario_respostas_${formId}`;
  const data: CacheRespostas = (await localforage.getItem(key)) || {
    respostas: [],
  };
  return data;
}

export async function limparRespostas(formId: string) {
  await localforage.removeItem(`formulario_respostas_${formId}`);
}
