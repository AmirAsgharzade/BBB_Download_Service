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
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.id}</td>
      <td><a href="${row.link}">${row.link}</a></td>
      <td>${new Date(row.created_at).toLocaleString()}</td>
      <td><a href="${row.download_url}">${row.download_url}</a></td>
      <td>${row.status}</td>
    `;
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
