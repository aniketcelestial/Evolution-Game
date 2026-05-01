import * as THREE from 'three';

export class Food {
    public position: THREE.Vector3;
    public radius: number = 0.2;
    public nutrition: number = 10;
    
    private mesh: THREE.Mesh;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        this.scene = scene;
        this.position = position.clone();

        const geometry = new THREE.SphereGeometry(this.radius, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            roughness: 0.4,
            metalness: 0.5,
            emissive: 0xff8800,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    public dispose(): void {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}

export class FoodManager {
    private foods: Food[] = [];
    private scene: THREE.Scene;
    private spawnRate: number = 0.1; // Foods per second
    private spawnTimer: number = 0;
    private maxFoods: number = 100;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initializeFoods(50);
    }

    private initializeFoods(count: number): void {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            const food = new Food(this.scene, new THREE.Vector3(x, 0.5, z));
            this.foods.push(food);
        }
    }

    public update(deltaTime: number): void {
        // Spawn new food
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > 1 / this.spawnRate && this.foods.length < this.maxFoods) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            const food = new Food(this.scene, new THREE.Vector3(x, 0.5, z));
            this.foods.push(food);
            this.spawnTimer = 0;
        }
    }

    public getFoods(): Food[] {
        return this.foods;
    }

    public removeFood(food: Food): void {
        const index = this.foods.indexOf(food);
        if (index > -1) {
            this.foods[index].dispose();
            this.foods.splice(index, 1);
        }
    }

    public clear(): void {
        this.foods.forEach(food => food.dispose());
        this.foods = [];
    }

    public dispose(): void {
        this.clear();
    }
}
