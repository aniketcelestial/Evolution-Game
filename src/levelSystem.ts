export class LevelProgressionSystem {
    public readonly LEVEL_RANGES = [
        { minLevel: 1, maxLevel: 15, mapIndex: 0, name: 'Starter Map' },
        { minLevel: 15, maxLevel: 30, mapIndex: 1, name: 'Intermediate Map' },
        { minLevel: 30, maxLevel: 45, mapIndex: 2, name: 'Advanced Map' },
        { minLevel: 45, maxLevel: 60, mapIndex: 3, name: 'Expert Map' },
        { minLevel: 60, maxLevel: 100, mapIndex: 4, name: 'Legendary Map' },
    ];

    public getMapIndexForLevel(level: number): number {
        for (const range of this.LEVEL_RANGES) {
            if (level >= range.minLevel && level <= range.maxLevel) {
                return range.mapIndex;
            }
        }
        return 0;
    }

    public getMapNameForLevel(level: number): string {
        for (const range of this.LEVEL_RANGES) {
            if (level >= range.minLevel && level <= range.maxLevel) {
                return range.name;
            }
        }
        return 'Unknown';
    }

    public canAccessMap(playerLevel: number, mapIndex: number): boolean {
        const range = this.LEVEL_RANGES[mapIndex];
        if (!range) return false;
        return playerLevel >= range.minLevel;
    }

    public getNextMapLevel(playerLevel: number): number {
        const currentMapIndex = this.getMapIndexForLevel(playerLevel);
        if (currentMapIndex < this.LEVEL_RANGES.length - 1) {
            return this.LEVEL_RANGES[currentMapIndex + 1].minLevel;
        }
        return this.LEVEL_RANGES[currentMapIndex].maxLevel;
    }

    public getProgressToNextMap(playerLevel: number): { current: number; next: number; percentage: number } {
        const nextMapLevel = this.getNextMapLevel(playerLevel);
        const currentMapIndex = this.getMapIndexForLevel(playerLevel);
        const currentRange = this.LEVEL_RANGES[currentMapIndex];
        
        const start = currentRange.minLevel;
        const progress = playerLevel - start;
        const total = nextMapLevel - start;
        
        return {
            current: playerLevel,
            next: nextMapLevel,
            percentage: Math.min(100, (progress / total) * 100),
        };
    }
}
