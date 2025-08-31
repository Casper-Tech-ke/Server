const socket = io();
let username = (function() {
  let c = document.cookie.match(/casper_user=([^;]+)/);
  return c ? decodeURIComponent(c[1]) : "";
})();
if (!username) window.location = "index.html";
document.getElementById('admin-form').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('feedback').textContent = "Message sent! Waiting for admin...";
  const cat = document.getElementById('cat').value;
  const msg = document.getElementById('msg').value;
  socket.emit("feedback", {from: username, category: cat, message: msg});
  setTimeout(() => {
    let reply = "";
    if (cat === "bug") reply = "Thank you for your bug report. We'll investigate!";
    else if (cat === "thanks") reply = "You're most welcome! We appreciate your support.";
    else if (cat === "suggestion") reply = "Thanks for your suggestion! The admin will review it soon.";
    document.getElementById('admin-resp').style.display = "block";
    document.getElementById('admin-resp').textContent = reply;
    document.getElementById('feedback').textContent = "";
  }, 1200);
});
