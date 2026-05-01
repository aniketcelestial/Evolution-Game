# Quick Start - Evolution Slither Game v2.0

## What's New?

We've completely redesigned the game from a creature simulator to a **slither-like combat game**:

### Before (v1.0)
- Evolution simulator with passive creatures
- Simple spawning and despawning
- No combat or progression

### After (v2.0) ✨
- **Slither-style gameplay**: Start small, grow by eating
- **Combat system**: Fight enemies, win by size advantage
- **5-map progression**: Unlock new maps as you level (15, 30, 45, 60)
- **Enemy AI**: Enemies chase, attack, and scale with difficulty
- **Health system**: Track player and enemy health
- **Experience & leveling**: Gain XP from killing enemies
- **Stat progression**: Improve speed, health, attack, size

## How to Play

### Start the Game
```bash
# The dev server should still be running from earlier
# If not:
npm run dev
```

### Game Controls
| Key | Action |
|-----|--------|
| **W** or **↑** | Move Up |
| **S** or **↓** | Move Down |
| **A** or **←** | Move Left |
| **D** or **→** | Move Right |
| **P** or Click Pause | Pause Game |
| **Click Menu** | Return to Main Menu |

### Gameplay Flow
1. **Start** - You begin as a tiny green creature (Level 1)
2. **Hunt** - Kill red enemies and eat yellow food
3. **Grow** - Each kill gives experience
4. **Level Up** - Increase stats every level
5. **Progress** - Unlock new maps:
   - **Level 15** → Intermediate Map (Blue)
   - **Level 30** → Advanced Map (Red)
   - **Level 45** → Expert Map (Dark Blue)
   - **Level 60** → Legendary Map (Purple)
6. **Win** - Reach level 100 in Legendary Map

### Visual Feedback
- **Green glow** = Your player (gets bigger and bluer as you level)
- **Red glow** = Enemies (strength increases with level)
- **Gold/Orange** = Food (small energy items)
- **Health bar** = Your current health (green bar at top)
- **XP bar** = Progress to next level (blue bar)

## What Files Changed

### Core Game Mechanics
- `src/player.ts` - NEW: Your controllable character
- `src/enemy.ts` - NEW: Enemy creatures with AI
- `src/combat.ts` - NEW: Combat and collision detection
- `src/food.ts` - NEW: Food spawning and eating
- `src/levelSystem.ts` - NEW: Level progression (5 maps)
- `src/mapManager.ts` - NEW: Multi-map system with difficulty
- `src/game.ts` - REWRITTEN: New game loop and systems

### UI Updates
- `index.html` - Updated HUD with health/XP bars
- `src/styles.css` - New bar styles and animations
- `README.md` - Complete new documentation

### Documentation
- `EXTENSIONS.md` - NEW: C++/Python integration guide

## Testing the Game

### Quick Test Path
1. **Start Simulation** → You should see a green sphere (you)
2. **Move around** → Use WASD/arrows, camera should follow
3. **Kill enemies** → Collide with red spheres (you should be bigger)
4. **Eat food** → Collect yellow spheres to gain XP
5. **Level up** → Watch your health bar refill and size increase
6. **Map transition** → At level 15, environment changes to blue
7. **Difficulty** → Enemies at level 30 map should be much stronger

### What You Should See
```
HUD Display:
Level: 1 → ... → 15 → ... → 30 → ... → 45 → ... → 60 → ... → 100
Health: 100/100 (green bar)
Experience: 0/100 (blue bar)
Map: Starter Map → Intermediate Map → Advanced Map → Expert Map → Legendary Map
Enemies: 15+
Time: 0:00 → ...
```

## Architecture Overview

```
Game Loop (60 FPS)
├── Player.update(deltaTime, input)
│   ├── Movement (WASD input)
│   ├── Camera follow
│   └── Health/XP tracking
├── Enemy.update(deltaTime, playerPos) [×15+]
│   ├── Chase/wander behavior
│   ├── Health tracking
│   └── Combat stats
├── FoodManager.update()
│   └── Spawn new food
├── CombatSystem.update()
│   ├── Player-Food collisions → Eat
│   ├── Player-Enemy collisions → Combat
│   └── Enemy-Enemy collisions → Avoid
├── MapManager.checkTransition()
│   └── Load new map at level milestones
└── Scene3D.render()
    └── Draw everything
```

## Extension Points Ready

### For Later (Character Design)
- Create custom 3D models
- Load GLB/OBJ files
- Add animations

### For Advanced (C++ Performance)
```typescript
// Physics in WebAssembly
import { CollisionDetector } from './physics_engine.wasm';
```

### For Advanced (Python AI)
```python
# Neural network enemies
from tensorflow import keras
model = keras.models.load_model('enemy_ai')
```

### For Advanced (Multiplayer)
```typescript
// Connect to Flask backend
const socket = io('localhost:5000');
```

## Troubleshooting

### Game is Slow
- Reduce enemy count (look in `mapManager.ts`)
- Disable grid (Settings → Show Grid)

### Can't Move
- Check that WASD/Arrow keys work (try typing in a text box)
- Check browser console for errors (F12)

### Enemies Not Appearing
- Wait a moment (they spawn after map loads)
- Check enemy count in HUD (should be 15+)

### Can't Level Up
- You need to kill enemies to gain XP
- Eat food to increase health when low
- Make sure you're bigger than the enemy to win fights

## Performance Expectations

- **FPS**: Should run at 60 FPS with 15 enemies
- **Memory**: < 100 MB
- **Load Time**: < 3 seconds
- **Max Entities**: 100+ enemies (with optimization)

## Next Steps (For You)

1. **Test the game** → Play through a few levels
2. **Add character models** → Replace geometric shapes with 3D models
3. **Add C++ physics** → WebAssembly for collision detection
4. **Add Python AI** → Neural networks for smart enemies
5. **Add multiplayer** → Flask backend for online play
6. **Add cosmetics** → Skins, visual effects, particles

## Code Quality

✅ **TypeScript** - Full type safety, no `any` types  
✅ **Modular** - Each system in separate file  
✅ **Documented** - Comments and type annotations  
✅ **No Errors** - Clean compilation  
✅ **Extensible** - Easy to add features  

## File Sizes

```
src/ Total: ~15 KB TypeScript
dist/ Build: ~400 KB (with Three.js)
node_modules/: ~200 MB (dependencies)
```

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ❌ IE 11 (not supported)

## Performance Tips

If the game is slow:
1. Close other browser tabs
2. Disable grid in settings
3. Reduce enemy spawn rate in `mapManager.ts`
4. Use Firefox (better WebGL performance)

## What's Next in the Roadmap

- [ ] Custom character models
- [ ] Power-ups and special abilities
- [ ] Particle effects
- [ ] Sound effects
- [ ] Mutations/genetics system
- [ ] Leaderboards
- [ ] Multiplayer
- [ ] Mobile optimization

---

**Version**: 2.0  
**Status**: Playable  
**Last Update**: May 2026

Enjoy! 🎮
