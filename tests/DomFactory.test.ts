import { createElement, appendElement, resolveChild, createElements, appendElements } from "../src/DomFactory";
import MyWidget from "./MyWidget";

declare global {
    interface HTMLElementTagNameMap {
        "my-widget": MyWidget;
    }
}

beforeAll(() => {
    if (!customElements.get("my-widget")) {
        customElements.define("my-widget", MyWidget);
    }
});

describe("MyWidget Web Component (using our DOM factory)", () => {
    test("attaches an open shadow root and wrapper via ref", () => {
        const ref = { current: null as MyWidget | null };
        appendElement(document.body, "my-widget", { ref });

        const widget = ref.current!;
        expect(widget).toBeInstanceOf(MyWidget);
        expect(widget.shadowRoot).not.toBeNull();

        const wrapper = widget.shadowRoot!
            .querySelector<HTMLDivElement>(".wrapper");
        expect(wrapper).toBeInstanceOf(HTMLDivElement);
    });

    test("projects slotted content into title & default slots", () => {
        const ref = { current: null as MyWidget | null };
        appendElement(document.body, "my-widget", { ref }, [
            {
                tagName: "span",
                options: { slot: "title", textContent: "Slotted Title" }
            },
            {
                tagName: "template", options: {}, children: [
                    // text nodes must be created manually
                    // our factory only proxies HTMLElement children
                ]
            },
            // default-text slot: we inject a real text node
            document.createTextNode("Default paragraph text"),
            {
                tagName: "button",
                options: { slot: "action", textContent: "Action Button" }
            }
        ]);

        const widget = ref.current!;
        const sr = widget.shadowRoot!;

        const titleSlot = sr.querySelector<HTMLSlotElement>(
            'slot[name="title"]'
        )!;
        expect(
            (titleSlot.assignedElements()[0] as HTMLSpanElement).textContent
        ).toBe("Slotted Title");

        const defaultSlot = sr.querySelector<HTMLSlotElement>(
            'slot:not([name])'
        )!;
        const textNode = defaultSlot
            .assignedNodes()
            .find(n => n.nodeType === Node.TEXT_NODE)!;
        expect(textNode.textContent!.trim())
            .toBe("Default paragraph text");
    });

    test("reflects data-count via dataset into a badge", () => {
        const ref = { current: null as MyWidget | null };
        appendElement(document.body, "my-widget", {
            ref,
            dataset: { count: "42" }
        });

        const widget = ref.current!;
        const badge = widget.shadowRoot!
            .querySelector<HTMLSpanElement>(".badge")!;

        expect(badge).toBeInstanceOf(HTMLSpanElement);
        expect(badge.textContent).toBe("42");
    });

    test("does not create a badge for unrelated attributes", () => {
        const widget = new MyWidget();
        document.body.appendChild(widget);

        // setting an unrelated attribute should not create .badge
        widget.setAttribute("id", "foo");
        expect(widget.shadowRoot!.querySelector(".badge")).toBeNull();
    });

    test("updates existing badge text without creating a second badge", () => {
        const widget = new MyWidget();
        document.body.appendChild(widget);

        widget.setAttribute("data-count", "1");
        const firstBadge = widget.shadowRoot!.querySelector(".badge")!;
        expect(firstBadge.textContent).toBe("1");

        // change it again
        widget.setAttribute("data-count", "2");
        const badges = widget.shadowRoot!.querySelectorAll(".badge");
        expect(badges).toHaveLength(1);               // still only one badge
        expect(firstBadge.textContent).toBe("2");     // and its text updated
    });

    test("clears badge text when data-count is removed", () => {
        const widget = new MyWidget();
        document.body.appendChild(widget);

        widget.setAttribute("data-count", "7");
        const badge = widget.shadowRoot!.querySelector(".badge")!;
        expect(badge.textContent).toBe("7");

        widget.removeAttribute("data-count");
        expect(badge.textContent).toBe("");          // empty string when val is null
    });

    test("badge is styled correctly (inline CSS)", () => {
        const widget = new MyWidget();
        document.body.appendChild(widget);

        widget.setAttribute("data-count", "9");
        const badge = widget.shadowRoot!.querySelector<HTMLElement>(".badge")!;

        // verify part of the cssText you injected
        expect(badge.style.background).toBe("crimson");
        expect(badge.style.color).toBe("white");
        expect(badge.style.borderRadius).toBe("50%");
    });

    test("action slot has inline backgroundColor style", () => {
        const widget = new MyWidget();
        document.body.appendChild(widget);

        const actionSlot = widget.shadowRoot!
            .querySelector<HTMLSlotElement>('slot[name="action"]')!;

        // This reflects the `{ style: { backgroundColor: "blue" } }` in the constructor
        expect(actionSlot.style.backgroundColor).toBe("blue");
    });

    test("skips when shadow is falsy", () => {
        const w = new MyWidget();
        // hack-remove the private shadow field
        (w as any).shadow = null;
        // calling setAttribute would never hit the block, so invoke directly
        expect(() => w.attributeChangedCallback("data-count", null, "7")).not.toThrow();
        // still no exception, and nothing was appended to the real shadowRoot
        expect(w.shadowRoot).not.toBeNull();
        expect(w.shadowRoot!.querySelector(".badge")).toBeNull();
    });
});

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

    describe("resolveChild string/Node branches", () => {
        test("resolveChild creates a Text node from a raw string", () => {
            const textNode = resolveChild("Hello, world!");
            expect(textNode).toBeInstanceOf(Text);
            expect(textNode.textContent).toBe("Hello, world!");
        });

        test("resolveChild preserves non-HTMLElement Node instances (e.g. Comment)", () => {
            const comment = document.createComment("a comment");
            const result = resolveChild(comment);
            expect(result).toBe(comment);
            expect(result.nodeType).toBe(Node.COMMENT_NODE);
            expect(result.nodeValue).toBe("a comment");
        });

        test("createElement accepts string children directly", () => {
            const p = createElement("p", {}, [
                "foo",
                { tagName: "strong", options: { textContent: "bar" }, children: [] },
                "baz"
            ]);
            // Should yield: Text("foo") → <strong>bar</strong> → Text("baz")
            expect(p.childNodes).toHaveLength(3);
            expect(p.childNodes[0]).toBeInstanceOf(Text);
            expect(p.childNodes[0].textContent).toBe("foo");
            expect((p.childNodes[1] as HTMLElement).tagName).toBe("STRONG");
            expect(p.childNodes[2].textContent).toBe("baz");
        });
    });
});
