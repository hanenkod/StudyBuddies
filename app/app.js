const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./services/db"); // Подключение к базе данных

const app = express();

// Устанавливаем PUG как шаблонизатор
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Подключение статических файлов
app.use(express.static(path.join(__dirname, "../static")));


// Middleware для обработки JSON и сессий
app.use(express.json());
app.use(session({
    secret: "123", 
    resave: false, 
    saveUninitialized: false
}));

// Главная страница
app.get("/", (req, res) => {
    res.render("home-page", { currentUser: req.session.user });
});

// Route for displaying tutors list
app.get("/tutors", async (req, res) => {
    try {
        const sql = 'SELECT * FROM Tutors';
        const tutors = await db.query(sql);
        res.render("tutor-list", { tutors, currentUser: req.session.user });
    } catch (err) {
        console.error("Error when retrieving data from the database:", err);
        res.status(500).send("Server error");
    }
});

// Маршрут для логина
app.get("/login", (req, res) => {
    res.render("login", { currentUser: req.session.user });
});

// Авторизация пользователя
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user;
        let userType = "student"; // По умолчанию студент

        // Проверяем в Users
        let userSql = "SELECT * FROM Users WHERE Email = ? AND Password = ?";
        let users = await db.query(userSql, [email, password]);

        if (users.length === 0) {
            // Если не найдено, проверяем в Tutors
            userSql = "SELECT * FROM Tutors WHERE Email = ? AND Password = ?";
            users = await db.query(userSql, [email, password]);
            if (users.length === 0) {
                return res.status(401).json({ success: false, message: "Неверный email или пароль" });
            }
            userType = "tutor"; // Если найден в Tutors, значит это репетитор
        }

        user = users[0];

        // Сохраняем данные в сессии
        req.session.user = {
            id: user.ID,
            name: user.Name,
            surname: user.Surname,
            type: userType
        };

        res.json({ success: true, userId: user.ID, userType });
    } catch (error) {
        console.error("Ошибка при входе:", error);
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Маршрут для профиля студента
app.get("/user-profile/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const userSql = "SELECT * FROM Users WHERE ID = ?";
        const users = await db.query(userSql, [userId]);

        if (users.length === 0) {
            return res.status(404).send("Пользователь не найден");
        }

        const subjectsSql = `
            SELECT Subjects.Name 
            FROM Users_Subjects 
            JOIN Subjects ON Users_Subjects.SubjectID = Subjects.SubjectID 
            WHERE Users_Subjects.UserID = ?;
        `;
        const subjects = await db.query(subjectsSql, [userId]);

        res.render("user-profile", { user: users[0], subjects, currentUser: req.session.user });
    } catch (error) {
        console.error("Ошибка при загрузке профиля пользователя:", error);
        res.status(500).send("Ошибка сервера");
    }
});

// Маршрут для профиля репетитора
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
            FROM Tutor_Subjects 
            JOIN Subjects ON Tutor_Subjects.SubjectID = Subjects.SubjectID 
            WHERE Tutor_Subjects.TutorID = ?;
        `;
        const subjects = await db.query(subjectsSql, [tutorId]);

        res.render("tutor-profile", { tutor: tutors[0], subjects, currentUser: req.session.user });
    } catch (error) {
        console.error("Ошибка при загрузке профиля репетитора:", error);
        res.status(500).send("Ошибка сервера");
    }
});

// Выход из аккаунта
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// Запуск сервера
app.listen(3000, () => {
    console.log("Сервер запущен на http://127.0.0.1:3000/");
});