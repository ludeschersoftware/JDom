import TTagName from "./TTagName";

type TElementOf<T extends TTagName> = HTMLElementTagNameMap[T];

export default TElementOf;