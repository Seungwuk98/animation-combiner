import { loadAvatar } from "./combineviwer.js";

const avatarInput = document.querySelector("#avatar");

avatarInput.addEventListener("change", () => {
    if (avatarInput.files && avatarInput.files[0]) {
        const file = avatarInput.files[0];
        const reader = new FileReader();
    
        reader.onload = e => {
            loadAvatar.buildModel(e.target.result);
        };
        
        reader.readAsDataURL(file);
    }
})
