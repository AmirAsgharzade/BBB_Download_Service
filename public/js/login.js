document.querySelectorAll('input[name="loginType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const val = document.querySelector('input[name="loginType"]:checked').value;
    document.getElementById('phoneLogin').style.display = val === 'phone' ? 'block' : 'none';
    document.getElementById('emailLogin').style.display = val === 'email' ? 'block' : 'none';
    resetStatus();
    resetPhoneLogin();
  });
});

let loginPhoneValue = '';

function sendLoginCode() {
  const phone = document.getElementById('loginPhone').value;
  fetch('/auth/login/phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loginPhoneValue = phone;
        document.getElementById('phoneStep1').style.display = 'none';
        document.getElementById('phoneStep2').style.display = 'block';
        resetStatus();
      } else {
        showError(data.error,data.type);
      }
    });
}

function verifyLoginCode() {
  const code = document.getElementById('loginCode').value;
  fetch('/auth/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: loginPhoneValue, code })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/home';
      } else {
        showError(data.error,data.type);
      }
    });
}

function loginWithEmail() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  fetch('/auth/login/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/home';
      } else {
        showError(data.error,data.type);
      }
    });
}

function showError(msg,type) {
  document.getElementById(`${type}-status`).innerText = msg;
}

function resetStatus() {
  const allElements = document.querySelectorAll('[id]');
  re = /[^\s"]*-status\b/g;
  for (const el of allElements) {
    if (re.test(el.id)) {
      el.innerText = '';
    }}
};

function resetPhoneLogin() {
  document.getElementById('phoneStep1').style.display = 'block';
  document.getElementById('phoneStep2').style.display = 'none';
  document.getElementById('loginPhone').value = '';
  document.getElementById('loginCode').value = '';
}

function goSignUp(){
  window.location.href= '/auth/signup';
}