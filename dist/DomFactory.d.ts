import TElementChild from "./TElementChild";
import TElementChildren from "./TElementChildren";
import TElementOf from "./TElementOf";
import TElementOptions from "./TElementOptions";
import TRecursiveElementObject from "./TRecursiveElementObject";
import TTagName from "./TTagName";
export declare function appendElements<Cfgs extends ReadonlyArray<TRecursiveElementObject>>(parent: HTMLElement, data: Cfgs): void;
export declare function appendElement<T extends TTagName>(parent: HTMLElement, tagName: T, options?: Readonly<TElementOptions<TElementOf<T>>>, children?: Readonly<TElementChildren>): void;
export declare function createElements<Cfgs extends ReadonlyArray<TRecursiveElementObject>>(data: Cfgs): {
    [K in keyof Cfgs]: Cfgs[K] extends TRecursiveElementObject<infer U> ? TElementOf<U> : never;
};
export declare function createElement<T extends TTagName>(tagName: T, options?: Readonly<TElementOptions<TElementOf<T>>>, children?: Readonly<TElementChildren>): TElementOf<T>;
export declare function resolveChild(cfg: Readonly<TRecursiveElementObject>): HTMLElement;
export declare function resolveChild(el: HTMLElement): HTMLElement;
export declare function resolveChild(nd: Node): Node;
export declare function resolveChild(str: string): Text;
export declare function resolveChild(child: TElementChild): Node;
//# sourceMappingURL=DomFactory.d.ts.map