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
    public species: string = 'generic';
    public actionPoints: number = 1;
    
    private mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private targetPosition: BABYLON.Vector3;
    private moveTimer: number = 0;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: number, species?: string) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = BABYLON.Vector3.Zero();
        this.targetPosition = position.clone();

        // choose species randomly if not provided
        const speciesList = ['ant', 'slither', 'bee', 'snake'];
        this.species = species || speciesList[Math.floor(Math.random() * speciesList.length)];

        // Generate base enemy stats based on level
        const levelFactor = 1 + (level - 1) * 0.2;
        let baseHealth = 50 * levelFactor;
        let baseSpeed = 8 + level * 0.5;
        let baseAttack = 5 + level * 1.5;
        let size = 0.8 + level * 0.1;

        // species modifiers
        switch (this.species) {
            case 'ant':
                baseHealth *= 0.9;
                baseSpeed *= 1.6;
                baseAttack *= 1.2;
                this.actionPoints = 3;
                size *= 0.7;
                break;
            case 'slither':
                baseHealth *= 1.0;
                baseSpeed *= 1.0;
                baseAttack *= 1.1;
                this.actionPoints = 2;
                size *= 1.1;
                break;
            case 'bee':
                baseHealth *= 0.7;
                baseSpeed *= 2.2;
                baseAttack *= 0.8;
                this.actionPoints = 4;
                size *= 0.6;
                break;
            case 'snake':
                baseHealth *= 1.6;
                baseSpeed *= 0.9;
                baseAttack *= 2.2;
                this.actionPoints = 1;
                size *= 1.25;
                break;
            default:
                this.actionPoints = 2;
        }

        this.stats = {
            level: level,
            health: baseHealth,
            maxHealth: baseHealth,
            size: size,
            speed: baseSpeed,
            attack: baseAttack,
            experienceReward: 50 * levelFactor,
        };

        this.mesh = this.createMesh();
        this.updateMesh();
    }

    private createMesh(): BABYLON.Mesh {
        // Different visuals per species
        let mesh: BABYLON.Mesh;
        const mat = new BABYLON.StandardMaterial('enemy-material', this.scene);

        switch (this.species) {
            case 'ant':
                mesh = BABYLON.MeshBuilder.CreateCylinder('enemy-ant', { diameterTop: this.radius * 0.8, diameterBottom: this.radius * 0.8, height: this.radius * 1.4, tessellation: 12 }, this.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString('#6b3b1a');
                mat.emissiveColor = BABYLON.Color3.FromHexString('#4a2a12');
                break;
            case 'bee':
                mesh = BABYLON.MeshBuilder.CreateSphere('enemy-bee', { diameter: this.radius * 1.2, segments: 12 }, this.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString('#ffd24d');
                mat.emissiveColor = BABYLON.Color3.FromHexString('#ffb600');
                // small wings
                const wingL = BABYLON.MeshBuilder.CreateBox('wingL', { width: this.radius * 0.4, height: 0.02, depth: this.radius * 0.8 }, this.scene);
                const wingR = wingL.clone('wingR');
                wingL.position.set(-this.radius * 0.4, 0.1, 0);
                wingR.position.set(this.radius * 0.4, 0.1, 0);
                wingL.parent = mesh;
                wingR.parent = mesh;
                break;
            case 'slither':
                mesh = BABYLON.MeshBuilder.CreateSphere('enemy-slither', { diameter: this.radius * 1.4, segments: 12 }, this.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString('#2aa65b');
                mat.emissiveColor = BABYLON.Color3.FromHexString('#188a3b');
                mesh.scaling.x = 1.8;
                mesh.scaling.z = 0.9;
                break;
            case 'snake':
                mesh = BABYLON.MeshBuilder.CreateTorus('enemy-snake', { diameter: this.radius * 1.4, thickness: this.radius * 0.35, tessellation: 24 }, this.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString('#8b2b2b');
                mat.emissiveColor = BABYLON.Color3.FromHexString('#5a1a1a');
                break;
            default:
                mesh = BABYLON.MeshBuilder.CreateIcoSphere('enemy', { radius: this.radius, subdivisions: 2 }, this.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString('#ff4444');
                mat.emissiveColor = BABYLON.Color3.FromHexString('#990000');
        }

        mesh.material = mat;
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
        // scale by species-aware size
        this.mesh.scaling = new BABYLON.Vector3(this.stats.size, this.stats.size, this.stats.size);

        // Color variations per species
        const material = this.mesh.material as BABYLON.StandardMaterial;
        switch (this.species) {
            case 'ant':
                material.diffuseColor = BABYLON.Color3.FromHexString('#6b3b1a');
                material.emissiveColor = BABYLON.Color3.FromHexString('#4a2a12');
                break;
            case 'bee':
                material.diffuseColor = BABYLON.Color3.FromHexString('#ffd24d');
                material.emissiveColor = BABYLON.Color3.FromHexString('#ffb600');
                break;
            case 'slither':
                material.diffuseColor = BABYLON.Color3.FromHexString('#2aa65b');
                material.emissiveColor = BABYLON.Color3.FromHexString('#188a3b');
                break;
            case 'snake':
                material.diffuseColor = BABYLON.Color3.FromHexString('#8b2b2b');
                material.emissiveColor = BABYLON.Color3.FromHexString('#5a1a1a');
                break;
            default:
                material.diffuseColor = BABYLON.Color3.FromHexString('#ff4444');
                material.emissiveColor = BABYLON.Color3.FromHexString('#990000');
        }
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
