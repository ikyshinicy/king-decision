/*
  Ruang Sidang Kerajaan — terhubung ke Edge Function mahkamah-ai
  Isi SUPABASE_URL dan SUPABASE_ANON_KEY di bawah sebelum dipakai.
*/

const SUPABASE_URL = "https://cavouyzyasnuygkuwizy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhdm91eXp5YXNudXlna3V3aXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjQzMDIsImV4cCI6MjA5NDQ0MDMwMn0.P9TepO4RLhxHv03ybUlwGMefCwkdjCnDwNpfqzAS2lo";
const ENDPOINT = `${SUPABASE_URL}/functions/v1/mahkamah-ai`;

const MINISTERS = ['gemini', 'claude', 'gpt'];
let history = []; // { role: 'king'|'gemini'|'claude'|'gpt', text: string }

function setStatus(minister, state, label){
  const el = document.getElementById(`status-${minister}`);
  el.textContent = label;
  el.dataset.state = state;
}

function seatEl(minister){ return document.getElementById(`stage-${minister}`); }

function appendMessage(minister, html, isKing){
  const box = document.getElementById(`chat-${minister}`);
  const div = document.createElement('div');
  div.className = isKing ? 'msg msg-king' : 'msg msg-minister';
  div.innerHTML = html;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function kingLine(text){
  return `<span class="tag">Titah Raja</span>${text}`;
}

async function callDewan(prompt, extraInstruction){
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ prompt, history, extraInstruction }),
  });
  if(!res.ok) throw new Error(`Gagal memanggil dewan: ${res.status}`);
  return res.json(); // { gemini, claude, gpt }
}

async function kirimKeDewan(prompt, extraInstruction){
  MINISTERS.forEach(m => {
    setStatus(m, 'thinking', 'Menimbang...');
    seatEl(m).classList.add('thinking');
  });

  try{
    const jawaban = await callDewan(prompt, extraInstruction);

    MINISTERS.forEach(m => {
      seatEl(m).classList.remove('thinking');
      seatEl(m).classList.add('replied');
      setStatus(m, 'replied', 'Telah Menjawab');
      appendMessage(m, jawaban[m], false);
      history.push({ role: m, text: jawaban[m] });
    });
  }catch(err){
    MINISTERS.forEach(m => {
      seatEl(m).classList.remove('thinking');
      setStatus(m, 'error', 'Gagal');
    });
    console.error(err);
  }
}

function sendTitah(){
  const input = document.getElementById('prompt-input');
  const pesan = input.value.trim();
  if(!pesan) return;

  history.push({ role: 'king', text: pesan });
  MINISTERS.forEach(m => appendMessage(m, kingLine(pesan), true));

  kirimKeDewan(pesan);
  input.value = '';
}

function triggerDebate(){
  const lastKing = [...history].reverse().find(h => h.role === 'king');
  const prompt = lastKing ? lastKing.text : 'Lanjutkan diskusi.';

  kirimKeDewan(prompt, 'Tanggapi langsung pandangan menteri lain yang berbeda denganmu.');
}

function toggleVoice(){
  const btn = document.getElementById('voice-btn');
  const active = btn.dataset.active === 'true';
  btn.dataset.active = String(!active);
  btn.textContent = !active ? 'Mode Suara: Aktif' : 'Mode Suara: Nonaktif';
}

document.getElementById('send-btn').addEventListener('click', sendTitah);
document.getElementById('debate-btn').addEventListener('click', triggerDebate);
document.getElementById('voice-btn').addEventListener('click', toggleVoice);
document.getElementById('prompt-input').addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendTitah();
  }
});
