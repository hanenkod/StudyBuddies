document.addEventListener('DOMContentLoaded', function () {
    const modal = document.querySelector('.modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const sendMessageBtns = document.querySelectorAll('.send-message-btn');
    const closeModalBtn = document.querySelector('.modal-button.cancel');
    const sendBtn = document.querySelector('.modal-button.send');
    const modalTitle = document.querySelector('.modal-title');
  
    // Opening a modal window
    sendMessageBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const tutorName = this.getAttribute('data-tutor-name');
        modalTitle.textContent = `Send message to ${tutorName}`;
        modal.classList.add('open');
        modalOverlay.classList.add('open');
      });
    });
  
    // Close the modal window
    closeModalBtn.addEventListener('click', function () {
      modal.classList.remove('open');
      modalOverlay.classList.remove('open');
    });
  
    // Send message
    sendBtn.addEventListener('click', function () {
      const message = document.querySelector('.modal-input').value;
      if (message.trim()) {
        alert(`Message sent: "${message}"`);
        modal.classList.remove('open');
        modalOverlay.classList.remove('open');
      } else {
        alert('Please enter a message.');
      }
    });
  
    // Close modal window when clicking on overlay
    modalOverlay.addEventListener('click', function () {
      modal.classList.remove('open');
      modalOverlay.classList.remove('open');
    });
  });