import * as BABYLON from '@babylonjs/core';

export class Food {
    public position: BABYLON.Vector3;
    public radius: number = 0.2;
    public nutrition: number = 10;
    
    private mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3) {
        this.scene = scene;
        this.position = position.clone();

        this.mesh = BABYLON.MeshBuilder.CreateSphere('food', { diameter: this.radius * 2, segments: 10 }, this.scene);
        const material = new BABYLON.StandardMaterial('food-material', this.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString('#ffaa00');
        material.emissiveColor = BABYLON.Color3.FromHexString('#ff8800');
        material.specularColor = BABYLON.Color3.FromHexString('#553300');
        this.mesh.material = material;
        this.mesh.position.copyFrom(this.position);
        this.mesh.receiveShadows = true;
    }

    public dispose(): void {
        this.mesh.dispose();
    }
}

export class FoodManager {
    private foods: Food[] = [];
    private scene: BABYLON.Scene;
    private spawnRate: number = 0.1; // Foods per second
    private spawnTimer: number = 0;
    private maxFoods: number = 100;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.initializeFoods(50);
    }

    private initializeFoods(count: number): void {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            const food = new Food(this.scene, new BABYLON.Vector3(x, 0.5, z));
            this.foods.push(food);
        }
    }

    public update(deltaTime: number): void {
        // Spawn new food
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > 1 / this.spawnRate && this.foods.length < this.maxFoods) {
            const x = (Math.random() - 0.5) * 150;
            const z = (Math.random() - 0.5) * 150;
            const food = new Food(this.scene, new BABYLON.Vector3(x, 0.5, z));
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
