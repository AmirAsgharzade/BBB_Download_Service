// Check user login status by fetching a protected endpoint or cookie
window.onload = () => {
  loadCaptcha();
  fetch('/auth/check-auth', { method: 'GET', credentials: 'include' })
    .then(res => {
      if (res.status === 200) {
        return res.json();
      }
      throw new Error('Not authenticated');
    })
    .then(data => {
      document.getElementById('userName').innerText = `${data.name}`;
      document.getElementById('logoutBtn').style.display = 'inline-block';
      document.getElementById('historyBtn').style.display = 'inline-block';
      document.getElementById('loginBtn').style.display = 'none';
      document.getElementById('signupBtn').style.display = 'none';
      document.getElementById('userlinkform').style.display='block';
      document.getElementById('anlinkform').style.display='none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('userheader').innerText = `${data.name}`
      fetchStats();
      setInterval(fetchStats,30000);

    })
    .catch(() => {
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('historyBtn').style.display = 'none';
      document.getElementById('loginBtn').style.display = 'inline-block';
      document.getElementById('signupBtn').style.display = 'inline-block';
      document.getElementById('userlinkform').style.display='none';
      document.getElementById('anlinkform').style.display='block';
      document.getElementById('dashboard').style.display = 'none'


    });
};


async function loadCaptcha() {
      const captchaImg = document.getElementById('captcha-image');
    
      const captchaImguser = document.getElementById('user-captcha-image')
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
        captchaImguser.src = 'data:image/svg+xml;base64,' + btoa(svgText); 
      } catch (err) {
        console.log("Error loading captcha:",err)
      }
    }


function reloadCaptcha(){
  loadCaptcha()
}

function logout() {
  fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    .then(() => {
      window.location.href = '/auth/login';
    });
}

function showError(error,type){
  document.getElementById(`${type}-status`).innerHTML = error
}

function goHistory() {
  window.location.href = '/user/history';
}


const userform = document.getElementById('userlinkform')
let userModal
userform.addEventListener('submit',async (e)=>{

    e.preventDefault()
    document.getElementById("progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد اطفا کمی صبر کنید"
    userModal = new bootstrap.Modal(document.getElementById('userModal'));
    userModal.show()
    const formData = new FormData(userform)
    const formDataEnteries = new URLSearchParams(formData).toString()
    console.log(formData)
    
    fetch('/recorder/testUrl',{
      method:'POST',
      headers:{
        'Content-type':'application/x-www-form-urlencoded',
        },
        body:formDataEnteries
        
      })
      .then(response => response.json())
      .then(data => {
        console.log(userform)

        document.getElementById('testloading').style.display = 'none'
        if (data.result){
          // console.log("Response:",data)
          document.getElementById("link-status").innerHTML = "لینک صحیح میباشد و تایید شد"
          document.getElementById("progress").innerHTML = "ایا مایل هستید که این ویدیو به صف برای دانلود اضافه بشود؟"
        document.getElementById("user-no").style.display = "inline-block"
        document.getElementById("user-yes").style.display = "inline-block"
        document.getElementById("user-close").style.display = "none"
        document.getElementById("captcha-container").style.display="flex"
        }else{
          if(data.type2)showError(data.error,data.type2);
          else showError(data.error,data.type);
        }
    })
    .catch(error =>{
        console.log(error)
        console.log('here')
    })
})

function addToQueue(){

const formData = new FormData()
const captcha = document.getElementById("captcha").value
const link = document.getElementById('userLinkInput').value
formData.append('captcha',captcha)
formData.append('link',link)
    const formDataEnteries = new URLSearchParams(formData).toString()
  userModal.hide()
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    fetch('/recorder/record-meeting',{
      method:'POST',
      headers:{
        'Content-type':'application/x-www-form-urlencoded',
        },
        body:formDataEnteries
        
      })
      .then(response => response.json())
      .then(data => {
        if (data.result){
          console.log("Response:",data)
          userform.reset()
          document.getElementById("result").innerHTML = "لینک با موفقیت به صف پیوست"
                document.getElementById("progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد اطفا کمی صبر کنید"

          document.getElementById("link-status").innerHTML = ""
          document.getElementById('testloading').style.display = 'block'
          document.getElementById("captcha-container").style.display="none"

          document.getElementById("user-no").style.display = "none"
        document.getElementById("user-yes").style.display = "none"
        document.getElementById("user-close").style.display = "inline-block"
        reloadCaptcha()
          //location.reload()
        }else{
          document.getElementById("progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد اطفا کمی صبر کنید"

          document.getElementById("link-status").innerHTML = ""
          document.getElementById('testloading').style.display = 'block'
          document.getElementById("captcha-container").style.display="none"

          document.getElementById("user-no").style.display = "none"
        document.getElementById("user-yes").style.display = "none"
        document.getElementById("user-close").style.display = "inline-block"
        reloadCaptcha()
          
          showError(data.error,data.type)
        }
    })
    .catch(error =>{
        console.log(error)
        console.log('here')
    })





  
}



const anform = document.getElementById('anlinkform')
let anModal;
anform.addEventListener('submit',async  (e)=>{

    e.preventDefault()
    document.getElementById("pre-progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد اطفا کمی صبر کنید"
    anModal = new bootstrap.Modal(document.getElementById('anModal'));    
    anModal.show()
    const formData = new FormData(anform)
    const formDataEnteries = new URLSearchParams(formData).toString()
    
    fetch('/recorder/testUrl',{
      method:'POST',
      headers:{
        'Content-type':'application/x-www-form-urlencoded',
      },
      body:formDataEnteries
      
    })
    .then(response => response.json())
    .then(data => {
      console.log("data:",data)
      document.getElementById('pre-testloading').style.display = 'none'
      if (data.result === true){
        
        document.getElementById("preview-status").innerHTML = "لینک صحیح میباشد و تایید شد"
        document.getElementById("pre-progress").innerHTML = "نشان دادن چند پیش نمایش از ویدیو چند دقیقه طول میکشد ایا مایل به تماشای پیش نمایش هستید؟"
        document.getElementById("pre-no").style.display = "inline-block"
        document.getElementById("pre-yes").style.display = "inline-block"
        document.getElementById("pre-close").style.display = "none"
        document.getElementById("pre-cap").style.display="flex"
      }else{
        showError(data.error,data.type)
      }

    })
    .catch(error =>{
      document.getElementById("preview-status").innerHTML = "لینک نا معتبر میباشد"
        console.error(error)
         console.log('here')
    })
})

function preview(){
  const formData = new FormData()
  const captcha = document.getElementById("pre-captcha").value
  const link = document.getElementById('anLinkInput').value
  formData.append('captcha',captcha)
  formData.append('link',link)

  const formDataEnteries = new URLSearchParams(formData).toString()
  anModal.hide()
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  const iconsrc = '/icons/img-loading.gif';
  const container = document.getElementById('image-container');
  for (let i =0; i<5; i++){
    const img = document.createElement('img');
    img.id = `img${i+1}`;
    img.src = iconsrc;
    container.appendChild(img);
  }

  fetch('/recorder/Preview',{
    method:'POST',
    headers:{
      'Content-type':'application/x-www-form-urlencoded',
    },
    body:formDataEnteries
    
  })
  .then(response => response.json())
  .then(data => {
    console.log("data:",data)
    
    if (data.result === true){
        console.log("Response:",data)
        data.images.forEach((src,index) => {
          const img = document.getElementById(`img${index + 1}`)
          img.src = src;
           document.getElementById("pre-progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد اطفا کمی صبر کنید"

          document.getElementById("preview-status").innerHTML = ""
          document.getElementById('pre-testloading').style.display = 'block'
          document.getElementById("pre-cap").style.display="none"
          document.getElementById("pre-no").style.display = "none"
        document.getElementById("pre-yes").style.display = "none"
        document.getElementById("pre-close").style.display = "inline-block"
        reloadCaptcha()
        })
      document.getElementById("suggest").innerHTML = "نمونه هایی برای پیشنمایش جهت دانلود ویدیو <a href=/auth/signup> ثبت نام </a>کنید"
      }else{
        document.getElementById("pre-progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد اطفا کمی صبر کنید"

          document.getElementById("preview-status").innerHTML = ""
          document.getElementById('pre-testloading').style.display = 'block'
          document.getElementById("pre-cap").style.display="none"
          document.getElementById("pre-no").style.display = "none"
        document.getElementById("pre-yes").style.display = "none"
        document.getElementById("pre-close").style.display = "inline-block"
        reloadCaptcha()
        showError(data.error,data.type)
        container.innerHTML = ""
      }

    })
    .catch(error =>{

      console.error(error)
         console.log('here')
    })
}

function closePreview(){
  const modalEl = document.getElementById('anModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  // modalInstance.hide()
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  // document.getElementById("linkInput").focus();
  location.reload()
}

function closeLink(){
  const modalEl = document.getElementById('userModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  // modalInstance.hide()
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
 location.reload() // document.getElementById("linkInput").focus();

}


      // Open modals on button click according to visibility
$('#user-close').on('click', function() {
  if($('#userlinkform').is(':visible')) {
      userModal.hide();
        }
      });

      $('#pre-close').on('click', function() {
        if($('#anlinkform').is(':visible')) {
          anModal.hide();
        }
      });






async function fetchStats() {
    try {
      const response = await fetch('/user/dashboard', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();

      document.getElementById('totalRequests').innerText = data.total_requests;
      document.getElementById('queuedRequests').innerText = data.queued_requests;
      document.getElementById('processingRequests').innerText = data.processing_requests;
      document.getElementById('processedRequests').innerText = data.processed_requests;
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }