

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

function reloadCaptcha(){
	document.getElementById('captcha').value = '';
  loadCaptcha()
}

function loginWithphone() {
  const phoneNumber = document.getElementById('loginphone').value;
  const password = document.getElementById('loginPassword').value;
  const captcha = document.getElementById('captcha').value
  fetch('/auth/login/phone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, password,captcha })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/home';
      } else {
        reloadCaptcha()
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

function goSignUp(){
  window.location.href= '/auth/signup';
}
