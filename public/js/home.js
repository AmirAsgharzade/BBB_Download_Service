// Check user login status by fetching a protected endpoint or cookie
//
let currentProgressBarIntervalId = null;
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
      document.getElementById('general-form').innerHTML=`
	 <!-- Authenticated user form -->
      <form action="" method="post" id="userlinkform">
        <div class="inp-container">
          <input type="text" id="userLinkInput" name="link" placeholder="لینک را وارد کنید" style="width:100%;direction:ltr;" />
	  
          <!-- Change submit button to button to open modal -->
          <button type="submit" id="userModalBtn" class="send-btn">بررسی</button>
        </div>
      </form>		
	    ` ;
	attachUserform();
      document.getElementById('userName').innerText = `${data.name}`;
      document.getElementById('logoutBtn').style.display = 'inline-block';
      document.getElementById('historyBtn').style.display = 'inline-block';
      document.getElementById('loginBtn').style.display = 'none';
      document.getElementById('signupBtn').style.display = 'none';
      //document.getElementById('userlinkform').style.display='block';
      //document.getElementById('anlinkform').style.display='none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('dashboard').innerHTML =  `
      <h1>داشبورد</h1>
    <h5 id="userheader"></h5>
    <div class="row text-center mt-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white mb-3">
          <div class="card-body">
            <h5 class="card-title">تعداد درخواست ها</h5>
            <p id="totalRequests" class="card-text fs-3">0</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-dark mb-3">
          <div class="card-body">
            <h5 class="card-title">در صف</h5>
            <p id="queuedRequests" class="card-text fs-3">0</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white mb-3">
          <div class="card-body">
            <h5 class="card-title">درحال پردازش</h5>
            <p id="processingRequests" class="card-text fs-3">0</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white mb-3">
          <div class="card-body">
            <h5 class="card-title">پردازش شده</h5>
            <p id="processedRequests" class="card-text fs-3">0</p>
          </div>
        </div>
      </div>
    </div>
		    `;
      document.getElementById('userheader').innerText = `${data.name}`
      fetchStats();
      setInterval(fetchStats,60000);

    })
    .catch((err) => {
      document.getElementById('general-form').innerHTML = `
      <form action="" method="post" id="anlinkform">
        <div class="inp-container">
          <input type="text" id="anLinkInput" name="link" placeholder="لینک را وارد کنید" style="width:100%;direction:ltr;" />
          <!-- Change submit button to button to open modal -->
          <button type="submit" id="anModalBtn" class="send-btn">بررسی</button>
        </div>
      </form>
	    `;
	attachAnform();
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('historyBtn').style.display = 'none';
      document.getElementById('loginBtn').style.display = 'inline-block';
      document.getElementById('signupBtn').style.display = 'inline-block';
//      document.getElementById('userlinkform').style.display='none';
      //document.getElementById('anlinkform').style.display='block';
      //document.getElementById('dashboard').style.display = 'none'

//	console.log(err)
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
	document.getElementById('captcha').value = '';
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

let userform;
let userModal;
function attachUserform(){
  userform = document.getElementById('userlinkform')
//let userModal
userform.addEventListener('submit',async (e)=>{

    e.preventDefault()
    document.getElementById("progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد لطفا کمی صبر کنید"
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
	  document.getElementById("progress").innerHTML = "";

          if(data.type2)showError(data.error,data.type2);
          else showError(data.error,data.type);
        }
    })
    .catch(error =>{
 document.getElementById("progress").innerHTML = "";
        console.log(error)
        console.log('here')
    })
})
}
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
          document.getElementById("progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد لطفا کمی صبر کنید"

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

let anModal;
function attachAnform(){
const anform = document.getElementById('anlinkform')
//let anModal;
anform.addEventListener('submit',async  (e)=>{

    e.preventDefault()
    document.getElementById("pre-progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد لطفا کمی صبر کنید"
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
	document.getElementById("pre-progress").innerHTML = ""
        showError(data.error,data.type)
      }

    })
    .catch(error =>{
 document.getElementById("pre-progress").innerHTML = ""
      document.getElementById("preview-status").innerHTML = "لینک نا معتبر میباشد"
        console.error(error)
         console.log('here')
    })
})
}
function preview(){
  const formData = new FormData()
  const captcha = document.getElementById("pre-captcha").value
  const link = document.getElementById('anLinkInput').value
  formData.append('captcha',captcha)
  formData.append('link',link)

  const formDataEnteries = new URLSearchParams(formData).toString()
  anModal.hide()
  startProgressBar(10+(5*15)+5);
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  const iconsrc = '/icons/img-loading.gif';
  const container = document.getElementById('image-container');
  for (let i =0; i<5; i++){
    const icontainer = document.createElement('div');
	  icontainer.classList.add('icon-container');

    const img = document.createElement('img');
	  img.classList.add('loading-icon');
    img.id = `img${i+1}`;
    img.src = iconsrc;
    img.style.width='24px';
    img.style.height='24px';
	icontainer.appendChild(img);
    container.appendChild(icontainer);
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
	  img.style.width = '15vw';
	  img.style.height = 'auto';	
           document.getElementById("pre-progress").innerHTML = "بررسی لینک چند لحظه ای طول میکشد اطفا کمی صبر کنید"

          document.getElementById("preview-status").innerHTML = ""
          document.getElementById('pre-testloading').style.display = 'block'
          document.getElementById("pre-cap").style.display="none"
          document.getElementById("pre-no").style.display = "none"
        document.getElementById("pre-yes").style.display = "none"
        document.getElementById("pre-close").style.display = "inline-block"
        reloadCaptcha()
        })
	document.getElementById("bar").style.display = "none";
      document.getElementById("suggest").innerHTML = "نمونه هایی برای پیشنمایش جهت دانلود ویدیو <a href=/auth/signup> ثبت نام </a>کنید"
      }else{
	      stopProgressBar();
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


async function startProgressBar(durationInSeconds) {

  if (currentProgressBarIntervalId !== null) {
	clearInterval(currentProgressBarIntervalId);
  }


    document.getElementById("bar").style.display = "block"
  const progressBarFill = document.getElementById('progressBarFill');
  const totalSteps = 100; // Number of steps for the animation
  const intervalTime = (durationInSeconds * 1000) / totalSteps; // Time per step in milliseconds
  let currentProgress = 0;

  progressBarFill.style.width = '0%'; // Reset to 0% at the start

  currentProgressBarIntervalId = setInterval(() => {
    currentProgress++;
    if (currentProgress <= totalSteps) {
      progressBarFill.style.width = `${currentProgress}%`;
    } else {
      clearInterval(currentProgressBarIntervalId); // Stop the interval when 100% is reached
	    currentProgressBarIntervalId = null;
    }
  }, intervalTime);

}


function stopProgressBar() {
//  clearInterval(intervalId);
   if (currentProgressBarIntervalId !== null) {
    clearInterval(currentProgressBarIntervalId);
    currentProgressBarIntervalId = null;
  }
  document.getElementById('bar').style.display = 'none';
  document.getElementById('progressBarFill').style.width = '0%';
}

