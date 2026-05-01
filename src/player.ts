import * as BABYLON from '@babylonjs/core';
import { PlayerControlInput } from './controls';

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
    private bodySegments: BABYLON.Mesh[] = [];
    private trailPoints: BABYLON.Vector3[] = [];
    private scene: BABYLON.Scene;
    private camera: BABYLON.ArcRotateCamera;
    private dashCooldown: number = 0;
    private dashTimer: number = 0;
    private dashDirection: BABYLON.Vector3 = BABYLON.Vector3.Zero();

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
        const segmentCount = 14;
        for (let i = 0; i < segmentCount; i++) {
            const segment = BABYLON.MeshBuilder.CreateSphere(`player-segment-${i}`, { diameter: this.radius * 1.8, segments: 18 }, this.scene);
            const segmentMaterial = new BABYLON.StandardMaterial(`player-segment-material-${i}`, this.scene);
            segmentMaterial.diffuseColor = BABYLON.Color3.FromHexString('#00ff00');
            segmentMaterial.emissiveColor = BABYLON.Color3.FromHexString('#003b10');
            segmentMaterial.specularColor = BABYLON.Color3.FromHexString('#112211');
            segment.material = segmentMaterial;
            segment.receiveShadows = true;
            this.bodySegments.push(segment);
        }

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

        // Boundary constraints
        this.position.x = Math.max(-100, Math.min(100, this.position.x));
        this.position.z = Math.max(-100, Math.min(100, this.position.z));

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

        this.updateBodySegments(color);
    }

    private pushTrailPoint(): void {
        this.trailPoints.unshift(this.position.clone());
        const maxTrailPoints = Math.max(64, this.bodySegments.length * 10);
        if (this.trailPoints.length > maxTrailPoints) {
            this.trailPoints.length = maxTrailPoints;
        }
    }

    private updateBodySegments(color: BABYLON.Color3): void {
        const spacing = 7;
        const swayPhase = performance.now() * 0.006;
        const velocityStrength = Math.min(1, this.velocity.length() / Math.max(1, this.stats.speed));

        // Compute forward direction from facingAngle; fallback to camera facing if idle.
        let forward = new BABYLON.Vector3(Math.sin(this.facingAngle), 0, Math.cos(this.facingAngle));
        if (forward.lengthSquared() < 0.0001) {
            forward = new BABYLON.Vector3(Math.sin(this.camera.alpha), 0, Math.cos(this.camera.alpha));
        }
        if (forward.lengthSquared() > 0.0001) {
            forward.normalize();
        }

        for (let i = 0; i < this.bodySegments.length; i++) {
            const segment = this.bodySegments[i];
            const trailIndex = Math.min(this.trailPoints.length - 1, i * spacing + 1);
            const trailTarget = this.trailPoints[trailIndex];

            // When moving, prefer trail-following. When idle, build a resting slither using forward offsets.
            let target: BABYLON.Vector3;
            if (trailTarget && (this.velocity.lengthSquared() > 0.0001 || this.trailPoints.some(p => !p.equals(this.position)))) {
                target = trailTarget;
            } else {
                // resting layout along forward vector
                const distance = (i + 1) * (0.4 + this.stats.size * 0.05);
                target = this.position.add(forward.scale(-distance));
            }

            // Sway oscillation: larger when idle
            const idleFactor = 1 - velocityStrength;
            const lateralOffset = Math.sin(swayPhase + i * 0.45) * (0.18 * idleFactor + velocityStrength * 0.06 + i * 0.005);
            const verticalOffset = Math.cos(swayPhase + i * 0.35) * (0.06 * idleFactor + 0.02 * velocityStrength);

            segment.position.copyFrom(target);
            // apply lateral offset perpendicular to forward
            const lateral = new BABYLON.Vector3(-forward.z, 0, forward.x).scale(lateralOffset);
            segment.position.addInPlace(lateral);
            segment.position.y = target.y + verticalOffset;

            const scaleFactor = Math.max(0.28, (this.stats.size * 0.9) * (1 - i / (this.bodySegments.length * 1.15)));
            segment.scaling.setAll(scaleFactor);

            // rotate segment to follow forward direction
            segment.rotation.y = Math.atan2(forward.x, forward.z || 0.0001);

            const segmentMaterial = segment.material as BABYLON.StandardMaterial;
            const fade = 1 - i / (this.bodySegments.length + 2);
            segmentMaterial.diffuseColor = BABYLON.Color3.Lerp(color, BABYLON.Color3.FromHexString('#05250c'), 1 - fade * 0.9);
            segmentMaterial.emissiveColor = color.scale(0.2 * fade);
        }
    }

    private addSegment(): void {
        const idx = this.bodySegments.length;
        const segment = BABYLON.MeshBuilder.CreateSphere(`player-segment-grow-${idx}`, { diameter: this.radius * 1.8, segments: 18 }, this.scene);
        const segmentMaterial = new BABYLON.StandardMaterial(`player-segment-material-grow-${idx}`, this.scene);
        segmentMaterial.diffuseColor = BABYLON.Color3.FromHexString('#00ff00');
        segmentMaterial.emissiveColor = BABYLON.Color3.FromHexString('#003b10');
        segmentMaterial.specularColor = BABYLON.Color3.FromHexString('#112211');
        segment.material = segmentMaterial;
        segment.receiveShadows = true;
        this.bodySegments.push(segment);

        // increase trail buffer so segments have places to follow
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

        // scale segments to look like an ant body (more tapered)
        this.bodySegments.forEach((s, i) => {
            const sf = 0.35 * (1 - i / Math.max(1, this.bodySegments.length));
            s.scaling.setAll(sf);
        });
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

        if (this.bodySegments.length < 24) {
            const segment = BABYLON.MeshBuilder.CreateSphere(`player-segment-bonus-${this.bodySegments.length}`, { diameter: this.radius * 1.8, segments: 18 }, this.scene);
            const segmentMaterial = new BABYLON.StandardMaterial(`player-segment-material-bonus-${this.bodySegments.length}`, this.scene);
            segmentMaterial.diffuseColor = BABYLON.Color3.FromHexString('#00ff00');
            segmentMaterial.emissiveColor = BABYLON.Color3.FromHexString('#003b10');
            segmentMaterial.specularColor = BABYLON.Color3.FromHexString('#112211');
            segment.material = segmentMaterial;
            segment.receiveShadows = true;
            this.bodySegments.push(segment);
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

        this.bodySegments.forEach(segment => {
            segment.dispose();
        });
        this.bodySegments = [];
        this.trailPoints = [];
    }
}
