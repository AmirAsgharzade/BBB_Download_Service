// Check user login status by fetching a protected endpoint or cookie
window.onload = () => {
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
    })
    .catch(() => {
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('historyBtn').style.display = 'none';
      document.getElementById('loginBtn').style.display = 'inline-block';
      document.getElementById('signupBtn').style.display = 'inline-block';
      document.getElementById('userlinkform').style.display='none';
      document.getElementById('anlinkform').style.display='block';

    });
};


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
userform.addEventListener('submit',async (e)=>{
    e.preventDefault()

    const formData = new FormData(userform)
    const formDataEnteries = new URLSearchParams(formData).toString()
    
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
          document.getElementById("progress").innerHTML = "the link has been succesfully added to our list!!"
        }else{
          showError(data.error,data.type)
        }
    })
    .catch(error =>{
        console.log(error)
        console.log('here')
    })
})



const anform = document.getElementById('anlinkform')
anform.addEventListener('submit',async (e)=>{
    e.preventDefault()

    const formData = new FormData(anform)
    const formDataEnteries = new URLSearchParams(formData).toString()
    document.getElementById("progress").innerHTML = "Preview in progress... it might take about 3 minutes"
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
        const container = document.getElementById('image-container');
        data.images.forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          container.appendChild(img);
          
        })
      document.getElementById("suggest").innerHTML = "Here is the preview if you would like to download the video you have to Sign in"
      }else{

        showError(data.error,data.type)
      }

    })
    .catch(error =>{
      console.error(error)
         console.log('here')
    })
})

