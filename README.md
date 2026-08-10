# Ruang Sidang Kerajaan

Ruang brainstorming pribadi dengan 3 AI (Gemini, Claude, GPT) sebagai "menteri" yang bisa dilempar ide/bahan bebas konteks, saling menyanggah, dan direspons lewat suara.

## Status

🟡 **UI-only prototype.** Belum terhubung ke API/backend apapun. Respons yang muncul saat ini masih placeholder (`script.js`) untuk uji alur interaksi dan animasi.

## Struktur

```
index.html   → markup + meja bundar (SVG)
style.css    → design tokens (warna, tipografi, layout)
script.js    → interaksi UI (simulasi kirim titah & debat)
```

## Rencana selanjutnya

- [ ] Supabase Edge Function sebagai proxy API key (Gemini, OpenAI, Anthropic)
- [ ] Alur nyata: kirim titah → panggil 3 model paralel → tampilkan jawaban
- [ ] Mode debat: model saling baca jawaban satu sama lain
- [ ] Voice mode: STT input + TTS output per menteri
- [ ] Histori percakapan (belum diputuskan: local storage / Supabase table)

## Menjalankan lokal

Buka `index.html` langsung di browser, atau serve dengan static server apa saja:

```bash
npx serve .
```
