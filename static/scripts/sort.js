document.addEventListener('DOMContentLoaded', function () {
    const sortBySelect = document.getElementById('sort-by');
    const tutorsContainer = document.querySelector('.frame-3');
    let originalOrder = Array.from(document.querySelectorAll('.group'));

    sortBySelect.addEventListener('change', function () {
        const sortOption = this.value;
        sortTutors(sortOption);
    });

    function sortTutors(sortOption) {
        const tutors = Array.from(document.querySelectorAll('.group'));

        if (sortOption === 'default') {
            
            tutorsContainer.innerHTML = '';
            originalOrder.forEach(tutor => tutorsContainer.appendChild(tutor.cloneNode(true)));
        } else {
            
            tutors.sort((a, b) => {
                if (sortOption === 'alphabetical') {
                    const nameA = a.querySelector('.text-wrapper-10').textContent.trim();
                    const nameB = b.querySelector('.text-wrapper-10').textContent.trim();
                    return nameA.localeCompare(nameB);
                } else if (sortOption === 'rating') {
                    const ratingA = parseFloat(a.querySelector('.frame-6').getAttribute('data-rating'));
                    const ratingB = parseFloat(b.querySelector('.frame-6').getAttribute('data-rating'));
                    return ratingB - ratingA;
                }
                return 0;
            });

            tutorsContainer.innerHTML = '';
            tutors.forEach(tutor => tutorsContainer.appendChild(tutor));
        }
    }
});