import * as BABYLON from '@babylonjs/core';

export class Scene3D {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private canvas: HTMLCanvasElement | null = null;

    constructor() {
        const placeholderCanvas = document.createElement('canvas');
        this.engine = new BABYLON.Engine(placeholderCanvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
        });
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera('game-camera', Math.PI / 2, Math.PI / 3, 28, BABYLON.Vector3.Zero(), this.scene);
    }

    async init(): Promise<void> {
        const container = document.getElementById('canvas-container');
        if (!container) {
            throw new Error('canvas-container not found');
        }

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'babylon-canvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        container.appendChild(this.canvas);

        this.engine.dispose();
        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
        });
        this.scene = new BABYLON.Scene(this.engine);

        this.scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.FromHexString('#0a0e27'));
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogColor = BABYLON.Color3.FromHexString('#0a0e27');
        this.scene.fogStart = 90;
        this.scene.fogEnd = 420;

        this.camera = new BABYLON.ArcRotateCamera('game-camera', Math.PI / 2, Math.PI / 3.2, 28, BABYLON.Vector3.Zero(), this.scene);
        this.camera.lowerRadiusLimit = 18;
        this.camera.upperRadiusLimit = 56;
        this.camera.lowerBetaLimit = 0.3;
        this.camera.upperBetaLimit = 1.25;
        this.camera.wheelPrecision = 45;
        this.camera.panningSensibility = 0;
        this.camera.angularSensibilityX = 2200;
        this.camera.angularSensibilityY = 2200;
        this.camera.attachControl(this.canvas, true);

        this.setupLights();
        this.setupEnvironment();
    }

    private setupLights(): void {
        const ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.85;
        ambientLight.diffuse = BABYLON.Color3.FromHexString('#88bbff');
        ambientLight.groundColor = BABYLON.Color3.FromHexString('#102035');

        const directionalLight = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.6, -1, -0.35), this.scene);
        directionalLight.position = new BABYLON.Vector3(30, 50, 20);
        directionalLight.intensity = 1.1;

        const glowLight = new BABYLON.PointLight('glow', new BABYLON.Vector3(-24, 14, -20), this.scene);
        glowLight.intensity = 0.35;
        glowLight.diffuse = BABYLON.Color3.FromHexString('#00d4ff');
    }

    private setupEnvironment(): void {
        const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 220, height: 220, subdivisions: 2 }, this.scene);
        const groundMaterial = new BABYLON.StandardMaterial('ground-material', this.scene);
        groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#1a3a4a');
        groundMaterial.specularColor = BABYLON.Color3.Black();
        groundMaterial.wireframe = true;
        groundMaterial.alpha = 0.45;
        ground.material = groundMaterial;

        const grid = BABYLON.MeshBuilder.CreateGround('grid-overlay', { width: 220, height: 220, subdivisions: 20 }, this.scene);
        grid.position.y = 0.02;
        const gridMaterial = new BABYLON.StandardMaterial('grid-material', this.scene);
        gridMaterial.diffuseColor = BABYLON.Color3.FromHexString('#00d4ff');
        gridMaterial.emissiveColor = BABYLON.Color3.FromHexString('#00aacc');
        gridMaterial.wireframe = true;
        gridMaterial.alpha = 0.15;
        grid.material = gridMaterial;

        this.addAtmosphereParticles();
    }

    private addAtmosphereParticles(): void {
        const starSystem = BABYLON.MeshBuilder.CreateSphere('atmo-particles', { diameter: 0.1, segments: 4 }, this.scene);
        const particleMaterial = new BABYLON.StandardMaterial('atmo-material', this.scene);
        particleMaterial.emissiveColor = BABYLON.Color3.FromHexString('#00d4ff');
        particleMaterial.alpha = 0;
        starSystem.material = particleMaterial;

        for (let i = 0; i < 160; i++) {
            const particle = starSystem.clone(`particle-${i}`) as BABYLON.Mesh;
            if (!particle) continue;
            particle.position = new BABYLON.Vector3((Math.random() - 0.5) * 360, Math.random() * 160 + 10, (Math.random() - 0.5) * 360);
            particle.scaling = new BABYLON.Vector3(1, 1, 1);
        }

        starSystem.dispose();
    }

    public render(): void {
        this.scene.render();
    }

    public getScene(): BABYLON.Scene {
        return this.scene;
    }

    public getCamera(): BABYLON.ArcRotateCamera {
        return this.camera;
    }

    public onWindowResize(): void {
        this.engine.resize();
    }

    public updateCameraRotation(rotationX: number, rotationY: number): void {
        this.camera.alpha += rotationY;
        this.camera.beta = Math.max(0.3, Math.min(1.25, this.camera.beta + rotationX));
    }

    public updateCameraTarget(target: BABYLON.Vector3): void {
        this.camera.setTarget(target);
    }

    public dispose(): void {
        this.scene.dispose();
        this.engine.dispose();
        if (this.canvas?.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }
}
