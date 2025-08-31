// Simple login/signup with cookies (demo only, no server-side auth!)
// User data stored in localStorage, "session" in cookie

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    let d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + d.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
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

// Auto-login if cookie
const existing = getCookie("casper_user");
if (existing) window.location = "home.html";

// Tab switching
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
loginTab.onclick = () => { loginTab.classList.add("active"); signupTab.classList.remove("active");
  document.getElementById("login-form").style.display="block";
  document.getElementById("signup-form").style.display="none";
  document.getElementById("error-msg").textContent="";
};
signupTab.onclick = () => { signupTab.classList.add("active"); loginTab.classList.remove("active");
  document.getElementById("login-form").style.display="none";
  document.getElementById("signup-form").style.display="block";
  document.getElementById("error-msg").textContent="";
};

document.getElementById("login-form").onsubmit = e => {
  e.preventDefault();
  let u = document.getElementById("login-username").value.trim();
  let p = document.getElementById("login-password").value;
  // Demo user check from localstorage
  let users = JSON.parse(localStorage.getItem("casper_users")||"{}");
  if (users[u] && users[u] === p) {
    setCookie("casper_user", u, 7);
    window.location = "home.html";
  } else {
    document.getElementById("error-msg").textContent = "Invalid credentials!";
  }
};

document.getElementById("signup-form").onsubmit = e => {
  e.preventDefault();
  let u = document.getElementById("signup-username").value.trim();
  let p = document.getElementById("signup-password").value;
  if (u.length < 3 || p.length < 3) {
    document.getElementById("error-msg").textContent = "Username and password must be at least 3 characters.";
    return;
  }
  let users = JSON.parse(localStorage.getItem("casper_users")||"{}");
  if (users[u]) {
    document.getElementById("error-msg").textContent = "Username already exists!";
    return;
  }
  users[u]=p;
  localStorage.setItem("casper_users", JSON.stringify(users));
  setCookie("casper_user", u, 7);
  window.location = "home.html";
};
