function initButtons() {
    // View Profile buttons
    document.querySelectorAll('.view-profile').forEach(button => {
      button.addEventListener('click', function() {
        const tutorId = this.dataset.tutorId;
        window.location.href = `/tutor-profile/${tutorId}`;
      });
    });
  
    // Pagination buttons
    const previousBtn = document.getElementById('previousBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageButtons = document.querySelectorAll('.page-btn:not(.ellipsis)');
    
    if (previousBtn && nextBtn) {
      previousBtn.addEventListener('click', () => {
        const currentPage = parseInt(document.querySelector('.page-btn.active').dataset.page);
        if (currentPage > 0) {
          document.querySelector(`.page-btn[data-page="${currentPage - 1}"]`).click();
        }
      });
      
      nextBtn.addEventListener('click', () => {
        const currentPage = parseInt(document.querySelector('.page-btn.active').dataset.page);
        const totalPages = parseInt(document.querySelectorAll('.page-btn:not(.ellipsis)').length);
        if (currentPage < totalPages - 1) {
          document.querySelector(`.page-btn[data-page="${currentPage + 1}"]`).click();
        }
      });
    }
    
    pageButtons.forEach(btn => {
      if (!btn.classList.contains('ellipsis')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(btn.dataset.page);
          showTutors(page);
        });
      }
    });

    showTutors(0);
  }
  
  function showTutors(page) {
    const tutorsPerPage = 4;
    const tutors = document.querySelectorAll('.tutors-list .tutor-card.regular');
    const startIndex = page * tutorsPerPage;
    
    tutors.forEach((tutor, index) => {
      if (index >= startIndex && index < startIndex + tutorsPerPage) {
        tutor.style.display = 'grid'; 
        tutor.classList.remove('recommended'); 
      } else {
        tutor.style.display = 'none';
      }
    });
    
    // Update active page button
    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.page) === page);
    });
    
    // Update navigation buttons
    document.getElementById('previousBtn').disabled = page === 0;
    document.getElementById('nextBtn').disabled = startIndex + tutorsPerPage >= tutors.length;
  }
  
  document.addEventListener('DOMContentLoaded', initButtons);