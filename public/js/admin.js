// Simulated Admin Dashboard Data/Logic

// Dummy data for demonstration
const members = [
  { name: "Alice", status: "active", ip: "192.168.1.2" },
  { name: "Bob", status: "inactive", ip: "192.168.1.3" },
  { name: "Charlie", status: "active", ip: "192.168.1.4" },
  { name: "David", status: "active", ip: "192.168.1.5" },
  { name: "Eva", status: "inactive", ip: "192.168.1.6" },
];

function countMembers() {
  document.getElementById('members-count').innerText = members.length;
}

function renderTopMembers() {
  // Top = members sorted by name (simulate)
  let html = '';
  members.slice(0,3).forEach(m => {
    html += `<li>${m.name}</li>`;
  });
  document.getElementById('top-members').innerHTML = html;
}

function renderActiveMembers() {
  let html = '';
  members.filter(m=>m.status==='active').forEach(m=>{
    html += `<li>${m.name} <span class="ip">(${m.ip})</span></li>`;
  });
  document.getElementById('active-members').innerHTML = html;
}

function renderMembersTable() {
  let html = '';
  members.forEach(m=>{
    html += `<tr><td>${m.name}</td><td>${m.status}</td><td class="ip">${m.ip}</td></tr>`;
  });
  document.getElementById('members-table').innerHTML = html;
}

document.getElementById('broadcast-form').addEventListener('submit', function(e){
  e.preventDefault();
  const msg = document.getElementById('broadcast-msg').value.trim();
  if (!msg) return;
  // Simulate broadcast (would actually send to backend & log IPs)
  document.getElementById('broadcast-log').innerText = `Message broadcasted: "${msg}" [IP logged]`;
  document.getElementById('broadcast-msg').value = '';
  setTimeout(()=>document.getElementById('broadcast-log').innerText='', 4000);
});

// Initialize dashboard
countMembers();
renderTopMembers();
renderActiveMembers();
renderMembersTable();
