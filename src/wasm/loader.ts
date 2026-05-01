// WASM loader for optional physics module. Falls back to JS implementation if WASM not available.
import type * as BABYLON from '@babylonjs/core';

export type PhysicsModule = {
    integrate_positions?: (posPtr: number, velPtr: number, count: number, dt: number) => void;
    // Emscripten-style cwrap direct functions may be provided instead.
};

let wasmModule: any = null;

export async function initPhysicsWasm(): Promise<boolean> {
    // Try to load an emscripten-generated JS wrapper first (dist/physics.js), then fallback to raw .wasm
    // Try raw .wasm first (served from /dist/physics.wasm). We avoid bundler-resolved imports.
    try {
        const resp = await fetch('/dist/physics.wasm');
        if (!resp.ok) return false;
        // instantiateStreaming is preferable
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            const inst = await WebAssembly.instantiateStreaming(resp, {} as any);
            wasmModule = (inst as any).instance.exports;
            return true;
        }
        const buf = await resp.arrayBuffer();
        const inst = await WebAssembly.instantiate(buf, {} as any);
        wasmModule = (inst as any).instance.exports;
        return true;
    } catch (e) {
        // ignore and return false
        return false;
    }
}

// JS fallback integrator
export function integratePositionsJS(positions: Float32Array, velocities: Float32Array, count: number, dt: number) {
    for (let i = 0; i < count; i++) {
        const b = i * 3;
        positions[b] += velocities[b] * dt;
        positions[b+1] += velocities[b+1] * dt;
        positions[b+2] += velocities[b+2] * dt;
    }
}

// Integrate with WASM if available, otherwise use JS fallback.
export function integratePositions(positions: Float32Array, velocities: Float32Array, count: number, dt: number) {
    if (wasmModule && wasmModule.integrate_positions) {
        // Emscripten: need to copy data into wasm heap; we keep this simple and fallback to JS if integration is not trivial.
        try {
            const bytes = positions.byteLength;
            const heap = (wasmModule as any).HEAPF32;
            if (heap) {
                const ptrPos = (wasmModule as any)._malloc(bytes);
                const ptrVel = (wasmModule as any)._malloc(bytes);
                (wasmModule as any).HEAPF32.set(new Float32Array(positions.buffer, positions.byteOffset, positions.length), ptrPos/4);
                (wasmModule as any).HEAPF32.set(new Float32Array(velocities.buffer, velocities.byteOffset, velocities.length), ptrVel/4);
                (wasmModule as any)._integrate_positions(ptrPos, ptrVel, count, dt);
                const res = new Float32Array((wasmModule as any).HEAPF32.buffer, ptrPos, positions.length);
                positions.set(res);
                (wasmModule as any)._free(ptrPos);
                (wasmModule as any)._free(ptrVel);
                return;
            }
        } catch (e) {
            // fall through to JS fallback
        }
    }
    integratePositionsJS(positions, velocities, count, dt);
}

export function hasWasm(): boolean { return !!wasmModule; }
