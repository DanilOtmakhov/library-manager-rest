import { showNotification } from './notification.js';

document.addEventListener('DOMContentLoaded', () => {
  loadBooks();
  initializeEventListeners();
});

function initializeEventListeners() {
  document.getElementById('filterSelect').addEventListener('change', (e) => {
    const filter = e.target.value;
    loadBooks(filter);
    e.target.classList.toggle('active', filter !== 'all');
  });

  document.getElementById('addBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addBook();
  });

  document.getElementById('borrowForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await borrowBook();
  });

  document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await editBook();
  });
}

async function loadBooks(filter = 'all') {
  try {
    const response = await fetch(`/books/api?filter=${filter}`);
    const books = await response.json();
    renderBooks(books);
  } catch (error) {
    console.error('Ошибка загрузки книг:', error);
    alert('Не удалось загрузить список книг');
  }
}

function renderBooks(books) {
  const tbody = document.getElementById('booksTableBody');
  tbody.innerHTML = '';

  if (books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #9ca3af;">
          <i class="fa-solid fa-inbox" style="font-size: 3em; margin-bottom: 10px; display: block;"></i>
          Книги не найдены
        </td>
      </tr>
    `;
    return;
  }

  books.forEach((book, index) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${index * 0.05}s`;

    let statusHTML = '';
    if (book.available) {
      statusHTML = '<span class="status-badge status-available"><i class="fa-solid fa-check-circle"></i> В наличии</span>';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDate = new Date(book.returnDate);
      returnDate.setHours(0, 0, 0, 0);

      if (returnDate < today) {
        statusHTML = '<span class="status-badge status-overdue"><i class="fa-solid fa-exclamation-triangle"></i> Просрочена</span>';
      } else {
        statusHTML = '<span class="status-badge status-borrowed"><i class="fa-solid fa-book-reader"></i> Выдана</span>';
      }
    }

    const formattedDate = book.returnDate
      ? new Date(book.returnDate).toLocaleDateString('ru-RU')
      : '—';

    tr.innerHTML = `
      <td><strong>${book.title}</strong></td>
      <td>${book.author}</td>
      <td>${book.year}</td>
      <td>${statusHTML}</td>
      <td>${book.borrower || '—'}</td>
      <td>${formattedDate}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" onclick="location.href='/books/${book.id}'">
            <i class="fa-solid fa-edit"></i> Изменить
          </button>
          ${book.available
            ? `<button class="btn-action btn-borrow" onclick="showBorrowModal(${book.id})">
                <i class="fa-solid fa-hand-holding-heart"></i> Выдать
              </button>`
            : `<button class="btn-action btn-return" onclick="returnBook(${book.id})">
                <i class="fa-solid fa-undo"></i> Вернуть
              </button>`
          }
          <button class="btn-action btn-delete" onclick="deleteBook(${book.id})">
            <i class="fa-solid fa-trash"></i> Удалить
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function showAddBookModal() {
  document.getElementById('addBookDialog').showModal();
}

window.showAddBookModal = showAddBookModal;

function closeAddBookModal() {
  document.getElementById('addBookDialog').close();
  document.getElementById('addBookForm').reset();
}

window.closeAddBookModal = closeAddBookModal;

async function addBook() {
  const form = document.getElementById('addBookForm');
  const formData = new FormData(form);

  const bookData = {
    title: formData.get('title'),
    author: formData.get('author'),
    year: parseInt(formData.get('year'))
  };

  try {
    const response = await fetch('/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    });

    if (response.ok) {
      closeAddBookModal();
      loadBooks();
      showNotification('Книга успешно добавлена!', 'success');
    } else {
      const error = await response.json();
      alert('Ошибка: ' + error.error);
    }
  } catch (error) {
    console.error('Ошибка добавления книги:', error);
    alert('Не удалось добавить книгу');
  }
}

function showBorrowModal(bookId) {
  document.getElementById('borrowBookId').value = bookId;
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('returnDate').min = today;
  document.getElementById('borrowDialog').showModal();
}

window.showBorrowModal = showBorrowModal;

function closeBorrowModal() {
  document.getElementById('borrowDialog').close();
  document.getElementById('borrowForm').reset();
}

window.closeBorrowModal = closeBorrowModal;

async function borrowBook() {
  const bookId = document.getElementById('borrowBookId').value;
  const borrower = document.getElementById('borrowerName').value;
  const returnDate = document.getElementById('returnDate').value;

  try {
    const response = await fetch(`/books/${bookId}/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrower, returnDate })
    });

    if (response.ok) {
      closeBorrowModal();
      loadBooks();
      showNotification('Книга успешно выдана!', 'success');
    } else {
      const error = await response.json();
      alert('Ошибка: ' + error.error);
    }
  } catch (error) {
    console.error('Ошибка выдачи книги:', error);
    alert('Не удалось выдать книгу');
  }
}

async function returnBook(bookId) {
  if (!confirm('Вернуть книгу в библиотеку?')) return;

  try {
    const response = await fetch(`/books/${bookId}/return`, {
      method: 'POST'
    });

    if (response.ok) {
      loadBooks();
      showNotification('Книга возвращена в библиотеку!', 'success');
    } else {
      const error = await response.json();
      alert('Ошибка: ' + error.error);
    }
  } catch (error) {
    console.error('Ошибка возврата книги:', error);
    alert('Не удалось вернуть книгу');
  }
}

window.returnBook = returnBook;

async function deleteBook(bookId) {
  if (!confirm('Вы уверены, что хотите удалить эту книгу? Это действие необратимо.')) return;

  try {
    const response = await fetch(`/books/${bookId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadBooks();
      showNotification('Книга успешно удалена!', 'success');
    } else {
      const error = await response.json();
      alert('Ошибка: ' + error.error);
    }
  } catch (error) {
    console.error('Ошибка удаления книги:', error);
    alert('Не удалось удалить книгу');
  }
}

window.deleteBook = deleteBook;
