let phoneValue = '';

function sendCode() {
  const phone = document.getElementById('phone').value;
  fetch('/auth/signup/phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        phoneValue = phone;
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
      } else {
        showError(data.error,data.type);
      }
    });
}

function verifyCode() {
  const code = document.getElementById('code').value;
  fetch('/auth/signup/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phoneValue, code })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'block';
      } else {
        showError(data.error,data.type);
      }
    });
}

function finalSignup() {
  const details = {
    phone: phoneValue,
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  fetch('/auth/signup/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/auth/login'; // or /login.html
      } else {
        showError(data.error,data.type);
      }
    });
}

function showError(msg,type) {

  document.getElementById(`${type}-status`).innerText = msg;
}


function goLogin(){
  window.location.href = '/auth/login'
}