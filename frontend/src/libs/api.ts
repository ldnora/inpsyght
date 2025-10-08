export async function fetchPerguntas() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${baseUrl}/api/perguntas`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error(`Erro ao buscar perguntas: ${res.statusText}`);

    const json = await res.json();
    return json.data.map((item: any) => ({
      id: item.id,
      texto: item.texto,
      area: item.area ?? "Sem área definida",
      feedback_baixo: Array.isArray(item.feedback_baixo)
        ? item.feedback_baixo
            .map((b: any) => b.children?.map((c: any) => c.text).join(" "))
            .join(" ")
        : item.feedback_baixo ?? "",
      feedback_medio: item.feedback_medio ?? "",
      feedback_alto: item.feedback_alto ?? "",
      pontuacao_reversa: item.pontuacao_reversa ?? false,
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}
