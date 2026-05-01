export interface TouchInput {
    moveX: number;
    moveY: number;
    sprint: boolean;
}

export class MobileControls {
    private joystickContainer: HTMLElement;
    private joystick: HTMLElement;
    private joystickBase: HTMLElement;
    private actionPanel: HTMLElement;
    private sprintButton: HTMLButtonElement;
    private dashButton: HTMLButtonElement;
    private actionButton: HTMLButtonElement;
    private isDragging: boolean = false;
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private joystickCenterX: number = 0;
    private joystickCenterY: number = 0;
    private joystickRadius: number = 60;
    private maxDistance: number = 50;

    public touchInput: TouchInput = {
        moveX: 0,
        moveY: 0,
        sprint: false,
    };

    private dashQueued: boolean = false;
    private interactQueued: boolean = false;

    constructor() {
        this.joystickContainer = document.getElementById('joystick-container') || this.createJoystick();
        this.joystickBase = this.joystickContainer.querySelector('.joystick-base') as HTMLElement;
        this.joystick = this.joystickContainer.querySelector('.joystick') as HTMLElement;
        this.actionPanel = document.getElementById('mobile-action-panel') || this.createActionPanel();
        this.sprintButton = this.actionPanel.querySelector('#sprint-button') as HTMLButtonElement;
        this.dashButton = this.actionPanel.querySelector('#dash-button') as HTMLButtonElement;
        this.actionButton = this.actionPanel.querySelector('#action-button') as HTMLButtonElement;
        
        this.setupTouchListeners();
        this.initializeJoystickPosition();
    }

    private createJoystick(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'joystick-container';
        container.className = 'joystick-container';
        container.innerHTML = `
            <div class="joystick-base">
                <div class="joystick"></div>
            </div>
        `;
        document.body.appendChild(container);
        return container;
    }

    private createActionPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.id = 'mobile-action-panel';
        panel.className = 'mobile-action-panel';
        panel.innerHTML = `
            <button id="sprint-button" class="action-button sprint-button" aria-label="Sprint">
                <span class="action-icon">🏃</span>
                <span class="action-label">Sprint</span>
            </button>
            <button id="dash-button" class="action-button dash-button" aria-label="Dash">
                <span class="action-icon">↗</span>
                <span class="action-label">Jump</span>
            </button>
            <button id="action-button" class="action-button action-button-main" aria-label="Action">
                <span class="action-icon">👊</span>
                <span class="action-label">Punch</span>
            </button>
        `;
        document.body.appendChild(panel);
        return panel;
    }

    private initializeJoystickPosition(): void {
        const rect = this.joystickBase.getBoundingClientRect();
        this.joystickCenterX = rect.left + rect.width / 2;
        this.joystickCenterY = rect.top + rect.height / 2;
    }

    private setupTouchListeners(): void {
        const gameHud = document.getElementById('game-hud');
        
        // Joystick touch
        this.joystickBase.addEventListener('touchstart', (e) => this.handleJoystickTouchStart(e));
        this.joystickBase.addEventListener('touchmove', (e) => this.handleJoystickTouchMove(e));
        this.joystickBase.addEventListener('touchend', (e) => this.handleJoystickTouchEnd(e));

        this.bindHoldButton(this.sprintButton, (held) => {
            this.touchInput.sprint = held;
        });

        this.bindTapButton(this.dashButton, () => {
            this.dashQueued = true;
        });

        this.bindTapButton(this.actionButton, () => {
            this.interactQueued = true;
        });

        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.joystickBase || this.isDragging) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    private bindHoldButton(button: HTMLButtonElement, onChange: (held: boolean) => void): void {
        const begin = (event: PointerEvent | TouchEvent | MouseEvent) => {
            event.preventDefault();
            onChange(true);
            button.classList.add('active');
        };

        const end = (event: PointerEvent | TouchEvent | MouseEvent) => {
            event.preventDefault();
            onChange(false);
            button.classList.remove('active');
        };

        button.addEventListener('pointerdown', begin);
        button.addEventListener('pointerup', end);
        button.addEventListener('pointercancel', end);
        button.addEventListener('pointerleave', end);
    }

    private bindTapButton(button: HTMLButtonElement, onTap: () => void): void {
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            onTap();
            button.classList.add('active');
        });

        const release = () => button.classList.remove('active');
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('pointerleave', release);
    }

    private handleJoystickTouchStart(event: TouchEvent): void {
        this.isDragging = true;
        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    private handleJoystickTouchMove(event: TouchEvent): void {
        if (!this.isDragging) return;

        event.preventDefault();
        const touch = event.touches[0];

        const deltaX = touch.clientX - this.joystickCenterX;
        const deltaY = touch.clientY - this.joystickCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        let moveX = deltaX;
        let moveY = deltaY;

        // Constrain to max distance
        if (distance > this.maxDistance) {
            const ratio = this.maxDistance / distance;
            moveX *= ratio;
            moveY *= ratio;
        }

        // Update joystick visual position
        this.joystick.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

        // Update input based on position
        this.touchInput.moveX = moveX / this.maxDistance;
        this.touchInput.moveY = -moveY / this.maxDistance;
    }

    private handleJoystickTouchEnd(event: TouchEvent): void {
        this.isDragging = false;
        this.joystick.style.transform = 'translate(-50%, -50%)';
        this.touchInput.moveX = 0;
        this.touchInput.moveY = 0;
    }

    public getMovementInput(): { moveX: number; moveY: number; sprint: boolean } {
        return {
            moveX: this.touchInput.moveX,
            moveY: this.touchInput.moveY,
            sprint: this.touchInput.sprint,
        };
    }

    public consumeActions(): { dash: boolean; interact: boolean } {
        const actions = {
            dash: this.dashQueued,
            interact: this.interactQueued,
        };
        this.dashQueued = false;
        this.interactQueued = false;
        return actions;
    }

    public show(): void {
        this.joystickContainer.classList.add('active');
        this.actionPanel.classList.add('active');
    }

    public hide(): void {
        this.joystickContainer.classList.remove('active');
        this.actionPanel.classList.remove('active');
    }
}

export class MapView {
    private mapCanvas: HTMLCanvasElement;
    private mapCtx: CanvasRenderingContext2D;
    private mapScale: number = 1;
    private mapSize: number = 200;

    constructor(containerId: string = 'map-view') {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Map view container ${containerId} not found`);
        }

        this.mapCanvas = container as HTMLCanvasElement;
        this.mapCtx = this.mapCanvas.getContext('2d') as CanvasRenderingContext2D;

        // Set canvas size
        this.mapCanvas.width = 200;
        this.mapCanvas.height = 200;

        // Draw initial map
        this.drawMap();
    }

    private drawMap(): void {
        // Background
        this.mapCtx.fillStyle = 'rgba(20, 30, 50, 0.9)';
        this.mapCtx.fillRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);

        // Border
        this.mapCtx.strokeStyle = '#00d4ff';
        this.mapCtx.lineWidth = 2;
        this.mapCtx.strokeRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);

        // Grid
        this.mapCtx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        this.mapCtx.lineWidth = 1;
        const gridSize = 20;
        for (let i = 0; i <= this.mapCanvas.width; i += gridSize) {
            this.mapCtx.beginPath();
            this.mapCtx.moveTo(i, 0);
            this.mapCtx.lineTo(i, this.mapCanvas.height);
            this.mapCtx.stroke();

            this.mapCtx.beginPath();
            this.mapCtx.moveTo(0, i);
            this.mapCtx.lineTo(this.mapCanvas.width, i);
            this.mapCtx.stroke();
        }
    }

    public updateMap(
        playerPos: { x: number; z: number },
        enemies: Array<{ position: { x: number; z: number }; alive: boolean }>,
        foods: Array<{ position: { x: number; z: number } }>,
        mapSize: number = 200
    ): void {
        this.drawMap();

        const scale = this.mapCanvas.width / mapSize;
        const centerX = this.mapCanvas.width / 2;
        const centerY = this.mapCanvas.height / 2;

        // Draw food
        this.mapCtx.fillStyle = '#ffaa00';
        foods.forEach(food => {
            const x = centerX + (food.position.x * scale);
            const y = centerY + (food.position.z * scale);
            this.mapCtx.beginPath();
            this.mapCtx.arc(x, y, 2, 0, Math.PI * 2);
            this.mapCtx.fill();
        });

        // Draw enemies
        enemies.forEach(enemy => {
            if (enemy.alive) {
                this.mapCtx.fillStyle = '#ff4444';
                const x = centerX + (enemy.position.x * scale);
                const y = centerY + (enemy.position.z * scale);
                this.mapCtx.beginPath();
                this.mapCtx.arc(x, y, 3, 0, Math.PI * 2);
                this.mapCtx.fill();
            }
        });

        // Draw player
        this.mapCtx.fillStyle = '#00ff00';
        this.mapCtx.strokeStyle = '#00aa00';
        this.mapCtx.lineWidth = 2;
        const playerX = centerX + (playerPos.x * scale);
        const playerY = centerY + (playerPos.z * scale);
        this.mapCtx.beginPath();
        this.mapCtx.arc(playerX, playerY, 5, 0, Math.PI * 2);
        this.mapCtx.fill();
        this.mapCtx.stroke();
    }

    public show(): void {
        this.mapCanvas.parentElement?.classList.add('active');
    }

    public hide(): void {
        this.mapCanvas.parentElement?.classList.remove('active');
    }
}
