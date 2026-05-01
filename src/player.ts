import * as THREE from 'three';

export interface PlayerStats {
    level: number;
    health: number;
    maxHealth: number;
    size: number;
    speed: number;
    attack: number;
    experience: number;
    experienceNeeded: number;
}

export class Player {
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public radius: number = 0.5; // Starts tiny
    public stats: PlayerStats;
    
    private mesh: THREE.Mesh;
    private bodySegments: THREE.Mesh[] = [];
    private trailPoints: THREE.Vector3[] = [];
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, position: THREE.Vector3) {
        this.scene = scene;
        this.camera = camera;
        this.position = position.clone();
        this.velocity = new THREE.Vector3();

        this.stats = {
            level: 1,
            health: 100,
            maxHealth: 100,
            size: 1,
            speed: 15,
            attack: 10,
            experience: 0,
            experienceNeeded: 100,
        };

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
        this.buildBodySegments();
        this.updateMesh();
    }

    private createMesh(): THREE.Mesh {
        const geometry = new THREE.SphereGeometry(this.radius, 24, 18);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            roughness: 0.5,
            metalness: 0.3,
            emissive: 0x00aa00,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    private buildBodySegments(): void {
        const segmentCount = 14;
        for (let i = 0; i < segmentCount; i++) {
            const segmentGeometry = new THREE.SphereGeometry(this.radius * 0.9, 18, 14);
            const segmentMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                roughness: 0.65,
                metalness: 0.15,
                emissive: 0x004400,
            });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.castShadow = true;
            segment.receiveShadow = true;
            this.bodySegments.push(segment);
            this.scene.add(segment);
        }

        const initialPoint = this.position.clone();
        for (let i = 0; i < segmentCount * 8; i++) {
            this.trailPoints.push(initialPoint.clone());
        }
    }

    public update(deltaTime: number, input: { up: boolean; down: boolean; left: boolean; right: boolean }): void {
        // Movement
        const moveVector = new THREE.Vector3();
        if (input.up) moveVector.z -= 1;
        if (input.down) moveVector.z += 1;
        if (input.left) moveVector.x -= 1;
        if (input.right) moveVector.x += 1;

        if (moveVector.length() > 0) {
            moveVector.normalize();
            this.velocity.copy(moveVector.multiplyScalar(this.stats.speed));
        } else {
            this.velocity.multiplyScalar(0.8);
        }

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.pushTrailPoint();

        // Boundary constraints
        this.position.x = Math.max(-100, Math.min(100, this.position.x));
        this.position.z = Math.max(-100, Math.min(100, this.position.z));

        this.updateMesh();
        this.updateCamera();
    }

    private updateMesh(): void {
        this.mesh.position.copy(this.position);
        const headScale = this.stats.size * 1.15;
        this.mesh.scale.setScalar(headScale);

        const velocityStrength = Math.min(1, this.velocity.length() / Math.max(1, this.stats.speed));
        this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z || 0.0001);
        this.mesh.rotation.x = Math.sin(performance.now() * 0.004) * 0.04 * velocityStrength;

        // Update color based on level
        const hue = (this.stats.level / 30) * 0.3; // Green to blue as you level
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        (this.mesh.material as THREE.MeshStandardMaterial).color = color;
        (this.mesh.material as THREE.MeshStandardMaterial).emissive = color;

        this.updateBodySegments(color);
    }

    private pushTrailPoint(): void {
        this.trailPoints.unshift(this.position.clone());
        const maxTrailPoints = Math.max(64, this.bodySegments.length * 10);
        if (this.trailPoints.length > maxTrailPoints) {
            this.trailPoints.length = maxTrailPoints;
        }
    }

    private updateBodySegments(color: THREE.Color): void {
        const spacing = 7;
        const swayPhase = performance.now() * 0.006;

        for (let i = 0; i < this.bodySegments.length; i++) {
            const segment = this.bodySegments[i];
            const trailIndex = Math.min(this.trailPoints.length - 1, i * spacing + 1);
            const target = this.trailPoints[trailIndex] || this.position;
            const nextTarget = this.trailPoints[Math.min(this.trailPoints.length - 1, trailIndex + 1)] || target;
            const followDirection = target.clone().sub(nextTarget);
            const lateralOffset = Math.sin(swayPhase + i * 0.45) * (0.12 + i * 0.01);

            segment.position.copy(target);
            segment.position.x += lateralOffset;
            segment.position.y = target.y + Math.cos(swayPhase + i * 0.35) * 0.08;
            segment.scale.setScalar(Math.max(0.35, (this.stats.size * 0.9) * (1 - i / (this.bodySegments.length * 1.15))));

            if (followDirection.lengthSq() > 0.0001) {
                segment.rotation.y = Math.atan2(followDirection.x, followDirection.z || 0.0001);
            }

            const segmentMaterial = segment.material as THREE.MeshStandardMaterial;
            const fade = 1 - i / (this.bodySegments.length + 2);
            segmentMaterial.color = color.clone().lerp(new THREE.Color(0x05250c), 1 - fade * 0.9);
            segmentMaterial.emissive = color.clone().multiplyScalar(0.2 * fade);
            segmentMaterial.opacity = 1;
            segmentMaterial.transparent = false;
        }
    }

    private updateCamera(): void {
        const distance = 10 + this.stats.size * 5;
        const height = 5 + this.stats.size * 2;
        this.camera.position.lerp(new THREE.Vector3(
            this.position.x,
            height,
            this.position.z + distance
        ), 0.1);
        this.camera.lookAt(this.position);
    }

    public addExperience(amount: number): void {
        this.stats.experience += amount;

        // Level up
        while (this.stats.experience >= this.stats.experienceNeeded) {
            this.levelUp();
        }
    }

    private levelUp(): void {
        this.stats.experience -= this.stats.experienceNeeded;
        this.stats.level += 1;

        // Increase stats on level up
        this.stats.size += 0.15;
        this.stats.maxHealth += 20;
        this.stats.health = this.stats.maxHealth;
        this.stats.speed += 0.5;
        this.stats.attack += 2;
        this.stats.experienceNeeded = Math.floor(this.stats.experienceNeeded * 1.1);

        if (this.bodySegments.length < 24) {
            const segmentGeometry = new THREE.SphereGeometry(this.radius * 0.9, 18, 14);
            const segmentMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                roughness: 0.65,
                metalness: 0.15,
                emissive: 0x004400,
            });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.castShadow = true;
            segment.receiveShadow = true;
            this.bodySegments.push(segment);
            this.scene.add(segment);
        }

        this.updateMesh();
    }

    public takeDamage(amount: number): void {
        this.stats.health -= amount;
    }

    public heal(amount: number): void {
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    }

    public eat(amount: number): void {
        this.heal(amount);
        this.addExperience(amount * 0.5);
    }

    public isAlive(): boolean {
        return this.stats.health > 0;
    }

    public getPosition(): THREE.Vector3 {
        return this.position;
    }

    public getRadius(): number {
        return this.radius * this.stats.size;
    }

    public dispose(): void {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();

        this.bodySegments.forEach(segment => {
            this.scene.remove(segment);
            segment.geometry.dispose();
            (segment.material as THREE.Material).dispose();
        });
        this.bodySegments = [];
        this.trailPoints = [];
    }
}
