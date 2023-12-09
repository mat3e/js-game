// global state = images to load before entering a game loop
let loaded = false;
const promises = new Map();
const images = new Map();
export async function loading() {
    await Promise.all(promises.values());
    loaded = true;
}
export function submitImage(src) {
    loaded = false;
    const img = new Image();
    img.src = src;
    promises.set(src, new Promise((resolve, reject) => {
        img.onload = () => {
            images.set(src, img);
            resolve(img);
        };
        img.onerror = reject;
    }));
}
export function getImage(src) {
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
