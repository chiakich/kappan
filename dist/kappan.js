// src/options.ts
var DEFAULT_PUNCT_RANGE = "U+2013-2015, U+2018-201D, U+2025-2026, U+3001-3011, U+3014-301F, U+30FB, U+FF01-FF0F, U+FF1A-FF20, U+FF3B-FF40, U+FF5B-FF65";
var resolveOptions = (o = {}) => ({
  paper: o.paper ?? "#efe9db",
  ink: o.ink ?? "#000",
  inkMuted: o.inkMuted ?? "#000",
  red: o.red ?? "#a2372a",
  typeFamily: o.typeFamily ?? "'I.Ming', 'IMing', 'Noto Serif TC', 'Songti TC', serif",
  latinFamily: o.latinFamily ?? "'Courier New', ui-monospace, monospace",
  filters: o.filters ?? {},
  variants: o.variants ?? false,
  pitch: o.pitch ?? "46px",
  lean: o.lean ?? 1,
  weight: o.weight ?? 1,
  texture: o.texture ?? 1,
  idPrefix: o.idPrefix ?? "lp",
  punctFont: o.punctFont === null || o.punctFont === void 0 ? null : {
    family: o.punctFont.family,
    src: o.punctFont.src,
    weight: o.punctFont.weight ?? 400,
    unicodeRange: o.punctFont.unicodeRange ?? DEFAULT_PUNCT_RANGE
  }
});

// src/css/tokens.ts
var tokensCss = (o) => {
  const type = o.punctFont ? `'${o.punctFont.family}', ${o.typeFamily}` : o.typeFamily;
  return `
.lp {
  --paper: ${o.paper};
  --ink: ${o.ink};
  --ink3: ${o.inkMuted};
  --red: ${o.red};
  --type: ${type};
  --latin: ${o.latinFamily};
  --pitch: ${o.pitch};
  --lean: ${o.lean};
  --weight: ${o.weight};
  --texture: ${o.texture};
  --ruled: color-mix(in srgb, var(--red) 15%, transparent);
  --lp-s: url(#${o.idPrefix}-s);
  --lp-t: url(#${o.idPrefix}-t);
  --lp-d: url(#${o.idPrefix}-d);
  --lp-x: url(#${o.idPrefix}-x);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--type);
}
.lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
`;
};

// src/filters.ts
var SMALL = {
  grainFrequency: 1.1,
  displace: 0.55,
  warp: 0,
  dilate: 0,
  squash: 0.8,
  rim: 0,
  deboss: 0,
  chipFrequency: 1.7,
  chipAmount: 0.16,
  voidFrequency: 0.35,
  voidThreshold: 0.66,
  voidHardness: 40,
  voidOctaves: 3,
  voidSeed: 71,
  round: false,
  roundThreshold: 0.41,
  chipEdge: 3,
  bleed: 3,
  contrast: 1.5,
  threshold: -0.1,
  fade: 1,
  inkFrequency: 0.2,
  inkFloor: 1,
  grainOctaves: 2,
  chipOctaves: 3,
  seed: 4,
  chipSeed: 31,
  inkOctaves: 2,
  inkSeed: 23,
  margin: 14,
  edgeThreshold: 0.8,
  warpFrequency: 0.03,
  warpSeed: 3,
  squashFrequency: 0.14,
  squashSeed: 37,
  pitRadius: 0
};
var TEXT = {
  grainFrequency: 0.88,
  displace: 0.65,
  warp: 0,
  dilate: 0,
  squash: 1,
  rim: 0,
  deboss: 0,
  chipFrequency: 1.05,
  chipAmount: 0.15,
  voidFrequency: 0.35,
  voidThreshold: 0.68,
  voidHardness: 40,
  voidOctaves: 3,
  voidSeed: 71,
  round: false,
  roundThreshold: 0.41,
  chipEdge: 3,
  bleed: 3,
  contrast: 1.4,
  threshold: -0.1,
  fade: 1,
  inkFrequency: 0.13,
  inkFloor: 0.8,
  grainOctaves: 3,
  chipOctaves: 4,
  seed: 9,
  chipSeed: 27,
  inkOctaves: 2,
  inkSeed: 23,
  margin: 16,
  edgeThreshold: 0.8,
  warpFrequency: 0.03,
  warpSeed: 3,
  squashFrequency: 0.14,
  squashSeed: 37,
  pitRadius: 0
};
var HEADING = {
  grainFrequency: 0.6,
  displace: 0.65,
  warp: 0.4,
  dilate: 0.1,
  squash: 0.8,
  rim: 0,
  deboss: 0,
  chipFrequency: 0.5,
  chipAmount: 0.295,
  voidFrequency: 0.35,
  voidThreshold: 0.72,
  voidHardness: 40,
  voidOctaves: 3,
  voidSeed: 71,
  round: 3,
  roundThreshold: 0.41,
  chipEdge: 5,
  bleed: 3,
  contrast: 1,
  threshold: -0.095,
  fade: 1,
  inkFrequency: 0.157,
  inkFloor: 0.87,
  grainOctaves: 3,
  chipOctaves: 4,
  seed: 13,
  chipSeed: 19,
  inkOctaves: 2,
  inkSeed: 23,
  margin: 22,
  edgeThreshold: 0.8,
  warpFrequency: 0.03,
  warpSeed: 3,
  squashFrequency: 0.14,
  squashSeed: 37,
  pitRadius: 1
};
var LARGE = {
  grainFrequency: 0.34,
  displace: 1.2,
  warp: 0.8,
  rim: 0,
  deboss: 0,
  inkFrequency: 0.06,
  inkFloor: 0.5,
  pinFrequency: 0.55,
  pinAmount: 1 / 12,
  voidFrequency: 0.35,
  voidThreshold: 0.66,
  voidHardness: 40,
  voidOctaves: 3,
  voidSeed: 71,
  round: false,
  roundThreshold: 0.49,
  chipEdge: 5,
  bleed: 5,
  contrast: 1.8,
  threshold: -0.03,
  fade: 1,
  grainOctaves: 3,
  inkOctaves: 3,
  pinOctaves: 2,
  seed: 7,
  inkSeed: 23,
  pinSeed: 47,
  margin: 12,
  edgeThreshold: 0.8,
  warpFrequency: 0.02,
  warpSeed: 3,
  pitRadius: 1
};
var STEPS = 48;
var discreteTable = (amount) => {
  const ones = Math.max(0, Math.min(STEPS, Math.round(amount * STEPS)));
  return Array.from({ length: STEPS }, (_, i) => i >= STEPS - ones ? 1 : 0).join(" ");
};
var clamp01 = (n) => Math.max(0, Math.min(1, n));
var voidPass = (t, input, strength, interior) => {
  const threshold = 1 - (1 - t.voidThreshold) * strength;
  if (threshold >= 1) return { markup: "", out: input };
  const k = t.voidHardness;
  return {
    markup: `  <feTurbulence type="fractalNoise" baseFrequency="${t.voidFrequency}" numOctaves="${t.voidOctaves}" seed="${t.voidSeed}" result="vn"/>
  <feColorMatrix in="vn" type="luminanceToAlpha" result="vnl"/>
  <feComponentTransfer in="vnl" result="vm"><feFuncA type="linear" slope="${k}" intercept="${+(-k * threshold).toFixed(3)}"/></feComponentTransfer>
  ${interior ? `<feComposite in="vm" in2="${interior}" operator="in" result="vmi"/>
  ` : ""}<feComposite in="${input}" in2="${interior ? "vmi" : "vm"}" operator="out" result="voided"/>
`,
    out: "voided"
  };
};
var KERNELS = {
  3: { matrix: "1 2 1 2 4 2 1 2 1", divisor: 16 },
  5: { matrix: "1 4 6 4 1 4 16 24 16 4 6 24 36 24 6 4 16 24 16 4 1 4 6 4 1", divisor: 256 }
};
var bleedFilter = (input, bleed) => {
  if (!bleed) return "";
  const k = KERNELS[bleed];
  return `  <feConvolveMatrix in="${input}" order="${bleed}" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="b"/>
`;
};
var roundFilter = (t, out) => {
  if (!t.round) return { markup: "", out: "SourceGraphic" };
  const k = KERNELS[t.round];
  const K = 60;
  return {
    markup: `  <feConvolveMatrix in="SourceGraphic" order="${t.round}" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="rb"/>
  <feComponentTransfer in="rb" result="${out}"><feFuncA type="linear" slope="${K}" intercept="${+(-K * t.roundThreshold).toFixed(2)}"/></feComponentTransfer>
`,
    out
  };
};
var edgeBand = (t, input) => {
  if (!t.chipEdge) return { markup: "", out: "" };
  const k = KERNELS[t.chipEdge];
  const K = 60;
  return {
    markup: `  <feConvolveMatrix in="${input}" order="${t.chipEdge}" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="eb"/>
  <feComponentTransfer in="eb" result="einner"><feFuncA type="linear" slope="${K}" intercept="${+(-K * t.edgeThreshold).toFixed(2)}"/></feComponentTransfer>
  <feComposite in="${input}" in2="einner" operator="out" result="eband"/>
`,
    out: "eband"
  };
};
var rimPass = (rim, input, interior, out) => {
  if (rim <= 0 || !interior) return { markup: "", out: input };
  return {
    markup: `  <feComposite in="${input}" in2="${interior}" operator="in" result="rimIn"/>
  <feComponentTransfer in="rimIn" result="rimDim"><feFuncA type="linear" slope="${+(1 - Math.min(1, rim)).toFixed(3)}"/></feComponentTransfer>
  <feComposite in="${input}" in2="${interior}" operator="out" result="rimEdge"/>
  <feComposite in="rimEdge" in2="rimDim" operator="over" result="${out}"/>
`,
    out
  };
};
var fadePass = (fade, input, out) => fade >= 1 ? { markup: "", out: input } : {
  markup: `  <feComponentTransfer in="${input}" result="${out}"><feFuncA type="linear" slope="${+fade.toFixed(3)}"/></feComponentTransfer>
`,
  out
};
var densityMask = (t, floor, out) => {
  const K = 3.2;
  const at = (x) => +(floor + (1 - floor) * x).toFixed(3);
  const table = [at(0), at(0.45), at(0.85), 1, 1].join(" ");
  return `  <feTurbulence type="fractalNoise" baseFrequency="${t.inkFrequency}" numOctaves="${t.inkOctaves}" seed="${t.inkSeed}" result="${out}N"/>
  <feColorMatrix in="${out}N" type="luminanceToAlpha" result="${out}L"/>
  <feComponentTransfer in="${out}L" result="${out}S"><feFuncA type="linear" slope="${K}" intercept="${+(0.5 - 0.5 * K).toFixed(3)}"/></feComponentTransfer>
  <feComponentTransfer in="${out}S" result="${out}"><feFuncA type="table" tableValues="${table}"/></feComponentTransfer>
`;
};
var inkPass = (t, input, strength, out) => {
  const floor = clamp01(1 - (1 - t.inkFloor) * strength);
  if (floor >= 1) return { markup: "", out: input };
  return {
    markup: `${densityMask(t, floor, "cinkmask")}  <feComposite in="${input}" in2="cinkmask" operator="in" result="${out}"/>
`,
    out
  };
};
var debossPass = (t, shape, ink2, strength, out) => {
  const depth = Math.min(1, t.deboss * strength);
  if (depth <= 0 || t.pitRadius <= 0) return { markup: "", out: ink2 };
  const shade = +(0.16 * depth).toFixed(3);
  const light = +(0.1 * depth).toFixed(3);
  const k = KERNELS[3];
  const soften = (input, out2) => `  <feConvolveMatrix in="${input}" order="3" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="${out2}"/>
`;
  return {
    markup: `  <feMorphology in="${shape}" operator="dilate" radius="${t.pitRadius}" result="pit"/>
  <feOffset in="pit" dx="1" dy="1" result="pitSE"/>
  <feComposite in="pit" in2="pitSE" operator="out" result="wallNW"/>
  <feComposite in="wallNW" in2="${ink2}" operator="out" result="wallNWp"/>
${soften("wallNWp", "wallNWs")}  <feColorMatrix in="wallNWs" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${shade} 0" result="shade"/>
  <feOffset in="pit" dx="-1" dy="-1" result="pitNW"/>
  <feComposite in="pit" in2="pitNW" operator="out" result="wallSE"/>
  <feComposite in="wallSE" in2="${ink2}" operator="out" result="wallSEp"/>
${soften("wallSEp", "wallSEs")}  <feColorMatrix in="wallSEs" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${light} 0" result="light"/>
  <feMerge result="${out}"><feMergeNode in="shade"/><feMergeNode in="light"/><feMergeNode in="${ink2}"/></feMerge>
`,
    out
  };
};
var warpPass = (t, input, strength) => {
  const scale = t.warp * strength;
  if (scale <= 0) return { markup: "", out: input };
  return {
    markup: `  <feTurbulence type="fractalNoise" baseFrequency="${t.warpFrequency}" numOctaves="1" seed="${t.warpSeed}" result="wp"/>
  <feDisplacementMap in="${input}" in2="wp" scale="${+scale.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="warped"/>
`,
    out: "warped"
  };
};
var squashPass = (t, core, halo, strength, out) => {
  const scale = t.squash * strength;
  if (scale <= 0) return "";
  return `  <feTurbulence type="fractalNoise" baseFrequency="${t.squashFrequency}" numOctaves="2" seed="${t.squashSeed}" result="sq"/>
  <feDisplacementMap in="${halo}" in2="sq" scale="${+scale.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="squashed"/>
  <feComposite in="${core}" in2="squashed" operator="over" result="${out}"/>
`;
};
var chipFilter = (id, t, strength) => {
  const displace = t.displace * strength;
  const dilate = t.dilate * strength;
  const size2 = 100 + t.margin * 2;
  const shaped = roundFilter(t, "shaped");
  const warped = warpPass(t, shaped.out, strength);
  const base = dilate > 0 ? "gain" : "rough";
  const band = edgeBand(t, base);
  const gap = voidPass(t, "chipped", strength, band.out ? "einner" : void 0);
  const squash = dilate > 0 ? squashPass(t, "rough", "grown", strength, "gain") : "";
  const inked = inkPass(t, "hard", strength, "inked");
  const rim = rimPass(t.rim, inked.out, band.out ? "einner" : void 0, "rimmed");
  const fade = fadePass(t.fade, rim.out, "faded");
  const deboss = debossPass(t, "rough", fade.out, strength, "pressed");
  const grow = dilate > 0 ? `  <feMorphology in="rough" operator="dilate" radius="${+dilate.toFixed(3)}" result="${squash ? "grown" : "gain"}"/>
${squash}` : "";
  return `
<filter id="${id}" x="-${t.margin}%" y="-${t.margin}%" width="${size2}%" height="${size2}%" color-interpolation-filters="sRGB">
${shaped.markup}${warped.markup}  <feTurbulence type="fractalNoise" baseFrequency="${t.grainFrequency}" numOctaves="${t.grainOctaves}" seed="${t.seed}" result="fib"/>
  <feDisplacementMap in="${warped.out}" in2="fib" scale="${+displace.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
${grow}  <feTurbulence type="fractalNoise" baseFrequency="${t.chipFrequency}" numOctaves="${t.chipOctaves}" seed="${t.chipSeed}" result="mot"/>
  <feColorMatrix in="mot" type="luminanceToAlpha" result="motl"/>
  <feComponentTransfer in="motl" result="chip"><feFuncA type="discrete" tableValues="${discreteTable(clamp01(t.chipAmount * strength))}"/></feComponentTransfer>
${band.markup}${band.out ? `  <feComposite in="chip" in2="${band.out}" operator="in" result="chipRim"/>
` : ""}  <feComposite in="${base}" in2="${band.out ? "chipRim" : "chip"}" operator="out" result="chipped"/>
${gap.markup}${bleedFilter(gap.out, t.bleed)}  <feComponentTransfer in="${t.bleed ? "b" : gap.out}" result="hard"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
${inked.markup}${rim.markup}${fade.markup}${deboss.markup}</filter>`;
};
var inkFilter = (id, t, strength) => {
  const size2 = 100 + t.margin * 2;
  const floor = clamp01(1 - (1 - t.inkFloor) * strength);
  const shaped = roundFilter(t, "shaped");
  const warped = warpPass(t, shaped.out, strength);
  const band = edgeBand(t, "uneven");
  const gap = voidPass(t, "chipped", strength, band.out ? "einner" : void 0);
  const rim = rimPass(t.rim, "hard", band.out ? "einner" : void 0, "rimmed");
  const fade = fadePass(t.fade, rim.out, "faded");
  const deboss = debossPass(t, "rough", fade.out, strength, "pressed");
  return `
<filter id="${id}" x="-${t.margin}%" y="-${t.margin}%" width="${size2}%" height="${size2}%" color-interpolation-filters="sRGB">
${shaped.markup}${warped.markup}  <feTurbulence type="fractalNoise" baseFrequency="${t.grainFrequency}" numOctaves="${t.grainOctaves}" seed="${t.seed}" result="fib"/>
  <feDisplacementMap in="${warped.out}" in2="fib" scale="${+(t.displace * strength).toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
${densityMask(t, floor, "inkmask")}  <feComposite in="rough" in2="inkmask" operator="in" result="uneven"/>
  <feTurbulence type="fractalNoise" baseFrequency="${t.pinFrequency}" numOctaves="${t.pinOctaves}" seed="${t.pinSeed}" result="pin"/>
  <feColorMatrix in="pin" type="luminanceToAlpha" result="pinl"/>
  <feComponentTransfer in="pinl" result="pinmask"><feFuncA type="discrete" tableValues="${discreteTable(clamp01(t.pinAmount * strength))}"/></feComponentTransfer>
${band.markup}${band.out ? `  <feComposite in="pinmask" in2="${band.out}" operator="in" result="pinRim"/>
` : ""}  <feComposite in="uneven" in2="${band.out ? "pinRim" : "pinmask"}" operator="out" result="chipped"/>
${gap.markup}${bleedFilter(gap.out, t.bleed)}  <feComponentTransfer in="${t.bleed ? "b" : gap.out}" result="hard"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
${rim.markup}${fade.markup}${deboss.markup}</filter>`;
};
var FILTER_VARIANTS = {
  /** 新字新墨，幾乎不破。小字級的內文或介面用。 */
  clean: { strength: 0.35 },
  /**
   * 吃墨：滾筒上墨太多，筆畫脹開糊在一起，但不太破。
   *
   * 沒有反方向的「破更兇」那一套 —— 實測 strength 1.15 跟預設幾乎分不出來、
   * 1.3 就已經難看，中間沒有可用區間。預設值本身就接近破損的上限了。
   */
  inky: {
    small: { dilate: 0.2, chipAmount: 0.04, voidThreshold: 0.9, contrast: 3.4 },
    text: { dilate: 0.26, chipAmount: 0.04, voidThreshold: 0.9, contrast: 4 },
    heading: { bleed: 3, dilate: 0.45, chipAmount: 0.08, voidThreshold: 0.92, contrast: 4.2 },
    large: { bleed: 3, inkFloor: 0.78, pinAmount: 0.02, voidThreshold: 0.92, contrast: 1.6 }
  }
};
var VARIANT_NAMES = Object.keys(FILTER_VARIANTS);
var oneSet = (idPrefix, tuning) => {
  const strength = tuning.strength ?? 1;
  return [
    chipFilter(`${idPrefix}-s`, { ...SMALL, ...tuning.small }, strength),
    chipFilter(`${idPrefix}-t`, { ...TEXT, ...tuning.text }, strength),
    chipFilter(`${idPrefix}-d`, { ...HEADING, ...tuning.heading }, strength),
    inkFilter(`${idPrefix}-x`, { ...LARGE, ...tuning.large }, strength)
  ].join("\n");
};
var filtersMarkup = (idPrefix = "lp", tuning = {}, variants = false) => {
  const sets = [oneSet(idPrefix, tuning)];
  if (variants) {
    for (const [name, v] of Object.entries(FILTER_VARIANTS)) {
      sets.push(oneSet(`${idPrefix}-${name}`, { ...tuning, ...v }));
    }
  }
  return sets.join("\n");
};
var FILTER_DEFAULTS = { small: SMALL, text: TEXT, heading: HEADING, large: LARGE };

// src/css/texture.ts
var grainUri = (size2, freq, octaves, opacity) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size2}' height='${size2}'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='${size2}' height='${size2}' filter='url(%23n)' opacity='${opacity}'/%3E%3C/svg%3E")`;
var variantCss = (prefix) => VARIANT_NAMES.map((v) => `.lp-${v} { ${["s", "t", "d", "x"].map((t) => `--lp-${t}: url(#${prefix}-${v}-${t});`).join(" ")} }`).join("\n");
var textureCss = (o) => `${o.variants ? variantCss(o.idPrefix) + "\n" : ""}
.lp .sg, .lp .tp, .lp p { filter: var(--lp-t); }
.lp .lbl { filter: var(--lp-s); }
.lp h1, .lp h2, .lp h1.sg, .lp h2.sg, .lp .stamp, .lp .bar { filter: var(--lp-d); }
.lp .stamp .sg, .lp .bar .sg { filter: none; }
/* \u9019\u88E1\u53EA\u7D66\u6C92\u6A19\u5B57\u865F\u7684\u5167\u5BB9\u4E00\u500B\u5408\u7406\u7684\u9810\u8A2D\u3002\u8981\u6307\u5B9A\u54EA\u4E00\u652F\uFF0C\u7528\u5B57\u865F class \u6216 .lp-f-*\uFF0C\u898B css/sizes\u3002 */

/**
 * \u4E00\u5F35\u7D19\uFF0C\u4E0D\u7528\u52A0\u4EFB\u4F55\u5143\u7D20\u3002\u7E96\u7DAD\u3001\u66DD\u5149\u4E0D\u5747\u3001\u566A\u9EDE\u90FD\u6536\u9032 ::before \u8207 ::after\u3002
 *
 * \u70BA\u4EC0\u9EBC\u662F\u5169\u500B\u800C\u4E0D\u662F\u4E00\u500B\uFF1A\u566A\u9EDE\u5F97\u58D3\u5728\u5B57\u4E0A\u9762\uFF08multiply\uFF09\uFF0C\u5176\u9918\u5E7E\u5C64\u5728\u5B57\u4E0B\u9762\u3002
 * \u80CC\u666F\u6C38\u9060\u5728\u5167\u5BB9\u4E4B\u5F8C\uFF0C\u6240\u4EE5\u55AE\u9760 background \u505A\u4E0D\u5230 \u2014\u2014 \u525B\u597D\u5169\u500B pseudo \u5C0D\u61C9\u5169\u908A\u3002
 *
 * \u4EE3\u50F9\u662F\u76F4\u63A5\u5B50\u5143\u7D20\u6703\u88AB\u8A2D\u6210 position:relative\uFF08z-index \u624D\u54AC\u5F97\u4F4F\uFF09\uFF0C\u5167\u5BB9\u624D\u593E\u5F97\u9032\u4E2D\u9593\u3002
 * \u9700\u8981\u5404\u5C64\u7368\u7ACB\u64FA\u4F4D\u7684\uFF08\u4F8B\u5982\u8CEA\u611F\u8981\u5EF6\u4F38\u5230\u5BB9\u5668\u4E4B\u5916\uFF09\uFF0C\u9084\u662F\u7528\u4E0B\u9762\u90A3\u7D44\u660E\u78BA\u758A\u5C64\u3002
 *
 * \u88DD\u8A02\u9670\u5F71\u8207\u9AD2\u6C61\u4E0D\u5728\u9019\u88E1 \u2014\u2014 \u90A3\u5169\u500B\u662F\u6558\u4E8B\u9053\u5177\u4E0D\u662F\u7D19\u7684\u7269\u7406\u6027\u8CEA\uFF0C\u8981\u7684\u4EBA\u81EA\u5DF1\u52A0 <i>\u3002
 */
.lp-paper { position: relative; isolation: isolate; }
.lp-paper > * { position: relative; z-index: 1; }
.lp-paper::before, .lp-paper::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
.lp-paper::before {
  z-index: 0;
  opacity: var(--texture);
  background-image:
    radial-gradient(115% 62% at 50% 26%, rgba(255, 255, 255, .2), transparent 62%),
    radial-gradient(100% 70% at 50% 104%, rgba(22, 19, 15, .04), transparent 72%),
    repeating-linear-gradient(0deg, rgba(22, 19, 15, .03) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, rgba(22, 19, 15, .02) 0 1px, transparent 1px 4px);
}
/* .34 \u7684\u5C64\u500D\u7387\u9810\u4E58\u9032 SVG \u81EA\u5DF1\u7684 opacity \u2014\u2014 \u4E00\u500B pseudo \u53EA\u6709\u4E00\u500B opacity \u53EF\u7528\u3002 */
.lp-paper::after {
  z-index: 2;
  mix-blend-mode: multiply;
  opacity: var(--texture);
  background-image: ${grainUri(170, "0.82", 4, "0.211")};
}

.lp-fibre, .lp-expose, .lp-grain, .lp-dirt, .lp-spine { position: absolute; inset: 0; pointer-events: none; }
.lp-fibre {
  z-index: 0;
  opacity: var(--texture);
  background-image:
    repeating-linear-gradient(0deg, rgba(22, 19, 15, .03) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, rgba(22, 19, 15, .02) 0 1px, transparent 1px 4px);
}
.lp-expose {
  z-index: 0;
  opacity: var(--texture);
  background:
    radial-gradient(115% 62% at 50% 26%, rgba(255, 255, 255, .2), transparent 62%),
    radial-gradient(100% 70% at 50% 104%, rgba(22, 19, 15, .04), transparent 72%);
}
.lp-spine {
  z-index: 0;
  right: auto;
  width: 118px;
  opacity: calc(.24 * var(--texture));
  background: linear-gradient(90deg, rgba(22, 19, 15, .85), rgba(22, 19, 15, .16) 46%, transparent);
}
.lp-grain {
  z-index: 2;
  mix-blend-mode: multiply;
  opacity: calc(.34 * var(--texture));
  background-image: ${grainUri(170, "0.82", 4, "0.62")};
}
.lp-dirt { z-index: 2; opacity: var(--texture); }
.lp-dirt i {
  position: absolute;
  display: block;
  border-radius: 50%;
  background: rgba(22, 19, 15, .46);
}
.lp-dirt i.hair { border-radius: 0; height: 1px; background: rgba(22, 19, 15, .28); }
`;

// src/css/typeset.ts
var faces = `
.lp .sg { font-family: var(--type); text-shadow: 0 0 .6px color-mix(in srgb, var(--ink) 60%, transparent); }
.lp .tp { font-family: var(--latin); text-shadow: .35px .3px 0 color-mix(in srgb, var(--ink) 20%, transparent), 1.3px 1.2px 0 color-mix(in srgb, var(--ink) 10%, transparent); }
.lp .lbl {
  font-family: var(--latin);
  font-size: 10px;
  letter-spacing: .2em;
  color: var(--ink3);
  text-transform: uppercase;
}
.lp h1, .lp h2 { margin: 0; font-weight: 600; }

.lp .bar {
  display: inline-block;
  inline-size: var(--bar-w, 42px);
  block-size: .95em;
  background: var(--ink);
  border-radius: 1px;
  vertical-align: -.12em;
}
`;
var jitterGeometry = `
.lp-ch { opacity: 1; }
.lp-ch.cj { display: inline-block; }
.lp-ch:not(.cj) { position: relative; }
.lp-ch:not(.cj):nth-child(19n+8) { top: calc(0.0375em * var(--lean)); }
.lp-ch:not(.cj):nth-child(29n+3) { top: calc(-0.0375em * var(--lean)); }
.lp-ch:not(.cj):nth-child(43n+17) { display: inline-block; transform: rotate(calc(2.4deg * var(--lean))); }
.lp-ch:not(.cj):nth-child(59n+31) { display: inline-block; transform: rotate(calc(-2.8deg * var(--lean))); top: calc(0.025em * var(--lean)); }
.lp-ch.cj:nth-child(3n+1) { transform: rotate(calc(.45deg * var(--lean))) translateX(calc(0.0187em * var(--lean))); }
.lp-ch.cj:nth-child(5n+2) { transform: rotate(calc(-.55deg * var(--lean))) translateX(calc(-0.0219em * var(--lean))); }
.lp-ch.cj:nth-child(7n+4) { transform: translateY(calc(0.0312em * var(--lean))) rotate(calc(.25deg * var(--lean))); }
.lp-ch.cj:nth-child(17n+3) { transform: rotate(calc(-.3deg * var(--lean))) translateY(calc(-0.025em * var(--lean))); }
.lp-ch.cj:nth-child(19n+7) { transform: rotate(calc(2.6deg * var(--lean))) translateY(calc(0.0437em * var(--lean))); }
.lp-ch.cj:nth-child(23n+11) { transform: rotate(calc(.2deg * var(--lean))); }
.lp-ch.cj:nth-child(29n+17) { transform: rotate(calc(-3.2deg * var(--lean))) translateX(calc(0.0375em * var(--lean))); }
.lp-ch.cj:nth-child(31n+5) { transform: rotate(calc(1.9deg * var(--lean))) translateX(calc(-0.0563em * var(--lean))) translateY(calc(0.0375em * var(--lean))); }
.lp-ch.cj:nth-child(41n+23) { transform: rotate(calc(-2.3deg * var(--lean))) translateY(calc(-0.0437em * var(--lean))); }
`;
var jitterWeight = `
.lp-ch:not(.cj):nth-child(4n+1) { color: color-mix(in srgb, var(--ink) calc(100% - 13% * var(--weight)), transparent); }
.lp-ch:not(.cj):nth-child(7n+4) { color: color-mix(in srgb, var(--ink) calc(100% - 32% * var(--weight)), transparent); }
.lp-ch:not(.cj):nth-child(11n+6) { color: color-mix(in srgb, var(--ink) calc(100% - 48% * var(--weight)), transparent); }
.lp-ch:not(.cj):nth-child(29n+3) { color: color-mix(in srgb, var(--ink) calc(100% - 19% * var(--weight)), transparent); }
.lp-ch:not(.cj):nth-child(5n+2) { text-shadow: calc(.64px * var(--weight)) 0 0 color-mix(in srgb, var(--ink) 82%, transparent); }
.lp-ch:not(.cj):nth-child(8n+5) { text-shadow: calc(.56px * var(--weight)) calc(.48px * var(--weight)) 0 color-mix(in srgb, var(--ink) 72%, transparent); }
.lp-ch:not(.cj):nth-child(13n+3) { text-shadow: calc(-.56px * var(--weight)) 0 0 color-mix(in srgb, var(--ink) 68%, transparent), calc(.56px * var(--weight)) 0 0 color-mix(in srgb, var(--ink) 68%, transparent); }
.lp-ch.cj:nth-child(11n+6) { color: color-mix(in srgb, var(--ink) calc(100% - 16% * var(--weight)), transparent); }
.lp-ch.cj:nth-child(17n+3) { color: color-mix(in srgb, var(--ink) calc(100% - 8% * var(--weight)), transparent); }
.lp-ch.cj:nth-child(13n+8) { text-shadow: calc(.45px * var(--weight)) 0 0 var(--ink), calc(-.45px * var(--weight)) 0 0 var(--ink), 0 calc(.45px * var(--weight)) .3px var(--ink); }
.lp-ch.cj:nth-child(23n+11) { text-shadow: calc(.35px * var(--weight)) calc(.35px * var(--weight)) 0 var(--ink); }
`;
var jitterOff = `
.lp-flat .lp-ch { transform: none !important; top: 0 !important; }
.lp-even .lp-ch, .lp-even .lp-ch.cj { color: inherit !important; text-shadow: inherit !important; }
`;
var grid = `
.lp-v { writing-mode: vertical-rl; }
/* \u53F3\u8D77\u6A6B\u6392\u3002\u6F22\u5B57\u7684 bidi \u985E\u5225\u662F\u5F37 L\uFF0C\u5149\u9760 direction \u4E0D\u6703\u53CD\u904E\u4F86\uFF0C\u8981 override \u624D\u884C\u3002
   DOM \u9806\u5E8F\u4E0D\u8B8A\uFF0C\u6240\u4EE5\u9078\u53D6\u8207\u8907\u88FD\u51FA\u4F86\u7684\u5B57\u5E8F\u4ECD\u7136\u662F\u5C0D\u7684\u3002 */
.lp-rtl { direction: rtl; unicode-bidi: bidi-override; }
/* \u76F4\u6392\u683C\u5B50\uFF1A\u628A\u300C\u6A19\u7C64\uFF0B\u5167\u5BB9\u300D\u7576\u4E00\u7D44\uFF0C\u6CBF\u6C34\u5E73\uFF08\u5340\u584A\u8EF8\uFF09\u7F6E\u4E2D\uFF0C\u624D\u6703\u5750\u5728\u683C\u7DDA\u6B63\u4E2D\u9593\u3002 */
.lp-cell { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
.lp-typed, .lp-typed p { line-height: var(--pitch); }
.lp-typed p { margin: 0; }
/* \u7A3F\u7D19\u683C\u7DDA\u3002\u7DDA\u756B\u5728\u5B57\u884C\u4E4B\u9593\uFF0C\u65B9\u5411\u8207\u66F8\u5BEB\u65B9\u5411\u76F8\u53CD\uFF1A\u76F4\u66F8 .lp-ruled\uFF0C\u6A6B\u66F8 .lp-ruled-h\u3002 */
.lp-ruled { background-image: repeating-linear-gradient(270deg, transparent 0 calc(var(--pitch) - 1px), var(--ruled) calc(var(--pitch) - 1px) var(--pitch)); }
.lp-ruled-h { background-image: repeating-linear-gradient(180deg, transparent 0 calc(var(--pitch) - 1px), var(--ruled) calc(var(--pitch) - 1px) var(--pitch)); }
`;
var typesetCss = (o) => {
  const fontFace = o.punctFont ? `
@font-face {
  font-family: '${o.punctFont.family}';
  src: url('${o.punctFont.src}') format('woff2');
  font-weight: ${o.punctFont.weight};
  font-display: block;
  unicode-range: ${o.punctFont.unicodeRange};
}
` : "";
  return [fontFace, faces, jitterGeometry, jitterWeight, jitterOff, grid].join("\n");
};

// src/css/sizes.ts
var tierFor = (pt) => pt <= 8 ? "s" : pt <= 17 ? "t" : pt <= 30 ? "d" : "x";
var size = (id, name, pt) => ({ id, name, pt, tier: tierFor(pt) });
var HAO_SIZES = [
  size("sz-0", "\u521D\u865F", 42),
  size("sz-1", "\u4E00\u865F", 27.5),
  size("sz-2", "\u4E8C\u865F", 21),
  size("sz-3", "\u4E09\u865F", 15.75),
  size("sz-4", "\u56DB\u865F", 13.75),
  size("sz-5", "\u4E94\u865F", 10.5),
  size("sz-6", "\u516D\u865F", 7.875)
];
var LATIN_SIZES = [
  size("canon", "Canon", 48),
  size("doublepica", "Double Pica", 24),
  size("doublesmallpica", "Double Small Pica", 22),
  size("paragon", "Paragon", 20),
  size("greatprimer", "Great Primer", 18),
  size("columbian", "Columbian", 16),
  size("twolinebrevier", "Two-line Brevier", 16),
  size("english", "English", 14),
  size("threelinediamond", "Three-line Diamond", 13.5),
  size("pica", "Pica", 12),
  size("smallpica", "Small Pica", 11),
  size("longprimer", "Long Primer", 10),
  size("bourgeois", "Bourgeois", 9),
  size("brevier", "Brevier", 8),
  size("minion", "Minion", 7),
  size("nonpareil", "Nonpareil", 6),
  size("agate", "Agate", 5.5),
  size("pearl", "Pearl", 5),
  size("diamond", "Diamond", 4.5)
];
var ALL_SIZES = [...HAO_SIZES, ...LATIN_SIZES];
var sizesCss = (_o) => {
  const sizeRules = ALL_SIZES.map(
    (s) => `.lp .lp-${s.id} { font-size: calc(${s.pt}pt * var(--lp-scale, 1)); filter: var(--lp-${s.tier}); }`
  ).join("\n");
  const tierRules = ["s", "t", "d", "x"].map((t) => `.lp .lp-f-${t} { filter: var(--lp-${t}); }`).join("\n");
  return `${sizeRules}
${tierRules}
`;
};

// src/styles.ts
var letterpressCss = (options = {}) => {
  const o = resolveOptions(options);
  return [tokensCss(o), textureCss(o), typesetCss(o), sizesCss(o)].join("\n");
};

// src/press.ts
var NEUTRAL_PRESS = { ink: 1, pressure: 1, roughness: 1, absorbency: 1, wear: 1, unevenness: 1 };
var resolvePress = (p) => {
  const { paper, ...rest } = p;
  const legacy = paper === void 0 ? {} : { roughness: paper, absorbency: paper };
  return { ...NEUTRAL_PRESS, ...legacy, ...rest };
};
var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
var ramp = (v, at0, at1, at2) => v <= 1 ? at0 + (at1 - at0) * v : at1 + (at2 - at1) * (v - 1);
var starveOf = (p) => (1 - p.pressure) * 0.55 + (p.roughness - 1) * 0.35 + Math.max(0, p.wear - 1) * 0.3;
var inkedOf = (p) => clamp(
  1 - (1 - p.pressure) * 0.45 - Math.max(0, p.wear - 1) * 0.2 - Math.max(0, 1 - p.ink) * 0.4,
  0.3,
  1
);
var inkEqOf = (p) => clamp(1 - Math.max(0, 1 - p.ink) + Math.max(0, p.ink - 1) + Math.max(0, p.pressure - 1) * 0.2, 0, 2);
var rimOf = (p) => clamp(Math.max(0, p.pressure - 1) * 0.12, 0, 0.12);
var debossOf = (p) => clamp(Math.max(0, p.pressure - 1) * ramp(p.roughness, 0.4, 1, 1.3), 0, 1);
var inkFloorOf = (p, base) => {
  if (base >= 1) return 1;
  const depth = (1 - base) * ramp(p.unevenness, 0, 1, 1.5) * ramp(p.ink, 1.3, 1, 0.6);
  return clamp(1 - depth, 0.15, 1);
};
var common = (p, d, fill) => ({
  // 圓角是印刷這個動作本身造成的，跟墨量無關，所以核心不動。但積墨的程度會 ——
  // 墨愈多，交會處填得愈滿，門檻就愈低。
  round: d.round,
  // 墨愈多，交會處填得愈滿，門檻就愈低。字愈舊則相反 —— 字面被磨鈍，門檻往上
  // 等於多削掉一點，那就是磨圓。核心大小換不了（3×3 已經是最小的一格），
  // 所以「更圓」只能靠門檻連續地推，不能靠換核心跳一階。
  roundThreshold: d.round ? clamp(
    ramp(inkEqOf(p), d.roundThreshold + 0.1, d.roundThreshold, d.roundThreshold - 0.12) + Math.max(0, p.wear - 1) * 0.06,
    0.2,
    0.6
  ) : d.roundThreshold,
  // 紙愈粗，纖維把筆畫推得愈歪；壓力愈大，紙被壓平，推歪反而變少。
  displace: clamp(d.displace * ramp(p.roughness, 0.4, 1, 1.6) * ramp(p.pressure, 1.5, 1, 0.8), 0, 4),
  // 整條筆畫的彎曲來自紙面起伏，粗紙起伏大；壓力大會把紙壓平，彎得少。
  // 比 displace 對紙的反應緩 —— 纖維推歪是紙的表面，起伏是紙的厚度，後者變化小。
  warp: clamp(d.warp * ramp(p.roughness, 0.6, 1, 1.4) * ramp(p.pressure, 1.3, 1, 0.85), 0, 6),
  rim: rimOf(p),
  deboss: debossOf(p),
  voidThreshold: clamp(d.voidThreshold - starveOf(p) * 0.28, 0.35, 1),
  // 吸墨的紙會讓邊緣滲開；墨上太多的話，再光滑的紙也擋不住。
  // 中性沿用各級預設（那就是對著見本調出來的值），很吸墨或墨多才一律升到 5，塗佈紙不暈。
  bleed: p.absorbency >= 1.3 || inkEqOf(p) >= 1.3 ? 5 : p.absorbency >= 0.5 ? d.bleed : false,
  // 拉硬同時管兩件事：墨少時把淡的部分吃掉（筆畫變細），墨多時把卷積暈出來的
  // 那一圈全部變實心（筆畫變胖）。threshold 到 0 為止 —— 再正下去連全透明的
  // 地方都會被拉起來，整個方框會發灰。
  contrast: clamp(ramp(inkEqOf(p), d.contrast * 0.625, d.contrast, d.contrast * fill), 1, 12),
  threshold: clamp(ramp(inkEqOf(p), d.threshold * 2.5, d.threshold, 0), -0.5, 0),
  fade: inkedOf(p)
});
var chip = (p, d, fill) => ({
  ...common(p, d, fill),
  // 脹開維持各級的預設，成因不去動它。feMorphology 的半徑會被取整到整數裝置像素，
  // 拿滑桿掃過去會在 0.24→0.27 之間突然粗一圈，而且門檻隨螢幕的 DPR 跑。
  // 固定值不會跳，所以留著沒關係；「墨往外擠」改由墨暈加拉硬去做。
  dilate: d.dilate,
  // 暈圈的不規則是印壓的事：壓得愈重，被擠出去的墨愈多，邊緣愈不受字面控制。
  // 墨量不進來 —— 墨多而壓力正常，多出來的墨是均勻地胖，不是擠出去的。
  squash: clamp(d.squash * ramp(p.pressure, 0.3, 1, 1.8), 0, 4),
  // 崩角只跟字的年紀有關。新字的缺陷是表面細斑點，舊字是真的崩掉一角 ——
  // 所以年紀一大不只變多，尺度也要變大（頻率降低＝單個缺口變大）。
  chipAmount: clamp(ramp(p.wear, 0, d.chipAmount, d.chipAmount * 2.24), 0, 0.5),
  // 舊字的缺口比新字大，但別放大到內文級數也長出標題那種尺度的blob ——
  // 遠端錨點從 0.4 收到 0.7。缺口變大主要交給邊緣帶去限位，不靠把噪點調粗。
  chipFrequency: clamp(ramp(p.wear, d.chipFrequency * 1.62, d.chipFrequency, d.chipFrequency * 0.7), 0.15, 3),
  chipEdge: d.chipEdge,
  inkFloor: inkFloorOf(p, d.inkFloor)
});
var ink = (p, d, fill) => ({
  ...common(p, d, fill),
  inkFloor: inkFloorOf(p, d.inkFloor),
  // 字面磨損在大字上是砂眼變多，同樣限在邊緣帶內。
  pinAmount: clamp(ramp(p.wear, 0, d.pinAmount, d.pinAmount * 2.4), 0, 0.4),
  chipEdge: d.chipEdge
});
var pressTuning = (p = {}) => {
  const press = resolvePress(p);
  return {
    small: chip(press, FILTER_DEFAULTS.small, 3.6),
    text: chip(press, FILTER_DEFAULTS.text, 3),
    heading: chip(press, FILTER_DEFAULTS.heading, 2.5),
    large: ink(press, FILTER_DEFAULTS.large, 2)
  };
};
var pressTexture = (p = {}) => clamp(ramp(resolvePress(p).roughness, 0.35, 1, 1), 0, 1);

// src/redact.ts
var CJ = /[\u2E80-\u9FFF\u3000-\u30FF\uF900-\uFAFF\uFF00-\uFFEF]/;
var splitRedacted = (text) => {
  const out = [];
  for (const chunk of text.split(/(█+)/)) {
    if (chunk.startsWith("\u2588")) {
      out.push({ kind: "bar", units: chunk.length });
      continue;
    }
    for (const char of chunk) {
      if (char === " ") out.push({ kind: "space" });
      else out.push({ kind: "char", char, cj: CJ.test(char) });
    }
  }
  return out;
};
var escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var redactedHtml = (text, barUnit = 14) => splitRedacted(text).map((token) => {
  if (token.kind === "space") return " ";
  if (token.kind === "bar") return `<span class="lp-ch bar" style="--bar-w:${token.units * barUnit}px"></span>`;
  return `<span class="lp-ch${token.cj ? " cj" : ""}">${escapeHtml(token.char)}</span>`;
}).join("");

// src/mount.ts
var SVG_NS = "http://www.w3.org/2000/svg";
var mount = (options = {}, root = document) => {
  const o = resolveOptions(options);
  const host = root instanceof Document ? root.head : root;
  const style = document.createElement("style");
  style.dataset.letterpress = o.idPrefix;
  style.textContent = letterpressCss(options);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("style", "position:absolute");
  svg.innerHTML = filtersMarkup(o.idPrefix, o.filters, o.variants);
  host.append(style, svg);
  return () => {
    style.remove();
    svg.remove();
  };
};
var redact = (el, barUnit = 14) => {
  if (el.classList.contains("lp-ch")) return;
  for (const node of [...el.childNodes]) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      redact(node, barUnit);
      continue;
    }
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const text = node.textContent ?? "";
    if (!text.trim()) continue;
    const holder = document.createElement("template");
    holder.innerHTML = redactedHtml(text, barUnit);
    node.replaceWith(holder.content);
  }
};
export {
  ALL_SIZES,
  FILTER_DEFAULTS,
  FILTER_VARIANTS,
  HAO_SIZES,
  LATIN_SIZES,
  NEUTRAL_PRESS,
  VARIANT_NAMES,
  filtersMarkup,
  grainUri,
  letterpressCss,
  mount,
  pressTexture,
  pressTuning,
  redact,
  redactedHtml,
  resolveOptions,
  splitRedacted
};
