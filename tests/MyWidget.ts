import { createElement } from "../src";

class MyWidget extends HTMLElement {
    private shadow: ShadowRoot;

    constructor() {
        super();
        // 1. attach an open shadow root
        this.shadow = this.attachShadow({ mode: "open" });

        // 2. build and append a <style> block
        const style = document.createElement("style");
        style.textContent = `
      .wrapper {
        border: 2px solid navy;
        padding: 1em;
        display: block;
        max-width: 300px;
      }
      h2 { margin: 0 0 0.5em; color: darkblue; }
      ::slotted(button) {
        background: navy;
        color: white;
        border: none;
        padding: 0.5em 1em;
        cursor: pointer;
      }
    `;
        this.shadow.appendChild(style);

        // 3. build the internal DOM via our createElement DSL
        const container = createElement("div", { className: "wrapper" }, [
            // a heading with a named slot
            {
                tagName: "h2", options: {}, children: [
                    { tagName: "slot", options: { attributes: { name: "title" } }, children: [] }
                ]
            },

            // a paragraph with default text slot
            {
                tagName: "p", options: {}, children: [
                    { tagName: "slot", options: {}, children: [] }
                ]
            },

            // a click-me button inside the shadow that users can style via slot
            {
                tagName: "div", options: { style: { textAlign: "right", marginTop: "1em" } }, children: [
                    { tagName: "slot", options: { attributes: { name: "action" }, style: { backgroundColor: "blue" } }, children: [] }
                ]
            }
        ]);

        this.shadow.appendChild(container);
    }

    // reflect an attribute as a property
    static get observedAttributes() { return ["data-count"]; }

    attributeChangedCallback(name: string, _old: string | null, val: string | null) {
        if (name === "data-count" && this.shadow) {
            // update a counter badge (or any logic you like)
            let badge = this.shadow.querySelector(".badge") as HTMLElement | null;
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "badge";
                badge.style.cssText = "background: crimson; color: white; border-radius: 50%; padding: 0.2em 0.5em; margin-left: 0.5em;";
                const header = this.shadow.querySelector("h2");
                header?.appendChild(badge);
            }
            badge.textContent = val ?? "";
        }
    }
}

export default MyWidget;