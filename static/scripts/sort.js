document.addEventListener('DOMContentLoaded', function() {
    const sortBySelect = document.getElementById('sort-by');
    const tutorsContainer = document.querySelector('.tutors-list');
    const originalOrder = Array.from(tutorsContainer.querySelectorAll('.tutor-card.regular'));

    sortBySelect.addEventListener('change', function() {
        const sortOption = this.value;
        sortTutors(sortOption);
    });

    function sortTutors(sortOption) {
        const tutors = Array.from(tutorsContainer.querySelectorAll('.tutor-card.regular'));

        if (sortOption === 'default') {
            tutors.forEach(tutor => tutor.remove());
            originalOrder.forEach(tutor => {
                tutorsContainer.appendChild(tutor);
                tutor.style.display = 'grid'; 
                tutor.classList.remove('recommended');
            });
        } else {
            tutors.sort((a, b) => {
                if (sortOption === 'alphabetical') {
                    const nameA = a.querySelector('.tutor-name').textContent.trim();
                    const nameB = b.querySelector('.tutor-name').textContent.trim();
                    return nameA.localeCompare(nameB);
                } else if (sortOption === 'rating') {
                    const ratingA = parseFloat(a.querySelector('.tutor-rating').getAttribute('data-rating')) || 0;
                    const ratingB = parseFloat(b.querySelector('.tutor-rating').getAttribute('data-rating')) || 0;
                    return ratingB - ratingA;
                }
                return 0;
            });

            tutors.forEach(tutor => tutor.remove());
            tutors.forEach(tutor => {
                tutorsContainer.appendChild(tutor);
                tutor.style.display = 'grid';
                tutor.classList.remove('recommended');
            });
        }
        
        if (typeof initButtons === 'function') {
            initButtons();
        }
    }
});