import * as BABYLON from '@babylonjs/core';
import { PlayerControlInput } from './controls';
import { createSlitherTube } from './modelFactory';

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
    public position: BABYLON.Vector3;
    public velocity: BABYLON.Vector3;
    public facingAngle: number = 0;
    public radius: number = 0.5; // Starts tiny
    public stats: PlayerStats;
    private segmentsGrown: number = 0;
    private evolved: boolean = false;
    
    private mesh: BABYLON.Mesh;
    private bodySegmentCount: number = 0;
    private trailPoints: BABYLON.Vector3[] = [];
    private slitherMesh: BABYLON.Mesh | null = null;
    private scene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private dashCooldown: number = 0;
    private dashTimer: number = 0;
    private dashDirection: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private movementBoundary: number = 100;
    private obstacles: Array<{ position: BABYLON.Vector3; radius: number }> = [];

    constructor(scene: BABYLON.Scene, camera: BABYLON.ArcRotateCamera, position: BABYLON.Vector3) {
        this.scene = scene;
        this.camera = camera;
        this.position = position.clone();
        this.velocity = BABYLON.Vector3.Zero();

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
        this.buildBodySegments();
        this.updateMesh();
    }

    private createMesh(): BABYLON.Mesh {
        const mesh = BABYLON.MeshBuilder.CreateSphere('player-head', { diameter: this.radius * 2, segments: 24 }, this.scene);
        const material = new BABYLON.StandardMaterial('player-head-material', this.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString('#00ff00');
        material.emissiveColor = BABYLON.Color3.FromHexString('#00aa00');
        material.specularColor = BABYLON.Color3.FromHexString('#223322');
        mesh.material = material;
        mesh.receiveShadows = true;
        return mesh;
    }

    private buildBodySegments(): void {
        // Use a simple segment count; visual is rendered as a smooth tube.
        const segmentCount = 14;
        this.bodySegmentCount = segmentCount;
        const initialPoint = this.position.clone();
        for (let i = 0; i < segmentCount * 8; i++) {
            this.trailPoints.push(initialPoint.clone());
        }
    }

    public update(deltaTime: number, input: PlayerControlInput): void {
        this.dashCooldown = Math.max(0, this.dashCooldown - deltaTime);

        const moveVector = new BABYLON.Vector3(input.moveX, 0, input.moveY);
        if (moveVector.lengthSquared() > 1) {
            moveVector.normalize();
        }

        if (moveVector.lengthSquared() > 0.0001) {
            this.facingAngle = Math.atan2(moveVector.x, moveVector.z);
        }

        const targetVelocity = moveVector.scale(this.stats.speed * (input.sprint ? 1.45 : 1));

        if (input.dash && this.dashCooldown <= 0 && moveVector.lengthSquared() > 0.0001) {
            this.dashDirection = moveVector.clone().normalize();
            this.dashTimer = 0.18;
            this.dashCooldown = 0.95;
        }

        if (this.dashTimer > 0) {
            this.dashTimer -= deltaTime;
            targetVelocity.addInPlace(this.dashDirection.scale(this.stats.speed * 4.5));
        }

        this.velocity = BABYLON.Vector3.Lerp(this.velocity, targetVelocity, Math.min(1, deltaTime * 8));
        this.position.addInPlace(this.velocity.scale(deltaTime));

        // Only extend the trail while moving; otherwise the body would collapse into the head.
        if (this.velocity.lengthSquared() > 0.0001) {
            this.pushTrailPoint();
        }

        // Boundary constraints (use runtime movementBoundary)
        const b = this.movementBoundary;
        this.position.x = Math.max(-b, Math.min(b, this.position.x));
        this.position.z = Math.max(-b, Math.min(b, this.position.z));

        // Obstacle collision: simple push-out from mountain spheres
        for (const obs of this.obstacles) {
            const toObs = this.position.subtract(obs.position);
            const dist = toObs.length();
            if (dist <= 0.0001) continue;
            const minDist = this.getRadius() + obs.radius + 0.2; // small padding
            if (dist < minDist) {
                const pushDir = toObs.normalize();
                this.position = obs.position.add(pushDir.scale(minDist));
                // reduce velocity on collision
                this.velocity.scaleInPlace(0.2);
            }
        }

        this.updateMesh();
        this.updateCamera();
    }

    private updateMesh(): void {
        this.mesh.position.copyFrom(this.position);
        const headScale = this.stats.size * 1.15;
        this.mesh.scaling.setAll(headScale);

        const velocityStrength = Math.min(1, this.velocity.length() / Math.max(1, this.stats.speed));
        this.mesh.rotation.y = this.facingAngle;
        this.mesh.rotation.x = Math.sin(performance.now() * 0.004) * 0.04 * velocityStrength;

        // Update color based on level
        const hue = (this.stats.level / 30) * 0.3; // Green to blue as you level
        const color = BABYLON.Color3.FromHSV(hue * 360, 1, 1);
        const headMaterial = this.mesh.material as BABYLON.StandardMaterial;
        headMaterial.diffuseColor = color;
        headMaterial.emissiveColor = color.scale(0.35);

        this.updateSlitherMesh(color);
    }

    private pushTrailPoint(): void {
        this.trailPoints.unshift(this.position.clone());
        const maxTrailPoints = Math.max(64, this.bodySegmentCount * 10);
        if (this.trailPoints.length > maxTrailPoints) {
            this.trailPoints.length = maxTrailPoints;
        }
    }

    private updateSlitherMesh(color: BABYLON.Color3): void {
        // sample trailPoints to create a short path for the tube mesh
        const maxSegmentsToShow = Math.max(6, this.bodySegmentCount);
        const pointsToUse = Math.min(this.trailPoints.length, maxSegmentsToShow * 6);
        const path: BABYLON.Vector3[] = [];
        const spacing = Math.max(1, Math.floor(this.trailPoints.length / Math.max(6, pointsToUse)));
        for (let i = 0; i < pointsToUse; i += spacing) {
            const p = this.trailPoints[i] || this.position;
            path.push(new BABYLON.Vector3(p.x, p.y + 0.02, p.z));
        }
        // ensure head point is included
        path.unshift(this.position.clone());

        if (this.slitherMesh) {
            try { this.slitherMesh.dispose(); } catch (e) {}
            this.slitherMesh = null;
        }

        if (path.length >= 2) {
            this.slitherMesh = createSlitherTube(this.scene, path, this.stats.size, `player-slither-${Date.now()}`);
            const mat = this.slitherMesh.material as BABYLON.StandardMaterial;
            mat.diffuseColor = color;
            mat.emissiveColor = color.scale(0.25);
        }
    }

    private addSegment(): void {
        this.bodySegmentCount += 1;
        for (let i = 0; i < 8; i++) {
            this.trailPoints.push(this.position.clone());
        }
    }

    private evolveToAnt(): void {
        if (this.evolved) return;
        this.evolved = true;
        // Change appearance: darker, smaller segments, faster/stronger
        const headMaterial = this.mesh.material as BABYLON.StandardMaterial;
        headMaterial.diffuseColor = BABYLON.Color3.FromHexString('#6b3b1a');
        headMaterial.emissiveColor = BABYLON.Color3.FromHexString('#4a2a12');

        // adjust stats for ant form
        this.stats.attack += 15;
        this.stats.speed += 4;
        this.stats.maxHealth += 30;
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + 30);
        // visually the slither will be thinner and more tapered when ant-evolved
        if (this.slitherMesh && this.slitherMesh.material) {
            const mat = this.slitherMesh.material as BABYLON.StandardMaterial;
            mat.diffuseColor = BABYLON.Color3.FromHexString('#6b3b1a');
            mat.emissiveColor = BABYLON.Color3.FromHexString('#4a2a12');
        }
    }

    private updateCamera(): void {
        this.camera.radius = 24 + this.stats.size * 3;
        this.camera.setTarget(this.position);
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

        if (this.bodySegmentCount < 24) {
            this.bodySegmentCount += 1;
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
        // Grow based on nutrition: 1 segment per ~5 nutrition
        const grows = Math.floor(amount / 5);
        for (let i = 0; i < Math.max(1, grows); i++) {
            this.addSegment();
            this.segmentsGrown += 1;
        }

        // Evolve when grown enough segments
        const evolveThreshold = 10; // configurable threshold
        if (!this.evolved && this.segmentsGrown >= evolveThreshold) {
            this.evolveToAnt();
        }
    }

    public isAlive(): boolean {
        return this.stats.health > 0;
    }

    public getPosition(): BABYLON.Vector3 {
        return this.position;
    }

    public getRadius(): number {
        return this.radius * this.stats.size;
    }

    public dispose(): void {
        this.mesh.dispose();

        if (this.slitherMesh) {
            try { this.slitherMesh.dispose(); } catch (e) {}
            this.slitherMesh = null;
        }
        this.trailPoints = [];
    }

    public setBoundary(boundary: number): void {
        this.movementBoundary = Math.max(20, boundary);
    }

    public setObstacles(obstacles: Array<{ position: BABYLON.Vector3; radius: number }>): void {
        this.obstacles = obstacles.map(o => ({ position: o.position.clone(), radius: o.radius }));
    }
}
