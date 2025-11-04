/**
 * Aplicación Frontend para Ronda Marroquí - Sprint 2
 * 
 * @description JavaScript que sostiene la experiencia visual lista para lanzamiento.
 * Este módulo muestra una partida simulada, expone métricas en consola y activa
 * efectos de interfaz para presentar el tablero digital al público.
 * 
 * @author Yahya Aboulafiya, Adrián Hoyos Sánchez, Souhail Batah, Carlos Robledo Badía
 * @version 2.0
 * @date 01/11/2025
 */

// ===================================
// Inicialización de la Aplicación
// ===================================

/**
 * Espera a que el DOM esté completamente cargado
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('=================================');
    console.log('RONDA MARROQUÍ - Tablero digital');
    console.log('Experiencia visual lista para lanzamiento - Sprint 2');
    console.log('=================================\n');
    
    // Verificar si el usuario está logueado
    checkUserSession();
    
    // Inicializar demostración del juego
    initGameDemo();
    
    // Agregar efectos visuales
    addVisualEffects();
    
    console.log('\n📌 Nota: Esta build se centra en la presentación visual.');
    console.log('   Las interacciones en vivo se publicarán en la versión conectada.');
});

// ===================================
// Gestión de Sesión de Usuario
// ===================================

/**
 * Verifica si existe una sesión activa de usuario
 */
function checkUserSession() {
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (currentUser) {
        const userData = JSON.parse(currentUser);
        console.log(`✅ Usuario autenticado: ${userData.nombre_usuario}`);
        console.log(`   Rol: ${userData.rol}`);
        console.log(`   Email: ${userData.email}`);
        
        // Mostrar información del usuario en la interfaz
        updateUserInfo(userData);
    } else {
        console.log('ℹ️ No hay sesión activa. Redirigir a login si es necesario.');
    }
}

/**
 * Actualiza la información del usuario en la interfaz
 * @param {Object} userData - Datos del usuario
 */
function updateUserInfo(userData) {
    // Aquí se actualizaría la UI con la información del usuario
    console.log('Actualizando UI con información del usuario...');
}

// ===================================
// Demostración del Juego
// ===================================

/**
 * Inicializa una partida de demostración y muestra el estado en consola
 */
function initGameDemo() {
    try {
        console.log('Inicializando partida de demostración...\n');
        
        // Crear una instancia del juego con 4 jugadores y 5 cartas
        const game = new RondaGame(4, 5);
        
        // Iniciar la partida
        game.startGame();
        
        // Obtener el estado del juego
        const gameState = game.getGameState();
        
        // Mostrar información en consola
        console.log('✅ Partida iniciada correctamente\n');
        displayGameState(gameState);
        displayPlayerHands(gameState);
        displayGameStatistics(game);
        
        // Guardar el estado del juego globalmente para debugging
        window.currentGame = game;
        window.gameState = gameState;
        
        console.log('\n💡 Tip: Puedes acceder al juego en la consola:');
        console.log('   - window.currentGame');
        console.log('   - window.gameState');
        
    } catch (error) {
        console.error('❌ Error al inicializar el juego:', error.message);
    }
}

/**
 * Muestra el estado general del juego en consola
 * @param {Object} state - Estado del juego
 */
function displayGameState(state) {
    console.log('--- ESTADO DEL JUEGO ---');
    console.log(`Jugador en turno: ${state.players[state.currentPlayer].name}`);
    console.log(`Dirección: ${state.gameDirection === 1 ? 'Horario ➡️' : 'Antihorario ⬅️'}`);
    
    if (state.topCard) {
        console.log(`Carta en mesa: ${state.topCard.value} de ${state.topCard.suit}`);
        console.log(`  Imagen: ${state.topCard.image}`);
        console.log(`  Es especial: ${state.topCard.isSpecial ? 'Sí ⭐' : 'No'}`);
    }
    
    console.log(`Cartas en mazo de robo: ${state.deckCount}`);
    console.log(`Cartas en pila de descarte: ${state.discardCount}`);
    console.log('');
}

/**
 * Muestra las manos de todos los jugadores
 * @param {Object} state - Estado del juego
 */
function displayPlayerHands(state) {
    console.log('--- MANOS DE LOS JUGADORES ---');
    
    state.players.forEach((player, index) => {
        console.log(`\n${player.name} (${player.cardsCount} cartas):`);
        
        player.hand.forEach((card, cardIndex) => {
            const specialMark = card.isSpecial ? ' ⭐' : '';
            console.log(`  ${cardIndex + 1}. ${card.value} de ${card.suit}${specialMark}`);
            console.log(`     Imagen: ${card.image}`);
        });
    });
    
    console.log('');
}

/**
 * Muestra estadísticas del juego
 * @param {RondaGame} game - Instancia del juego
 */
function displayGameStatistics(game) {
    console.log('--- ESTADÍSTICAS DE LA PARTIDA ---');
    console.log(`Total de jugadores: ${game.numPlayers}`);
    console.log(`Cartas iniciales por jugador: ${game.cardsPerPlayer}`);
    console.log(`Total de cartas repartidas: ${game.numPlayers * game.cardsPerPlayer}`);
    console.log(`Cartas restantes en el mazo: ${game.deck.length}`);
    
    // Calcular cartas especiales en juego
    let specialCardsCount = 0;
    game.players.forEach(player => {
        specialCardsCount += player.hand.filter(card => card.isSpecial).length;
    });
    if (game.discardPile[0]?.isSpecial) specialCardsCount++;
    
    console.log(`Cartas especiales visibles: ${specialCardsCount}`);
    console.log('');
}

// ===================================
// Efectos Visuales
// ===================================

/**
 * Añade efectos visuales interactivos a la presentación del tablero
 */
function addVisualEffects() {
    setupPanelIconToggles();

    // Efecto hover en cartas del jugador
    const playerCards = document.querySelectorAll('.player-card');
    playerCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
        
        // En esta edición visual, solo mostramos un mensaje informativo al hacer clic
        card.addEventListener('click', function() {
            console.log('🃏 Carta seleccionada (funcionalidad disponible en la versión conectada)');
        });
    });
    
    // Efecto hover en el mazo de robo
    const deckCard = document.querySelector('.deck-card');
    if (deckCard) {
        deckCard.addEventListener('click', function() {
            console.log('🎴 Mazo de robo seleccionado (funcionalidad disponible en la versión conectada)');
        });
    }
    
    // Animación de aparición suave
    const gameBoard = document.querySelector('.game-board');
    if (gameBoard) {
        gameBoard.style.opacity = '0';
        setTimeout(() => {
            gameBoard.style.transition = 'opacity 1s ease';
            gameBoard.style.opacity = '1';
        }, 100);
    }
}

/**
 * Activa/desactiva paneles informativos desde el selector de iconos
 */
function setupPanelIconToggles() {
    const buttons = document.querySelectorAll('.panel-icon-button');
    const panels = document.querySelectorAll('.panel-content [data-panel]');

    if (!buttons.length || !panels.length) {
        return;
    }

    const syncAriaHidden = () => {
        panels.forEach(panel => {
            panel.setAttribute('aria-hidden', panel.classList.contains('active') ? 'false' : 'true');
        });
    };

    const activatePanel = (targetId, trigger) => {
        const targetPanel = document.getElementById(targetId);
        if (!targetPanel || trigger.classList.contains('active')) {
            return;
        }

        buttons.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
        });

        panels.forEach(panel => {
            panel.classList.remove('active');
        });

        trigger.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        targetPanel.classList.add('active');
        syncAriaHidden();
        targetPanel.focus({ preventScroll: true });
    };

    panels.forEach(panel => {
        panel.setAttribute('tabindex', '-1');
    });
    syncAriaHidden();

    buttons.forEach(button => {
        const targetId = button.getAttribute('data-target');
        if (!targetId) {
            return;
        }

        if (!document.getElementById(targetId)) {
            return;
        }

        button.addEventListener('click', () => {
            activatePanel(targetId, button);
        });

        button.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activatePanel(targetId, button);
            }
        });
    });
}

// ===================================
// Funciones Auxiliares (plan de evolución)
// ===================================

/**
 * Renderiza una carta en el DOM (placeholder para la versión interactiva)
 * @param {Object} card - Objeto carta
 * @returns {string} HTML de la carta
 */
function renderCard(card) {
    const specialClass = card.isSpecial ? 'special-card' : '';
    const specialBadge = card.isSpecial ? 
        '<div class="special-badge"><i class="fas fa-star"></i></div>' : '';
    
    return `
        <div class="player-card-container">
            <img src="${card.image}" 
                 alt="${card.value} de ${card.suit}" 
                 class="card-img player-card ${specialClass}"
                 data-value="${card.value}"
                 data-suit="${card.suit}">
            ${specialBadge}
        </div>
    `;
}

/**
 * Actualiza la UI con el estado del juego (placeholder para la versión interactiva)
 * @param {Object} gameState - Estado actual del juego
 */
function updateUI(gameState) {
    console.log('updateUI() - Función reservada para la versión conectada');
    // Esta función se activará cuando se integre la interactividad en línea
}

/**
 * Obtiene el estado del juego desde el servidor (placeholder para la versión interactiva)
 * @returns {Promise<Object>} Estado del juego
 */
async function fetchGameState() {
    console.log('fetchGameState() - Función reservada para la versión conectada');
    // Esta función se implementará junto a la API en tiempo real
    return null;
}

// ===================================
// Información de Debug
// ===================================

/**
 * Muestra información de debug en consola
 */
function showDebugInfo() {
    console.log('\n=================================');
    console.log('INFORMACIÓN DE DEBUG - SPRINT 2');
    console.log('=================================');
    console.log('Edición visual: 2.0');
    console.log('Características implementadas:');
    console.log('  ✅ Clase RondaGame');
    console.log('  ✅ Creación y barajado de mazo');
    console.log('  ✅ Reparto de cartas');
    console.log('  ✅ Experiencia visual del tablero');
    console.log('  ✅ Gestión de imágenes');
    console.log('  ✅ Sistema de usuarios (login/registro)');
    console.log('  ✅ Base de datos MySQL');
    console.log('  ✅ Clases Usuario, Jugador, Administrador');
    console.log('  ✅ DBControlador para operaciones CRUD');
    console.log('\nPróximas incorporaciones:');
    console.log('  ⏳ Interactividad completa');
    console.log('  ⏳ Cartas especiales avanzadas');
    console.log('  ⏳ Multijugador en tiempo real');
    console.log('  ⏳ Sistema de torneos');
    console.log('=================================\n');
}

// Mostrar información de debug al cargar
setTimeout(showDebugInfo, 2000);

// ===================================
// Exportar funciones (para testing)
// ===================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderCard,
        updateUI,
        fetchGameState,
        checkUserSession
    };
}
