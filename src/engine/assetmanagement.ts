// global state = images to load before entering a game loop

let loaded: boolean = false;
const promises: Map<string, Promise<HTMLImageElement>> = new Map();
const images: Map<string, HTMLImageElement> = new Map();

export async function loading(): Promise<void> {
    await Promise.all(promises.values());
    loaded = true;
}

export function submitImage(src: string): void {
    loaded = false;
    const img: HTMLImageElement = new Image();
    img.src = src;
    promises.set(src, new Promise((resolve, reject) => {
        img.onload = () => {
            images.set(src, img);
            resolve(img);
        };
        img.onerror = reject;
    }));
}

export function getImage(src: string): HTMLImageElement {
    const result = images.get(src);
    if (!result) {
        const message = 'Image not found. Ensure to load it first.';
        if (!loaded) {
            throw Error(message + ' Did you forget to await loading of assets?');
        }
        throw Error(message);
    }
    return result;
}
