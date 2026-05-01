import * as THREE from 'three';

export interface TouchInput {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
}

export class MobileControls {
    private joystickContainer: HTMLElement;
    private joystick: HTMLElement;
    private joystickBase: HTMLElement;
    private isDragging: boolean = false;
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private joystickCenterX: number = 0;
    private joystickCenterY: number = 0;
    private joystickRadius: number = 60;
    private maxDistance: number = 50;

    public touchInput: TouchInput = {
        up: false,
        down: false,
        left: false,
        right: false,
    };

    private cameraRotationX: number = 0;
    private cameraRotationY: number = 0;
    private touchCameraStartX: number = 0;
    private touchCameraStartY: number = 0;
    private isCameraRotating: boolean = false;
    private cameraRotationSensitivity: number = 0.005;

    constructor() {
        this.joystickContainer = document.getElementById('joystick-container') || this.createJoystick();
        this.joystickBase = this.joystickContainer.querySelector('.joystick-base') as HTMLElement;
        this.joystick = this.joystickContainer.querySelector('.joystick') as HTMLElement;
        
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

        // Camera control - slide anywhere on screen
        if (gameHud) {
            gameHud.addEventListener('touchstart', (e) => this.handleCameraRotationStart(e));
            document.addEventListener('touchmove', (e) => this.handleCameraRotationMove(e));
            document.addEventListener('touchend', (e) => this.handleCameraRotationEnd(e));
        }

        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (e.target === this.joystickBase || this.isDragging) {
                e.preventDefault();
            }
        }, { passive: false });
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
        this.touchInput.up = moveY < -20;
        this.touchInput.down = moveY > 20;
        this.touchInput.left = moveX < -20;
        this.touchInput.right = moveX > 20;
    }

    private handleJoystickTouchEnd(event: TouchEvent): void {
        this.isDragging = false;
        this.joystick.style.transform = 'translate(-50%, -50%)';
        this.touchInput = { up: false, down: false, left: false, right: false };
    }

    private handleCameraRotationStart(event: TouchEvent): void {
        // Don't start camera rotation if touching joystick
        if (event.target === this.joystickBase || this.joystickBase.contains(event.target as Node)) {
            return;
        }

        // Check if there's a second touch (two-finger camera control)
        if (event.touches.length === 2) {
            this.isCameraRotating = true;
            this.touchCameraStartX = event.touches[0].clientX;
            this.touchCameraStartY = event.touches[0].clientY;
        }
    }

    private handleCameraRotationMove(event: TouchEvent): void {
        if (!this.isCameraRotating || event.touches.length < 2) return;

        const deltaX = event.touches[0].clientX - this.touchCameraStartX;
        const deltaY = event.touches[0].clientY - this.touchCameraStartY;

        this.cameraRotationY += deltaX * this.cameraRotationSensitivity;
        this.cameraRotationX += deltaY * this.cameraRotationSensitivity;

        // Clamp X rotation
        this.cameraRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotationX));

        this.touchCameraStartX = event.touches[0].clientX;
        this.touchCameraStartY = event.touches[0].clientY;
    }

    private handleCameraRotationEnd(event: TouchEvent): void {
        this.isCameraRotating = false;
    }

    public getCameraRotation(): { x: number; y: number } {
        return {
            x: this.cameraRotationX,
            y: this.cameraRotationY,
        };
    }

    public resetCameraRotation(): void {
        this.cameraRotationX = 0;
        this.cameraRotationY = 0;
    }

    public show(): void {
        this.joystickContainer.classList.add('active');
    }

    public hide(): void {
        this.joystickContainer.classList.remove('active');
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
        playerPos: THREE.Vector3,
        enemies: Array<{ position: THREE.Vector3; alive: boolean }>,
        foods: Array<{ position: THREE.Vector3 }>,
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
