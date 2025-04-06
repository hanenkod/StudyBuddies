document.addEventListener('DOMContentLoaded', function() {
    const chatId = window.location.pathname.split('/')[2];
    const messageInput = document.querySelector('#messageInput');
    const sendButton = document.querySelector('#sendButton');
    const fileInput = document.querySelector('#fileInput');
    const messagesContainer = document.querySelector('#messagesContainer');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/chat/${chatId}`);
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
            loadMessages();
        }
    };
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Single file input event listener
    fileInput.addEventListener('change', handleFileUpload);
    
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText) return;
        
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messageText })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send message');
            }
            
            messageInput.value = '';
            messageInput.focus();
        } catch (error) {
            console.error('Error:', error);
            alert('Error sending message: ' + error.message);
        }
    }
    
    async function handleFileUpload() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            if (file.size > 10 * 1024 * 1024) {
                alert('File size exceeds 10MB limit');
                fileInput.value = '';
                return;
            }
    
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch(`/api/chats/${chatId}/files`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('File upload failed');
                }
                
                fileInput.value = '';
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Error uploading file: ' + error.message);
            }
        }
    }
    
    async function loadMessages() {
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`);
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }
            const messages = await response.json();
            
            messagesContainer.innerHTML = '';
            
            messages.forEach(msg => {
                const msgElement = document.createElement('div');
                msgElement.className = `message ${msg.messageType}`;
                
                if (msg.IsFile) {
                    msgElement.innerHTML = `
                        <a class="message-file" href="/download/${msg.MessageText}" target="_blank">${msg.MessageText}</a>
                        <div class="message-time">${formatTime(msg.Timestamp)}</div>
                        <div class="message-sender">${msg.SenderName}</div>
                    `;
                } else {
                    msgElement.innerHTML = `
                        <div class="message-content">${msg.MessageText}</div>
                        <div class="message-time">${formatTime(msg.Timestamp)}</div>
                        <div class="message-sender">${msg.SenderName}</div>
                    `;
                }
                
                messagesContainer.appendChild(msgElement);
            });
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }
    
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Initial load
    loadMessages();
});