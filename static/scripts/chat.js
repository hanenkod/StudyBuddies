document.addEventListener('DOMContentLoaded', function() {
    const chatId = window.location.pathname.split('/')[2];
    const messageInput = document.querySelector('#messageInput');
    const sendButton = document.querySelector('#sendButton');
    const fileInput = document.querySelector('#fileInput');
    const messagesContainer = document.querySelector('#messagesContainer');
    const currentUser = JSON.parse(document.getElementById('currentUser').textContent);
    
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/chat/${chatId}`);
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
            
            if (data.senderId !== currentUser.id) {
                appendMessage(data.message, 'received');
            }
        }
    };
    
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    fileInput.addEventListener('change', handleFileUpload);
    
    async function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText) return;
        const tempMessage = {
            MessageText: messageText,
            messageType: 'sent',
            Timestamp: new Date().toISOString(),
            SenderName: currentUser.name + ' ' + currentUser.surname,
            IsFile: false
        };
        
        appendMessage(tempMessage, 'sent');
        
        messageInput.value = '';
        messageInput.focus();
        
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messageText })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            
            const result = await response.json();
            updateTempMessage(tempMessage, result.messageId);
            
        } catch (error) {
            console.error('Error:', error);
            removeTempMessage(tempMessage);
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
    
            const tempMessage = {
                MessageText: file.name,
                messageType: 'sent',
                Timestamp: new Date().toISOString(),
                SenderName: currentUser.name + ' ' + currentUser.surname,
                IsFile: true
            };
            
            appendMessage(tempMessage, 'sent');
            
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
                
                const result = await response.json();
                updateTempMessage(tempMessage, result.messageId);
                
                fileInput.value = '';
            } catch (error) {
                console.error('Error uploading file:', error);
                removeTempMessage(tempMessage);
                alert('Error uploading file: ' + error.message);
            }
        }
    }
    
    function appendMessage(message, type) {
        const msgElement = document.createElement('div');
        msgElement.className = `message ${type}`;
        msgElement.dataset.tempId = message.tempId || message.MessageID;
        
        const senderName = message.SenderFullName || 
                         (message.SenderName + (message.SenderSurname ? ' ' + message.SenderSurname : ''));
    
        if (message.IsFile) {
            msgElement.innerHTML = `
                <a class="message-file" href="/download/${message.MessageText}" target="_blank">${message.MessageText}</a>
                <div class="message-time">${formatTime(message.Timestamp)}</div>
                <div class="message-sender">${senderName}</div>
            `;
        } else {
            msgElement.innerHTML = `
                <div class="message-content">${message.MessageText}</div>
                <div class="message-time">${formatTime(message.Timestamp)}</div>
                <div class="message-sender">${senderName}</div>
            `;
        }
        
        messagesContainer.appendChild(msgElement);
        
        const isScrolledUp = messagesContainer.scrollTop + messagesContainer.clientHeight < messagesContainer.scrollHeight - 100;
        if (!isScrolledUp) {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    function updateTempMessage(tempMessage, messageId) {
        const elements = document.querySelectorAll(`[data-temp-id="${tempMessage.tempId || tempMessage.MessageID}"]`);
        if (elements.length > 0) {
            elements[0].dataset.tempId = messageId;
            elements[0].dataset.messageId = messageId;
        }
    }
    
    function removeTempMessage(tempMessage) {
        const elements = document.querySelectorAll(`[data-temp-id="${tempMessage.tempId || tempMessage.MessageID}"]`);
        if (elements.length > 0) {
            elements[0].remove();
        }
    }
    
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC' 
        });
    }

    
    loadMessages();
    
    async function loadMessages() {
        try {
            const response = await fetch(`/chat/${chatId}/messages`);
            if (!response.ok) throw new Error('Failed to load messages');
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const messageElements = doc.querySelectorAll('.message');
            
            messagesContainer.innerHTML = '';
            messageElements.forEach(element => {
                messagesContainer.appendChild(element.cloneNode(true));
            });
            
            
            const savedScroll = sessionStorage.getItem(`chatScroll_${chatId}`);
            if (savedScroll) {
                setTimeout(() => {
                    messagesContainer.scrollTop = savedScroll;
                    sessionStorage.removeItem(`chatScroll_${chatId}`);
                }, 0);
            } else {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem(`chatScroll_${chatId}`, messagesContainer.scrollTop);
    });
    
    
    window.addEventListener('load', () => {
        const savedScroll = sessionStorage.getItem(`chatScroll_${chatId}`);
        if (savedScroll) {
            messagesContainer.scrollTop = savedScroll;
            sessionStorage.removeItem(`chatScroll_${chatId}`);
        }
    });
});

