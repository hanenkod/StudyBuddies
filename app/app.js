// Impot of the required modules
const express = require("express");
const path = require("path");
const db = require('./services/db'); // Database connection

// Creating an Express instance
const app = express();

// Installing PUG as a templating engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views")); // Specify the folder with the templates


// Connecting static files (CSS, images)
app.use(express.static(path.join(__dirname, "../static")));
app.use(express.static(path.join(__dirname, "images")));

// Route for the main page

app.get("/", (req, res) => {
  res.render("home-page");
});

app.get("/tutors", async (req, res) => {
    try {
      const sql = 'SELECT * FROM Tutors';
      const tutors = await db.query(sql);
      res.render("tutor-list", { tutors });
    } catch (err) {
      console.error("Error when retrieving data from the database:", err);
      res.status(500).send("Server error");
    }
  });

  app.get("/profile", (req, res) => {
    res.render("profile");
  });

// Route for testing the database
app.get("/db_test", async (req, res) => {
    try {
        // Example of a query for the table test_table
        const sql = 'SELECT * FROM test_table';
        const results = await db.query(sql); // Using asynchronous query
        console.log(results);
        res.send(results);
    } catch (err) {
        console.error("Database testing error:", err);
        res.status(500).send("Server error");
    }
});



// Starting the server on port 3000
app.listen(3000, () => {
    console.log("The server is running on http://127.0.0.1:3000/");
});