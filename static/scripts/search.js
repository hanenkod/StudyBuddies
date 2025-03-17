document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    let tutors = []; 

    
    async function fetchTutors() {
        try {
            const response = await fetch('/api/tutors');
            tutors = await response.json();
            displaySearchResults(tutors); 
        } catch (error) {
            console.error('Error while receiving data:', error);
        }
    }

    
    function filterTutors(query) {
        return tutors.filter(tutor => {
            const fullName = `${tutor.Name} ${tutor.Surname}`.toLowerCase();
            return fullName.includes(query.toLowerCase());
        });
    }

    
    function displaySearchResults(results) {
        const resultsContainer = document.querySelector(".frame-3");
        resultsContainer.innerHTML = ""; 

        results.forEach(tutor => {
            const tutorElement = document.createElement("div");
            tutorElement.className = "group";
            tutorElement.innerHTML = `
                <div class="frame-4">
                    <div class="frame-5">
                        <div class="text-wrapper-10">${tutor.Name} ${tutor.Surname}</div>
                        <div class="text-wrapper-11">${tutor.Short_Course_Description}</div>
                    </div>
                    <button class="button">
                        <div class="text-wrapper-12">Send Message</div>
                    </button>
                    <img class="user-2" src="/images/user.svg">
                    <p class="p">${tutor.Short_Message}</p>
                    <div class="frame-6" data-rating="${tutor.Rating}">
                        ${Array.from({ length: 5 }, (_, i) => 
                            `<div class="star">
                                <img src="/images/star-filled.svg" class="star-icon filled">
                                <img src="/images/star-half-filled.svg" class="star-icon half">
                            </div>`
                        ).join("")}
                    </div>
                </div>
            `;
            resultsContainer.appendChild(tutorElement);
        });
    }

    
    searchInput.addEventListener("input", (event) => {
        const query = event.target.value.trim();
        if (query) {
            const results = filterTutors(query);
            displaySearchResults(results);
        } else {
            
            displaySearchResults(tutors);
        }
    });

    
    fetchTutors();
});