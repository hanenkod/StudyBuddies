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
                    rightHalf.classList.add('selected'); 
                }
            });
        });
    });
});
