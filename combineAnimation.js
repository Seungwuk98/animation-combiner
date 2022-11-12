import { loadAvatar } from "./combineviwer.js";

const animationInput = document.querySelector("#animation");

animationInput.addEventListener("change", () => {
    if (animationInput.files && animationInput.files[0]) {
        const file = animationInput.files[0];
        const reader = new FileReader();
    
        reader.onload = e => {
            loadAvatar.extractAnimation(e.target.result);
        };
        
        reader.readAsDataURL(file);
    }
})
