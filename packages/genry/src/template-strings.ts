const t = (strings: TemplateStringsArray, ...params: any[]): string =>
    strings
        .map((s, idx) => s + (params.length < idx ? params[idx] : ""))
        .join("");

export { t as html, t as css, t as md, t as graphql };
