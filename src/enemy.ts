import * as BABYLON from '@babylonjs/core';

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
    public position: BABYLON.Vector3;
    public velocity: BABYLON.Vector3;
    public radius: number = 0.5;
    public stats: EnemyStats;
    public age: number = 0;
    
    private mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private targetPosition: BABYLON.Vector3;
    private moveTimer: number = 0;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: number) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = BABYLON.Vector3.Zero();
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
        this.updateMesh();
    }

    private createMesh(): BABYLON.Mesh {
        const mesh = BABYLON.MeshBuilder.CreateIcoSphere('enemy', { radius: this.radius, subdivisions: 2 }, this.scene);
        const material = new BABYLON.StandardMaterial('enemy-material', this.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString('#ff4444');
        material.emissiveColor = BABYLON.Color3.FromHexString('#990000');
        material.specularColor = BABYLON.Color3.FromHexString('#442222');
        mesh.material = material;
        mesh.receiveShadows = true;
        return mesh;
    }

    public update(deltaTime: number, playerPos: BABYLON.Vector3): void {
        this.age += deltaTime;
        this.moveTimer += deltaTime;

        // Update target position every 2 seconds or randomly move
        if (this.moveTimer > 2) {
            const distance = BABYLON.Vector3.Distance(this.position, playerPos);
            
            if (distance < 20) {
                // Chase player if nearby
                this.targetPosition.copyFrom(playerPos);
            } else {
                // Random wandering
                this.targetPosition.copyFrom(this.position);
                this.targetPosition.x += (Math.random() - 0.5) * 30;
                this.targetPosition.z += (Math.random() - 0.5) * 30;
            }
            this.moveTimer = 0;
        }

        // Move towards target
        const direction = this.targetPosition.subtract(this.position);
        if (direction.lengthSquared() > 0.0001) {
            direction.normalize();
        }
        this.velocity = direction.scale(this.stats.speed);
        this.position.addInPlace(this.velocity.scale(deltaTime));

        // Boundary constraints
        this.position.x = Math.max(-100, Math.min(100, this.position.x));
        this.position.z = Math.max(-100, Math.min(100, this.position.z));

        // Apply friction
        this.velocity.scaleInPlace(0.9);

        this.updateMesh();
    }

    private updateMesh(): void {
        this.mesh.position.copyFrom(this.position);
        this.mesh.scaling.setAll(this.stats.size);

        // Color based on level (red shades)
        const saturation = 0.7 + (this.stats.level / 30) * 0.3;
        const lightness = 0.4 + (this.stats.level / 30) * 0.1;
        const color = BABYLON.Color3.FromHSV(0, saturation, lightness);
        const material = this.mesh.material as BABYLON.StandardMaterial;
        material.diffuseColor = color;
        material.emissiveColor = color.scale(0.55);
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
        this.mesh.dispose();
    }
}
