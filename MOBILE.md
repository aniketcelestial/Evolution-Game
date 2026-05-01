# Mobile & Android Support Guide

## Overview

Evolution Slither now has complete mobile and Android support with touch-based controls, virtual joystick, live map view, and touch-based camera rotation.

## Features

### 1. Virtual Joystick (Left Bottom Corner)
- **360° movement control** - Swipe and drag to move in any direction
- **Visual feedback** - Joystick shows movement direction and distance
- **Responsive** - Automatically adjusts for different screen sizes

### 2. Touch Camera Control (Two-Finger Drag)
- **Look around** - Use two fingers to rotate camera
- **Smooth rotation** - Swipe horizontally to turn
- **Swipe vertically** - Look up and down
- **Sensitivity control** - Built-in sensitivity slider

### 3. Live Map View (Bottom Right)
- **Real-time minimap** - Shows your position (green), enemies (red), and food (yellow)
- **Toggle button** - 📍 Map button to open/close
- **Position tracking** - Updates in real-time as you move
- **Grid reference** - For navigation

### 4. Mobile UI Optimization
- **Full-screen game** - Maximizes game view area
- **Responsive layout** - Adapts to all screen sizes
- **Safe area support** - Works with iPhone notches
- **Portrait & landscape** - Supports all orientations

### 5. Touch-Friendly Buttons
- **Pause/Resume** - Easy thumb access
- **Menu** - Quick return to main menu
- **Map toggle** - Open minimap anytime

## Controls

### Movement
```
Left Joystick (Bottom-Left)
- Drag in any direction
- 360° continuous movement
- Release to stop
```

### Camera Control
```
Two-Finger Swipe (Anywhere on screen)
- Swipe left/right: Rotate view horizontally
- Swipe up/down: Tilt view vertically
```

### Map View
```
Map Button (Bottom-Right)
- Tap to toggle minimap open/closed
- Shows enemy positions in red
- Shows food positions in yellow
- Shows your position in green
```

## Installation

The game automatically detects if it's running on mobile and activates touch controls.

### For Android
1. Open the game URL in Chrome/Firefox
2. Optional: Add to home screen (Chrome menu → Install app)
3. Plays in fullscreen mode

### For iOS
1. Open in Safari
2. Tap share → Add to Home Screen
3. Opens as fullscreen web app
4. Works with notches (iPhone X+)

## Mobile Files

```
src/mobile.ts
├── MobileControls
│   ├── Joystick management
│   ├── Touch input handling
│   └── Camera rotation tracking
└── MapView
    ├── Canvas rendering
    ├── Entity positioning
    └── Real-time updates
```

### CSS for Mobile
```
Mobile Touch Controls:
- .joystick-container       → Virtual joystick
- .joystick-base           → Joystick background circle
- .joystick               → Draggable thumb
- .map-view-container     → Minimap popup
- .mobile-btn             → Touch buttons

Responsive breakpoints:
- @media (max-width: 600px)        → Phone layout
- @media (max-height: 500px)       → Landscape adjustments
- Safe area support (notches)
```

## Screen Layouts

### Portrait Mode (Phone)
```
┌─────────────────────────┐
│ HUD Stats (Top)         │
│ - Level, Health, XP     │
│ - Map, Enemies, Time    │
├─────────────────────────┤
│                         │
│    3D Game World        │
│                         │
│                         │
├─────────────────────────┤
│ 📍 Map (Bottom-Right)   │
│ [Joystick] (Bottom-Left)│
│ [Pause] [Menu] (Top-Right) │
└─────────────────────────┘
```

### Landscape Mode
```
┌──────────────┬──────────────────┐
│ HUD Stats    │  3D Game World   │
│ (Vertical)   │                  │
│              │                  │
│              │      📍 Map      │
│              │   [Joystick]     │
└──────────────┴──────────────────┘
```

## Performance

### Mobile Optimization
- Reduced shadow quality on mobile
- Optimized particle count
- Efficient touch event handling
- Minimal layout shifts
- No unnecessary re-renders

### Device Support
- ✅ Android 6.0+
- ✅ iOS 11+
- ✅ Tablets (iPad, Samsung Tab)
- ✅ Large phones (6"+ screens)
- ✅ Small phones (4"+ screens)

### Performance Targets
- **FPS**: 60 FPS target (stable)
- **Memory**: < 150 MB
- **Load time**: < 5 seconds
- **Battery**: Efficient power usage

## Customization

### Adjust Joystick Size
```typescript
// src/mobile.ts
private maxDistance: number = 50; // Increase for larger movement range
private joystickRadius: number = 60; // Increase for larger visual
```

### Change Camera Sensitivity
```typescript
// src/mobile.ts
private cameraRotationSensitivity: number = 0.005; // Increase for faster rotation
```

### Modify Map Size
```typescript
// In game initialization
this.mapView = new MapView('map-view');
// Adjust canvas size in CSS: width: 200px; height: 200px;
```

## Troubleshooting

### Joystick Not Responsive
1. Ensure touch is working (test in browser console)
2. Check browser permissions
3. Try landscape orientation

### Camera Not Rotating
1. Use TWO fingers to drag (not one)
2. Ensure device supports multi-touch
3. Check camera sensitivity setting

### Map Not Showing
1. Click the 📍 Map button
2. Ensure map-view-container is in HTML
3. Check browser console for errors

### UI Text Too Small
1. Browser → Settings → Text Size
2. Pinch to zoom (maps disable zoom)
3. Rotate to landscape

### Touch Lag
1. Close other apps
2. Clear browser cache
3. Disable browser extensions
4. Update browser

## Testing on Mobile

### Using Chrome DevTools
1. Open DevTools (F12)
2. Click Device Toolbar (Ctrl+Shift+M)
3. Select device (iPhone, Pixel, etc.)
4. Test touch events

### Testing on Real Device
1. Run `npm run dev`
2. Get local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Open `http://[YOUR_IP]:5173` on mobile
4. Test all controls

### Testing on Android Emulator
1. Install Android Studio
2. Create virtual device
3. Run app in emulator
4. Test touch controls

## HTML Structure

```html
<!-- Joystick Container -->
<div id="joystick-container" class="joystick-container">
    <div class="joystick-base">
        <div class="joystick"></div>
    </div>
</div>

<!-- Map View -->
<div id="map-view-container" class="map-view-container">
    <div class="map-header">
        <span class="map-title">Map</span>
        <button id="close-map-btn" class="close-btn">✕</button>
    </div>
    <canvas id="map-view" class="map-canvas"></canvas>
</div>

<!-- Mobile Buttons -->
<button id="map-btn" class="mobile-btn map-btn">📍 Map</button>
```

## API Reference

### MobileControls

```typescript
// Initialize
const controls = new MobileControls();

// Get input
const input = controls.touchInput; // { up, down, left, right }

// Camera rotation
const rotation = controls.getCameraRotation(); // { x, y }

// Show/hide
controls.show();
controls.hide();

// Reset
controls.resetCameraRotation();
```

### MapView

```typescript
// Initialize
const mapView = new MapView('map-view');

// Update with game state
mapView.updateMap(playerPos, enemies, foods, mapSize);

// Show/hide
mapView.show();
mapView.hide();
```

## Browser Compatibility

| Browser | Android | iOS | Tablet |
|---------|---------|-----|--------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ❌ | ✅ |
| Safari | ❌ | ✅ | ✅ |
| Samsung Internet | ✅ | ❌ | ✅ |
| Opera | ✅ | ❌ | ✅ |

## Viewport Settings

The game includes proper mobile viewport settings:
```html
<meta name="viewport" content="
    width=device-width,
    initial-scale=1.0,
    viewport-fit=cover,
    user-scalable=no
">
```

Features:
- `width=device-width` - Responsive width
- `initial-scale=1.0` - Proper zoom level
- `viewport-fit=cover` - Full notch support
- `user-scalable=no` - Disable pinch zoom

## Advanced Features

### Haptic Feedback (Optional)
```typescript
// Add vibration on hit
if (navigator.vibrate) {
    navigator.vibrate(50); // 50ms vibration
}
```

### Full-Screen Mode (Optional)
```typescript
// Request fullscreen on mobile
if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
}
```

### Installation Prompt (Android)
```typescript
// Prompt to install as app
window.addEventListener('beforeinstallprompt', (e) => {
    e.prompt(); // Show install banner
});
```

## Accessibility

- Touch targets >= 44px (thumb-friendly)
- High contrast UI (white/blue on dark)
- Clear visual feedback (glow effects)
- No time-critical interactions

## Battery Optimization

- Adaptive frame rate
- Pause when backgrounded
- Reduce particle effects on low battery
- Optimize WebGL rendering

## Future Enhancements

- [ ] Gyro-based camera control
- [ ] Haptic feedback on hits
- [ ] Game controller support
- [ ] Cloud saves
- [ ] Multiplayer sync
- [ ] Achievements/badges
- [ ] Mobile-specific cosmetics
- [ ] Social sharing

## Support

For issues:
1. Check browser console (F12)
2. Clear cache and reload
3. Update to latest Chrome/Firefox
4. Test on different device
5. Report bugs with device/browser info

---

**Mobile Support**: v2.1  
**Last Updated**: May 2026  
**Status**: Full Support  
**Tested On**: Android 6-13, iOS 11-16, iPad OS 14+
