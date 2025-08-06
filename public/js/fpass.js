window.onload = loadCaptcha()



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


    
let phoneValue = '';
let timerInterval;
const countdownDuration = 2*60;
const sendCodeBtn = document.getElementById("codebutton");
const verificationCodeInput = document.getElementById("code");
const timerText = document.getElementById("timerText");

function sendfpCode() {
  const phone = document.getElementById('phone').value;
  fetch('/auth/forgot-pass/phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        phoneValue = phone;
        console.log(data.code);
        startCountdown()
        
      } else {
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

  timerText.textContent = `Resend available in ${formattedTime}`;

}function resetButton() {

  sendCodeBtn.disabled = false;
  sendCodeBtn.classList.remove("disabled");
  sendCodeBtn.textContent = "Send Code";
  timerText.textContent = ""; // Clear timer text when done
}
  
  function verifyfpCode() {
    const code = document.getElementById('code').value;
    
    fetch('/auth/forgot-pass/verify', {
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
        showError(data.error,data.type);
      }
    });
}

function resetPass() {
  const details = {

    phone: phoneValue,
    code:document.getElementById('code').value,
    password: document.getElementById('password').value,
    conf_password: document.getElementById('conf_password').value,
    captcha:document.getElementById('captcha').value
  };

  fetch('/auth/forgot-pass/resetPassword', {
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