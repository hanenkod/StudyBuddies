document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tutor-rating").forEach((ratingContainer) => {
        const rating = parseFloat(ratingContainer.getAttribute("data-rating")) || 0;
        
        const stars = ratingContainer.querySelectorAll(".star");
        
        stars.forEach((star, index) => {
            const starIndex = index + 1;
            const filled = star.querySelector(".filled");
            const half = star.querySelector(".half");
            
            filled.style.opacity = "0";
            half.style.opacity = "0";
            
            if (starIndex <= Math.floor(rating)) {
                filled.style.opacity = "1";
            } else if (starIndex === Math.ceil(rating) && rating % 1 !== 0) {
                half.style.opacity = "1";
            }
        });
    });
  });