const poemLine = document.getElementById('poem-line');

const poemBank = [

    "mouse\n\nThis rock dazzle unforgettable crowd.\nThis room exult wondrous moon.\nDewy button brim the hippopotamus along that vegetable.\nThat basket whisper that pillow of the motorcycle.\nThe sock lilt fiery volcano.\n\nThe card ripple a paint.\nThe net sustain effervescent spring.\nMoonlit fiery triangle dawn a fire wondrously.\n\nThis rose shimmer that teapot.\nMystical triangle exhale the bar.\nThat monkey beckon a coat tenderly.\nThis finger linger blushing song.\nTranquil kitten stir the record enigmatically.\n\nButtery flower tickle unfettered motorcycle.\nThat toothbrush quiver the paper.\nThe bread harmonize a plant.\nDivine helicopter ensconce that glass.\nThe fish tangle adventurous slipper.",
    "pen\n\nLuminous art vibrate that teapot near that helicopter.\nEthereal pensive tiger inhale the snow.\nThat shower mingle the door ethereally.\nThe day spontaneously that eye to the button.\nDappled rooster sustain the police.\n\nThat horse glisten fleeting tiger.\nThis star paint fleeting egg.\nMoonlit gift usher cerulean net.\nSensuous opulent rooster wonder tender card.\nA brush quiver this pot.\n\nCaramel wing descend radiant match.\nThis dance sway that gold.\nVivid dragon illuminate that lock.\nTranquil fanciful garden echo that milk but this bar.\nThe skateboard harmonize that hill.\n\nHoneyed juice brim prismatic game.\nSapphire house divine wistful fly.\nA room twine a wire fearlessly.\nThe spoon resonate the monkey.\nIncandescent key uplift a ribbon."



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
