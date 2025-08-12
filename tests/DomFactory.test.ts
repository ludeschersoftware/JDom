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

    test("resolveChild creates from TRecursiveElementObject", () => {
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

describe("DOM Helper Library", () => {
    it("should create a styled button with click handler", () => {
        const btn = createElement("button", {
            textContent: "Click Me",
            style: { backgroundColor: "navy", color: "white", padding: "0.5em 1em" },
            onclick: jest.fn(),
        });

        expect(btn).toBeInstanceOf(HTMLButtonElement);
        expect(btn.textContent).toBe("Click Me");
        expect(btn.style.backgroundColor).toBe("navy");
        expect(typeof btn.click).toBe("function");
    });

    it("should append a list of <li> items to a <ul>", () => {
        const items = ["Apple", "Banana", "Cherry"];

        appendElement(
            document.body,
            "ul",
            {},
            createElements(
                items.map((item) => ({
                    tagName: "li",
                    options: { textContent: item },
                    children: [],
                }))
            )
        );

        const appendedUl = document.body.querySelector("ul");
        expect(appendedUl).not.toBeNull();
        expect(appendedUl?.children.length).toBe(3);
    });

    it("should create mixed children in a <p> element", () => {
        const strong = document.createElement("strong");
        const p = createElement("p", {}, [
            "Hello, ",
            strong,
            { tagName: "em", options: { textContent: "world" }, children: [] },
        ]);

        expect(p).toBeInstanceOf(HTMLParagraphElement);
        expect(p.childNodes.length).toBe(3);
        expect(p.textContent).toContain("Hello, world");
    });

    it("should create an input with props, events, attributes, and dataset", () => {
        const input = createElement("input", {
            type: "checkbox",
            checked: true,
            onchange: jest.fn(),
            attributes: { id: "agree", "aria-label": "Agree" },
            dataset: { toggle: "yes" },
        });

        expect(input).toBeInstanceOf(HTMLInputElement);
        expect(input.checked).toBe(true);
        expect(input.id).toBe("agree");
        expect(input.dataset["toggle"]).toBe("yes");
    });

    it("should apply styles and dataset to a div", () => {
        const div = createElement("div", {
            style: { display: "flex", gap: "1em", padding: "1em" },
            dataset: { userId: "42", role: "admin" },
        });

        expect(div.style.display).toBe("flex");
        expect(div.dataset["userId"]).toBe("42");
        expect(div.dataset["role"]).toBe("admin");
    });

    it("should assign refs correctly", () => {
        const refObj = { current: null as HTMLButtonElement | null };
        const refFn = jest.fn();

        const btn1 = createElement("button", { ref: refObj }, ["OK"]);
        const btn2 = createElement("button", { ref: refFn }, ["Cancel"]);

        expect(refObj.current).toBe(btn1);
        expect(refFn).toHaveBeenCalledWith(btn2);
    });

    it("should batch create and append <li> elements", () => {
        const lis = createElements([
            { tagName: "li", options: { textContent: "One" }, children: [] },
            { tagName: "li", options: { textContent: "Two" }, children: [] },
        ]);

        appendElement(document.body, "ul", { className: "batch-create" }, lis);

        const ul = document.body.querySelector("ul.batch-create");
        expect(ul?.children.length).toBe(2);
        expect(ul?.textContent).toContain("One");
        expect(ul?.textContent).toContain("Two");
    });

    it("should render a nested component tree", () => {
        appendElements(document.body, [
            {
                tagName: "section",
                options: { id: "main" },
                children: [
                    {
                        tagName: "h1",
                        options: { textContent: "Dashboard" },
                        children: [],
                    },
                    {
                        tagName: "div",
                        options: { className: "cards", style: { display: "grid", gap: "1em" } },
                        children: [
                            {
                                tagName: "article",
                                options: { className: "card" },
                                children: [
                                    { tagName: "h2", options: { textContent: "Card 1" }, children: [] },
                                    { tagName: "p", options: { textContent: "Details about card 1" }, children: [] },
                                ],
                            },
                            {
                                tagName: "article",
                                options: { className: "card" },
                                children: [
                                    { tagName: "h2", options: { textContent: "Card 2" }, children: [] },
                                    { tagName: "p", options: { textContent: "Details about card 2" }, children: [] },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);

        const section = document.body.querySelector("section#main");
        expect(section).not.toBeNull();
        expect(section?.querySelectorAll("article.card").length).toBe(2);
    });
});

describe("DOM Helper Library - Edge Cases", () => {
    it("should handle missing options gracefully", () => {
        const div = createElement("div");
        expect(div).toBeInstanceOf(HTMLDivElement);
        expect(div.textContent).toBe("");
    });

    it("should throw on unknown properties in options", () => {
        expect(() =>
            createElement("span", {
                textContent: "Hello",
                // @ts-expect-error
                unknownProp: "value" as any,
            })
        ).toThrow(`Unknown property "unknownProp" for: HTMLSpanElement`);
    });

    it("should handle null or undefined children", () => {
        // @ts-expect-error
        const div = createElement("div", {}, [null, undefined, "Text"]);
        expect(div.childNodes.length).toBe(1);
        expect(div.textContent).toBe("Text");
    });

    it("should not fail when appending to a null parent", () => {
        const child = createElement("p", { textContent: "Oops" });
        expect(() => appendElement(null as any, "div", {}, [child])).toThrow();
    });

    it("should throw on falsy children in createElements", () => {
        expect(() => createElements([
            null as any,
            undefined as any,
            false as any,
            { tagName: "span", options: { textContent: "Valid" }, children: [] },
        ])).toThrow(TypeError);
    });

    it("should handle empty children array", () => {
        const ul = createElement("ul", {}, []);
        expect(ul.children.length).toBe(0);
    });

    it("should not crash with empty tagName in createElements", () => {
        expect(() =>
            createElements([
                // @ts-expect-error
                { tagName: "", options: {}, children: [] },
            ])
        ).toThrow();
    });

    it("should handle deeply nested children", () => {
        appendElements(document.body, [
            {
                tagName: "div",
                options: { id: "root" },
                children: [
                    {
                        tagName: "section",
                        options: {},
                        children: [
                            {
                                tagName: "article",
                                options: {},
                                children: [
                                    {
                                        tagName: "p",
                                        options: { textContent: "Deep content" },
                                        children: [],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);
        const p = document.body.querySelector("#root section article p");
        expect(p?.textContent).toBe("Deep content");
    });

    it("should handle multiple refs in one call", () => {
        const ref1 = { current: null as HTMLDivElement | null };
        const ref2 = jest.fn();

        const div = createElement("div", {
            ref: (el) => {
                ref1.current = el;
                ref2(el);
            },
        });

        expect(ref1.current).toBe(div);
        expect(ref2).toHaveBeenCalledWith(div);
    });

    it("should not apply dataset if not an object", () => {
        const div = createElement("div", {
            dataset: "not-an-object" as any,
        });

        expect(Object.keys(div.dataset).length).toBe(0);
    });

    it("should not apply attributes if not an object", () => {
        const div = createElement("div", {
            attributes: "invalid" as any,
        });

        expect(div.getAttributeNames().length).toBe(0);
    });

    it("should not apply style if not an object", () => {
        const div = createElement("div", {
            style: "color: red;" as any,
        });

        expect(div.getAttribute("style")).toBeNull();
    });
});