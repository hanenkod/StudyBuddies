document.addEventListener('DOMContentLoaded', function() {
    
    loadChats();
    
    
    const modalOverlay = document.querySelector('.chat-modal-overlay');
    const modal = document.querySelector('.chat-modal');
    const closeModal = document.querySelector('.modal-close');
    const cancelModal = document.querySelector('.modal-cancel');
    
    
    document.querySelectorAll('.send-message-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const tutorId = this.getAttribute('data-tutor-id');
        const tutorName = this.getAttribute('data-tutor-name');
        
        document.querySelector('.modal-title').textContent = `Send Message to ${tutorName}`;
        document.querySelector('#sendMessageBtn').setAttribute('data-tutor-id', tutorId);
        
        modalOverlay.style.display = 'block';
        modal.style.display = 'block';
      });
    });
    
    
    closeModal.addEventListener('click', closeMessageModal);
    cancelModal.addEventListener('click', closeMessageModal);
    modalOverlay.addEventListener('click', closeMessageModal);
    
    
    document.querySelector('#sendMessageBtn').addEventListener('click', sendNewMessage);
    
    
    document.querySelectorAll('.chat-item').forEach(item => {
      item.addEventListener('click', function() {
        const chatId = this.getAttribute('data-chat-id');
        window.location.href = `/chat/${chatId}`;
      });
    });
  });
  
  function closeMessageModal() {
    document.querySelector('.chat-modal-overlay').style.display = 'none';
    document.querySelector('.chat-modal').style.display = 'none';
    document.querySelector('#messageText').value = '';
  }
  
  async function sendNewMessage() {
    const tutorId = this.getAttribute('data-tutor-id');
    const messageText = document.querySelector('#messageText').value.trim();
    
    if (!messageText) {
      alert('Please enter a message');
      return;
    }
    
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tutorId })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      
      const messageResponse = await fetch(`/api/chats/${data.chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messageText })
      });
      
      const messageData = await messageResponse.json();
      
      if (messageData.error) {
        throw new Error(messageData.error);
      }
      
      closeMessageModal();
      window.location.href = `/chat/${data.chatId}`;
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    }
  }
  
  async function loadChats() {
    try {
      const response = await fetch('/api/chats');
      const chats = await response.json();
      
      
      console.log('Loaded chats:', chats);
      
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }