import { createElement, appendElement, resolveChild, createElements, appendElements } from "../src";

describe("DomFactory", () => {
    test("creates a div element", () => {
        const el = createElement("div");
        expect(el.tagName).toBe("DIV");
    });

    test("assigns textContent", () => {
        const el = createElement("p", { textContent: "Hello" });
        expect(el.textContent).toBe("Hello");
    });

    test("adds event listener", () => {
        const clickHandler = jest.fn();
        const el = createElement("button", { onclick: clickHandler });
        el.click();
        expect(clickHandler).toHaveBeenCalled();
    });

    test("invalid eventname throws on unknown event", () => {
        // @ts-ignore
        expect(() => createElement("button", { onmount: jest.fn() })).toThrow(`Unknown event "mount" for: HTMLButtonElement`);
    });

    test("handles dataset", () => {
        const el = createElement("section", { dataset: { foo: "bar" } });
        expect(el.dataset["foo"]).toBe("bar");
    });

    test("handles invalid dataset", () => {
        // @ts-ignore
        expect(() => createElement("section", { dataset: { foo: 0 } })).toThrow(`Dataset "foo" does have a invalid value type "number", for: HTMLElement`);
    });

    test("appends element children", () => {
        const child = document.createElement("span");
        const el = createElement("div", {}, [child]);
        expect(el.firstChild).toBe(child);
    });

    test("renders recursive tree", () => {
        const result = createElements([
            {
                tagName: "div",
                options: { id: "root" },
                children: [
                    {
                        tagName: "div",
                        children: [
                            {
                                tagName: "label",
                                options: {
                                    textContent: "von:",
                                    htmlFor: "inputid",
                                },
                                children: [
                                    {
                                        tagName: "input",
                                        options: {
                                            id: "inputid",
                                            type: "text",
                                            value: "peter",
                                        },
                                    },
                                    {
                                        tagName: "h1",
                                        options: { textContent: "Header" },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(result).toHaveLength(1);
        const root = result[0];
        expect(root.id).toBe("root");
        expect(root.querySelector("h1")?.textContent).toBe("Header");
    });

    test("assigns ref callback", () => {
        let refEl: HTMLElement | null = null;
        createElement("div", { ref: el => (refEl = el) });
        expect(refEl).toBeInstanceOf(HTMLDivElement);
    });

    test("assigns ref object", () => {
        const ref = { current: null as HTMLInputElement | null };
        const el = createElement("input", { ref });
        expect(ref.current).toBe(el);
    });

    test("assigns invalid ref object", () => {
        // @ts-ignore
        const ref: { current: HTMLInputElement; } = {};
        expect(() => createElement("input", { ref })).toThrow(`Invalid ref object: "{}" the object is missing the prop "current", for: HTMLInputElement`);
    });

    test("assigns invalid ref type", () => {
        // @ts-ignore
        const ref: { current: HTMLInputElement; } = "Peter";
        expect(() => createElement("input", { ref })).toThrow(`Invalid ref type: string, for: HTMLInputElement`);
    });

    test("appendElements supports tree config", () => {
        const parent = document.createElement("div");
        appendElements(parent, [
            {
                tagName: "p",
                options: {
                    textContent: "Hi"
                },
                children: [
                    {
                        tagName: "label",
                        options: {
                            textContent: "von:",
                            htmlFor: "inputid",
                        },
                        children: [
                            {
                                tagName: "input",
                                options: {
                                    id: "inputid",
                                    type: "text",
                                    value: "peter",
                                },
                            },
                            {
                                tagName: "h1",
                                options: { textContent: "Header" },
                            },
                        ],
                    },
                ],
            }
        ]);
        expect(parent.querySelector("p label h1")?.textContent).toBe("Header");
    });

    test("appendElement supports tag + options", () => {
        const parent = document.createElement("div");
        appendElement(parent, "span", { id: "child" });
        expect(parent.querySelector("#child")).not.toBeNull();
    });

    test("resolveChild creates from RecursiveElementObject", () => {
        const child = { tagName: "p", options: { textContent: "Hi" } } as const;
        const el = (resolveChild(child));
        expect(el.tagName).toBe("P");
        expect(el.textContent).toBe("Hi");
    });

    test("assigns inline styles", () => {
        const el = createElement("div", { style: { backgroundColor: "blue" } });
        expect(el.style.backgroundColor).toBe("blue");
    });

    test("assigns boolean and numeric props", () => {
        const inp = createElement("input", { checked: true, maxLength: 5 });
        expect((inp as HTMLInputElement).checked).toBe(true);
        expect((inp as HTMLInputElement).maxLength).toBe(5);
    });

    test("assigns className and hidden", () => {
        const div = createElement("div", { className: "foo bar", hidden: true });
        expect(div.className).toBe("foo bar");
        expect(div.hidden).toBe(true);
    });

    test("merges multiple inline styles", () => {
        const el = createElement("div", {
            style: { color: "red", backgroundColor: "blue" }
        });
        expect(el.style.color).toBe("red");
        expect(el.style.backgroundColor).toBe("blue");
    });

    test("inline style overrides defaults", () => {
        const el = createElement("div", { style: { display: "none" } });
        expect(el.style.display).toBe("none");
    });

    test("dataset maps camelCase to data- attributes", () => {
        const el = createElement("div", { dataset: { fooBar: "baz" } });
        expect(el.dataset["fooBar"]).toBe("baz");
        expect(el.getAttribute("data-foo-bar")).toBe("baz");
    });

    test("createElement accepts mix of HTMLElement and config in children", () => {
        const existing = document.createElement("em");
        const p = createElement("p", {}, [
            existing,
            { tagName: "strong", options: { textContent: "Bold" } }
        ]);
        expect(p.firstChild).toBe(existing);
        expect(p.lastChild).toBeInstanceOf(HTMLElement);
        expect((p.lastChild as HTMLElement).tagName).toBe("STRONG");
    });

    test("appendElement supports passing children array", () => {
        const parent = document.createElement("div");
        const span = document.createElement("span");
        appendElement(parent, "div", {}, [span]);
        const childDiv = parent.firstChild as HTMLDivElement;
        expect(childDiv).toBeInstanceOf(HTMLDivElement);
        expect(childDiv.firstChild).toBe(span);
    });

    test("multiple listeners on one element", () => {
        const click = jest.fn();
        const focus = jest.fn();
        const btn = createElement("button", { onclick: click, onfocus: focus });
        btn.click();
        btn.dispatchEvent(new FocusEvent("focus")); // In JSDOM calling btn.focus() doesn’t actually dispatch a focus event.
        expect(click).toHaveBeenCalled();
        expect(focus).toHaveBeenCalled();
    });

    test("event names are case-sensitive ('onclick', not 'onClick')", () => {
        // @ts-ignore
        expect(() => createElement("button", { onClick: jest.fn() }))
            .toThrow(/Unknown event "Click" for: HTMLButtonElement/);
    });

    test("createElements([]) returns empty array", () => {
        expect(createElements([])).toEqual([]);
    });

    test("appendElements([],…) does nothing", () => {
        const parent = document.createElement("div");
        appendElements(parent, []);
        expect(parent.childElementCount).toBe(0);
    });
});
