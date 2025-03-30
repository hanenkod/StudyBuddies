document.addEventListener('DOMContentLoaded', function() {
    const userTypeBtns = document.querySelectorAll('.user-type-btn');
    const userTypeInput = document.getElementById('userType');
    const shortMessageContainer = document.getElementById('shortMessageContainer');
    
    if (!shortMessageContainer) {
        console.error('Element with ID "shortMessageContainer" not found');
        return;
    }
    
    userTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            userTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            userTypeInput.value = this.dataset.type;
            
            
            shortMessageContainer.style.display = this.dataset.type === 'tutor' ? 'block' : 'none';
        });
    });

    
    const defaultUserTypeBtn = document.querySelector('.user-type-btn[data-type="user"]');
    if (defaultUserTypeBtn) {
        defaultUserTypeBtn.classList.add('active');
    }
    
    
    if (shortMessageContainer) {
        shortMessageContainer.style.display = 'none';
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            // Convert subjects string to array
            data.subjects = data.subjects.split(',').map(s => s.trim());
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.location.href = result.redirectUrl;
                } else {
                    alert(result.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration');
            }
        });
    }
});