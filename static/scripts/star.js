document.addEventListener('DOMContentLoaded', function () {
    const starContainers = document.querySelectorAll('.frame-6');

    starContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');

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

            star.addEventListener('click', (e) => {
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
<<<<<<< HEAD
                    rightHalf.classList.add('selected'); 
=======
                    rightHalf.classList.add('selected');
                }

<<<<<<< HEAD
                // Отправка оценки на сервер
=======
                // Determine who we're rating
                const isTutorPage = window.location.pathname.includes("tutor-profile");
                const ratingData = isTutorPage
                    ? { tutorID: profileID, rating: selectedRating }
                    : { userID: profileID, rating: selectedRating };

                const endpoint = isTutorPage ? "/tutor-profile" : "/user-profile";

                // Send the evaluation to the server
>>>>>>> 645c1a0 (Sprint 3)
                try {
                    const response = await fetch('/rate-tutor', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            tutorID: tutorID,
                            rating: selectedRating,
                        }),
                    });

                    if (response.ok) {
<<<<<<< HEAD
                        alert('Rating submitted successfully!');
                        window.location.reload(); // Обновить страницу для отображения нового рейтинга
                    } else {
                        alert('Failed to submit rating.');
=======
                        alert('Rating has been successfully submitted!');
                        window.location.reload();
                    } else {
                        alert('An error occurred while submitting the rating. Please try again later.');
>>>>>>> 645c1a0 (Sprint 3)
                    }
                } catch (error) {
                    console.error('Error:', error);
>>>>>>> d8f5229 (Sprint 3)
                }
            });
        });
    });
});
