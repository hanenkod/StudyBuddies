document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    let tutors = []; // Здесь будут храниться данные о преподавателях

    // Функция для получения данных о преподавателях с сервера
    async function fetchTutors() {
        try {
            const response = await fetch('/api/tutors');
            tutors = await response.json();
            displaySearchResults(tutors); // Отображаем всех преподавателей при загрузке страницы
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    }

    // Функция для фильтрации преподавателей
    function filterTutors(query) {
        return tutors.filter(tutor => {
            const fullName = `${tutor.Name} ${tutor.Surname}`.toLowerCase();
            return fullName.includes(query.toLowerCase());
        });
    }

    // Функция для отображения результатов поиска
    function displaySearchResults(results) {
        const resultsContainer = document.querySelector(".frame-3");
        resultsContainer.innerHTML = ""; // Очищаем контейнер

        results.forEach(tutor => {
            const tutorElement = document.createElement("div");
            tutorElement.className = "group";
            tutorElement.innerHTML = `
                <div class="frame-4">
                    <div class="frame-5">
                        <div class="text-wrapper-10">${tutor.Name} ${tutor.Surname}</div>
                        <div class="text-wrapper-11">${tutor.Short_Course_Description}</div>
                    </div>
                    <button class="button">
                        <div class="text-wrapper-12">Send Message</div>
                    </button>
                    <img class="user-2" src="/images/user.svg">
                    <p class="p">${tutor.Short_Message}</p>
                    <div class="frame-6" data-rating="${tutor.Rating}">
                        ${Array.from({ length: 5 }, (_, i) => 
                            `<div class="star">
                                <img src="/images/star-filled.svg" class="star-icon filled">
                                <img src="/images/star-half-filled.svg" class="star-icon half">
                            </div>`
                        ).join("")}
                    </div>
                </div>
            `;
            resultsContainer.appendChild(tutorElement);
        });
    }

    // Обработчик события ввода в поле поиска
    searchInput.addEventListener("input", (event) => {
        const query = event.target.value.trim();
        if (query) {
            const results = filterTutors(query);
            displaySearchResults(results);
        } else {
            // Если поле поиска пустое, отображаем всех преподавателей
            displaySearchResults(tutors);
        }
    });

    // Загружаем данные о преподавателях при загрузке страницы
    fetchTutors();
});