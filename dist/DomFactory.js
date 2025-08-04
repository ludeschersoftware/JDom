export function appendElements(parent, data) {
    data.forEach(cfg => parent.appendChild(createElement(cfg.tagName, cfg.options, cfg.children)));
}
export function appendElement(parent, tagName, options, children) {
    parent.appendChild(createElement(tagName, options, children));
}
export function createElements(data) {
    return data.map(cfg => createElement(cfg.tagName, cfg.options, cfg.children));
}
export function createElement(tagName, options, children) {
    const el = document.createElement(tagName);
    const opts = (options ?? {});
    const { attributes, dataset, style, ref, ...rest } = opts;
    for (const [key, value] of Object.entries(rest)) {
        if (key.startsWith("on") && typeof value === "function") {
            const eventName = key.slice(2);
            if (eventName in el) {
                el.addEventListener(eventName, value);
            }
            else {
                throw new Error(`Unknown event "${eventName}" for: ${el.constructor.name}`);
            }
        }
        else {
            el[key] = value;
        }
    }
    if (style) {
        Object.assign(el.style, style);
    }
    if (dataset) {
        for (const [k, v] of Object.entries(dataset)) {
            if (typeof v === "string") {
                el.dataset[k] = v;
            }
            else {
                throw new Error(`Dataset "${k}" does have a invalid value type "${typeof v}", for: ${el.constructor.name}`);
            }
        }
    }
    if (attributes) {
        for (const [attr, val] of Object.entries(attributes)) {
            el.setAttribute(attr, val);
        }
    }
    for (const child of children ?? []) {
        el.appendChild(resolveChild(child));
    }
    if (ref) {
        if (typeof ref === "function") {
            ref(el);
        }
        else if (typeof ref === "object") {
            if ("current" in ref) {
                ref.current = el;
            }
            else {
                throw new Error(`Invalid ref object: "${JSON.stringify(ref)}" the object is missing the prop "current", for: ${el.constructor.name}`);
            }
        }
        else {
            throw new Error(`Invalid ref type: ${typeof ref}, for: ${el.constructor.name}`);
        }
    }
    return el;
}
export function resolveChild(child) {
    if (typeof child === "string") {
        return document.createTextNode(child);
    }
    if (child instanceof HTMLElement) {
        return child;
    }
    if (child instanceof Node) {
        return child;
    }
    return createElement(child.tagName, child.options, child.children);
}
//# sourceMappingURL=DomFactory.js.map