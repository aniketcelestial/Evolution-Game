import * as THREE from 'three';
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

    private scene: THREE.Scene;
    private gridHelper: THREE.GridHelper | null = null;
    private foodManager: FoodManager | null = null;

    constructor(scene: THREE.Scene) {
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
        this.scene.background = new THREE.Color(config.backgroundColor);
        this.scene.fog = new THREE.Fog(config.backgroundColor, config.size * 2, config.size * 3);

        // Update grid
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
        }
        this.gridHelper = new THREE.GridHelper(config.size, config.size / 10, 0x00d4ff, config.gridColor);
        (this.gridHelper as any).position.y = 0.01;
        this.scene.add(this.gridHelper);

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

            const enemy = new Enemy(this.scene, new THREE.Vector3(x, 1, z), Math.floor(enemyLevel));
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
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
        }
    }
}
