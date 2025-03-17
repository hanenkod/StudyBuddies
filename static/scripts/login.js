document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.querySelector('input[type="email"]').value;
    const password = document.querySelector('input[type="password"]').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = data.userType === 'tutor' 
                ? `/tutor-profile/${data.userId}` 
                : `/user-profile/${data.userId}`;
        } else {
            alert("Incorrect email or password");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("There was an error logging in");
    }
});
