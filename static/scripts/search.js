document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const tutorList = document.getElementById('tutorList');
    const tutorCards = tutorList.querySelectorAll('.group');
    const recommendedTutorsSection = document.querySelector('.recommended-tutors');
    const recommendedTutors = document.querySelectorAll('.recommended-tutors .tutor-card');

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();

        if (searchTerm === '') {
            tutorCards.forEach(card => {
                card.style.display = '';
            });
            recommendedTutors.forEach(card => {
                card.style.display = '';
            });
            recommendedTutorsSection.style.display = 'flex';
            return;
        }

        let hasMatches = false;
        tutorCards.forEach(card => {
            const name = card.querySelector('.text-wrapper-10').textContent.toLowerCase();
            const course = card.querySelector('.text-wrapper-11').textContent.toLowerCase();
            const description = card.querySelector('.p')?.textContent.toLowerCase() || '';

            if (name.includes(searchTerm) || course.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = ''; 
                hasMatches = true;
            } else {
                card.style.display = 'none';
            }
        });

        let hasRecommendedMatches = false;
        recommendedTutors.forEach(card => {
            const name = card.querySelector('.text-wrapper-6').textContent.toLowerCase();
            const description = card.querySelector('.text-wrapper-3').textContent.toLowerCase();

            if (name.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = '';
                hasRecommendedMatches = true;
            } else {
                card.style.display = 'none';
            }
        });

        recommendedTutorsSection.style.display = hasRecommendedMatches ? 'flex' : 'none';

        if (!hasMatches && !hasRecommendedMatches) {
            let noResults = document.getElementById('noResults');
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = 'noResults';
                noResults.textContent = 'No tutors found matching your search.';
                noResults.style.textAlign = 'center';
                noResults.style.padding = '20px';
                noResults.style.width = '100%';
                tutorList.appendChild(noResults);
            }
        } else {
            const noResults = document.getElementById('noResults');
            if (noResults) {
                noResults.remove();
            }
        }
    });
});
