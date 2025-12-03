document.addEventListener('DOMContentLoaded', () => {
    const manoJugador = document.getElementById('mano-jugador');
    const carruselCartas = document.getElementById('carrusel-cartas');
    const cartas = document.querySelectorAll('.carta-jugador');

    const CARD_WIDTH = 120; 
    const CARD_GAP = 10;
    
    let currentIndex = 0;
    let isCarouselOpen = false;

    manoJugador.addEventListener('click', () => {
        isCarouselOpen = !isCarouselOpen;
        manoJugador.classList.toggle('abierto');
        
        if (isCarouselOpen) {
            manoJugador.scrollLeft = 0;
            } else {
            }
    });
});