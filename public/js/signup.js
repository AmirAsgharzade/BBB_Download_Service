window.onload = loadCaptcha()
const verifyfield = document.getElementById("code")

verifyfield.disabled = true
verifyfield.classList.add("disabled");


async function loadCaptcha() {
      const captchaImg = document.getElementById('captcha-image');

      try {
        const response = await fetch(`/auth/captcha`, {
          method: 'GET',
          credentials: 'include' // important to send cookies (session cookie)
        });
        if (!response.ok) {
          throw new Error('Failed to load captcha');
        }
        const svgText = await response.text();

        // Display SVG as image by embedding SVG XML directly
        captchaImg.src = 'data:image/svg+xml;base64,' + btoa(svgText);
      } catch (err) {
        console.log("Error loading captcha:",err)
      }
    }


function reloadCaptcha(){
	document.getElementById('captcha').value = '';
  loadCaptcha()
}

    
let phoneValue = '';
let timerInterval;
const countdownDuration = 3*60;
const sendCodeBtn = document.getElementById("codebutton");
const verificationCodeInput = document.getElementById("code");
const timerText = document.getElementById("timerText");
function sendCode() {
  const phone = document.getElementById('phone').value;
  const captcha = document.getElementById('captcha').value;
  fetch('/auth/signup/phone', {
    method: 'POST',

    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone,captcha })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        verifyfield.disabled = false
        verifyfield.classList.remove("disabled");

        phoneValue = phone;
       console.log(data.code)
        startCountdown()
        
      } else {
        reloadCaptcha()
        showError(data.error,data.type);
      }
    });
  }

  function startCountdown() {
  let timeLeft = countdownDuration;
  sendCodeBtn.disabled = true;
  sendCodeBtn.classList.add("disabled");
  updateButtonText(timeLeft);

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      resetButton();
    } else {
      updateButtonText(timeLeft);
    }
  }, 1000);
}

function updateButtonText(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${mins}:${secs.toString().padStart(2, "0")}`;

  timerText.textContent = `ارسال مجدد در ${formattedTime}`;
}function resetButton() {

  sendCodeBtn.disabled = false;
  sendCodeBtn.classList.remove("disabled");
  sendCodeBtn.textContent = "Send Code";
  timerText.textContent = ""; // Clear timer text when done
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
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
      } else {
	      reloadCaptcha();
        showError(data.error,data.type);
      }
    });
}

function finalSignup() {
  const details = {

    phone: document.getElementById('phone').value,
    code:document.getElementById('code').value,
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    password: document.getElementById('password').value,
    pass_conf:document.getElementById('pass_conf').value,
//    captcha: document.getElementById('captcha').value,
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
        console.log(details)
        reloadCaptcha()
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
