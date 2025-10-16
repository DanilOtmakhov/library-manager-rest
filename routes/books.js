const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dataPath = path.join(__dirname, "../data/books.json");

function getBooks() {
  const data = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(data);
}

function saveBooks(books) {
  fs.writeFileSync(dataPath, JSON.stringify(books, null, 2));
}

router.get("/", (req, res) => {
  const books = getBooks();
  res.json(books);
});

router.get("/:id", (req, res) => {
  const books = getBooks();
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.json(book);
});

router.post("/", (req, res) => {
  const books = getBooks();
  const newBook = {
    id: Date.now(),
    title: req.body.title,
    author: req.body.author,
    year: req.body.year,
    available: true,
    borrower: null,
    returnDate: null,
  };
  books.push(newBook);
  saveBooks(books);
  res.status(201).json(newBook);
});

module.exports = router;
