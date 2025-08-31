const socket = io();
const messagesDiv = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
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
form.addEventListener('submit', e => {
  e.preventDefault();
  const userMsg = input.value.trim();
  if (!userMsg) return;
  appendMessage(userMsg, 'user');
  input.value = '';
  socket.emit("ai-message", { text: userMsg });
});
socket.on("ai-reply", (data) => {
  appendMessage(data.text, "ai");
});
