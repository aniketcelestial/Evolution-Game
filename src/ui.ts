export class UIManager {
    private screens: Map<string, HTMLElement> = new Map();

    constructor() {
        // Cache screen elements
        const screenIds = ['main-menu', 'settings-screen', 'about-screen', 'game-hud', 'loading-screen'];
        screenIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.screens.set(id, element);
            }
        });
    }

    public showScreen(screenId: string): void {
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }

    public hideScreen(screenId: string): void {
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.classList.remove('active');
        }
    }

    public updateStat(statId: string, value: string | number): void {
        const element = document.getElementById(statId);
        if (element) {
            element.textContent = value.toString();
        }
    }

    public getButtonElement(buttonId: string): HTMLButtonElement | null {
        return document.getElementById(buttonId) as HTMLButtonElement;
    }

    public dispose(): void {
        this.screens.clear();
    }
}
