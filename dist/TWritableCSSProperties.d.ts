type TWritableCSSProperties = {
    [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string ? (readonly [K] extends [never] ? K : never) : never]: CSSStyleDeclaration[K];
};
export default TWritableCSSProperties;
//# sourceMappingURL=TWritableCSSProperties.d.ts.map