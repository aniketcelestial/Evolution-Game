import * as THREE from 'three';

export interface EnemyStats {
    level: number;
    health: number;
    maxHealth: number;
    size: number;
    speed: number;
    attack: number;
    experienceReward: number;
}

export class Enemy {
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public radius: number = 0.5;
    public stats: EnemyStats;
    public age: number = 0;
    
    private mesh: THREE.Mesh;
    private scene: THREE.Scene;
    private targetPosition: THREE.Vector3;
    private moveTimer: number = 0;

    constructor(scene: THREE.Scene, position: THREE.Vector3, level: number) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3();
        this.targetPosition = position.clone();

        // Generate enemy stats based on level
        const levelFactor = 1 + (level - 1) * 0.2;
        this.stats = {
            level: level,
            health: 50 * levelFactor,
            maxHealth: 50 * levelFactor,
            size: 0.8 + level * 0.1,
            speed: 8 + level * 0.5,
            attack: 5 + level * 1.5,
            experienceReward: 50 * levelFactor,
        };

        this.mesh = this.createMesh();
        this.scene.add(this.mesh);
        this.updateMesh();
    }

    private createMesh(): THREE.Mesh {
        const geometry = new THREE.OctahedronGeometry(this.radius, 2);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            roughness: 0.6,
            metalness: 0.2,
            emissive: 0x990000,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    public update(deltaTime: number, playerPos: THREE.Vector3): void {
        this.age += deltaTime;
        this.moveTimer += deltaTime;

        // Update target position every 2 seconds or randomly move
        if (this.moveTimer > 2) {
            const distance = this.position.distanceTo(playerPos);
            
            if (distance < 20) {
                // Chase player if nearby
                this.targetPosition.copy(playerPos);
            } else {
                // Random wandering
                this.targetPosition.copy(this.position);
                this.targetPosition.x += (Math.random() - 0.5) * 30;
                this.targetPosition.z += (Math.random() - 0.5) * 30;
            }
            this.moveTimer = 0;
        }

        // Move towards target
        const direction = this.targetPosition.clone().sub(this.position).normalize();
        this.velocity.copy(direction.multiplyScalar(this.stats.speed));
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Boundary constraints
        this.position.x = Math.max(-100, Math.min(100, this.position.x));
        this.position.z = Math.max(-100, Math.min(100, this.position.z));

        // Apply friction
        this.velocity.multiplyScalar(0.9);

        this.updateMesh();
    }

    private updateMesh(): void {
        this.mesh.position.copy(this.position);
        this.mesh.scale.setScalar(this.stats.size);

        // Color based on level (red shades)
        const hue = 0; // Red
        const saturation = 0.7 + (this.stats.level / 30) * 0.3;
        const lightness = 0.4 + (this.stats.level / 30) * 0.1;
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        (this.mesh.material as THREE.MeshStandardMaterial).color = color;
        (this.mesh.material as THREE.MeshStandardMaterial).emissive = color;
    }

    public takeDamage(amount: number): void {
        this.stats.health -= amount;
    }

    public isAlive(): boolean {
        return this.stats.health > 0;
    }

    public getRadius(): number {
        return this.radius * this.stats.size;
    }

    public dispose(): void {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
