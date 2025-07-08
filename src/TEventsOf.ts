type TEventsOf<T> = T extends HTMLElement ? {
    [K in keyof HTMLElementEventMap as `on${K}`]?: (ev: HTMLElementEventMap[K]) => any;
} : {};

export default TEventsOf;