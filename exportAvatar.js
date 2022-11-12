import { loadAvatar } from "./combineviwer.js";

const exportButton = document.querySelector("#extract_gltf");
exportButton.addEventListener("click", (event) => {
    event.preventDefault();
    loadAvatar.exportThisAvatar();
});