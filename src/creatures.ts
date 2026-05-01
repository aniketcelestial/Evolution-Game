import * as THREE from 'three';

export interface CreatureData {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    health: number;
    energy: number;
}

export class Creature {
    public position: THREE.Vector3;
    public velocity: THREE.Vector3;
    public health: number = 100;
    public energy: number = 100;
    public age: number = 0;
    
    private mesh: THREE.Mesh;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            0,
            (Math.random() - 0.5) * 2
        );

        // Create simple creature mesh
        const geometry = new THREE.IcosahedronGeometry(0.5, 2);
        const material = new THREE.MeshStandardMaterial({
            color: this.randomColor(),
            roughness: 0.7,
            metalness: 0.3,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }

    private randomColor(): number {
        const hue = Math.random();
        const rgb = this.hsvToRgb(hue, 0.8, 0.9);
        return (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    }

    private hsvToRgb(h: number, s: number, v: number): [number, number, number] {
        const c = v * s;
        const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;

        if (h < 1 / 6) {
            r = c; g = x; b = 0;
        } else if (h < 2 / 6) {
            r = x; g = c; b = 0;
        } else if (h < 3 / 6) {
            r = 0; g = c; b = x;
        } else if (h < 4 / 6) {
            r = 0; g = x; b = c;
        } else if (h < 5 / 6) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255),
        ];
    }

    public update(deltaTime: number): void {
        // Decrease energy
        this.energy -= 0.5 * deltaTime;
        this.health = Math.max(0, this.energy);
        this.age += deltaTime;

        // Apply friction
        this.velocity.multiplyScalar(0.95);

        // Apply random movement
        this.velocity.x += (Math.random() - 0.5) * 0.1;
        this.velocity.z += (Math.random() - 0.5) * 0.1;

        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Boundary constraints
        this.position.x = Math.max(-100, Math.min(100, this.position.x));
        this.position.z = Math.max(-100, Math.min(100, this.position.z));

        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.02;

        // Update color based on health
        const healthRatio = this.health / 100;
        const color = new THREE.Color();
        color.setHSL(healthRatio * 0.3, 0.8, 0.5);
        (this.mesh.material as THREE.MeshStandardMaterial).color = color;
    }

    public isAlive(): boolean {
        return this.health > 0;
    }

    public dispose(): void {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}

export class CreatureManager {
    private creatures: Creature[] = [];
    private scene: THREE.Scene;
    private populationSize: number;

    constructor(scene: THREE.Scene, populationSize: number = 50) {
        this.scene = scene;
        this.populationSize = populationSize;
    }

    public initialize(count: number): void {
        // Clear existing creatures
        this.clear();

        // Create new creatures
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            const position = new THREE.Vector3(x, 1, z);
            
            const creature = new Creature(this.scene, position);
            this.creatures.push(creature);
        }
    }

    public update(deltaTime: number, timeScale: number = 1): void {
        const scaledDeltaTime = deltaTime * timeScale;

        // Update all creatures
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const creature = this.creatures[i];
            creature.update(scaledDeltaTime);

            // Remove dead creatures
            if (!creature.isAlive()) {
                creature.dispose();
                this.creatures.splice(i, 1);
            }
        }

        // Add new creatures if population drops
        if (this.creatures.length < this.populationSize * 0.5) {
            this.addCreatures(5);
        }
    }

    private addCreatures(count: number): void {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            const position = new THREE.Vector3(x, 1, z);
            
            const creature = new Creature(this.scene, position);
            this.creatures.push(creature);
        }
    }

    public getCreatureCount(): number {
        return this.creatures.length;
    }

    public getCreatures(): Creature[] {
        return this.creatures;
    }

    public clear(): void {
        this.creatures.forEach(creature => creature.dispose());
        this.creatures = [];
    }

    public dispose(): void {
        this.clear();
    }
}
