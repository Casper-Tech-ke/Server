const socket = io();
let username = (function() {
  let c = document.cookie.match(/casper_user=([^;]+)/);
  return c ? decodeURIComponent(c[1]) : "";
})();
if (!username) window.location = "index.html";
socket.emit("user-join", username);
let selectedUser = null;
let userList = [];
socket.on("user-list", (users) => {
  userList = users;
  renderUsers();
});
function renderUsers() {
  const ul = document.getElementById('user-list');
  ul.innerHTML = '';
  userList.filter(u => u.name !== username).forEach(u => {
    const li = document.createElement('li');
    li.textContent = u.name;
    if (selectedUser === u.name) li.classList.add('selected');
    li.onclick = () => { selectedUser = u.name; renderUsers(); };
    ul.appendChild(li);
  });
}
document.getElementById('private-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!selectedUser) return alert("Select a user to chat with.");
  const text = document.getElementById('private-input').value.trim();
  if (!text) return;
  socket.emit("private-message", {from: username, to: selectedUser, message: text});
  appendMessage(`You: ${text}`, 'you');
  document.getElementById('private-input').value = '';
});
function appendMessage(text, sender) {
  const div = document.createElement('div');
  div.className = 'msg ' + sender;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerText = text;
  div.appendChild(bubble);
  document.getElementById('private-msg').appendChild(div);
}
socket.on("private-message", ({from, to, message}) => {
  if ((from === selectedUser && to === username) || (from === username && to === selectedUser)) {
    appendMessage(`${from}: ${message}`, from === username ? 'you' : 'ai');
  }
});
