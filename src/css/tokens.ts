import type { ResolvedOptions } from '../options'

/** .lp 這層把所有可調值落成 CSS 變數，底下的規則一律只讀變數。 */
export const tokensCss = (o: ResolvedOptions) => {
  // 標點字型必須排在最前面，unicode-range 才搶得贏後面的正文字型。
  const type = o.punctFont ? `'${o.punctFont.family}', ${o.typeFamily}` : o.typeFamily
  return `
.lp {
  --paper: ${o.paper};
  --ink: ${o.ink};
  --ink3: ${o.inkMuted};
  --rule: ${o.rule};
  --red: ${o.red};
  --amber: ${o.amber};
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
`
}
