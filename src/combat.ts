import * as THREE from 'three';
import { Player } from './player';
import { Enemy } from './enemy';
import { Food, FoodManager } from './food';

export class CombatSystem {
    private player: Player;
    private enemies: Enemy[];
    private foods: Food[];
    private foodManager: FoodManager;
    private scene: THREE.Scene;

    constructor(player: Player, enemies: Enemy[], foodManager: FoodManager, scene: THREE.Scene) {
        this.player = player;
        this.enemies = enemies;
        this.foodManager = foodManager;
        this.foods = foodManager.getFoods();
        this.scene = scene;
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
            const distance = playerPos.distanceTo(food.position);

            if (distance < playerRadius + food.radius) {
                this.player.eat(food.nutrition);
                this.foodManager.removeFood(food);
                this.foods.splice(i, 1);
            }
        }

        // Check enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = playerPos.distanceTo(enemy.position);
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
                const distance = enemy1.position.distanceTo(enemy2.position);
                const minDistance = enemy1.getRadius() + enemy2.getRadius();

                if (distance < minDistance && distance > 0) {
                    // Push apart
                    const direction = enemy2.position.clone().sub(enemy1.position).normalize();
                    const overlap = minDistance - distance;
                    enemy1.position.sub(direction.multiplyScalar(overlap * 0.5));
                    enemy2.position.add(direction.multiplyScalar(overlap * 0.5));
                }
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
