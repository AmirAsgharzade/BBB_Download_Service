function toSolarDateTime(adDateTime) {
  const date = new Date(adDateTime);

  // Format Persian Solar Hijri date
  const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    numberingSystem: 'latn',
  });

  // Format time (24-hour format)
  const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    numberingSystem: 'latn',
  });

  const solarDate = dateFormatter.format(date);
  const time = timeFormatter.format(date);

  return `${solarDate} ${time}`;
}




let currentPage = 1;
const limit = 10;
let sortBy = 'created_at';
let order = 'desc';
let total = 0;





document.addEventListener('DOMContentLoaded', () => {
  loadData();

  document.querySelectorAll('th').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.getAttribute('data-column');
      if (sortBy === column) {
        order = order === 'asc' ? 'desc' : 'asc';
      } else {
        sortBy = column;
        order = 'asc';
      }
      currentPage = 1;
      loadData();
    });
  });
});

function loadData() {
  fetch(`/user/histories?page=${currentPage}&limit=${limit}&sortBy=${sortBy}&order=${order}`, {
    credentials: 'include'
  })
    .then(res => {
      if (res.status === 401) {
        window.location.href = '/auth/login';
        throw new Error('Unauthorized');
      }
      return res.json();
    })
    .then(data => {
      document.getElementById('userName').innerText = `${data.user}`;
      total = data.total;
      populateTable(data.data);
      updatePagination();
    })
    .catch(err => console.error(err));
}

function populateTable(rows) {
  const tbody = document.querySelector('#historyTable tbody');
  tbody.innerHTML = '';

  rows.forEach(row => {
    console.log(row)
    const tr = document.createElement('tr');
    if (row.download_url === null){

      tr.innerHTML = `
        <td style="text-align: right;">${row.id}</td>
        <td style="text-align: right;"><a href="${row.link}"><img src='/icons/link.png' alt='the link'></a></td>
        <td style="text-align: right;">${toSolarDateTime(new Date(row.created_at).toLocaleString())}</td>
        <td style="text-align: right;">لینک اماده نیست</td>
        <td style="text-align: right;">${row.status}</td>
      `;
    }else{
      tr.innerHTML = `
        <td style="text-align: right;">${row.id}</td>
        <td style="text-align: right;"><a href="${row.link}"><img src='/icons/link.png' alt='the link'></a></td>
        <td style="text-align: right;">${toSolarDateTime(new Date(row.created_at).toLocaleString())}</td>
        <td style="text-align: right;"><a href="${row.download_url}"><img src='/icons/download.png'></a></td>
        <td style="text-align: right;">${row.status}</td>
      `;
    }
    tbody.appendChild(tr);
  });
}

function updatePagination() {
  const pageInfo = document.getElementById('pageInfo');
  const totalPages = Math.ceil(total / limit);
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById('prevBtn').disabled = currentPage <= 1;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadData();
  }
}

function nextPage() {
  const totalPages = Math.ceil(total / limit);
  if (currentPage < totalPages) {
    currentPage++;
    loadData();
  }
}

function logout() {
  fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    .then(() => {
      window.location.href = '/auth/login';
    });
}

function goHome() {
  window.location.href = '/home';
}