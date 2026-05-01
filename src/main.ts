import { Game } from './game';

// Initialize the game when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});
