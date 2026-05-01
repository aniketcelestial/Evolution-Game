# C++ and Python Integration Guide

This guide explains how to add C++ and Python extensions to the Evolution Slither Game for advanced AI, physics, and procedural generation.

## Table of Contents
1. [C++ Extensions (WebAssembly)](#cpp-extensions-webassembly)
2. [Python Extensions (Pyodide)](#python-extensions-pyodide)
3. [Backend Services (Flask/FastAPI)](#backend-services-flaskfastapi)
4. [Performance Considerations](#performance-considerations)
5. [Example Implementations](#example-implementations)

---

## C++ Extensions (WebAssembly)

### Why C++?
- **Performance**: 10-100x faster than JavaScript for heavy computation
- **Use Cases**: Physics, collision detection, procedural generation, complex algorithms
- **Cross-platform**: Same code runs anywhere WebAssembly is supported

### Setup

#### Option 1: Rust (Recommended)
Rust compiles to WebAssembly safely and efficiently.

```bash
# Install Rust and wasm-pack
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install wasm-pack

# Create a new library
cargo new --lib game_physics
cd game_physics
```

**Cargo.toml:**
```toml
[package]
name = "game_physics"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

#### Option 2: C++ with Emscripten

```bash
# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Compile C++ to WASM
emcc physics.cpp -o physics.js -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]'
```

### Example 1: High-Performance Collision Detection

**Rust Implementation:**
```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct CollisionDetector {
    entities: Vec<Entity>,
}

#[wasm_bindgen]
pub struct Entity {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub radius: f32,
}

#[wasm_bindgen]
impl CollisionDetector {
    #[wasm_bindgen(constructor)]
    pub fn new() -> CollisionDetector {
        CollisionDetector {
            entities: Vec::new(),
        }
    }

    pub fn add_entity(&mut self, x: f32, y: f32, z: f32, radius: f32) {
        self.entities.push(Entity { x, y, z, radius });
    }

    pub fn check_collisions(&self) -> Vec<(usize, usize)> {
        let mut collisions = Vec::new();
        
        for i in 0..self.entities.len() {
            for j in (i + 1)..self.entities.len() {
                let e1 = &self.entities[i];
                let e2 = &self.entities[j];
                
                let dx = e2.x - e1.x;
                let dy = e2.y - e1.y;
                let dz = e2.z - e1.z;
                
                let dist_sq = dx*dx + dy*dy + dz*dz;
                let min_dist = e1.radius + e2.radius;
                
                if dist_sq < min_dist * min_dist {
                    collisions.push((i, j));
                }
            }
        }
        
        collisions
    }
}
```

**Build:**
```bash
wasm-pack build --target web
```

**TypeScript Integration:**
```typescript
// src/collision.ts
import init, { CollisionDetector } from '../game_physics/pkg';

let detector: CollisionDetector;

export async function initCollisionDetector() {
    await init();
    detector = new CollisionDetector();
}

export function updateCollisions(player: Player, enemies: Enemy[]) {
    detector.add_entity(player.position.x, player.position.y, player.position.z, player.getRadius());
    
    enemies.forEach((enemy, idx) => {
        detector.add_entity(enemy.position.x, enemy.position.y, enemy.position.z, enemy.getRadius());
    });
    
    const collisions = detector.check_collisions();
    return collisions;
}
```

### Example 2: Procedural Terrain Generation

**Rust with Noise:**
```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn generate_heightmap(width: usize, height: usize, scale: f32, seed: u32) -> Vec<f32> {
    // Use Perlin noise algorithm to generate terrain
    // This would integrate a noise library like `noise-rs`
    
    let mut heightmap = vec![0.0; width * height];
    
    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let nx = x as f32 / scale;
            let ny = y as f32 / scale;
            
            // Perlin noise calculation (simplified)
            heightmap[idx] = (nx.sin() * ny.cos()).abs();
        }
    }
    
    heightmap
}
```

---

## Python Extensions (Pyodide)

### Why Python?
- **AI/ML**: TensorFlow, PyTorch, scikit-learn
- **Use Cases**: Neural networks, procedural generation, analytics
- **Easy**: Python is more readable than C++
- **Browser-native**: Runs in the browser with Pyodide

### Setup

```bash
npm install pyodide
```

### Example 1: Neural Network Enemy AI

**Python Module:**
```python
# enemy_ai.py
import numpy as np
from tensorflow import keras

class EnemyAI:
    def __init__(self):
        # Load or create neural network model
        self.model = keras.Sequential([
            keras.layers.Dense(64, activation='relu', input_shape=(5,)),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(4, activation='softmax')
        ])
        self.model.compile(optimizer='adam', loss='mse')
    
    def decide_action(self, state):
        """
        state = [enemy_health, player_distance, player_size, enemy_level, time]
        returns: [up, down, left, right] movement
        """
        state_array = np.array(state).reshape(1, -1)
        action = self.model.predict(state_array, verbose=0)
        return action[0].tolist()
    
    def train(self, states, rewards):
        """Train on collected game data"""
        self.model.fit(states, rewards, epochs=1, verbose=0)
```

**TypeScript Integration:**
```typescript
// src/neuralEnemy.ts
import { loadPyodide, PyProxy } from 'pyodide';
import { Enemy } from './enemy';

export class NeuralEnemy extends Enemy {
    private aiModule: PyProxy;
    
    static async initialize() {
        const pyodide = await loadPyodide();
        const aiModule = await pyodide.runPythonAsync(`
            import numpy as np
            from tensorflow import keras
            
            class EnemyAI:
                def __init__(self):
                    self.model = keras.Sequential([
                        keras.layers.Dense(64, activation='relu', input_shape=(5,)),
                        keras.layers.Dense(32, activation='relu'),
                        keras.layers.Dense(4, activation='softmax')
                    ])
                
                def decide_action(self, state):
                    import numpy as np
                    state_array = np.array(state).reshape(1, -1)
                    action = self.model.predict(state_array, verbose=0)
                    return action[0].tolist()
            
            ai = EnemyAI()
            ai
        `);
        return aiModule;
    }
    
    async decide_movement(playerPos: THREE.Vector3) {
        const state = [
            this.stats.health,
            this.position.distanceTo(playerPos),
            this.stats.size,
            this.stats.level,
            this.age
        ];
        
        const action = await this.aiModule.decide_action(state);
        
        // Apply action to movement
        if (action[0] > 0.5) this.velocity.z -= 1; // Move up
        if (action[1] > 0.5) this.velocity.z += 1; // Move down
        if (action[2] > 0.5) this.velocity.x -= 1; // Move left
        if (action[3] > 0.5) this.velocity.x += 1; // Move right
    }
}
```

### Example 2: Procedural Difficulty Balancing

```typescript
// src/difficultyBalancer.ts
import { loadPyodide } from 'pyodide';

export class DifficultyBalancer {
    private pyodide: any;
    
    async init() {
        this.pyodide = await loadPyodide();
    }
    
    async calculateDifficulty(playerStats: any, mapIndex: number) {
        return await this.pyodide.runPythonAsync(`
            import json
            
            player_stats = ${JSON.stringify(playerStats)}
            map_index = ${mapIndex}
            
            # Analyze player progression
            level = player_stats['level']
            health = player_stats['health']
            max_health = player_stats['maxHealth']
            
            # Calculate difficulty multiplier
            health_ratio = health / max_health
            difficulty_mult = 1.0
            
            if health_ratio < 0.3:
                difficulty_mult *= 0.8  # Player struggling
            elif health_ratio > 0.8:
                difficulty_mult *= 1.2  # Player doing well
            
            # Map progression adjustment
            difficulty_mult += (map_index * 0.5)
            
            difficulty_mult
        `);
    }
}
```

---

## Backend Services (Flask/FastAPI)

For scalability, multiplayer, and external computations:

### Setup Flask Backend

```bash
pip install flask flask-cors python-socketio
```

**app.py:**
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import socketio

app = Flask(__name__)
CORS(app)
sio = socketio.Server(async_mode='threading', cors_allowed_origins='*')

class GameServer:
    def __init__(self):
        self.leaderboard = []
        self.active_players = {}
    
    @app.route('/api/leaderboard', methods=['GET'])
    def get_leaderboard(self):
        limit = request.args.get('limit', 10, type=int)
        return jsonify(self.leaderboard[:limit])
    
    @app.route('/api/score', methods=['POST'])
    def submit_score(self):
        data = request.json
        self.leaderboard.append(data)
        self.leaderboard.sort(key=lambda x: x['level'], reverse=True)
        return jsonify({'status': 'success'})
    
    @sio.event
    def connect(sid, environ):
        print(f"Player {sid} connected")
        self.active_players[sid] = {'position': [0, 0, 0], 'level': 1}
    
    @sio.event
    def update_player(sid, data):
        if sid in self.active_players:
            self.active_players[sid].update(data)
            # Broadcast to other players
            sio.emit('player_update', self.active_players[sid], skip_sid=sid)
    
    @sio.event
    def disconnect(sid):
        if sid in self.active_players:
            del self.active_players[sid]

if __name__ == '__main__':
    sio.attach(app)
    app.run(debug=True, port=5000)
```

**TypeScript Client:**
```typescript
// src/multiplayer.ts
import { io } from 'socket.io-client';

export class MultiplayerGame {
    private socket: any;
    
    async connect() {
        this.socket = io('http://localhost:5000');
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('player_update', (data: any) => {
            // Update other players
            this.updateOtherPlayer(data);
        });
    }
    
    sendPlayerUpdate(position: THREE.Vector3, level: number) {
        this.socket.emit('update_player', {
            position: position.toArray(),
            level: level
        });
    }
    
    async submitScore(playerName: string, level: number, time: number) {
        const response = await fetch('http://localhost:5000/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, level, time })
        });
        return response.json();
    }
}
```

---

## Performance Considerations

### When to Use Each

| Technology | Use When | Avoid When |
|-----------|----------|-----------|
| **JavaScript** | UI, logic, < 1000 objects | Complex math, physics |
| **WebAssembly (C++/Rust)** | Collision detection, physics, procedural generation | Frequent JS interop |
| **Python (Pyodide)** | AI, ML, one-off computations | Real-time critical code |
| **Backend (Flask/FastAPI)** | Multiplayer, persistence, heavy computation | Low latency required |

### Optimization Tips

1. **Minimize Data Transfer**
   ```typescript
   // ❌ Bad: Many small calls
   for (const enemy of enemies) {
       const result = detector.check_collision(enemy);
   }
   
   // ✅ Good: Batch processing
   const results = detector.check_collisions_batch(enemies);
   ```

2. **Cache WASM Modules**
   ```typescript
   // Initialize once
   let detector: CollisionDetector;
   export async function initDetector() {
       detector = await createDetector(); // Only call once
   }
   ```

3. **Use Web Workers for Python**
   ```typescript
   // Run Pyodide in a worker thread to avoid blocking
   const worker = new Worker('ai-worker.js');
   worker.postMessage({ action: 'compute_ai', state: [...] });
   worker.onmessage = (e) => applyAIDecision(e.data);
   ```

---

## Example Implementations

### Full Example: Hybrid Physics Engine

```typescript
// src/hybridPhysics.ts
import init, { PhysicsWorld } from './physics_engine';

export class HybridPhysicsEngine {
    private wasmWorld: PhysicsWorld;
    
    async initialize() {
        await init();
        this.wasmWorld = new PhysicsWorld();
    }
    
    addEntity(pos: THREE.Vector3, radius: number, mass: number) {
        this.wasmWorld.add_entity(pos.x, pos.y, pos.z, radius, mass);
    }
    
    step(deltaTime: number) {
        // Run native physics calculations
        this.wasmWorld.step(deltaTime);
        
        // Get results back
        const positions = this.wasmWorld.get_positions();
        return positions;
    }
}
```

### Full Example: AI-Driven Enemies

```typescript
// src/aiEnemies.ts
import { loadPyodide } from 'pyodide';

export class AIEnemyManager {
    private pyodide: any;
    
    async train(gameData: GameReplay[]) {
        return await this.pyodide.runPythonAsync(`
            import tensorflow as tf
            import numpy as np
            
            # Training logic
            states = np.array([data.state for data in game_data])
            actions = np.array([data.action for data in game_data])
            
            model = tf.keras.Sequential([...])
            model.fit(states, actions, epochs=10)
            
            # Save model
            model.save('trained_ai_model')
        `);
    }
}
```

---

## Testing Extensions

### Unit Testing WASM
```typescript
// test/physics.test.ts
import { test, expect } from '@jest/globals';
import init, { CollisionDetector } from '../physics_engine';

test('collision detection works', async () => {
    await init();
    const detector = new CollisionDetector();
    
    detector.add_entity(0, 0, 0, 1);
    detector.add_entity(1.5, 0, 0, 1);
    
    const collisions = detector.check_collisions();
    expect(collisions.length).toBe(1);
});
```

### Testing Python
```typescript
// test/ai.test.ts
import { loadPyodide } from 'pyodide';

test('AI model predicts actions', async () => {
    const pyodide = await loadPyodide();
    const result = await pyodide.runPythonAsync(`
        from enemy_ai import EnemyAI
        ai = EnemyAI()
        action = ai.decide_action([50, 10, 2, 5, 0])
        action
    `);
    
    expect(result).toHaveLength(4);
});
```

---

## Troubleshooting

### WASM Module Not Loading
```typescript
// Add try-catch with fallback
try {
    const detector = new CollisionDetector();
} catch (e) {
    console.warn('WASM not available, using JS fallback');
    useJavaScriptDetector();
}
```

### Python Performance Issues
- Use `numpy` for arrays instead of lists
- Batch operations instead of loops
- Cache results when possible

### Memory Leaks
- Dispose of WASM objects explicitly
- Clear Python variables after use
- Monitor browser dev tools

---

**For more help, see the main README.md**
