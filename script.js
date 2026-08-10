/*
  Ruang Sidang Kerajaan — UI prototype
  Belum terhubung ke backend/API apapun.
  Fungsi di bawah ini cuma mensimulasikan alur (status berubah, pesan muncul)
  supaya interaksi & animasi bisa dites dulu sebelum Edge Function dipasang.
*/

const MINISTERS = ['gemini', 'claude', 'gpt'];

const PLACEHOLDER_REPLIES = {
  gemini: [
    'Menarik. Coba lihat dari sudut yang belum umum: bagaimana kalau dibalik dulu asumsinya?',
    'Ini bisa dikembangkan ke arah yang belum banyak dicoba orang lain.'
  ],
  claude: [
    'Sebelum dilanjutkan, perlu dicek dulu: siapa yang benar-benar butuh ini, dan apa risikonya kalau meleset?',
    'Secara realistis ini bisa jalan, tapi ada beberapa asumsi yang perlu diuji dulu.'
  ],
  gpt: [
    'Langkah pertama yang konkret: tentukan scope minimal, lalu jalan dalam 3 tahap.',
    'Saya susun jadi rencana kerja singkat, siap dieksekusi minggu ini.'
  ]
};

function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

function setStatus(minister, state, label){
  const el = document.getElementById(`status-${minister}`);
  el.textContent = label;
  el.dataset.state = state;
}

function seatEl(minister){ return document.getElementById(`seat-${minister}`); }

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

function sendTitah(){
  const input = document.getElementById('prompt-input');
  const pesan = input.value.trim();
  if(!pesan) return;

  MINISTERS.forEach((m, i) => {
    appendMessage(m, kingLine(pesan), true);
    setStatus(m, 'thinking', 'Menimbang...');
    seatEl(m).classList.add('thinking');

    // simulasi jeda jawab, nanti diganti pemanggilan Edge Function asli
    setTimeout(() => {
      seatEl(m).classList.remove('thinking');
      seatEl(m).classList.add('replied');
      setStatus(m, 'replied', 'Telah Menjawab');
      appendMessage(m, pick(PLACEHOLDER_REPLIES[m]), false);
    }, 900 + i * 500);
  });

  input.value = '';
}

function triggerDebate(){
  const threads = ['thread-gc', 'thread-cp', 'thread-gp'];
  threads.forEach(id => document.getElementById(id).classList.add('active'));

  MINISTERS.forEach(m => {
    setStatus(m, 'thinking', 'Menyanggah...');
    seatEl(m).classList.add('thinking');
  });

  setTimeout(() => {
    appendMessage('gemini', 'Menanggapi menteri lain: gagasan itu bagus, tapi saya usulkan versi yang lebih berani.', false);
    appendMessage('claude', 'Menanggapi Gemini: versi yang lebih berani itu perlu batas yang jelas dulu, atau risikonya melebar.', false);
    appendMessage('gpt', 'Menanggapi keduanya: saya ambil jalan tengah, susun jadi dua tahap — versi aman dulu, lalu versi berani.', false);

    MINISTERS.forEach(m => {
      seatEl(m).classList.remove('thinking');
      seatEl(m).classList.add('replied');
      setStatus(m, 'replied', 'Telah Menjawab');
    });
    threads.forEach(id => document.getElementById(id).classList.remove('active'));
  }, 1400);
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
