const poemLine = document.getElementById('poem-line');

const poemBank = [
    "Example poem line 1,\nExample poem line 2,\nExample poem line 3,\nExample poem line 4."
];

let currentPoem = '';
let poemIndex = 0;
let characterIndex = 0;

function typePoem() {
    if (characterIndex < poemBank[poemIndex].length) {
        currentPoem += poemBank[poemIndex].charAt(characterIndex);
        poemLine.textContent = currentPoem;
        characterIndex++;
        setTimeout(typePoem, 100); // Adjust the typing speed here (100ms)
    }
}

typePoem(); // Start typing the poem
