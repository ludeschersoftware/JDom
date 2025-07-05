type TagName = keyof HTMLElementTagNameMap;
type ElementOf<T extends TagName> = HTMLElementTagNameMap[T];
type Ref<T> = { readonly current: T | null; } | ((el: T) => void);

type WritableCSSProperties = {
    [K in keyof CSSStyleDeclaration as
    CSSStyleDeclaration[K] extends string ? (readonly [K] extends [never] ? K : never) : never
    ]: CSSStyleDeclaration[K];
};

type EventsOf<T> = T extends HTMLElement ? {
    [K in keyof HTMLElementEventMap as `on${K}`]?: (ev: HTMLElementEventMap[K]) => any;
} : {};

type ElementOptions<T extends HTMLElement> = {
    style?: Partial<WritableCSSProperties>;
    dataset?: Record<string, string>;
    ref?: Ref<T>;
} & Omit<Partial<T>, 'style'> & EventsOf<T>;

type ElementChildren = ReadonlyArray<Readonly<RecursiveElementObject> | HTMLElement>;

type RecursiveElementObject<T extends TagName = TagName> = Readonly<{
    tagName: T;
    options?: ElementOptions<ElementOf<T>>;
    children?: ElementChildren;
}>;

export function appendElements<Cfgs extends ReadonlyArray<RecursiveElementObject>>(
    parent: HTMLElement,
    data: Cfgs
): void {
    data.forEach(cfg => parent.appendChild(createElement(cfg.tagName, cfg.options, cfg.children)));
}

export function appendElement<T extends TagName>(
    parent: HTMLElement,
    tagName: T,
    options?: Readonly<ElementOptions<ElementOf<T>>>,
    children?: Readonly<ElementChildren>
): void {
    parent.appendChild(createElement(tagName, options, children));
}

export function createElements<Cfgs extends ReadonlyArray<RecursiveElementObject>>(
    data: Cfgs
): {
        [K in keyof Cfgs]:
        Cfgs[K] extends RecursiveElementObject<infer U>
        ? ElementOf<U>
        : never
    } {
    return data.map(cfg => createElement(cfg.tagName, cfg.options, cfg.children)) as any;
}

export function createElement<T extends TagName>(
    tagName: T,
    options?: Readonly<ElementOptions<ElementOf<T>>>,
    children?: Readonly<ElementChildren>
): ElementOf<T> {
    const el = document.createElement(tagName) as ElementOf<T>;
    const opts = (options ?? {}) as ElementOptions<ElementOf<T>>;

    const { dataset, style, ref, ...rest } = opts;

    for (const [key, value] of Object.entries(rest)) {
        if (key.startsWith("on") && typeof value === "function") {
            const eventName = key.slice(2) as keyof HTMLElementEventMap;

            if (eventName in el) {
                el.addEventListener(eventName, value as EventListener);
            } else {
                throw new Error(`Unknown event "${eventName}" for: ${el.constructor.name}`);
            }
        } else {
            (el as any)[key] = value;
        }
    }

    if (style) {
        Object.assign(el.style, style);
    }

    if (dataset) {
        for (const [k, v] of Object.entries(dataset)) {
            if (typeof v === "string") {
                el.dataset[k] = v;
            } else {
                throw new Error(`Dataset "${k}" does have a invalid value type "${typeof v}", for: ${el.constructor.name}`);
            }
        }
    }

    for (const child of children ?? []) {
        el.appendChild(resolveChild(child));
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

export function resolveChild(
    child: RecursiveElementObject | HTMLElement
): HTMLElement {
    return child instanceof HTMLElement
        ? child
        : createElement(child.tagName, child.options, child.children);
}