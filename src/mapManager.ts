import * as BABYLON from '@babylonjs/core';
import { Enemy } from './enemy';
import { FoodManager } from './food';

export interface MapConfig {
    index: number;
    name: string;
    difficulty: number;
    enemyDensity: number;
    minEnemyLevel: number;
    maxEnemyLevel: number;
    size: number;
    backgroundColor: number;
    gridColor: number;
}

export class MapManager {
    private currentMapIndex: number = 0;
    private mapConfigs: MapConfig[] = [
        {
            index: 0,
            name: 'Starter Map',
            difficulty: 1,
            enemyDensity: 0.3,
            minEnemyLevel: 1,
            maxEnemyLevel: 5,
            size: 200,
            backgroundColor: 0x0a1428,
            gridColor: 0x1a3a4a,
        },
        {
            index: 1,
            name: 'Intermediate Map',
            difficulty: 2,
            enemyDensity: 0.5,
            minEnemyLevel: 5,
            maxEnemyLevel: 15,
            size: 300,
            backgroundColor: 0x0d1a1f,
            gridColor: 0x1a4a6a,
        },
        {
            index: 2,
            name: 'Advanced Map',
            difficulty: 3,
            enemyDensity: 0.7,
            minEnemyLevel: 15,
            maxEnemyLevel: 30,
            size: 400,
            backgroundColor: 0x1a0a0a,
            gridColor: 0x4a1a1a,
        },
        {
            index: 3,
            name: 'Expert Map',
            difficulty: 4,
            enemyDensity: 0.9,
            minEnemyLevel: 30,
            maxEnemyLevel: 50,
            size: 500,
            backgroundColor: 0x0a0a1a,
            gridColor: 0x1a1a4a,
        },
        {
            index: 4,
            name: 'Legendary Map',
            difficulty: 5,
            enemyDensity: 1,
            minEnemyLevel: 50,
            maxEnemyLevel: 100,
            size: 600,
            backgroundColor: 0x1a0a1a,
            gridColor: 0x4a1a4a,
        },
    ];

    private scene: BABYLON.Scene;
    private ground: BABYLON.Mesh | null = null;
    private mountains: BABYLON.Mesh[] = [];

    public getMountains(): Array<{ position: BABYLON.Vector3; radius: number }> {
        return this.mountains.map(m => {
            const info = m.getBoundingInfo();
            const sphere = info.boundingSphere;
            const worldCenter = sphere.center.add(m.position);
            return { position: worldCenter.clone(), radius: sphere.radius * Math.max(m.scaling.x, m.scaling.z) };
        });
    }
    private foodManager: FoodManager | null = null;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
    }

    public loadMap(mapIndex: number, foodManager: FoodManager): void {
        if (mapIndex >= this.mapConfigs.length || mapIndex < 0) {
            console.warn(`Map index ${mapIndex} out of range`);
            return;
        }

        this.currentMapIndex = mapIndex;
        this.foodManager = foodManager;
        const config = this.mapConfigs[mapIndex];

        // Update scene background
        this.scene.clearColor = BABYLON.Color4.FromColor3(BABYLON.Color3.FromHexString(`#${config.backgroundColor.toString(16).padStart(6, '0')}`));
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogColor = BABYLON.Color3.FromHexString(`#${config.backgroundColor.toString(16).padStart(6, '0')}`);
        this.scene.fogStart = config.size * 1.5;
        this.scene.fogEnd = config.size * 3;

        // Update ground grid
        if (this.ground) {
            this.ground.dispose();
        }
        this.ground = BABYLON.MeshBuilder.CreateGround('map-ground', { width: config.size, height: config.size, subdivisions: 4 }, this.scene);
        const groundMaterial = new BABYLON.StandardMaterial('map-ground-material', this.scene);
        // green land look
        groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#2b8f4a');
        groundMaterial.emissiveColor = BABYLON.Color3.FromHexString('#1f6b36');
        groundMaterial.specularColor = BABYLON.Color3.Black();
        groundMaterial.wireframe = false;
        groundMaterial.alpha = 1;
        this.ground.material = groundMaterial;

        // Dispose previous mountains
        this.mountains.forEach(m => m.dispose());
        this.mountains = [];

        // Place mountains along the map boundary to visually block movement
        const boundary = config.size / 2;
        const spacing = Math.max(6, Math.floor(config.size / 28));
        const mountainCountPerSide = Math.ceil((config.size) / spacing);
        // Helper: create a low-poly rock mesh
        const createRock = (name: string, size: number, offset: BABYLON.Vector3) => {
            const parts: BABYLON.Mesh[] = [];
            const clusterSize = Math.max(3, Math.round(size / 2));
            for (let r = 0; r < clusterSize; r++) {
                const d = 0.5 + Math.random() * 1.2;
                const mesh = BABYLON.MeshBuilder.CreateBox(`${name}-part-${r}`, { size: d }, this.scene);
                mesh.scaling = new BABYLON.Vector3(1 + Math.random() * 0.6, 0.6 + Math.random() * 1.2, 1 + Math.random() * 0.8);
                mesh.position = new BABYLON.Vector3(offset.x + (Math.random() - 0.5) * size * 0.6, offset.y + Math.random() * size * 0.35, offset.z + (Math.random() - 0.5) * size * 0.6);
                mesh.rotation = new BABYLON.Vector3(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);
                parts.push(mesh);
            }

            // Merge parts into a single mesh for performance
            const merged = BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, true) as BABYLON.Mesh | null;
            if (!merged) return null;
            const mat = new BABYLON.StandardMaterial(`${name}-mat`, this.scene);
            mat.diffuseColor = BABYLON.Color3.FromHexString('#6b5538');
            mat.emissiveColor = BABYLON.Color3.FromHexString('#4f3f2d');
            merged.material = mat;
            merged.receiveShadows = true;
            return merged;
        };

        for (let i = 0; i <= mountainCountPerSide; i++) {
            const t = -boundary + i * spacing;
            const northPos = new BABYLON.Vector3(t, 0, -boundary - 6 - Math.random() * 6);
            const southPos = new BABYLON.Vector3(t, 0, boundary + 6 + Math.random() * 6);
            const north = createRock(`mountain-n-${i}`, 8 + Math.random() * 12, northPos);
            const south = createRock(`mountain-s-${i}`, 8 + Math.random() * 12, southPos);
            if (north) this.mountains.push(north);
            if (south) this.mountains.push(south);
        }

        for (let i = 1; i < mountainCountPerSide; i++) {
            const t = -boundary + i * spacing;
            const westPos = new BABYLON.Vector3(-boundary - 6 - Math.random() * 6, 0, t);
            const eastPos = new BABYLON.Vector3(boundary + 6 + Math.random() * 6, 0, t);
            const west = createRock(`mountain-w-${i}`, 8 + Math.random() * 12, westPos);
            const east = createRock(`mountain-e-${i}`, 8 + Math.random() * 12, eastPos);
            if (west) this.mountains.push(west);
            if (east) this.mountains.push(east);
        }

        console.log(`Loaded map: ${config.name}`);
    }

    public generateEnemies(count: number, playerLevel: number): Enemy[] {
        const config = this.mapConfigs[this.currentMapIndex];
        const enemies: Enemy[] = [];

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * config.size;
            const z = (Math.random() - 0.5) * config.size;
            
            // Enemy level is around player level ±5
            const enemyLevel = Math.max(
                config.minEnemyLevel,
                Math.min(
                    config.maxEnemyLevel,
                    playerLevel + (Math.random() - 0.5) * 10
                )
            );

            const enemy = new Enemy(this.scene, new BABYLON.Vector3(x, 1, z), Math.floor(enemyLevel));
            enemies.push(enemy);
        }

        return enemies;
    }

    public getCurrentMapConfig(): MapConfig {
        return this.mapConfigs[this.currentMapIndex];
    }

    public getCurrentMapIndex(): number {
        return this.currentMapIndex;
    }

    public getMapBounds(): { size: number; boundary: number } {
        const config = this.mapConfigs[this.currentMapIndex];
        return {
            size: config.size,
            boundary: config.size / 2,
        };
    }

    public dispose(): void {
        if (this.ground) {
            this.ground.dispose();
            this.ground = null;
        }
    }
}
