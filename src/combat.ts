import * as BABYLON from '@babylonjs/core';
import { Player } from './player';
import { Enemy } from './enemy';
import { Food, FoodManager } from './food';

export class CombatSystem {
    private player: Player;
    private enemies: Enemy[];
    private foods: Food[];
    private foodManager: FoodManager;

    constructor(player: Player, enemies: Enemy[], foodManager: FoodManager, scene: unknown) {
        this.player = player;
        this.enemies = enemies;
        this.foodManager = foodManager;
        this.foods = foodManager.getFoods();
    }

    public update(): void {
        this.checkCollisions();
    }

    private checkCollisions(): void {
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.getRadius();

        // Check food collisions
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            const distance = BABYLON.Vector3.Distance(playerPos, food.position);
            const pickupRadius = (food as Food & { pickupRadius?: number }).pickupRadius ?? food.radius * 2.5;

            if (distance < playerRadius + pickupRadius) {
                this.player.eat(food.nutrition);
                this.foodManager.removeFood(food);
                this.foods.splice(i, 1);
            }
        }

        // Check enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = BABYLON.Vector3.Distance(playerPos, enemy.position);
            const enemyRadius = enemy.getRadius();

            if (distance < playerRadius + enemyRadius) {
                this.resolveCollision(this.player, enemy, i);
            }
        }

        // Enemy-to-enemy collisions (simple avoidance)
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const enemy1 = this.enemies[i];
                const enemy2 = this.enemies[j];
                const distance = BABYLON.Vector3.Distance(enemy1.position, enemy2.position);
                const minDistance = enemy1.getRadius() + enemy2.getRadius();

                if (distance < minDistance && distance > 0) {
                    // Push apart
                    const direction = enemy2.position.subtract(enemy1.position).normalize();
                    const overlap = minDistance - distance;
                    enemy1.position.subtractInPlace(direction.scale(overlap * 0.5));
                    enemy2.position.addInPlace(direction.scale(overlap * 0.5));
                }
            }
        }
    }

    public triggerInteraction(): void {
        const playerPos = this.player.getPosition();
        const interactionRange = this.player.getRadius() * 5 + 5;

        let nearestFood: Food | null = null;
        let nearestFoodDistance = Infinity;
        for (const food of this.foods) {
            const pickupRadius = (food as Food & { pickupRadius?: number }).pickupRadius ?? food.radius * 2.5;
            const distance = BABYLON.Vector3.Distance(playerPos, food.position);
            if (distance < interactionRange + pickupRadius && distance < nearestFoodDistance) {
                nearestFood = food;
                nearestFoodDistance = distance;
            }
        }

        if (nearestFood) {
            this.player.eat(nearestFood.nutrition * 1.5);
            this.foodManager.removeFood(nearestFood);
            this.foods = this.foodManager.getFoods();
            return;
        }

        let nearestEnemy: Enemy | null = null;
        let nearestEnemyDistance = Infinity;
        let nearestEnemyIndex = -1;

        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            const distance = BABYLON.Vector3.Distance(playerPos, enemy.position);
            if (distance < interactionRange && distance < nearestEnemyDistance) {
                nearestEnemy = enemy;
                nearestEnemyDistance = distance;
                nearestEnemyIndex = i;
            }
        }

        if (nearestEnemy && nearestEnemyIndex >= 0) {
            if (this.player.stats.size >= nearestEnemy.stats.size) {
                nearestEnemy.takeDamage(this.player.stats.attack * 1.5);
                if (!nearestEnemy.isAlive()) {
                    this.player.eat(nearestEnemy.stats.experienceReward * 0.75);
                    nearestEnemy.dispose();
                    this.enemies.splice(nearestEnemyIndex, 1);
                }
            } else {
                this.player.takeDamage(nearestEnemy.stats.attack * 0.3);
            }
        }
    }

    private resolveCollision(player: Player, enemy: Enemy, enemyIndex: number): void {
        const playerSize = player.stats.size;
        const enemySize = enemy.stats.size;
        const playerAttack = player.stats.attack;
        const enemyAttack = enemy.stats.attack;

        if (playerSize > enemySize) {
            // Player wins - eat enemy
            player.eat(enemy.stats.experienceReward);
            enemy.dispose();
            this.enemies.splice(enemyIndex, 1);
        } else if (enemySize > playerSize * 1.2) {
            // Enemy wins - player takes damage
            const damage = enemyAttack * (enemySize / playerSize);
            player.takeDamage(damage);
        } else {
            // Balanced fight - both take damage
            player.takeDamage(enemyAttack * 0.5);
            enemy.takeDamage(playerAttack * 0.5);

            if (!enemy.isAlive()) {
                player.eat(enemy.stats.experienceReward * 0.5);
                enemy.dispose();
                this.enemies.splice(enemyIndex, 1);
            }
        }
    }

    public getEnemies(): Enemy[] {
        return this.enemies;
    }
}
