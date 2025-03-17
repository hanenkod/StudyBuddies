// Impot of the required modules
const express = require("express");
const path = require("path");
<<<<<<< HEAD
const db = require('./services/db'); // Database connection
=======
const session = require("express-session");
const db = require("./services/db"); // Connect to the database
>>>>>>> c02b2a6 (Sprint 3)

// Creating an Express instance
const app = express();

<<<<<<< HEAD
// Installing PUG as a templating engine
=======
<<<<<<< HEAD
// Устанавливаем PUG как шаблонизатор
=======
// Set PUG as a templateizer
>>>>>>> 645c1a0 (Sprint 3)
>>>>>>> c02b2a6 (Sprint 3)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views")); // Specify the folder with the templates

<<<<<<< HEAD

<<<<<<< HEAD
// Connecting static files (CSS, images)
=======
=======
<<<<<<< HEAD
>>>>>>> d8f5229 (Sprint 3)
// Connecting static files (CSS, images, scripts)
=======
// Connecting static files
>>>>>>> c02b2a6 (Sprint 3)
>>>>>>> 12fbb37 (Sprint 3)
app.use(express.static(path.join(__dirname, "../static")));
app.use(express.static(path.join(__dirname, "images")));

<<<<<<< HEAD
// Route for the main page
<<<<<<< HEAD

=======
=======
<<<<<<< HEAD

// Middleware для обработки JSON и сессий
=======
// Middleware for JSON and session processing
>>>>>>> 645c1a0 (Sprint 3)
app.use(express.json());
app.use(session({
    secret: "123", 
    resave: false, 
    saveUninitialized: false
}));

// Home Page
>>>>>>> c02b2a6 (Sprint 3)
>>>>>>> d8f5229 (Sprint 3)
app.get("/", (req, res) => {
  res.render("home-page");
});

<<<<<<< HEAD
=======
<<<<<<< HEAD
// Route for displaying tutors list
=======
// List of tutors
>>>>>>> 645c1a0 (Sprint 3)
>>>>>>> d8f5229 (Sprint 3)
app.get("/tutors", async (req, res) => {
    try {
      const sql = 'SELECT * FROM Tutors';
      const tutors = await db.query(sql);
      res.render("tutor-list", { tutors });
    } catch (err) {
<<<<<<< HEAD
      console.error("Error when retrieving data from the database:", err);
=======
<<<<<<< HEAD
        console.error("Error when retrieving data from the database:", err);
=======
        console.error("Error when uploading tutors:", err);
>>>>>>> 645c1a0 (Sprint 3)
        res.status(500).send("Server error");
    }
});

<<<<<<< HEAD
// Route for displaying tutor profile with subjects
=======
<<<<<<< HEAD
// Маршрут для логина
=======
// Login page
>>>>>>> 645c1a0 (Sprint 3)
app.get("/login", (req, res) => {
    res.render("login", { currentUser: req.session.user });
});

// User authorization
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user;
<<<<<<< HEAD
        let userType = "student"; // По умолчанию студент

        // Проверяем в Users
=======
        let userType = "user"; // Default - user

        // Check in the Users table
>>>>>>> 645c1a0 (Sprint 3)
        let userSql = "SELECT * FROM Users WHERE Email = ? AND Password = ?";
        let users = await db.query(userSql, [email, password]);

        if (users.length === 0) {
            // If not found, check in Tutors
            userSql = "SELECT * FROM Tutors WHERE Email = ? AND Password = ?";
            users = await db.query(userSql, [email, password]);
            if (users.length === 0) {
                return res.status(401).json({ success: false, message: "Неверный email или пароль" });
            }
            userType = "tutor"; // Если найден в Tutors, значит это репетитор
        }

        user = users[0];

<<<<<<< HEAD
        // Сохраняем данные в сессии
=======
        // Saving data in the session
>>>>>>> 645c1a0 (Sprint 3)
        req.session.user = {
            id: user.ID,
            name: user.Name,
            surname: user.Surname,
            type: userType
        };

        res.json({ success: true, userId: user.ID, userType });
    } catch (error) {
<<<<<<< HEAD
        console.error("Ошибка при входе:", error);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Маршрут для профиля студента
=======
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// User Profile
>>>>>>> 645c1a0 (Sprint 3)
app.get("/user-profile/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const userSql = "SELECT * FROM Users WHERE ID = ?";
        const users = await db.query(userSql, [userId]);

        if (users.length === 0) {
            return res.status(404).send("User not found");
        }

        const subjectsSql = `
            SELECT Subjects.Name 
            FROM Users_Subjects 
            JOIN Subjects ON Users_Subjects.SubjectID = Subjects.SubjectID 
            WHERE Users_Subjects.UserID = ?;
        `;
        const subjects = await db.query(subjectsSql, [userId]);

<<<<<<< HEAD
        res.render("user-profile", { user: users[0], subjects, currentUser: req.session.user });
=======
        // Get the average user rating
        const avgRatingSql = "SELECT AVG(Rating) AS avgRating FROM Users_Ratings WHERE UserID = ?";
        const avgRatingResult = await db.query(avgRatingSql, [userId]);
        const avgRating = avgRatingResult[0].avgRating || 0;

        res.render("user-profile", { user: users[0], subjects, currentUser: req.session.user, avgRating });
>>>>>>> 645c1a0 (Sprint 3)
    } catch (error) {
        console.error("Error when loading a user profile:", error);
        res.status(500).send("Server error");
    }
});

<<<<<<< HEAD
// Маршрут для профиля репетитора
=======
app.post("/user-profile", async (req, res) => {
    const { userID, rating } = req.body;
    const tutorID = req.session.user ? req.session.user.id : null;

    if (!tutorID || req.session.user.type !== "tutor") {
        return res.status(403).json({ success: false, message: "Только учителя могут оценивать пользователей" });
    }

    try {
        const checkSql = "SELECT * FROM Users_Ratings WHERE TutorID = ? AND UserID = ?";
        const existingRating = await db.query(checkSql, [tutorID, userID]);

        if (existingRating.length > 0) {
            const updateSql = "UPDATE Users_Ratings SET Rating = ? WHERE TutorID = ? AND UserID = ?";
            await db.query(updateSql, [rating, tutorID, userID]);
        } else {
            const insertSql = "INSERT INTO Users_Ratings (TutorID, UserID, Rating) VALUES (?, ?, ?)";
            await db.query(insertSql, [tutorID, userID, rating]);
        }

        res.json({ success: true, message: "Оценка сохранена" });
    } catch (error) {
        console.error("Ошибка при сохранении оценки:", error);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Tutor Profile
>>>>>>> 645c1a0 (Sprint 3)
>>>>>>> c02b2a6 (Sprint 3)
app.get("/tutor-profile/:id", async (req, res) => {
  try {
      const tutorId = req.params.id;
      console.log("Tutor ID:", tutorId);

      // Получаем информацию о репетиторе
      const tutorSql = 'SELECT * FROM Tutors WHERE ID = ?';
      const tutor = await db.query(tutorSql, [tutorId]);
      console.log("Tutor data:", tutor);

      if (tutor.length === 0) {
          console.log("Tutor not found");
          return res.status(404).send("Tutor not found");
      }

      
      const subjectsSql = `
          SELECT Subjects.Name 
          FROM Tutor_Subjects 
          JOIN Subjects ON Tutor_Subjects.SubjectID = Subjects.SubjectID 
          WHERE Tutor_Subjects.TutorID = ?;
      `;
      const subjects = await db.query(subjectsSql, [tutorId]);
      console.log("Subjects:", subjects);

      
      const ratingSql = 'SELECT AVG(Rating) AS AverageRating FROM Ratings WHERE TutorID = ?';
      const ratingResult = await db.query(ratingSql, [tutorId]);
      tutor[0].AverageRating = parseFloat(ratingResult[0].AverageRating) || 0;

      res.render("tutor-profile", { tutor: tutor[0], subjects });
  } catch (error) {
      console.error("Error:", error);
>>>>>>> d8f5229 (Sprint 3)
      res.status(500).send("Server error");
    }
  });

  app.get("/profile", (req, res) => {
    res.render("profile");
  });

// Route for testing the database
app.get("/db_test", async (req, res) => {
    try {
<<<<<<< HEAD
        // Example of a query for the table test_table
=======
<<<<<<< HEAD
>>>>>>> d8f5229 (Sprint 3)
        const sql = 'SELECT * FROM test_table';
        const results = await db.query(sql); // Using asynchronous query
        console.log(results);
        res.send(results);
    } catch (err) {
        console.error("Database testing error:", err);
=======
        const tutorSql = "SELECT * FROM Tutors WHERE ID = ?";
        const tutors = await db.query(tutorSql, [tutorId]);

        if (tutors.length === 0) {
            return res.status(404).send("Репетитор не найден");
        }

        const subjectsSql = `
            SELECT Subjects.Name 
            FROM Tutor_Subjects 
            JOIN Subjects ON Tutor_Subjects.SubjectID = Subjects.SubjectID 
            WHERE Tutor_Subjects.TutorID = ?;
        `;
        const subjects = await db.query(subjectsSql, [tutorId]);

<<<<<<< HEAD
        res.render("tutor-profile", { tutor: tutors[0], subjects, currentUser: req.session.user });
=======
        // Get the average tutor rating
        const avgRatingSql = "SELECT AVG(Rating) AS avgRating FROM Tutors_Ratings WHERE TutorID = ?";
        const avgRatingResult = await db.query(avgRatingSql, [tutorId]);
        const avgRating = avgRatingResult[0].avgRating || 0;

        res.render("tutor-profile", { tutor: tutors[0], subjects, currentUser: req.session.user, avgRating });
>>>>>>> 645c1a0 (Sprint 3)
    } catch (error) {
        console.error("Error when loading a tutor profile:", error);
>>>>>>> c02b2a6 (Sprint 3)
        res.status(500).send("Server error");
    }
});

<<<<<<< HEAD


// Starting the server on port 3000
app.listen(3000, () => {
    console.log("The server is running on http://127.0.0.1:3000/");
});
=======
<<<<<<< HEAD
// Starting the server on port 3000
app.listen(3000, () => {
    console.log("The server is running on http://127.0.0.1:3000/");
});
=======
<<<<<<< HEAD
// Выход из аккаунта
=======
// Saving the tutor's rating
app.post("/tutor-profile", async (req, res) => {
    const { tutorID, rating } = req.body;
    const userID = req.session.user ? req.session.user.id : null;

    if (!userID || req.session.user.type !== "user") {
        return res.status(403).json({ success: false, message: "Только пользователи могут оценивать учителей" });
    }

    try {
        const checkSql = "SELECT * FROM Tutors_Ratings WHERE TutorID = ? AND UserID = ?";
        const existingRating = await db.query(checkSql, [tutorID, userID]);

        if (existingRating.length > 0) {
            const updateSql = "UPDATE Tutors_Ratings SET Rating = ? WHERE TutorID = ? AND UserID = ?";
            await db.query(updateSql, [rating, tutorID, userID]);
        } else {
            const insertSql = "INSERT INTO Tutors_Ratings (TutorID, UserID, Rating) VALUES (?, ?, ?)";
            await db.query(insertSql, [tutorID, userID, rating]);
        }

        res.json({ success: true, message: "The rating's been saved" });
    } catch (error) {
        console.error("Error when saving a rating:", error);
        res.status(500).json({ success: false, message: "Server" });
    }
});

// Log out of the account
>>>>>>> 645c1a0 (Sprint 3)
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// Start the server
app.listen(3000, () => {
<<<<<<< HEAD
    console.log("Сервер запущен на http://127.0.0.1:3000/");
});
=======
    console.log("The server runs at http://127.0.0.1:3000/");
});
>>>>>>> 645c1a0 (Sprint 3)
>>>>>>> c02b2a6 (Sprint 3)
>>>>>>> d8f5229 (Sprint 3)
