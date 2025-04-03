document.addEventListener('DOMContentLoaded', function() {
    const modal = document.querySelector('.modal-container');
    const modalOverlay = document.querySelector('.modal-overlay');
    const reportBtn = document.querySelector('.btn-report');
    const closeModalBtn = document.querySelector('.btn-cancel');
    const submitBtn = document.querySelector('.btn-submit');
    
    reportBtn.addEventListener('click', function() {
      modalOverlay.style.display = 'block';
      modal.style.display = 'block';
    });
  
    closeModalBtn.addEventListener('click', function() {
      modalOverlay.style.display = 'none';
      modal.style.display = 'none';
    });
  
    submitBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const reportText = document.querySelector('.report-textarea').value;
      
      if (reportText.trim()) {
        alert('Report submitted successfully!');
        modalOverlay.style.display = 'none';
        modal.style.display = 'none';
      } else {
        alert('Please enter your report reason.');
      }
    });
  
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
        modal.style.display = 'none';
      }
    });
});