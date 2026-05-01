import * as BABYLON from '@babylonjs/core';
import { Scene3D } from './scene';
import { UIManager } from './ui';
import { Player } from './player';
import { Enemy } from './enemy';
import { FoodManager } from './food';
import { CombatSystem } from './combat';
import { LevelProgressionSystem } from './levelSystem';
import { MapManager } from './mapManager';
import { MobileControls, MapView } from './mobile';
import { PlayerControlInput } from './controls';

export class Game {
    private scene3D: Scene3D | null = null;
    private uiManager: UIManager | null = null;
    private player: Player | null = null;
    private enemies: Enemy[] = [];
    private foodManager: FoodManager | null = null;
    private combatSystem: CombatSystem | null = null;
    private levelSystem: LevelProgressionSystem;
    private mapManager: MapManager | null = null;
    private mobileControls: MobileControls | null = null;
    private mapView: MapView | null = null;
    private animationFrameId: number | null = null;
    private keyboardState: Set<string> = new Set();
    private queuedActions = {
        dash: false,
        interact: false,
    };
    private mapButtonListenerAttached: boolean = false;
    private viewportClampBound = () => this.applyMobileViewportClamp();
    
    private isRunning: boolean = false;
    private isPaused: boolean = false;
    private gameTime: number = 0;
    private simulationSpeed: number = 1;
    
    // Input handling
    private input = {
        up: false,
        down: false,
        left: false,
        right: false,
    };

    constructor() {
        this.levelSystem = new LevelProgressionSystem();
    }

    async init(): Promise<void> {
        try {
            // Show loading screen
            this.showScreen('loading-screen');

            // Initialize Three.js scene
            this.scene3D = new Scene3D();
            await this.scene3D.init();

            // Initialize UI Manager
            this.uiManager = new UIManager();
            this.setupUIListeners();
            this.setupInputListeners();

            // Hide loading screen and show main menu
            this.hideScreen('loading-screen');
            this.showScreen('main-menu');

            // Start the animation loop
            this.animate();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to initialize game. Check console for details.');
        }
    }

    private setupInputListeners(): void {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const handled = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', ' ', 'spacebar', 'e', 'enter'].includes(key);
            if (handled) {
                e.preventDefault();
            }

            this.keyboardState.add(key);

            switch (e.key.toUpperCase()) {
                case 'W':
                case 'ARROWUP':
                    break;
                case 'S':
                case 'ARROWDOWN':
                    break;
                case 'A':
                case 'ARROWLEFT':
                    break;
                case 'D':
                case 'ARROWRIGHT':
                    break;
                case ' ':
                case 'SPACEBAR':
                    if (!e.repeat) {
                        this.queuedActions.dash = true;
                    }
                    break;
                case 'E':
                case 'ENTER':
                    if (!e.repeat) {
                        this.queuedActions.interact = true;
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keyboardState.delete(e.key.toLowerCase());
            switch (e.key.toUpperCase()) {
                case 'W':
                case 'ARROWUP':
                    break;
                case 'S':
                case 'ARROWDOWN':
                    break;
                case 'A':
                case 'ARROWLEFT':
                    break;
                case 'D':
                case 'ARROWRIGHT':
                    break;
            }
        });

        window.addEventListener('blur', () => {
            this.keyboardState.clear();
            this.queuedActions.dash = false;
            this.queuedActions.interact = false;
        });
    }

    private setupUIListeners(): void {
        // Main Menu
        document.getElementById('start-btn')?.addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showScreen('settings-screen');
            this.hideScreen('main-menu');
        });

        document.getElementById('about-btn')?.addEventListener('click', () => {
            this.showScreen('about-screen');
            this.hideScreen('main-menu');
        });

        // Settings
        document.getElementById('settings-back-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu');
            this.hideScreen('settings-screen');
        });

        // About
        document.getElementById('about-back-btn')?.addEventListener('click', () => {
            this.showScreen('main-menu');
            this.hideScreen('about-screen');
        });

        // Game HUD Controls
        document.getElementById('pause-btn')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.returnToMenu();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.scene3D?.onWindowResize();
            this.applyMobileViewportClamp();
        });

        window.addEventListener('orientationchange', this.viewportClampBound);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', this.viewportClampBound);
        }
    }

    private startGame(): void {
        this.hideScreen('main-menu');
        this.showScreen('game-hud');
        this.isRunning = true;
        this.isPaused = false;
        this.gameTime = 0;

        const scene = this.scene3D!.getScene();
        const camera = this.scene3D!.getCamera();

        // Initialize food + map before creatures so the world exists first
        this.foodManager = new FoodManager(scene);
        this.mapManager = new MapManager(scene);
        this.mapManager.loadMap(0, this.foodManager);

        // Initialize player
        this.player = new Player(scene, camera, new BABYLON.Vector3(0, 1, 0));

        // Configure player movement boundary from map
        const bounds = this.mapManager.getMapBounds();
        this.player.setBoundary(bounds.boundary - 6); // leave small padding inside mountains
        // Provide mountain obstacles so player can't pass through
        const obstacles = this.mapManager.getMountains();
        this.player.setObstacles(obstacles);

        // Generate initial enemies
        this.enemies = this.mapManager.generateEnemies(15, this.player.stats.level);
        // give enemies obstacle info
        for (const e of this.enemies) {
            e.setObstacles(obstacles);
        }

        // Initialize combat system
        this.combatSystem = new CombatSystem(
            this.player,
            this.enemies,
            this.foodManager,
            scene
        );

        // Initialize mobile controls
        this.mobileControls = new MobileControls();
        this.mobileControls.show();

        // Initialize map view
        try {
            this.mapView = new MapView('map-view');
            this.mapView.hide();
        } catch (e) {
            console.warn('Map view not available:', e);
        }

        this.setupMapControls();
        this.applyMobileViewportClamp();
    }

    private applyMobileViewportClamp(): void {
        const mapBtn = document.getElementById('map-btn') as HTMLButtonElement | null;
        const mapView = document.getElementById('map-view-container') as HTMLDivElement | null;
        const actionPanel = document.getElementById('mobile-action-panel') as HTMLDivElement | null;
        if (!mapBtn || !mapView || !actionPanel) return;

        const vw = window.visualViewport?.width ?? window.innerWidth;
        const vh = window.visualViewport?.height ?? window.innerHeight;
        const isLandscape = vw > vh;
        const isPhoneLike = Math.min(vw, vh) <= 900;

        // Reset runtime styles for desktop or non-phone-like layouts.
        if (!isLandscape || !isPhoneLike) {
            mapBtn.style.top = '';
            mapBtn.style.right = '';
            mapBtn.style.bottom = '';
            mapBtn.style.maxWidth = '';
            mapBtn.style.fontSize = '';

            mapView.style.top = '';
            mapView.style.right = '';
            mapView.style.bottom = '';
            mapView.style.width = '';
            mapView.style.maxHeight = '';

            actionPanel.style.right = '';
            actionPanel.style.bottom = '';
            actionPanel.style.width = '';
            actionPanel.style.display = '';
            actionPanel.style.gridTemplateColumns = '';
            return;
        }

        const safeRight = 8 + this.getSafeAreaInset('right');
        const safeTop = 8 + this.getSafeAreaInset('top');
        const safeBottom = 8 + this.getSafeAreaInset('bottom');

        const mapBtnWidth = Math.max(70, Math.min(130, vw * 0.28));
        const mapWidth = Math.max(110, Math.min(170, vw * 0.36));
        const mapTop = safeTop + 36;
        const actionWidth = Math.max(170, Math.min(250, vw * 0.52));

        mapBtn.style.top = `${safeTop}px`;
        mapBtn.style.right = `${safeRight}px`;
        mapBtn.style.bottom = 'auto';
        mapBtn.style.maxWidth = `${mapBtnWidth}px`;
        mapBtn.style.fontSize = vw < 420 ? '0.68rem' : '0.72rem';

        mapView.style.top = `${mapTop}px`;
        mapView.style.right = `${safeRight}px`;
        mapView.style.bottom = 'auto';
        mapView.style.width = `${mapWidth}px`;
        mapView.style.maxHeight = `${Math.max(120, Math.floor(vh * 0.42))}px`;

        actionPanel.style.right = `${safeRight}px`;
        actionPanel.style.bottom = `${safeBottom}px`;
        actionPanel.style.width = `${actionWidth}px`;
        actionPanel.style.display = 'grid';
        actionPanel.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    }

    private getSafeAreaInset(edge: 'top' | 'right' | 'bottom' | 'left'): number {
        const probe = document.createElement('div');
        probe.style.position = 'fixed';
        probe.style.visibility = 'hidden';
        probe.style.pointerEvents = 'none';
        probe.style.setProperty('padding-top', 'env(safe-area-inset-top)');
        probe.style.setProperty('padding-right', 'env(safe-area-inset-right)');
        probe.style.setProperty('padding-bottom', 'env(safe-area-inset-bottom)');
        probe.style.setProperty('padding-left', 'env(safe-area-inset-left)');
        document.body.appendChild(probe);
        const computed = getComputedStyle(probe);
        const value = parseFloat(computed.getPropertyValue(`padding-${edge}`)) || 0;
        probe.remove();
        return value;
    }

    private setupMapControls(): void {
        if (this.mapButtonListenerAttached) {
            document.getElementById('map-btn')?.classList.add('active');
            return;
        }

        document.getElementById('map-btn')?.classList.add('active');
        document.getElementById('map-btn')?.addEventListener('click', () => {
            const container = document.getElementById('map-view-container');
            if (container?.classList.contains('active')) {
                container.classList.remove('active');
            } else {
                container?.classList.add('active');
            }
        });

        document.getElementById('close-map-btn')?.addEventListener('click', () => {
            document.getElementById('map-view-container')?.classList.remove('active');
        });

        this.mapButtonListenerAttached = true;
    }

    private togglePause(): void {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pause-btn');
        if (btn) {
            btn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
    }

    private returnToMenu(): void {
        this.isRunning = false;
        this.isPaused = false;
        this.showScreen('main-menu');
        this.hideScreen('game-hud');
        
        // Hide mobile controls
        this.mobileControls?.hide();
        this.mapView?.hide();
        document.getElementById('map-btn')?.classList.remove('active');
        document.getElementById('map-view-container')?.classList.remove('active');
        this.applyMobileViewportClamp();
        
        // Cleanup
        this.player?.dispose();
        this.enemies.forEach(e => e.dispose());
        this.enemies = [];
        this.foodManager?.dispose();
        this.mapManager?.dispose();
        
        this.player = null;
        this.foodManager = null;
        this.combatSystem = null;
        this.mapManager = null;
        this.mobileControls = null;
        this.mapView = null;
        this.keyboardState.clear();
        this.queuedActions.dash = false;
        this.queuedActions.interact = false;
    }

    private showScreen(screenId: string): void {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }

    private hideScreen(screenId: string): void {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('active');
        }
    }

    private updateHUD(): void {
        if (!this.player) return;

        // Update stats
        const levelEl = document.getElementById('player-level');
        const healthEl = document.getElementById('player-health');
        const expEl = document.getElementById('player-exp');
        const mapEl = document.getElementById('current-map');
        const enemyCountEl = document.getElementById('enemy-count');
        const timeEl = document.getElementById('time-elapsed');

        if (levelEl) levelEl.textContent = this.player.stats.level.toString();
        
        if (healthEl) {
            const healthPercent = (this.player.stats.health / this.player.stats.maxHealth) * 100;
            healthEl.textContent = `${Math.ceil(this.player.stats.health)} / ${this.player.stats.maxHealth}`;
            const healthBar = document.getElementById('health-bar');
            if (healthBar) {
                healthBar.style.width = healthPercent + '%';
                healthBar.style.backgroundColor = healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ffaa00' : '#ff4444';
            }
        }

        if (expEl) {
            const expPercent = (this.player.stats.experience / this.player.stats.experienceNeeded) * 100;
            expEl.textContent = `${Math.floor(this.player.stats.experience)} / ${this.player.stats.experienceNeeded}`;
            const expBar = document.getElementById('exp-bar');
            if (expBar) {
                expBar.style.width = expPercent + '%';
            }
        }

        if (mapEl && this.mapManager) {
            const mapName = this.levelSystem.getMapNameForLevel(this.player.stats.level);
            mapEl.textContent = mapName;
        }

        if (enemyCountEl) {
            enemyCountEl.textContent = this.enemies.filter(e => e.isAlive()).length.toString();
        }

        if (timeEl) {
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = Math.floor(this.gameTime % 60);
            timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    private checkMapTransition(): void {
        if (!this.player || !this.mapManager) return;

        const newMapIndex = this.levelSystem.getMapIndexForLevel(this.player.stats.level);
        if (newMapIndex !== this.mapManager.getCurrentMapIndex()) {
            // Transition to new map
            console.log(`Transitioning to map ${newMapIndex}`);
            this.mapManager.loadMap(newMapIndex, this.foodManager!);
            
            // Respawn enemies for new map
            this.enemies.forEach(e => e.dispose());
            this.enemies = this.mapManager.generateEnemies(
                15 + newMapIndex * 5,
                this.player.stats.level
            );
            
            // Reset combat system
            this.combatSystem = new CombatSystem(
                this.player,
                this.enemies,
                this.foodManager!,
                this.scene3D!.getScene()
            );
        }
    }

    private animate = (): void => {
        this.animationFrameId = requestAnimationFrame(this.animate);

        if (this.isRunning && !this.isPaused) {
            const deltaTime = (1 / 60) * this.simulationSpeed;

            const controlState = this.buildControlState();

            // Update player
            this.player?.update(deltaTime, controlState);

            if (controlState.interact) {
                this.combatSystem?.triggerInteraction();
            }

            // Update enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (enemy.isAlive()) {
                    enemy.update(deltaTime, this.player!.getPosition());
                } else {
                    enemy.dispose();
                    this.enemies.splice(i, 1);
                }
            }

            // Update food
            this.foodManager?.update(deltaTime);

            // Combat/collision detection
            this.combatSystem?.update();

            // Check if player is dead
            if (!this.player?.isAlive()) {
                this.gameOverEvent();
            }

            // Respawn enemies if count drops
            if (this.enemies.length < 10 && this.mapManager) {
                const newEnemies = this.mapManager.generateEnemies(5, this.player!.stats.level);
                const obstacles = this.mapManager.getMountains();
                for (const ne of newEnemies) {
                    ne.setObstacles(obstacles);
                }
                this.enemies.push(...newEnemies);
            }

            // Check for map transitions
            this.checkMapTransition();

            // Update game time
            this.gameTime += deltaTime;

            // Update HUD every frame
            this.updateHUD();

            // Update map view
            if (this.mapView && this.player) {
                const foods = this.foodManager?.getFoods().map(f => ({
                    position: f.position
                })) || [];
                const enemiesData = this.enemies.map(e => ({
                    position: e.position,
                    alive: e.isAlive()
                }));
                const mapSize = this.mapManager?.getMapBounds().size || 200;
                this.mapView.updateMap(this.player.getPosition(), enemiesData, foods, mapSize);
            }
        }

        // Render scene
        this.scene3D?.render();
    };

    private buildControlState(): PlayerControlInput {
        let forward = 0;
        let strafe = 0;

        if (this.keyboardState.has('w') || this.keyboardState.has('arrowup')) forward += 1;
        if (this.keyboardState.has('s') || this.keyboardState.has('arrowdown')) forward -= 1;
        if (this.keyboardState.has('d') || this.keyboardState.has('arrowright')) strafe += 1;
        if (this.keyboardState.has('a') || this.keyboardState.has('arrowleft')) strafe -= 1;

        let sprint = this.keyboardState.has('shift');
        let dash = this.queuedActions.dash;
        let interact = this.queuedActions.interact;

        this.queuedActions.dash = false;
        this.queuedActions.interact = false;

        if (this.mobileControls) {
            const touchMovement = this.mobileControls.getMovementInput();
            forward += touchMovement.moveY;
            strafe += touchMovement.moveX;
            sprint = sprint || touchMovement.sprint;

            const touchActions = this.mobileControls.consumeActions();
            dash = dash || touchActions.dash;
            interact = interact || touchActions.interact;
        }

        const camera = this.scene3D?.getCamera();
        const alpha = camera?.alpha ?? 0;

        // Flip the camera-relative basis so controller up moves toward the visible map front.
        const forwardVector = new BABYLON.Vector3(-Math.sin(alpha), 0, -Math.cos(alpha));
        const rightVector = new BABYLON.Vector3(forwardVector.z, 0, -forwardVector.x);
        const worldMove = rightVector.scale(strafe).add(forwardVector.scale(forward)).scale(-1);

        if (worldMove.lengthSquared() > 1) {
            worldMove.normalize();
        }

        return {
            moveX: worldMove.x,
            moveY: worldMove.z,
            sprint,
            dash,
            interact,
        };
    }

    private gameOverEvent(): void {
        this.isRunning = false;
        alert(`Game Over! You reached level ${this.player?.stats.level}`);
        this.returnToMenu();
    }

    public getScene(): BABYLON.Scene | null {
        return this.scene3D?.getScene() || null;
    }

    public dispose(): void {
        window.removeEventListener('orientationchange', this.viewportClampBound);
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', this.viewportClampBound);
        }
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.player?.dispose();
        this.enemies.forEach(e => e.dispose());
        this.foodManager?.dispose();
        this.mapManager?.dispose();
        this.scene3D?.dispose();
    }
}
