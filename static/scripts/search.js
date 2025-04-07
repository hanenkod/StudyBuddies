document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const tutorList = document.querySelector('.tutors-list');
    const tutorCards = tutorList.querySelectorAll('.tutor-card.regular');
    const recommendedTutorsSection = document.querySelector('.recommended-tutors-grid');
    const recommendedTutors = document.querySelectorAll('.recommended-tutors-grid .tutor-card');

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();

        if (searchTerm === '') {
            tutorCards.forEach(card => {
                card.style.display = 'grid';
                card.classList.remove('recommended');
            });
            recommendedTutors.forEach(card => {
                card.style.display = 'flex';
            });
            recommendedTutorsSection.style.display = 'grid';
            return;
        }

        let hasMatches = false;
        tutorCards.forEach(card => {
            const name = card.querySelector('.tutor-name').textContent.toLowerCase();
            const subject = card.querySelector('.tutor-subject').textContent.toLowerCase();
            const bio = card.querySelector('.tutor-bio')?.textContent.toLowerCase() || '';

            if (name.includes(searchTerm) || subject.includes(searchTerm) || bio.includes(searchTerm)) {
                card.style.display = 'grid';
                card.classList.remove('recommended');
                hasMatches = true;
            } else {
                card.style.display = 'none';
            }
        });

        let hasRecommendedMatches = false;
        recommendedTutors.forEach(card => {
            const name = card.querySelector('.tutor-name').textContent.toLowerCase();
            const subject = card.querySelector('.tutor-subject').textContent.toLowerCase();
            const description = card.querySelector('.tutor-description').textContent.toLowerCase();

            if (name.includes(searchTerm) || subject.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
                hasRecommendedMatches = true;
            } else {
                card.style.display = 'none';
            }
        });

        recommendedTutorsSection.style.display = hasRecommendedMatches ? 'grid' : 'none';

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