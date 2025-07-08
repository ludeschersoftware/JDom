import TElementChildren from "./TElementChildren";
import TElementOf from "./TElementOf";
import TElementOptions from "./TElementOptions";
import TTagName from "./TTagName";

type TRecursiveElementObject<T extends TTagName = TTagName> = Readonly<{
    tagName: T;
    options?: TElementOptions<TElementOf<T>>;
    children?: TElementChildren;
}>;

export default TRecursiveElementObject;