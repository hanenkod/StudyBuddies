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
        
        
        tutors.forEach(tutor => {
            if (!tutor.Short_Message) {
                tutor.Short_Message = tutor.Short_Course_Description || '';
            }
        });
        
        res.render("tutor-list", { 
            tutors, 
            currentUser: req.session.user,
            searchQuery: req.query.search || '' 
        });
    } catch (err) {
        console.error("Error when uploading tutors:", err);
        res.status(500).send("Server error");
    }
});

// Registration page
app.get("/register", (req, res) => {
    res.render("register", { currentUser: req.session.user });
});

// Handle registration
app.post("/register", async (req, res) => {
    const { name, surname, course, email, password, userType, subjects, shortMessage } = req.body;
    
    try {
        // Check if email already exists in either table
        const userCheck = await db.query("SELECT * FROM Users WHERE Email = ?", [email]);
        const tutorCheck = await db.query("SELECT * FROM Tutors WHERE Email = ?", [email]);
        
        if (userCheck.length > 0 || tutorCheck.length > 0) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }
        
        let userId;
        
        if (userType === "user") {
            // Insert into Users table
            const userSql = `
                INSERT INTO Users (Name, Surname, Course, Email, Password) 
                VALUES (?, ?, ?, ?, ?)
            `;
            const userResult = await db.query(userSql, [name, surname, course, email, password]);
            userId = userResult.insertId;
            
            // Handle subjects for user
            await processSubjects(subjects, userId, 'user');
            
        } else {
            // Insert into Tutors table
            const tutorSql = `
                INSERT INTO Tutors (Name, Surname, Course, Email, Password, Short_Message) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const tutorResult = await db.query(tutorSql, [
                name, 
                surname, 
                course, 
                email, 
                password,
                shortMessage || null  // Use null if shortMessage is empty
            ]);
            userId = tutorResult.insertId;
            
            // Handle subjects for tutor
            await processSubjects(subjects, userId, 'tutor');
        }
        
        // Set session and redirect
        req.session.user = {
            id: userId,
            name,
            surname,
            type: userType
        };
        
        res.json({ 
            success: true, 
            redirectUrl: userType === 'user' ? `/user-profile/${userId}` : `/tutor-profile/${userId}`
        });
        
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ success: false, message: "Server error during registration" });
    }
});

// Helper function to process subjects
async function processSubjects(subjects, userId, userType) {
    for (const subjectName of subjects) {
        // Check if subject exists
        const subjectCheck = await db.query("SELECT SubjectID FROM Subjects WHERE Name = ?", [subjectName]);
        
        let subjectId;
        
        if (subjectCheck.length > 0) {
            subjectId = subjectCheck[0].SubjectID;
        } else {
            // Create new subject if it doesn't exist
            const newSubject = await db.query("INSERT INTO Subjects (Name) VALUES (?)", [subjectName]);
            subjectId = newSubject.insertId;
        }
        
        // Insert into appropriate join table
        const joinTable = userType === 'user' ? 'Users_Subjects' : 'Tutors_Subjects';
        const idField = userType === 'user' ? 'UserID' : 'TutorID';
        
        await db.query(`INSERT INTO ${joinTable} (${idField}, SubjectID) VALUES (?, ?)`, [userId, subjectId]);
    }
}

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
                return res.status(401).json({ success: false, message: "Incorrect email or password" });
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
        return res.status(403).json({ success: false, message: "Only teachers can rate Users." });
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

        res.json({ success: true, message: "Rating Saved" });
    } catch (error) {
        console.error("Error Saving Rating:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Tutor Profile
app.get("/tutor-profile/:id", async (req, res) => {
    const tutorId = req.params.id;

    try {
        const tutorSql = "SELECT * FROM Tutors WHERE ID = ?";
        const tutors = await db.query(tutorSql, [tutorId]);

        if (tutors.length === 0) {
            return res.status(404).send("Tutor not found");
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
        return res.status(403).json({ success: false, message: "Only Users can rate Teachers" });
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
