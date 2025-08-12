import TElementChild from "./TElementChild";
import TElementChildren from "./TElementChildren";
import TElementOf from "./TElementOf";
import TElementOptions from "./TElementOptions";
import TRecursiveElementObject from "./TRecursiveElementObject";
import TTagName from "./TTagName";

export function appendElements<Cfgs extends ReadonlyArray<TRecursiveElementObject>>(
    parent: HTMLElement,
    data: Cfgs
): void {
    data
        .filter(cfg => (cfg && (typeof cfg === "object")))
        .map(cfg => parent.appendChild(createElement(cfg.tagName, cfg.options, cfg.children)));
}

export function appendElement<T extends TTagName>(
    parent: HTMLElement,
    tagName: T,
    options?: Readonly<TElementOptions<TElementOf<T>>>,
    children?: Readonly<TElementChildren>
): void {
    parent.appendChild(createElement(tagName, options, children));
}

export function createElements<Cfgs extends ReadonlyArray<TRecursiveElementObject>>(
    data: Cfgs
): {
        [K in keyof Cfgs]:
        Cfgs[K] extends TRecursiveElementObject<infer U>
        ? TElementOf<U>
        : never
    } {
    return data
        .filter(cfg => (cfg && (typeof cfg === "object")))
        .map(cfg => createElement(cfg.tagName, cfg.options, cfg.children)) as any;
}

export function createElement<T extends TTagName>(
    tagName: T,
    options?: Readonly<TElementOptions<TElementOf<T>>>,
    children?: Readonly<TElementChildren>
): TElementOf<T> {
    const el = document.createElement(tagName) as TElementOf<T>;
    const opts = (options ?? {}) as TElementOptions<TElementOf<T>>;

    const { attributes, dataset, style, ref, ...rest } = opts;

    for (const [key, value] of Object.entries(rest)) {
        if (key.startsWith("on") && typeof value === "function") {
            const eventName = key.slice(2) as keyof HTMLElementEventMap;

            if (key in el) {
                el.addEventListener(eventName, value as EventListener);
            } else {
                throw new Error(`Unknown event "${eventName}" for: ${el.constructor.name}`);
            }
        } else if (key in el) {
            (el as any)[key] = value;
        } // else ignore
    }

    if (style) {
        Object.assign(el.style, style);
    }

    if (typeof dataset === "object") {
        for (const [k, v] of Object.entries(dataset)) {
            if (typeof v === "string") {
                el.dataset[k] = v;
            } else {
                throw new Error(`Dataset "${k}" does have a invalid value type "${typeof v}", for: ${el.constructor.name}`);
            }
        }
    }

    if (typeof attributes === "object") {
        for (const [attr, val] of Object.entries(attributes)) {
            el.setAttribute(attr, val);
        }
    }

    for (const child of children ?? []) {
        if (child) {
            el.appendChild(resolveChild(child));
        }
    }

    if (ref) {
        if (typeof ref === "function") {
            ref(el);
        } else if (typeof ref === "object") {
            if ("current" in ref) {
                (ref as { current: typeof el; }).current = el;
            } else {
                throw new Error(`Invalid ref object: "${JSON.stringify(ref)}" the object is missing the prop "current", for: ${el.constructor.name}`);
            }
        } else {
            throw new Error(`Invalid ref type: ${typeof ref}, for: ${el.constructor.name}`);
        }
    }

    return el;
}

export function resolveChild(cfg: Readonly<TRecursiveElementObject>): HTMLElement;
export function resolveChild(el: HTMLElement): HTMLElement;
export function resolveChild(nd: Node): Node;
export function resolveChild(str: string): Text;
export function resolveChild(child: TElementChild): Node;

export function resolveChild(child: TElementChild): Node {
    if (typeof child === "string") {
        return document.createTextNode(child);
    }

    if (child instanceof HTMLElement) {
        return child;
    }

    if (child instanceof Node) { // Text or Comment
        return child;
    }

    return createElement(child.tagName, child.options, child.children);
}