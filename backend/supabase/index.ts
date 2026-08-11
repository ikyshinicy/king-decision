// Edge Function: mahkamah-ai
// Manggil 3 model (Gemini, Claude, GPT) via Replicate, paralel, satu history bersama.

const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY")!;

const MODELS = {
  gemini: "google/gemini-2.5-flash",
  claude: "anthropic/claude-4.5-sonnet",
  gpt: "openai/gpt-5-mini",
};

const ROLES: Record<string, string> = {
  gemini: "Kamu Menteri Inovasi. Beri sudut pandang baru, jangan cuma mengulang yang sudah dibahas.",
  claude: "Kamu Menteri Realitas. Uji kelayakan dan risiko dari ide yang muncul.",
  gpt: "Kamu Menteri Eksekusi. Beri langkah konkret dan taktis.",
};

type HistoryItem = { role: string; text: string };

function buildPrompt(minister: string, history: HistoryItem[], extraInstruction?: string) {
  const transcript = history.map((h) => `${h.role}: ${h.text}`).join("\n");
  return [
    ROLES[minister],
    "Balas singkat (maksimal 4-5 kalimat), natural, boleh menanggapi menteri lain kalau relevan.",
    extraInstruction ?? "",
    "\n--- Transkrip sejauh ini ---",
    transcript,
  ].join("\n");
}

async function callReplicate(model: string, prompt: string): Promise<string> {
  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({ input: { prompt } }),
  });

  if (!res.ok) {
    throw new Error(`Replicate error (${model}): ${res.status} ${await res.text()}`);
  }

  const data = await res.json();

  // Kalau "Prefer: wait" belum selesai dalam batas waktu, fallback polling manual.
  if (data.status === "succeeded") {
    return Array.isArray(data.output) ? data.output.join("") : String(data.output);
  }

  return await pollUntilDone(data.urls.get);
}

async function pollUntilDone(url: string, timeoutMs = 30000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` },
    });
    const data = await res.json();
    if (data.status === "succeeded") {
      return Array.isArray(data.output) ? data.output.join("") : String(data.output);
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Prediction ${data.status}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error("Timeout menunggu jawaban model");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { prompt, history = [], extraInstruction }: {
      prompt: string;
      history: HistoryItem[];
      extraInstruction?: string;
    } = await req.json();

    const fullHistory: HistoryItem[] = [...history, { role: "king", text: prompt }];

    const ministers = Object.keys(MODELS) as (keyof typeof MODELS)[];

    const results = await Promise.allSettled(
      ministers.map((m) =>
        callReplicate(MODELS[m], buildPrompt(m, fullHistory, extraInstruction))
      )
    );

    const output: Record<string, string> = {};
    ministers.forEach((m, i) => {
      const r = results[i];
      output[m] = r.status === "fulfilled" ? r.value : `(gagal menjawab: ${r.reason})`;
    });

    return new Response(JSON.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
