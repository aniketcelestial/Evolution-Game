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
        this.ground = BABYLON.MeshBuilder.CreateGround('map-ground', { width: config.size, height: config.size, subdivisions: 2 }, this.scene);
        const groundMaterial = new BABYLON.StandardMaterial('map-ground-material', this.scene);
        groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#1a3a4a');
        groundMaterial.emissiveColor = BABYLON.Color3.FromHexString(`#${config.gridColor.toString(16).padStart(6, '0')}`);
        groundMaterial.specularColor = BABYLON.Color3.Black();
        groundMaterial.wireframe = true;
        groundMaterial.alpha = 0.35;
        this.ground.material = groundMaterial;

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
