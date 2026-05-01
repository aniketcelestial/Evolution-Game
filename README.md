# Evolution Slither Game - 3D Combat & Progression

A 3D slither-like evolution game where you start tiny and grow by eating enemies. Progress through 5 maps as you level up, unlocking new challenges and increasingly powerful enemies.

## Project Structure

```
├── index.html              # Main HTML with game UI
├── package.json            # Dependencies (Three.js, Vite, TypeScript)
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── src/
│   ├── main.ts            # Game initialization entry point
│   ├── game.ts            # Core game controller & main loop
│   ├── scene.ts           # Three.js 3D scene setup & rendering
│   ├── player.ts          # Player creature system & stats
│   ├── enemy.ts           # Enemy AI, combat, and progression
│   ├── food.ts            # Food spawning and consumption
│   ├── combat.ts          # Combat system & collision detection
│   ├── levelSystem.ts     # Level progression (maps unlock at levels 15, 30, 45, 60)
│   ├── mapManager.ts      # Multi-map management (5 maps total)
│   ├── ui.ts              # UI screen manager
│   └── styles.css         # Styling and animations
└── dist/                  # Compiled output (generated)
```

## Game Overview

### Core Gameplay
1. **Start Small** - Begin as a tiny creature with minimal stats
2. **Hunt & Eat** - Kill enemies and consume food to gain experience
3. **Level Up** - Increase stats (health, size, speed, attack damage)
4. **Progress Maps** - Unlock new maps at levels 15, 30, 45, 60
5. **Scale Difficulty** - Face stronger enemies as you progress
6. **Reach Level 100** - Ultimate goal in Legendary Map

### Map System
| Map | Level Range | Difficulty | Environment | Enemy Level Range |
|-----|------------|-----------|-------------|------------------|
| Starter Map | 1-15 | Easy | Green (peaceful) | 1-5 |
| Intermediate Map | 15-30 | Medium | Blue (moderate) | 5-15 |
| Advanced Map | 30-45 | Hard | Red (dangerous) | 15-30 |
| Expert Map | 45-60 | Very Hard | Dark Blue (extreme) | 30-50 |
| Legendary Map | 60-100 | Legendary | Purple (nightmare) | 50-100 |

### Player Stats
- **Level**: Character progression (1-100)
- **Health**: Current health / Max health
- **Experience**: Progress towards next level
- **Size**: Physical scale (affects combat)
- **Speed**: Movement speed
- **Attack**: Damage dealt to enemies

### Combat System
- **Size Advantage**: Larger creatures defeat smaller ones
- **Balanced Combat**: Similar-sized creatures both take damage
- **Health Points**: Enemies have health pools based on their level
- **Experience Rewards**: Defeating enemies grants experience
- **Loot**: Eat defeated enemies to recover health and gain XP

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move Forward |
| S / ↓ | Move Backward |
| A / ← | Move Left |
| D / → | Move Right |
| P / Click Pause | Pause/Resume Game |
| Click Menu | Return to Main Menu |

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
cd d:\Programming\Game
npm install
```

### Development Server

```bash
npm run dev
```
Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
```

## Architecture

### Core Systems

#### `Player` (src/player.ts)
- **Responsibility**: Player creature state and progression
- **Key Features**:
  - Position and velocity tracking
  - Stat management and leveling
  - Camera following
  - Experience-to-levelup conversion
  - Dynamic color based on level

#### `Enemy` (src/enemy.ts)
- **Responsibility**: Enemy creatures with AI behavior
- **Key Features**:
  - Level-based stat scaling
  - Chase and wander behavior
  - Collision-based pathfinding
  - Experience and loot rewards
  - Dynamic difficulty

#### `CombatSystem` (src/combat.ts)
- **Responsibility**: Collision detection and combat resolution
- **Key Features**:
  - Food consumption
  - Player-enemy combat
  - Size-based victory calculation
  - Damage dealing
  - Experience distribution
  - Enemy-enemy separation

#### `FoodManager` (src/food.ts)
- **Responsibility**: Spawn and manage food items
- **Key Features**:
  - Continuous food spawning
  - Population cap management
  - Energy values
  - Visual representation

#### `LevelProgressionSystem` (src/levelSystem.ts)
- **Responsibility**: Manage level ranges and map unlocking
- **Key Features**:
  - Map tier definitions
  - Level-to-map mapping
  - Progress tracking
  - Unlock requirements

#### `MapManager` (src/mapManager.ts)
- **Responsibility**: Manage different game maps
- **Key Features**:
  - Environment setup per map
  - Enemy generation with scaling
  - Difficulty management
  - Visual customization

#### `Game` (src/game.ts)
- **Responsibility**: Main game controller
- **Key Features**:
  - Game loop management
  - Input handling
  - System coordination
  - State management
  - HUD updates

## Extending the Game

### 1. Adding C++ Extensions (via WebAssembly)

**Best Use Cases:**
- High-performance collision detection for 1000+ entities
- Complex physics simulations
- Procedural terrain generation
- Advanced pathfinding algorithms

**Setup:**
```bash
npm install wasm-pack
```

**Example: High-Performance Collision Detection**
```rust
// src/physics.rs
#[wasm_bindgen]
pub fn check_collisions(entities: &JsValue) -> JsValue {
    // Native Rust implementation for speed
}
```

```typescript
// src/combat.ts
import init, { check_collisions } from './physics';

export class CombatSystem {
    async init() {
        await init();
    }
    
    update() {
        const results = check_collisions(this.entities);
        // Use results
    }
}
```

### 2. Adding Python Extensions (via Pyodide)

**Best Use Cases:**
- Neural network-based enemy AI
- Dynamic difficulty balancing
- Procedural content generation
- Game analytics and telemetry
- Machine learning-based behavior

**Setup:**
```bash
npm install pyodide
```

**Example: Neural Network AI**
```typescript
// src/neuralEnemy.ts
import { loadPyodide } from 'pyodide';

export class NeuralEnemy extends Enemy {
    private pyodide: any;
    
    async init() {
        this.pyodide = await loadPyodide();
        await this.pyodide.runPythonAsync(`
            import numpy as np
            import tensorflow as tf
            # Load pre-trained model
            model = tf.keras.models.load_model('enemy_ai')
        `);
    }
    
    async decideAction() {
        const state = [this.stats.health, this.position.x, this.position.z];
        const action = await this.pyodide.runPythonAsync(`
            action = model.predict([${state}])
            action.tolist()
        `);
        return action;
    }
}
```

### 3. Character Design & Models

When you're ready to implement custom character designs:

**Create Character Classes:**
```typescript
// src/character.ts
export interface CharacterTemplate {
    name: string;
    baseModel: string; // Path to .glb/.obj file
    animations: string[];
    traits: CharacterTrait[];
}

export class Character {
    async loadModel(template: CharacterTemplate) {
        const loader = new GLTFLoader();
        this.model = await loader.loadAsync(template.baseModel);
        this.setupAnimations();
    }
}
```

**Update Player to use custom models:**
```typescript
// src/player.ts
import { Character } from './character';

export class Player extends Character {
    // Now uses custom 3D models instead of basic geometry
}
```

### 4. Feature Implementation Examples

#### Add Power-ups
```typescript
// src/powerup.ts
export class PowerUp {
    constructor(public position: THREE.Vector3, public type: 'speed' | 'health' | 'attack') {}
    
    apply(player: Player) {
        switch(this.type) {
            case 'speed': player.stats.speed *= 1.5; break;
            case 'health': player.heal(50); break;
            case 'attack': player.stats.attack *= 1.3; break;
        }
    }
}
```

#### Implement Mutations
```typescript
// src/genetics.ts
export class Genetics {
    static mutate(parent: EnemyStats): EnemyStats {
        const mutated = { ...parent };
        // 20% chance to mutate each stat
        if (Math.random() < 0.2) {
            mutated.speed *= (0.8 + Math.random() * 0.4);
        }
        // ... more mutations
        return mutated;
    }
}
```

#### Add Leaderboards
```typescript
// src/leaderboard.ts
export class Leaderboard {
    async saveScore(playerName: string, level: number, time: number) {
        const response = await fetch('/api/leaderboard', {
            method: 'POST',
            body: JSON.stringify({ playerName, level, time })
        });
        return response.json();
    }
    
    async getTopScores(limit: number = 10) {
        const response = await fetch(`/api/leaderboard?limit=${limit}`);
        return response.json();
    }
}
```

### 5. Performance Optimization

**Current optimizations:**
- Spatial culling via Three.js frustum
- Shadow map optimization
- Efficient material reuse

**Future optimizations:**
```typescript
// src/performance.ts
// Instance rendering for enemies with identical models
export class InstancedEnemyRenderer {
    private instancedMesh: THREE.InstancedMesh;
    
    updatePositions(enemies: Enemy[]) {
        enemies.forEach((enemy, i) => {
            const matrix = new THREE.Matrix4();
            matrix.setPosition(enemy.position);
            this.instancedMesh.setMatrixAt(i, matrix);
        });
    }
}

// Spatial partitioning for faster collision detection
export class Octree {
    insert(entity: Entity) { /* ... */ }
    getNearbies(position: THREE.Vector3, radius: number): Entity[] { /* ... */ }
}
```

## Future Development Roadmap

### Phase 1: Core Gameplay ✅
- [x] Player movement and stats
- [x] Enemy AI and combat
- [x] Level progression
- [x] Multi-map system
- [x] Food system

### Phase 2: Enhancements
- [ ] Custom character models
- [ ] Power-ups and special abilities
- [ ] Particle effects for combat
- [ ] Sound effects and music
- [ ] Mutations and genetics system

### Phase 3: Advanced Features
- [ ] Leaderboards and rankings
- [ ] Daily/weekly challenges
- [ ] Multiplayer (WebSocket)
- [ ] Cloud save system
- [ ] Mobile optimization

### Phase 4: AI & ML
- [ ] Neural network-based enemy AI
- [ ] Procedural map generation
- [ ] Dynamic difficulty balancing
- [ ] Behavior tree system
- [ ] Learning AI opponents

## Technologies Used

- **Three.js (v0.160.0)**: 3D graphics and rendering
- **TypeScript (v5.3.3)**: Type-safe development
- **Vite (v5.0.8)**: Fast build tool and dev server
- **CSS3**: Modern styling with animations
- **WebGL**: Hardware-accelerated 3D rendering
- **Optional: WebAssembly** - For high-performance extensions
- **Optional: Pyodide** - For Python-based AI
- **Optional: TensorFlow.js** - For neural networks

## Troubleshooting

### Game is Laggy
- Check enemy count (reduce in mapManager.ts)
- Disable visual effects
- Lower scene quality

### Enemies not spawning
- Verify mapManager.generateEnemies()
- Check enemy list in combat.ts

### Player not moving
- Check keyboard listeners in game.ts
- Verify input handling

### Collision issues
- Debug CombatSystem.checkCollisions()
- Verify enemy radius calculations

## Contributing Guidelines

1. **Keep Modular**: One system per file
2. **Use TypeScript**: Type safety required
3. **Follow Style**: Match existing code patterns
4. **Test Features**: Verify new features work
5. **Document Code**: Add comments for complex logic

## Performance Targets

- **FPS**: 60 FPS target (stable)
- **Entities**: Handle 100+ enemies smoothly
- **Memory**: < 100MB for web version
- **Load Time**: < 3 seconds

## Version History

- **v2.0.0** (Current): Slither gameplay, 5-map progression, combat system
- **v1.0.0**: Original evolution simulator

## License

MIT - Feel free to use and modify

---

**Developer**: Aniket Verma  
**Last Updated**: May 2026  
**Status**: Active Development

