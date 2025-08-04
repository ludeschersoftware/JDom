import TEventsOf from "./TEventsOf";
import TRef from "./TRef";
import TWritableCSSProperties from "./TWritableCSSProperties";
type TElementOptions<T extends HTMLElement> = {
    attributes?: Record<string, string>;
    style?: Partial<TWritableCSSProperties>;
    dataset?: Record<string, string>;
    ref?: TRef<T>;
} & Omit<Partial<T>, 'style' | 'attributes'> & TEventsOf<T>;
export default TElementOptions;
//# sourceMappingURL=TElementOptions.d.ts.map