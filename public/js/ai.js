// CASPER AI Chat Logic

const messagesDiv = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');

// Special triggers
const specialAnswers = [
  { q: ["who are you", "what is your name", "your name"], a: "I am CASPER AI, your personal assistant." },
  { q: ["who is your developer", "who made you", "your creator"], a: "I was created by CASPER TECH KENYA." }
];

// Main API and backups
const API_MAIN = "https://apis.davidcyriltech.my.id/ai/chatbot?query=";
const API_BACKUPS = [
  "https://apis.davidcyriltech.my.id/ai/deepseek-r1?text=",
  "https://apis.davidcyriltech.my.id/ai/metaai?text=",
  "https://apis.davidcyriltech.my.id/ai/gpt3?text=",
  "https://apis.davidcyriltech.my.id/ai/gpt4omini?text=",
  "https://apis.davidcyriltech.my.id/ai/gpt4?text=",
];

function appendMessage(content, sender = 'ai') {
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerText = content;
  div.appendChild(bubble);
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Checks if msg matches a "special" question
function getSpecialAnswer(msg) {
  const lower = msg.trim().toLowerCase();
  for(const entry of specialAnswers) {
    if (entry.q.some(q => lower === q)) return entry.a;
  }
  return null;
}

// Main chat handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userMsg = input.value.trim();
  if (!userMsg) return;
  appendMessage(userMsg, 'user');
  input.value = '';
  // Check for special question
  const special = getSpecialAnswer(userMsg);
  if (special) return setTimeout(() => appendMessage(special, 'ai'), 400);

  // Try main API first
  let aiResponse = await fetchAI(userMsg, API_MAIN, "result");
  if (!aiResponse) {
    // Fallback to backup APIs
    for (let url of API_BACKUPS) {
      aiResponse = await fetchAI(userMsg, url, "result");
      if (aiResponse) break;
    }
    if (!aiResponse) aiResponse = "Sorry, no response from CASPER AI at this time.";
  }
  appendMessage(aiResponse, 'ai');
});

async function fetchAI(userMsg, url, field) {
  try {
    const res = await fetch(url + encodeURIComponent(userMsg));
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data === "object" && data.success && data[field]) {
      return data[field];
    }
    if (data[field]) return data[field]; // For backup APIs
    // Try to extract any text field
    for (let k in data) {
      if (typeof data[k] === "string" && data[k].length > 4) return data[k];
    }
    return null;
  } catch {
    return null;
  }
}
