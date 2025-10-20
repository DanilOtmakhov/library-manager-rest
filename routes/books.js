const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const booksFilePath = path.join(__dirname, '../data/books.json');

function readBooks() {
  const data = fs.readFileSync(booksFilePath, 'utf-8');
  return JSON.parse(data);
}

function writeBooks(books) {
  fs.writeFileSync(booksFilePath, JSON.stringify(books, null, 2), 'utf-8');
}

// GET /books - Отображение страницы со списком книг
router.get('/', (req, res) => {
  const books = readBooks();
  res.render('books', { books });
});

// GET /books/api - Получение списка книг
router.get('/api', (req, res) => {
  const books = readBooks();
  const { filter } = req.query;

  let filteredBooks = books;

  if (filter === 'available') {
    filteredBooks = books.filter(book => book.available);
  } else if (filter === 'overdue') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredBooks = books.filter(book => {
      if (!book.available && book.returnDate) {
        const returnDate = new Date(book.returnDate);
        returnDate.setHours(0, 0, 0, 0);
        return returnDate < today;
      }
      return false;
    });
  }

  res.json(filteredBooks);
});

// GET /books/:id - Получение информации о конкретной книге
router.get('/:id', (req, res) => {
  const books = readBooks();
  const book = books.find(b => b.id === parseInt(req.params.id));

  if (!book) {
    return res.status(404).render('error', { message: 'Книга не найдена' });
  }

  res.render('book', { book });
});

// POST /books - Добавление новой книги
router.post('/', (req, res) => {
  const books = readBooks();
  const { title, author, year } = req.body;

  if (!title || !author || !year) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  const newBook = {
    id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
    title,
    author,
    year: parseInt(year),
    available: true,
    borrower: null,
    returnDate: null
  };

  books.push(newBook);
  writeBooks(books);

  res.status(201).json(newBook);
});

// PUT /books/:id - Редактирование книги
router.put('/:id', (req, res) => {
  const books = readBooks();
  const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }

  const { title, author, year } = req.body;

  if (title) books[bookIndex].title = title;
  if (author) books[bookIndex].author = author;
  if (year) books[bookIndex].year = parseInt(year);

  writeBooks(books);
  res.json(books[bookIndex]);
});

// POST /books/:id/borrow - Выдача книги читателю
router.post('/:id/borrow', (req, res) => {
  const books = readBooks();
  const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }

  if (!books[bookIndex].available) {
    return res.status(400).json({ error: 'Книга уже выдана' });
  }

  const { borrower, returnDate } = req.body;

  if (!borrower || !returnDate) {
    return res.status(400).json({ error: 'Укажите имя читателя и дату возврата' });
  }

  // Выдача книги
  books[bookIndex].available = false;
  books[bookIndex].borrower = borrower;
  books[bookIndex].returnDate = returnDate;

  writeBooks(books);
  res.json(books[bookIndex]);
});

// POST /books/:id/return - Возврат книги в библиотеку
router.post('/:id/return', (req, res) => {
  const books = readBooks();
  const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }

  if (books[bookIndex].available) {
    return res.status(400).json({ error: 'Книга уже в библиотеке' });
  }

  books[bookIndex].available = true;
  books[bookIndex].borrower = null;
  books[bookIndex].returnDate = null;

  writeBooks(books);
  res.json(books[bookIndex]);
});

// DELETE /books/:id - Удаление книги
router.delete('/:id', (req, res) => {
  const books = readBooks();
  const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));

  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Книга не найдена' });
  }

  books.splice(bookIndex, 1);
  writeBooks(books);

  res.json({ message: 'Книга успешно удалена' });
});

module.exports = router;
