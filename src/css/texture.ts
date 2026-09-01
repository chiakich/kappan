import type { ResolvedOptions } from '../options'

/** feTurbulence 直接畫成一張灰噪點貼圖，比在 CSS 疊漸層省事也自然得多。 */
export const grainUri = (size: number, freq: string, octaves: number, opacity: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='${size}' height='${size}' filter='url(%23n)' opacity='${opacity}'/%3E%3C/svg%3E")`

/**
 * 紙的物理層：纖維、曝光不均、噪點、髒污、裝訂陰影，加上三支墨壓濾鏡的套用規則。
 *
 * 這幾個 .lp-* 疊層都是 position:absolute inset:0，父層要自己是 position:relative。
 * 濃度統一乘上 --texture（0~1），0 就是白紙一張。再往上加沒用，opacity 封頂在 1。
 */
export const textureCss = (_o: ResolvedOptions) => `
.lp .sg, .lp .tp, .lp p { filter: var(--lp-t); }
.lp .lbl { filter: var(--lp-s); }
.lp h1, .lp h2, .lp h1.sg, .lp h2.sg, .lp .stamp, .lp .bar { filter: var(--lp-d); }
.lp .stamp .sg, .lp .bar .sg { filter: none; }
/* 這裡只給沒標字號的內容一個合理的預設。要指定哪一支，用字號 class 或 .lp-f-*，見 css/sizes。 */

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
    radial-gradient(100% 70% at 50% 104%, rgba(22, 19, 15, .12), transparent 72%);
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
  background-image: ${grainUri(170, '0.82', 4, '0.62')};
}
.lp-dirt { z-index: 2; opacity: var(--texture); }
.lp-dirt i {
  position: absolute;
  display: block;
  border-radius: 50%;
  background: rgba(22, 19, 15, .46);
}
.lp-dirt i.hair { border-radius: 0; height: 1px; background: rgba(22, 19, 15, .28); }
`
