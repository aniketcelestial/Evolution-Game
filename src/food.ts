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

        // Create a simple mushroom: cap (sphere) + stalk (cylinder) grouped under a transform node
        const root = new BABYLON.TransformNode('food-mushroom-root', this.scene);
        const cap = BABYLON.MeshBuilder.CreateSphere('mushroom-cap', { diameter: this.radius * 3, segments: 16 }, this.scene);
        cap.scaling.y = 0.6;
        const capMat = new BABYLON.StandardMaterial('mushroom-cap-mat', this.scene);
        capMat.diffuseColor = BABYLON.Color3.FromHexString('#ff7fb3');
        capMat.emissiveColor = BABYLON.Color3.FromHexString('#ff6ba3');
        cap.material = capMat;

        const stalk = BABYLON.MeshBuilder.CreateCylinder('mushroom-stalk', { diameterTop: this.radius * 0.6, diameterBottom: this.radius * 0.8, height: this.radius * 1.6, tessellation: 12 }, this.scene);
        const stalkMat = new BABYLON.StandardMaterial('mushroom-stalk-mat', this.scene);
        stalkMat.diffuseColor = BABYLON.Color3.FromHexString('#efe1c6');
        stalk.material = stalkMat;

        cap.parent = root;
        stalk.parent = root;
        cap.position.y = this.radius * 0.8;
        stalk.position.y = this.radius * 0.0;

        root.position.copyFrom(this.position);
        this.mesh = root as unknown as BABYLON.Mesh;
        // mark receiveShadows on children
        cap.receiveShadows = true;
        stalk.receiveShadows = true;
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
