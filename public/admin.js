const socket = io();
socket.emit("dashboard-request");
socket.on("dashboard-data", data => {
  document.getElementById('members-count').innerText = data.members.length;
  document.getElementById('top-members').innerHTML =
    data.members.slice(0, 3).map(m => `<li>${m.name}</li>`).join('');
  document.getElementById('active-members').innerHTML =
    data.members.filter(m=>m.status==='active').map(m=>`<li>${m.name} <span class="ip">(${m.ip})</span></li>`).join('');
  document.getElementById('members-table').innerHTML =
    data.members.map(m=>`<tr><td>${m.name}</td><td>${m.status}</td><td class="ip">${m.ip}</td></tr>`).join('');
});
socket.on("broadcast", ({message}) => {
  document.getElementById('broadcast-log').innerText = `Broadcast: ${message}`;
});
document.getElementById('broadcast-form').addEventListener('submit', function(e){
  e.preventDefault();
  const msg = document.getElementById('broadcast-msg').value.trim();
  if (!msg) return;
  socket.emit("broadcast", { message: msg });
  document.getElementById('broadcast-msg').value = '';
});
socket.on("admin-feedback", ({from, category, message}) => {
  // Optionally update dashboard with feedback
});
