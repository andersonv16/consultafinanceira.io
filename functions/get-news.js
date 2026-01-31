export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  
  // Pegamos os parâmetros enviados pelo seu frontend
  const query = searchParams.get('q') || 'finanças Brasil';
  const from = searchParams.get('from') || '';
  const pageSize = searchParams.get('pageSize') || '2';
  const API_KEY = "8f7311707a2845838bde6554318672b7";

  const url = `https://newsapi.org/v2/everything?q=${query}&language=pt&from=${from}&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${API_KEY}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "CloudflareWorker" }
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}