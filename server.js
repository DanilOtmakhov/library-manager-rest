const express = require("express");
const path = require("path");

const app = express();

const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/books", require("./routes/books"));

app.get("/", (req, res) => {
  res.render("index", { title: "Library Home" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
