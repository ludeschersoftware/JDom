A lightweight, fully-typed DOM helper library for creating and appending HTML elements with a declarative, recursive API. Built in TypeScript, it provides:

- Type-safe tag names and element types
- Strongly-typed props, events, styles, datasets, and arbitrary attributes
- Recursive child definitions including strings, existing nodes, and nested configs
- Helpers for single or batch creation/appending

---

## Installation

```bash
npm install @ludescher/dom
# or
yarn add @ludescher/dom
```

---

## Quick Start

```ts
import {
  createElement,
  appendElement,
  createElements,
  appendElements,
} from "@ludescher/dom";

// 1) Create a <button> with text, style, click handler
const btn = createElement("button", {
  textContent: "Click Me",
  style: { backgroundColor: "navy", color: "white", padding: "0.5em 1em" },
  onclick: () => alert("Hello!"),
});
document.body.appendChild(btn);

// 2) Append a list of <li> into a <ul>
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
```

---

## API Reference

| Function       | Signature                                                           | Return              | Notes                                               |
| -------------- | ------------------------------------------------------------------- | ------------------- | --------------------------------------------------- |
| createElement  | `createElement<T extends TagName>(tagName: T, options?, children?)` | `ElementOf<T>`      | Core builder, returns a typed HTML element          |
| createElements | `createElements<Cfgs extends RecursiveElementObject[]>(data: Cfgs)` | Typed element array | Builds multiple elements at once                    |
| appendElement  | `appendElement(parent, tagName, options?, children?)`               | `void`              | Shorthand: `parent.appendChild(createElement(...))` |
| appendElements | `appendElements(parent, data: RecursiveElementObject[])`            | `void`              | Shorthand for batching multiple `appendChild` calls |

---

### Core Types

```ts
type TagName = keyof HTMLElementTagNameMap;
type ElementOf<T extends TagName> = HTMLElementTagNameMap[T];

interface RecursiveElementObject<T extends TagName = TagName> {
  readonly tagName: T;
  readonly options?: ElementOptions<ElementOf<T>>;
  readonly children?: ElementChildren;
}

type ElementChild = RecursiveElementObject | HTMLElement | Node | string;
type ElementChildren = readonly ElementChild[];

interface ElementOptions<T extends HTMLElement> {
  attributes?: Record<string, string>; // arbitrary HTML attributes
  style?: Partial<WritableCSSProperties>; // CSS-in-JS style object
  dataset?: Record<string, string>; // data-* attributes
  ref?: Ref<T>; // callback or mutable ref object
  // … plus any partial HTMLElement props and on<Event> handlers
}
```

---

## Feature Highlights

### 1. Type-Safe Tag Names

Every call to `createElement("div", …)` returns a `HTMLDivElement`, not just `HTMLElement`.  
IDE autocomplete guides you to properties and events specific to that element.

### 2. Declarative Children

Children can be:

- Plain strings (converted to `Text` nodes)
- Existing `HTMLElement` or any `Node` (passed through)
- Nested configs (`RecursiveElementObject`) for deep trees

```ts
// Mixed children: text, element, nested config
const p = createElement("p", {}, [
  "Hello, ",
  document.createElement("strong"),
  { tagName: "em", options: { textContent: "world" }, children: [] },
]);
```

### 3. Props, Events & Attributes

```ts
createElement("input", {
  type: "checkbox",
  checked: true, // native prop
  onchange: (e) => console.log(e.target), // event handler
  attributes: { id: "agree", "aria-label": "Agree" }, // arbitrary attrs
  dataset: { toggle: "yes" }, // data-toggle="yes"
});
```

### 4. Styles & Dataset

```ts
createElement("div", {
  style: { display: "flex", gap: "1em", padding: "1em" },
  dataset: { userId: "42", role: "admin" },
});
```

### 5. Refs

```ts
const refObj = { current: null as HTMLButtonElement | null };
const refFn = (el: HTMLButtonElement) => console.log("got", el);

createElement("button", { ref: refObj, onclick: () => {} }, ["OK"]);
createElement("button", { ref: refFn }, ["Cancel"]);

// later
console.log(refObj.current); // the actual <button> element
```

### 6. Batch Creation & Appending

```ts
// create an array of <li> elements
const lis = createElements([
  { tagName: "li", options: { textContent: "One" }, children: [] },
  { tagName: "li", options: { textContent: "Two" }, children: [] },
]);

// append them under a <ul>
appendElement(document.body, "ul", {}, lis);
```

---

## Advanced Example: Nested Component Tree

```ts
const tree: RecursiveElementObject[] = [
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
              {
                tagName: "h2",
                options: { textContent: "Card 1" },
                children: [],
              },
              {
                tagName: "p",
                options: { textContent: "Details about card 1" },
                children: [],
              },
            ],
          },
          {
            tagName: "article",
            options: { className: "card" },
            children: [
              {
                tagName: "h2",
                options: { textContent: "Card 2" },
                children: [],
              },
              {
                tagName: "p",
                options: { textContent: "Details about card 2" },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
];

// render it all
appendElements(document.body, tree);
```

---

## TypeScript Tips

- If you ever need to pass raw `Text` or `Comment`, just include the node directly in the `children` array.
- Use `as const` on deeply nested literal configs to preserve literal `tagName` types.
- Extend the global `HTMLElementTagNameMap` to teach TS about your custom elements:
  ```ts
  declare global {
    interface HTMLElementTagNameMap {
      "my-widget": MyWidgetElement;
    }
  }
  ```

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Add tests under `tests/`
4. Submit a PR

---

## License

MIT © Johannes Ludescher
