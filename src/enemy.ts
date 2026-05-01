import * as BABYLON from '@babylonjs/core';
import { createAntModel, createBeeModel, createSnakeModel, createSlitherTube, tryLoadGLTF } from './modelFactory';

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
    
    private mesh: BABYLON.AbstractMesh | BABYLON.TransformNode;
    private scene: BABYLON.Scene;
    private targetPosition: BABYLON.Vector3;
    private moveTimer: number = 0;
    private obstacles: Array<{ position: BABYLON.Vector3; radius: number }> = [];

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
        // Create a provisional model immediately, then try to replace with a glTF model if one exists at assets/models/{species}.glb
        const provisionalName = `enemy-proxy-${this.species}-${Math.floor(Math.random() * 10000)}`;
        let provisional: BABYLON.Mesh | BABYLON.TransformNode;
        switch (this.species) {
            case 'ant':
                provisional = createAntModel(this.scene, this.stats.size, provisionalName);
                break;
            case 'bee':
                provisional = createBeeModel(this.scene, this.stats.size, provisionalName);
                break;
            case 'slither':
                provisional = createSlitherTube(this.scene, [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(-0.8,0,0)], this.stats.size, provisionalName) as unknown as BABYLON.TransformNode;
                break;
            case 'snake':
                provisional = createSnakeModel(this.scene, 8, this.stats.size, provisionalName);
                break;
            default:
                const fallback = BABYLON.MeshBuilder.CreateIcoSphere(provisionalName, { radius: this.radius, subdivisions: 2 }, this.scene);
                const mat = new BABYLON.StandardMaterial(provisionalName + '-mat', this.scene);
                mat.diffuseColor = BABYLON.Color3.FromHexString('#ff4444');
                fallback.material = mat;
                fallback.receiveShadows = true;
                provisional = fallback;
        }

        // attempt to load a glTF model from assets/models/{species}.glb and replace the provisional mesh if available
        (async () => {
            // try both .glb and .gltf extensions so developers can drop either format in assets/models/
            const candidates = [`assets/models/${this.species}.glb`, `assets/models/${this.species}.gltf`];
            let loaded = null as any;
            for (const url of candidates) {
                loaded = await tryLoadGLTF(this.scene, url, `enemy-${this.species}`);
                if (loaded) break;
            }
            if (loaded) {
                try {
                    // position and scale the loaded root to match provisional
                    loaded.position.copyFrom(provisional.position || BABYLON.Vector3.Zero());
                    loaded.scaling = new BABYLON.Vector3(this.stats.size, this.stats.size, this.stats.size);
                    // dispose provisional
                    try { (provisional as any).dispose(); } catch (e) {}
                    this.mesh = loaded;
                } catch (e) {
                    // ignore replacement errors
                }
            }
        })();

        return provisional as unknown as BABYLON.Mesh;
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

        // Obstacle collision avoidance: push out of mountain spheres
        for (const obs of this.obstacles) {
            const toObs = this.position.subtract(obs.position);
            const dist = toObs.length();
            if (dist <= 0.0001) continue;
            const minDist = this.getRadius() + obs.radius + 0.2;
            if (dist < minDist) {
                const pushDir = toObs.normalize();
                this.position = obs.position.add(pushDir.scale(minDist));
                // reduce velocity to avoid jitter
                this.velocity.scaleInPlace(0.3);
            }
        }

        // Boundary constraints
        this.position.x = Math.max(-100, Math.min(100, this.position.x));
        this.position.z = Math.max(-100, Math.min(100, this.position.z));

        // Apply friction
        this.velocity.scaleInPlace(0.9);

        this.updateMesh();
    }

    private updateMesh(): void {
        if ((this.mesh as any).position) {
            (this.mesh as any).position.copyFrom(this.position);
        } else if ((this.mesh as BABYLON.TransformNode).getChildren) {
            // TransformNode: set its position
            (this.mesh as BABYLON.TransformNode).position.copyFrom(this.position);
        }

        // Uniformly scale root models by stats.size
        try {
            (this.mesh as any).scaling = new BABYLON.Vector3(this.stats.size, this.stats.size, this.stats.size);
        } catch (e) {
            // ignore
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

    public setObstacles(obstacles: Array<{ position: BABYLON.Vector3; radius: number }>): void {
        this.obstacles = obstacles.map(o => ({ position: o.position.clone(), radius: o.radius }));
    }
}
