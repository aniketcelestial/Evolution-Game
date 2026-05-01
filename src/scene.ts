import * as THREE from 'three';

export class Scene3D {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private canvas: HTMLCanvasElement | null = null;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        this.scene.fog = new THREE.Fog(0x0a0e27, 100, 500);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    async init(): Promise<void> {
        // Append canvas to DOM
        const container = document.getElementById('canvas-container');
        if (container) {
            this.canvas = this.renderer.domElement;
            container.appendChild(this.canvas);
        }

        // Setup lighting
        this.setupLights();

        // Setup environment
        this.setupEnvironment();
    }

    private setupLights(): void {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x4a90e2, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Point light for atmosphere
        const pointLight = new THREE.PointLight(0x00d4ff, 0.4);
        pointLight.position.set(-20, 15, -20);
        this.scene.add(pointLight);
    }

    private setupEnvironment(): void {
        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a3a4a,
            roughness: 0.8,
            metalness: 0.2,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(200, 20, 0x00d4ff, 0x444444);
        (gridHelper as any).position.y = 0.01;
        this.scene.add(gridHelper);

        // Add axes helper for debugging
        const axesHelper = new THREE.AxesHelper(20);
        this.scene.add(axesHelper);

        // Add some environmental objects
        this.addEnvironmentObjects();
    }

    private addEnvironmentObjects(): void {
        // Add some floating particles/stars for atmosphere
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 400;
            positions[i + 1] = Math.random() * 200;
            positions[i + 2] = (Math.random() - 0.5) * 400;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00d4ff,
            size: 0.5,
            opacity: 0.6,
            transparent: true,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    public getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }

    public onWindowResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    public updateCameraRotation(rotationX: number, rotationY: number): void {
        // Apply rotation to camera
        // Rotations are applied around the player's position
        // This provides a way to look around while the player moves
        const currentPos = this.camera.position.clone();
        const distance = 25;
        const height = 8;

        // Calculate new camera position based on rotation
        const x = Math.sin(rotationY) * distance;
        const z = Math.cos(rotationY) * distance;
        const y = height + Math.sin(rotationX) * 5;

        this.camera.position.set(x, y, z);
        // Camera continues to look at the player (will be updated by player.ts)
    }

    public dispose(): void {
        this.renderer.dispose();
        if (this.canvas?.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }
}
