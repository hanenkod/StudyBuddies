const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./services/db");
const WebSocket = require('ws');
const multer = require('multer');
const fs = require('fs');
const sanitize = require('sanitize-filename');

const app = express();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Set PUG as a template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Connecting static files
app.use(express.static(path.join(__dirname, "../static")));

// Middleware for JSON and session processing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "123", 
    resave: false, 
    saveUninitialized: false
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to check if the user is a Tutor
function isTutor(req, res, next) {
    if (req.session.user && req.session.user.type === 'tutor') {
        return next();
    }
    res.redirect('/');
}

// Middleware to check if user is a user (Student)
function isUser(req, res, next) {
    if (req.session.user && req.session.user.type === 'user') {
        return next();
    }
    res.redirect('/');
}

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Home Page (Open to ALL users)
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

// Registration page (Open to All users)
app.get("/register", (req, res) => {
    res.render("register", { currentUser: req.session.user });
});

// Handle registration
app.post("/register", async (req, res) => {
    const { name, surname, course, email, password, userType, subjects, shortMessage } = req.body;
    
    try {
        const userCheck = await db.query("SELECT * FROM Users WHERE Email = ?", [email]);
        const tutorCheck = await db.query("SELECT * FROM Tutors WHERE Email = ?", [email]);
        
        if (userCheck.length > 0 || tutorCheck.length > 0) {
            return res.status(400).json({ success: false, message: "Email already in use" });
        }
        
        let userId;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        if (userType === "user") {
            const userSql = 
                `INSERT INTO Users (Name, Surname, Course, Email, Password) 
                VALUES (?, ?, ?, ?, ?)`
            ;
            const userResult = await db.query(userSql, [name, surname, course, email, hashedPassword]);
            userId = userResult.insertId;
            await processSubjects(subjects, userId, 'user');
            
        } else {
            const tutorSql = 
                `INSERT INTO Tutors (Name, Surname, Course, Email, Password, Short_Message) 
                VALUES (?, ?, ?, ?, ?, ?)`
            ;
            const tutorResult = await db.query(tutorSql, [
                name, 
                surname, 
                course, 
                email, 
                hashedPassword,
                shortMessage || null
            ]);
            userId = tutorResult.insertId;
            
            await processSubjects(subjects, userId, 'tutor');
        }
        
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
        const subjectCheck = await db.query("SELECT SubjectID FROM Subjects WHERE Name = ?", [subjectName]);
        
        let subjectId;
        
        if (subjectCheck.length > 0) {
            subjectId = subjectCheck[0].SubjectID;
        } else {
            const newSubject = await db.query("INSERT INTO Subjects (Name) VALUES (?)", [subjectName]);
            subjectId = newSubject.insertId;
        }
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
        let userType = "user"; 
        let userSql = "SELECT * FROM Users WHERE Email = ?";
        let users = await db.query(userSql, [email]);

        if (users.length === 0) {
            userSql = "SELECT * FROM Tutors WHERE Email = ?";
            users = await db.query(userSql, [email]);
            if (users.length === 0) {
                return res.status(401).json({ success: false, message: "Incorrect email or password" });
            }
            userType = "tutor";
        }

        user = users[0];
        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Incorrect email or password" });
        }

        req.session.user = { id: user.ID, name: user.Name, surname: user.Surname, type: userType };
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

        const subjectsSql = 
        `SELECT Subjects.Name 
        FROM Users_Subjects 
        JOIN Subjects ON Users_Subjects.SubjectID = Subjects.SubjectID 
        WHERE Users_Subjects.UserID = ?`;
        const subjects = await db.query(subjectsSql, [userId]);
        const avgRatingSql = "SELECT AVG(Rating) AS avgRating FROM Users_Ratings WHERE UserID = ?";
        const avgRatingResult = await db.query(avgRatingSql, [userId]);
        const avgRating = avgRatingResult[0].avgRating || 0;

        res.render("user-profile", { 
            user: users[0], 
            subjects, 
            currentUser: req.session.user, 
            avgRating 
        });
    } catch (error) {
        console.error("Error when loading a user profile:", error);
        res.status(500).send("Server error");
    }
});

// Saving user rating
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
            WHERE Tutors_Subjects.TutorID = ?
        `;
        const subjects = await db.query(subjectsSql, [tutorId]);
        const avgRatingSql = "SELECT AVG(Rating) AS avgRating FROM Tutors_Ratings WHERE TutorID = ?";
        const avgRatingResult = await db.query(avgRatingSql, [tutorId]);
        const avgRating = avgRatingResult[0].avgRating || 0;

        res.render("tutor-profile", { 
            tutor: tutors[0], 
            subjects, 
            currentUser: req.session.user, 
            avgRating 
        });
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

// Messages System

// Get list of chats for the current user
app.get("/api/chats", isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.type;
        
        let chats;
        if (userType === 'user') {
            chats = await db.query(`
                SELECT c.ChatID, t.ID as TutorID, t.Name, t.Surname, t.Course, 
                       m.MessageText as LastMessage, m.Timestamp as LastMessageTime,
                       SUM(CASE WHEN m.IsRead = FALSE AND m.ReceiverID = ? THEN 1 ELSE 0 END) as UnreadCount
                FROM Chats c
                JOIN Tutors t ON c.TutorID = t.ID
                LEFT JOIN Messages m ON (
                    m.MessageID = (SELECT MAX(MessageID) FROM Messages 
                                   WHERE (SenderID = c.UserID AND ReceiverID = c.TutorID) 
                                   OR (SenderID = c.TutorID AND ReceiverID = c.UserID))
                )
                WHERE c.UserID = ?
                GROUP BY c.ChatID, t.ID, t.Name, t.Surname, t.Course, m.MessageText, m.Timestamp
                ORDER BY m.Timestamp DESC
            `, [userId, userId]);
        } else {
            chats = await db.query(`
                SELECT c.ChatID, u.ID as UserID, u.Name, u.Surname, u.Course, 
                       m.MessageText as LastMessage, m.Timestamp as LastMessageTime,
                       SUM(CASE WHEN m.IsRead = FALSE AND m.ReceiverID = ? THEN 1 ELSE 0 END) as UnreadCount
                FROM Chats c
                JOIN Users u ON c.UserID = u.ID
                LEFT JOIN Messages m ON (
                    m.MessageID = (SELECT MAX(MessageID) FROM Messages 
                                   WHERE (SenderID = c.UserID AND ReceiverID = c.TutorID) 
                                   OR (SenderID = c.TutorID AND ReceiverID = c.UserID))
                )
                WHERE c.TutorID = ?
                GROUP BY c.ChatID, u.ID, u.Name, u.Surname, u.Course, m.MessageText, m.Timestamp
                ORDER BY m.Timestamp DESC
            `, [userId, userId]);
        }
        
        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get messages in a chat
app.post("/api/chats/:chatId/messages", isAuthenticated, async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const { messageText } = req.body;
        const userId = req.session.user.id;
        const userType = req.session.user.type;

        const chat = await db.query("SELECT * FROM Chats WHERE ChatID = ?", [chatId]);
        if (chat.length === 0) {
            return res.status(404).json({ error: "Chat not found" });
        }

        const isUser = userType === 'user';
        const receiverId = isUser ? chat[0].TutorID : chat[0].UserID;
        const receiverType = isUser ? 'tutor' : 'user';

        const result = await db.query(`
            INSERT INTO Messages (SenderID, SenderType, ReceiverID, ReceiverType, MessageText)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, userType, receiverId, receiverType, messageText]);

        await db.query(`UPDATE Chats SET LastMessageTimestamp = NOW() WHERE ChatID = ?`, [chatId]);
        
        wss.clients.forEach(client => {
            if (client.chatId === chatId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'new_message',
                    messageId: result.insertId
                }));
            }
        });

        res.json({ success: true, messageId: result.insertId });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Send a message
app.post("/api/chats/:chatId/messages", isAuthenticated, async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const { messageText } = req.body;
        const userId = req.session.user.id;
        const userType = req.session.user.type;

        const chat = await db.query("SELECT * FROM Chats WHERE ChatID = ?", [chatId]);
        if (chat.length === 0) {
            return res.status(404).json({ error: "Chat not found" });
        }

        const isUser = userType === 'user';
        const receiverId = isUser ? chat[0].TutorID : chat[0].UserID;
        const receiverType = isUser ? 'tutor' : 'user';

        const result = await db.query(`
            INSERT INTO Messages (SenderID, SenderType, ReceiverID, ReceiverType, MessageText)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, userType, receiverId, receiverType, messageText]);

        await db.query(`UPDATE Chats SET LastMessageTimestamp = NOW() WHERE ChatID = ?`, [chatId]);
        
        wss.clients.forEach(client => {
            if (client.chatId === chatId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'new_message',
                    message: {
                        MessageID: result.insertId,
                        MessageText: messageText,
                        SenderID: userId,
                        SenderType: userType,
                        ReceiverID: receiverId,
                        ReceiverType: receiverType,
                        Timestamp: new Date().toISOString(),
                        IsRead: false,
                        IsFile: false,
                        SenderName: req.session.user.name + ' ' + req.session.user.surname
                    },
                    senderId: userId
                }));
            }
        });

        res.json({ success: true, messageId: result.insertId });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Create a new chat
app.post("/api/chats", isAuthenticated, async (req, res) => {
    try {
        const { tutorId } = req.body;
        const userId = req.session.user.id;
        
        if (req.session.user.type !== 'user') {
            return res.status(403).json({ error: "Only users can initiate chats" });
        }
        
        const tutor = await db.query("SELECT * FROM Tutors WHERE ID = ?", [tutorId]);
        if (tutor.length === 0) {
            return res.status(404).json({ error: "Tutor not found" });
        }
        
        const existingChat = await db.query(`
            SELECT * FROM Chats 
            WHERE UserID = ? AND TutorID = ?
        `, [userId, tutorId]);
        
        if (existingChat.length > 0) {
            return res.json({ chatId: existingChat[0].ChatID });
        }
        
        const result = await db.query(`
            INSERT INTO Chats (UserID, TutorID, LastMessageTimestamp)
            VALUES (?, ?, NOW())
        `, [userId, tutorId]);
        
        res.json({ chatId: result.insertId });
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Chats list page
app.get("/chats", isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const userType = req.session.user.type;
        
        let chats;
        if (userType === 'user') {
            chats = await db.query(`
                SELECT c.ChatID, t.ID as TutorID, t.Name, t.Surname, t.Course, 
                       m.MessageText as LastMessage, m.Timestamp as LastMessageTime,
                       SUM(CASE WHEN m.IsRead = FALSE AND m.ReceiverID = ? THEN 1 ELSE 0 END) as UnreadCount
                FROM Chats c
                JOIN Tutors t ON c.TutorID = t.ID
                LEFT JOIN Messages m ON (
                    m.MessageID = (SELECT MAX(MessageID) FROM Messages 
                                   WHERE (SenderID = c.UserID AND ReceiverID = c.TutorID) 
                                   OR (SenderID = c.TutorID AND ReceiverID = c.UserID))
                )
                WHERE c.UserID = ?
                GROUP BY c.ChatID, t.ID, t.Name, t.Surname, t.Course, m.MessageText, m.Timestamp
                ORDER BY m.Timestamp DESC
            `, [userId, userId]);
        } else {
            chats = await db.query(`
                SELECT c.ChatID, u.ID as UserID, u.Name, u.Surname, u.Course, 
                       m.MessageText as LastMessage, m.Timestamp as LastMessageTime,
                       SUM(CASE WHEN m.IsRead = FALSE AND m.ReceiverID = ? THEN 1 ELSE 0 END) as UnreadCount
                FROM Chats c
                JOIN Users u ON c.UserID = u.ID
                LEFT JOIN Messages m ON (
                    m.MessageID = (SELECT MAX(MessageID) FROM Messages 
                                   WHERE (SenderID = c.UserID AND ReceiverID = c.TutorID) 
                                   OR (SenderID = c.TutorID AND ReceiverID = c.UserID))
                )
                WHERE c.TutorID = ?
                GROUP BY c.ChatID, u.ID, u.Name, u.Surname, u.Course, m.MessageText, m.Timestamp
                ORDER BY m.Timestamp DESC
            `, [userId, userId]);
        }
        
        res.render("chats-list", { 
            chats, 
            currentUser: req.session.user,
            formatTime: (timestamp) => {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        });
    } catch (error) {
        console.error("Error loading chats:", error);
        res.status(500).send("Server error");
    }
});

// Chat page
app.get("/chat/:chatId", isAuthenticated, async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const userId = req.session.user.id;        
        const chat = await db.query(`
            SELECT c.*, 
                   u.Name as UserName, u.Surname as UserSurname, u.Course as UserCourse,
                   t.Name as TutorName, t.Surname as TutorSurname, t.Course as TutorCourse
            FROM Chats c
            LEFT JOIN Users u ON c.UserID = u.ID
            LEFT JOIN Tutors t ON c.TutorID = t.ID
            WHERE c.ChatID = ? AND (c.UserID = ? OR c.TutorID = ?)
        `, [chatId, userId, userId]);
        
        if (chat.length === 0) {
            return res.status(403).send("Access denied");
        }
        
        const messages = await db.query(`
            SELECT m.*, 
                   CASE 
                     WHEN m.SenderID = ? THEN 'sent' 
                     ELSE 'received' 
                   END as messageType,
                   CONCAT(IFNULL(u.Name, t.Name), ' ', IFNULL(u.Surname, t.Surname)) as SenderFullName
            FROM Messages m
            LEFT JOIN Users u ON m.SenderID = u.ID AND m.SenderType = 'user'
            LEFT JOIN Tutors t ON m.SenderID = t.ID AND m.SenderType = 'tutor'
            WHERE (m.SenderID = ? AND m.ReceiverID = ?) 
               OR (m.SenderID = ? AND m.ReceiverID = ?)
            ORDER BY m.Timestamp ASC
        `, [userId, chat[0].UserID, chat[0].TutorID, chat[0].TutorID, chat[0].UserID]);
        
        await db.query(`
            UPDATE Messages 
            SET IsRead = TRUE 
            WHERE ReceiverID = ? AND SenderID = ? AND IsRead = FALSE
        `, [userId, userId === chat[0].UserID ? chat[0].TutorID : chat[0].UserID]);
        
        const partner = {
            ID: userId === chat[0].UserID ? chat[0].TutorID : chat[0].UserID,
            Name: userId === chat[0].UserID ? chat[0].TutorName : chat[0].UserName,
            Surname: userId === chat[0].UserID ? chat[0].TutorSurname : chat[0].UserSurname,
            Course: userId === chat[0].UserID ? chat[0].TutorCourse : chat[0].UserCourse
        };
        
        res.render("chat", { 
            messages,
            partner,
            currentUser: req.session.user,
            formatTime: (timestamp) => {
                if (!timestamp) return '';
                const date = new Date(timestamp);
                return date.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'UTC'
                });
            },
            profileLink: userId === chat[0].UserID ? 
                `/tutor-profile/${chat[0].TutorID}` : 
                `/user-profile/${chat[0].UserID}`
        });
    } catch (error) {
        console.error("Error loading chat:", error);
        res.status(500).send("Server error");
    }
});

// Start a new chat
app.get("/start-chat/:tutorId", isUser, async (req, res) => {
    try {
        const tutorId = req.params.tutorId;
        const userId = req.session.user.id;
        
        const existingChat = await db.query(`
            SELECT * FROM Chats 
            WHERE UserID = ? AND TutorID = ?
        `, [userId, tutorId]);
        
        let chatId;
        if (existingChat.length > 0) {
            chatId = existingChat[0].ChatID;
        } else {
            const result = await db.query(`
                INSERT INTO Chats (UserID, TutorID, LastMessageTimestamp)
                VALUES (?, ?, NOW())
            `, [userId, tutorId]);
            chatId = result.insertId;
        }
        
        res.redirect(`/chat/${chatId}`);
    } catch (error) {
        console.error("Error starting chat:", error);
        res.status(500).send("Server error");
    }
});

app.get('/download/:filename', (req, res, next) => {
    const sanitizedFilename = sanitize(req.params.filename);
    if (sanitizedFilename !== req.params.filename) {
        return res.status(400).send('Invalid filename');
    }
    next();
}, (req, res) => {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
});

app.post("/api/chats/:chatId/files", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const chatId = req.params.chatId;
        const userId = req.session.user.id;
        const userType = req.session.user.type;
        
        const chat = await db.query("SELECT * FROM Chats WHERE ChatID = ?", [chatId]);
        if (chat.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: "Chat not found" });
        }

        const isUser = userType === 'user';
        const receiverId = isUser ? chat[0].TutorID : chat[0].UserID;
        const receiverType = isUser ? 'tutor' : 'user';

        const fileName = req.file.originalname;
        
        const result = await db.query(`
            INSERT INTO Messages (SenderID, SenderType, ReceiverID, ReceiverType, MessageText, IsFile)
            VALUES (?, ?, ?, ?, ?, TRUE)
        `, [userId, userType, receiverId, receiverType, fileName]);

        await db.query(`UPDATE Chats SET LastMessageTimestamp = NOW() WHERE ChatID = ?`, [chatId]);
        
        wss.clients.forEach(client => {
            if (client.chatId === chatId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'new_message',
                    messageId: result.insertId
                }));
            }
        });

        res.json({ success: true, messageId: result.insertId });
    } catch (error) {
        console.error("Error sending file:", error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Failed to send file" });
    }
});

// Log out of the account
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// Start the server
const server = app.listen(3000, () => {
    console.log("The server runs at http://127.0.0.1:3000/");
});


const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const chatId = req.url.split('/')[3];
    ws.chatId = chatId;
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'new_message') {
                wss.clients.forEach(client => {
                    if (client.chatId === chatId && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'new_message',
                            message: {
                                MessageID: data.message.MessageID,
                                MessageText: data.message.MessageText,
                                SenderID: data.senderId,
                                SenderType: data.message.SenderType,
                                ReceiverID: data.message.ReceiverID,
                                ReceiverType: data.message.ReceiverType,
                                Timestamp: data.message.Timestamp,
                                IsRead: data.message.IsRead,
                                IsFile: data.message.IsFile,
                                SenderFullName: data.message.SenderFullName || data.message.SenderName
                            },
                            senderId: data.senderId
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('WebSocket error:', error);
        }
    });
});
