// Feature detect which polyfill needs to be imported.

let needsTemplate = false;
// no real <template> because no `content` property (IE and older browsers)
const t: HTMLTemplateElement = document.createElement("template");
if (!("content" in t)) {
  needsTemplate = true;
}
// broken doc fragment (older Edge)
if (!(t.content.cloneNode() instanceof DocumentFragment)) {
  needsTemplate = true;
}
// broken <template> cloning (Edge up to at least version 17)
const t2: HTMLTemplateElement = document.createElement("template");
t2.content.appendChild(document.createElement("div"));
t.content.appendChild(t2);
const clone: any = t.cloneNode(true);
needsTemplate =
  clone.content.childNodes.length === 0 ||
  clone.content.firstChild.content.childNodes.length === 0;

let polyfills: string[] = [];
// NOTE: any browser that does not have template or ES6 features
// must load the full suite of polyfills.
if (!Promise || !Array.from || !window.URL || !Symbol || needsTemplate) {
  polyfills = ["sd-ce-pf"];
}
if (
  !(
    "attachShadow" in Element.prototype && "getRootNode" in Element.prototype
  ) ||
  ((window as any).ShadyDOM && (window as any).ShadyDOM.force)
) {
  polyfills.push("sd");
}
if (!window.customElements || (window.customElements as any).forcePolyfill) {
  polyfills.push("ce");
}

// Note that in this case we need to append the .js extension, otherwise
// Webpack will try to load the .js.map files into the bundle too.
(polyfills.length
  ? import(`@webcomponents/webcomponentsjs/bundles/${polyfills.join("-")}.js`)
  : Promise.resolve()
).then(() => import("./app/mint-app"));
