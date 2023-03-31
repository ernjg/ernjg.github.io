const poemLine = document.getElementById('poem-line');

const poemBank = [

    "mouse This rock dazzle unforgettable crowd.
        This room exult wondrous moon.
        Dewy button brim the hippopotamus along that vegetable.
        That basket whisper that pillow of the motorcycle.
        The sock lilt fiery volcano.

        The card ripple a paint.
        The net sustain effervescent spring.
        Moonlit fiery triangle dawn a fire wondrously.


        This rose shimmer that teapot.
        Mystical triangle exhale the bar.
        That monkey beckon a coat tenderly.
        This finger linger blushing song.
        Tranquil kitten stir the record enigmatically.


        Buttery flower tickle unfettered motorcycle.
        That toothbrush quiver the paper.
        The bread harmonize a plant.
        Divine helicopter ensconce that glass.
        The fish tangle adventurous slipper."
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
