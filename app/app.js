const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./services/db"); // Connect to the database

const app = express();

// Set PUG as a templateizer
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Connecting static files
app.use(express.static(path.join(__dirname, "../static")));

// Middleware for JSON and session processing
app.use(express.json());
app.use(session({
    secret: "123", 
    resave: false, 
    saveUninitialized: false
}));

// Home Page
app.get("/", (req, res) => {
    res.render("home-page", { currentUser: req.session.user });
});

// List of tutors
app.get("/tutors", async (req, res) => {
    try {
        const sql = 'SELECT * FROM Tutors';
        const tutors = await db.query(sql);
        res.render("tutor-list", { tutors, currentUser: req.session.user });
    } catch (err) {
        console.error("Error when uploading tutors:", err);
        res.status(500).send("Server error");
    }
});

// Login page
app.get("/login", (req, res) => {
    res.render("login", { currentUser: req.session.user });
});

// User authorization
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user;
        let userType = "user"; // Default - user

        // Check in the Users table
        let userSql = "SELECT * FROM Users WHERE Email = ? AND Password = ?";
        let users = await db.query(userSql, [email, password]);

        if (users.length === 0) {
            // If not found, check in Tutors
            userSql = "SELECT * FROM Tutors WHERE Email = ? AND Password = ?";
            users = await db.query(userSql, [email, password]);
            if (users.length === 0) {
                return res.status(401).json({ success: false, message: "Неверный email или пароль" });
            }
            userType = "tutor";
        }

        user = users[0];

        // Saving data in the session
        req.session.user = {
            id: user.ID,
            name: user.Name,
            surname: user.Surname,
            type: userType
        };

        res.json({ success: true, userId: user.ID, userType });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// User Profile
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

        // Get the average user rating
        const avgRatingSql = "SELECT AVG(Rating) AS avgRating FROM Users_Ratings WHERE UserID = ?";
        const avgRatingResult = await db.query(avgRatingSql, [userId]);
        const avgRating = avgRatingResult[0].avgRating || 0;

        res.render("user-profile", { user: users[0], subjects, currentUser: req.session.user, avgRating });
    } catch (error) {
        console.error("Error when loading a user profile:", error);
        res.status(500).send("Server error");
    }
});

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
app.get("/tutor-profile/:id", async (req, res) => {
    const tutorId = req.params.id;

    try {
        const tutorSql = "SELECT * FROM Tutors WHERE ID = ?";
        const tutors = await db.query(tutorSql, [tutorId]);

        if (tutors.length === 0) {
            return res.status(404).send("Репетитор не найден");
        }

        const subjectsSql = `
            SELECT Subjects.Name 
            FROM Tutors_Subjects 
            JOIN Subjects ON Tutors_Subjects.SubjectID = Subjects.SubjectID 
            WHERE Tutors_Subjects.TutorID = ?;
        `;
        const subjects = await db.query(subjectsSql, [tutorId]);

        // Get the average tutor rating
        const avgRatingSql = "SELECT AVG(Rating) AS avgRating FROM Tutors_Ratings WHERE TutorID = ?";
        const avgRatingResult = await db.query(avgRatingSql, [tutorId]);
        const avgRating = avgRatingResult[0].avgRating || 0;

        res.render("tutor-profile", { tutor: tutors[0], subjects, currentUser: req.session.user, avgRating });
    } catch (error) {
        console.error("Error when loading a tutor profile:", error);
        res.status(500).send("Server error");
    }
});

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
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// Start the server
app.listen(3000, () => {
    console.log("The server runs at http://127.0.0.1:3000/");
});
