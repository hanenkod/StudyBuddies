document.addEventListener('DOMContentLoaded', function() {
    const tutorList = document.getElementById('tutorList');
    const previousBtn = document.getElementById('previousBtn');
    const nextBtn = document.getElementById('nextBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageButtons = document.querySelectorAll('.page-btn');
    const tutorsPerPage = 5;
    let currentPage = 0;

    const tutors = Array.from(tutorList.querySelectorAll('.group'));

    function showTutors(page) {
      const startIndex = page * tutorsPerPage;
      const endIndex = startIndex + tutorsPerPage;

      tutors.forEach((tutor, index) => {
        if (index >= startIndex && index < endIndex) {
          tutor.style.display = 'block';
        } else {
          tutor.style.display = 'none';
        }
      });

      previousBtn.disabled = page === 0;
      nextBtn.disabled = endIndex >= tutors.length;

      // Update active state for page buttons
      pageButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.page) === page);
      });
    }

    previousBtn.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        showTutors(currentPage);
      }
    });

    nextBtn.addEventListener('click', () => {
      if ((currentPage + 1) * tutorsPerPage < tutors.length) {
        currentPage++;
        showTutors(currentPage);
      }
    });

    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage--;
        showTutors(currentPage);
      }
    });

    nextPageBtn.addEventListener('click', () => {
      if ((currentPage + 1) * tutorsPerPage < tutors.length) {
        currentPage++;
        showTutors(currentPage);
      }
    });

    pageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        currentPage = page;
        showTutors(currentPage);
      });
    });

    // Initial load
    showTutors(currentPage);
  });