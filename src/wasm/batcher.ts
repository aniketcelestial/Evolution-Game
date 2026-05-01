import * as BABYLON from '@babylonjs/core';
import { integratePositions, integratePositionsJS } from './loader';

export interface PhysicsEntity {
    position: BABYLON.Vector3;
    velocity: BABYLON.Vector3;
}

export class PhysicsBatcher {
    private entities: PhysicsEntity[] = [];
    private positions: Float32Array = new Float32Array(0);
    private velocities: Float32Array = new Float32Array(0);
    private count: number = 0;

    public add(entity: PhysicsEntity): void {
        this.entities.push(entity);
    }

    public clear(): void {
        this.entities = [];
        this.count = 0;
    }

    public prepareBatch(): void {
        this.count = this.entities.length;
        if (this.count === 0) return;

        // Allocate or resize arrays
        if (this.positions.length !== this.count * 3) {
            this.positions = new Float32Array(this.count * 3);
            this.velocities = new Float32Array(this.count * 3);
        }

        // Collect positions and velocities
        for (let i = 0; i < this.count; i++) {
            const e = this.entities[i];
            const base = i * 3;
            this.positions[base + 0] = e.position.x;
            this.positions[base + 1] = e.position.y;
            this.positions[base + 2] = e.position.z;
            this.velocities[base + 0] = e.velocity.x;
            this.velocities[base + 1] = e.velocity.y;
            this.velocities[base + 2] = e.velocity.z;
        }
    }

    public integrate(dt: number): void {
        if (this.count === 0) return;
        // Call WASM integrator (with JS fallback)
        integratePositions(this.positions, this.velocities, this.count, dt);
    }

    public applyResults(): void {
        // Write back integrated positions to entities
        for (let i = 0; i < this.count; i++) {
            const e = this.entities[i];
            const base = i * 3;
            e.position.x = this.positions[base + 0];
            e.position.y = this.positions[base + 1];
            e.position.z = this.positions[base + 2];
        }
    }

    // One-call integration: prepare, integrate, and apply results in one function.
    public integrateAll(dt: number): void {
        this.prepareBatch();
        this.integrate(dt);
        this.applyResults();
        this.clear();
    }
}
