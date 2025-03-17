document.addEventListener('DOMContentLoaded', function () {
    const starContainers = document.querySelectorAll('.stars-container');

    starContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        const profileID = container.getAttribute('data-profile-id');
        let selectedRating = 0;

        stars.forEach(star => {
            const leftHalf = star.querySelector('.left');
            const rightHalf = star.querySelector('.right');

            star.addEventListener('mousemove', (e) => {
                const rect = star.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;

                stars.forEach(s => {
                    s.classList.remove('hovered');
                    s.querySelector('.left').classList.remove('hovered');
                    s.querySelector('.right').classList.remove('hovered');
                });

                const currentValue = parseInt(star.dataset.value, 10);

                stars.forEach(s => {
                    const starValue = parseInt(s.dataset.value, 10);
                    if (starValue < currentValue) {
                        s.classList.add('hovered');
                        s.querySelector('.left').classList.add('hovered');
                        s.querySelector('.right').classList.add('hovered');
                    }
                });

                if (mouseX <= rect.width / 2) {
                    leftHalf.classList.add('hovered');
                } else {
                    leftHalf.classList.add('hovered');
                    rightHalf.classList.add('hovered');
                }
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => {
                    s.classList.remove('hovered');
                    s.querySelector('.left').classList.remove('hovered');
                    s.querySelector('.right').classList.remove('hovered');
                });
            });

            star.addEventListener('click', async (e) => {
                const rect = star.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                selectedRating = parseInt(star.dataset.value, 10);

                stars.forEach(s => {
                    s.classList.remove('selected');
                    s.querySelector('.left').classList.remove('selected');
                    s.querySelector('.right').classList.remove('selected');
                });

                stars.forEach(s => {
                    const starValue = parseInt(s.dataset.value, 10);
                    if (starValue < selectedRating) {
                        s.classList.add('selected');
                        s.querySelector('.left').classList.add('selected');
                        s.querySelector('.right').classList.add('selected');
                    }
                });

                if (mouseX <= rect.width / 2) {
                    leftHalf.classList.add('selected');
                } else {
                    leftHalf.classList.add('selected');
                    rightHalf.classList.add('selected');
                }

                // Определяем, кого оцениваем
                const isTutorPage = window.location.pathname.includes("tutor-profile");
                const ratingData = isTutorPage
                    ? { tutorID: profileID, rating: selectedRating }
                    : { userID: profileID, rating: selectedRating };

                const endpoint = isTutorPage ? "/tutor-profile" : "/user-profile";

                // Отправляем оценку на сервер
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(ratingData),
                    });

                    if (response.ok) {
                        alert('Оценка успешно отправлена!');
                        window.location.reload();
                    } else {
                        alert('Не удалось отправить оценку.');
                    }
                } catch (error) {
                    console.error('Ошибка:', error);
                }
            });
        });
    });
});
