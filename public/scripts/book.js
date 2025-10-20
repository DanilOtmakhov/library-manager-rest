import { showNotification } from './notification.js';

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("bookId").value;
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const year = document.getElementById("year").value;

  const res = await fetch(`/books/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author, year }),
  });
  if (res.ok) {
    showNotification('Книга успешно обновлена!', 'success');
    location.reload();
  } else {
    alert("Ошибка при сохранении");
  }
});

function showBorrowForm() {
  document.getElementById("borrowDialog").showModal();
}

window.showBorrowForm = showBorrowForm;

function closeBorrowModal() {
  document.getElementById("borrowDialog").close();
}

window.closeBorrowModal = closeBorrowModal;

document.getElementById("borrowForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const borrower = document.getElementById("borrower").value;
  const returnDate = document.getElementById("returnDate").value;
  const id = document.getElementById("borrowBookId").value;

  const res = await fetch(`/books/${id}/borrow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ borrower, returnDate }),
  });
  if (res.ok) {
    showNotification('Книга успешно выдана!', 'success');
    location.reload();
  } else {
    alert("Ошибка при выдаче");
  }
});

async function returnBook(id) {
  if (!confirm("Вернуть книгу в библиотеку?")) return;
  const res = await fetch(`/books/${id}/return`, { method: "POST" });
  if (res.ok) {
    showNotification('Книга возвращена в библиотеку!', 'success');
    location.reload();
  } else {
    alert("Ошибка возврата");
  }
}

window.returnBook = returnBook;
