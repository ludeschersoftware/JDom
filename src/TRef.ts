type TRef<T> = { readonly current: T | null; } | ((el: T) => void);

export default TRef;