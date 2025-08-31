// Universal NavBar (auto-included on all pages except login)
(function() {
  if (!document.getElementById("navbar")) return;
  function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
      let c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  }
  const user = getCookie("casper_user");
  if (!user) { window.location = "index.html"; return; }
  let html = `<div class="nav-bar-inner">
    <a class="nav-link" href="home.html">Home</a>
    <a class="nav-link" href="ai-chat.html">AI Chat</a>
    <a class="nav-link" href="private-chat.html">Private Chat</a>
    <a class="nav-link" href="contact-admin.html">Contact Admin</a>
    <a class="nav-link" href="dashboard.html">Dashboard</a>
    <span class="user">👤 ${user}</span>
    <button class="logout-btn" id="logout-btn">Log Out</button>
    </div>`;
  document.getElementById("navbar").innerHTML = html;
  document.getElementById("logout-btn").onclick = function() {
    document.cookie = "casper_user=;expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location = "index.html";
  };
  // Highlight current page
  let links = document.querySelectorAll("#navbar .nav-link");
  const page = location.pathname.split('/').pop();
  links.forEach(link => {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
})();
