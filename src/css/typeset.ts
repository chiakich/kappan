import type { ResolvedOptions } from '../options'

/** 兩種字面：活字與西文。每種對應一支濾鏡與一組微陰影。 */
const faces = `
.lp .sg { font-family: var(--type); text-shadow: 0 0 .6px rgba(0, 0, 0, .6); }
.lp .tp { font-family: var(--latin); text-shadow: .35px .3px 0 rgba(0, 0, 0, .2), 1.3px 1.2px 0 rgba(0, 0, 0, .1); }
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
`

/**
 * 逐字歪斜（幾何）。鉛字是一顆一顆排上去的，歪斜要按「第幾顆」變，不能整段套同一個值。
 * 用互質的 nth-child 週期疊在一起，肉眼看不出循環。
 *
 * 每個位移量都乘上 --lean，所以歪斜程度可以無段調整：0 是完全排正，1 是預設，
 * 調到 2 就是排字工今天狀況很差。`.lp-flat` 是 --lean: 0 的捷徑。
 * 需要 splitRedacted / <Redacted> 產生的 .lp-ch / .lp-ch.cj 標記。
 */
const jitterGeometry = `
.lp-ch { opacity: 1; }
.lp-ch.cj { display: inline-block; }
.lp-ch:not(.cj) { position: relative; }
.lp-ch:not(.cj):nth-child(19n+8) { top: calc(.6px * var(--lean)); }
.lp-ch:not(.cj):nth-child(29n+3) { top: calc(-.6px * var(--lean)); }
.lp-ch:not(.cj):nth-child(43n+17) { display: inline-block; transform: rotate(calc(2.4deg * var(--lean))); }
.lp-ch:not(.cj):nth-child(59n+31) { display: inline-block; transform: rotate(calc(-2.8deg * var(--lean))); top: calc(.4px * var(--lean)); }
.lp-ch.cj:nth-child(3n+1) { transform: rotate(calc(.45deg * var(--lean))) translateX(calc(.3px * var(--lean))); }
.lp-ch.cj:nth-child(5n+2) { transform: rotate(calc(-.55deg * var(--lean))) translateX(calc(-.35px * var(--lean))); }
.lp-ch.cj:nth-child(7n+4) { transform: translateY(calc(.5px * var(--lean))) rotate(calc(.25deg * var(--lean))); }
.lp-ch.cj:nth-child(17n+3) { transform: rotate(calc(-.3deg * var(--lean))) translateY(calc(-.4px * var(--lean))); }
.lp-ch.cj:nth-child(19n+7) { transform: rotate(calc(2.6deg * var(--lean))) translateY(calc(.7px * var(--lean))); }
.lp-ch.cj:nth-child(23n+11) { transform: rotate(calc(.2deg * var(--lean))); }
.lp-ch.cj:nth-child(29n+17) { transform: rotate(calc(-3.2deg * var(--lean))) translateX(calc(.6px * var(--lean))); }
.lp-ch.cj:nth-child(31n+5) { transform: rotate(calc(1.9deg * var(--lean))) translateX(calc(-.9px * var(--lean))) translateY(calc(.6px * var(--lean))); }
.lp-ch.cj:nth-child(41n+23) { transform: rotate(calc(-2.3deg * var(--lean))) translateY(calc(-.7px * var(--lean))); }
.lp-ch.pending { opacity: 0; }
`

/**
 * 逐字濃淡（墨量）。有的字沾墨多就厚一點黑一點，有的沾得少就淡。
 * 跟歪斜分開，因為兩者是不同的成因，也常常只想要其中一種。
 *
 * 深淺與加粗都乘上 --weight，0 就是墨色完全均勻。
 * 拉丁字另外走一組，週期更密、幅度是漢字的 1.6 倍：
 *   - 一個字母佔的寬度遠小於漢字，同樣的週期看起來會太稀
 *   - 漢字的墨面積大，一點濃淡差就讀得到；同樣的差落在細細的字母上幾乎看不見
 * 倍率直接寫進係數而不是另開一個變數 —— 自訂屬性的 calc() 在宣告處就算完了，
 * 子層覆蓋 --weight 不會讓衍生變數重算，那樣滑桿會變成只動中文。
 */
const jitterWeight = `
.lp-ch:not(.cj):nth-child(4n+1) { color: rgba(0, 0, 0, calc(1 - .13 * var(--weight))); }
.lp-ch:not(.cj):nth-child(7n+4) { color: rgba(0, 0, 0, calc(1 - .32 * var(--weight))); }
.lp-ch:not(.cj):nth-child(11n+6) { color: rgba(0, 0, 0, calc(1 - .48 * var(--weight))); }
.lp-ch:not(.cj):nth-child(29n+3) { color: rgba(0, 0, 0, calc(1 - .19 * var(--weight))); }
.lp-ch:not(.cj):nth-child(5n+2) { text-shadow: calc(.64px * var(--weight)) 0 0 rgba(0, 0, 0, .82); }
.lp-ch:not(.cj):nth-child(8n+5) { text-shadow: calc(.56px * var(--weight)) calc(.48px * var(--weight)) 0 rgba(0, 0, 0, .72); }
.lp-ch:not(.cj):nth-child(13n+3) { text-shadow: calc(-.56px * var(--weight)) 0 0 rgba(0, 0, 0, .68), calc(.56px * var(--weight)) 0 0 rgba(0, 0, 0, .68); }
.lp-ch.cj:nth-child(11n+6) { color: rgba(0, 0, 0, calc(1 - .16 * var(--weight))); }
.lp-ch.cj:nth-child(17n+3) { color: rgba(0, 0, 0, calc(1 - .08 * var(--weight))); }
.lp-ch.cj:nth-child(13n+8) { text-shadow: calc(.45px * var(--weight)) 0 0 #000, calc(-.45px * var(--weight)) 0 0 #000, 0 calc(.45px * var(--weight)) .3px #000; }
.lp-ch.cj:nth-child(23n+11) { text-shadow: calc(.35px * var(--weight)) calc(.35px * var(--weight)) 0 #000; }
`

/** 兩組各自的關閉開關。放在最後才蓋得過上面的 nth-child。 */
const jitterOff = `
.lp-flat .lp-ch { transform: none !important; top: 0 !important; }
.lp-even .lp-ch, .lp-even .lp-ch.cj { color: inherit !important; text-shadow: inherit !important; }
`

const grid = `
.lp-v { writing-mode: vertical-rl; }
/* 右起橫排。漢字的 bidi 類別是強 L，光靠 direction 不會反過來，要 override 才行。
   DOM 順序不變，所以選取與複製出來的字序仍然是對的。 */
.lp-rtl { direction: rtl; unicode-bidi: bidi-override; }
/* 直排格子：把「標籤＋內容」當一組，沿水平（區塊軸）置中，才會坐在格線正中間。 */
.lp-cell { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
.lp-typed, .lp-typed p { line-height: var(--pitch); }
.lp-typed p { margin: 0; }
/* 稿紙格線。線畫在字行之間，方向與書寫方向相反：直書 .lp-ruled，橫書 .lp-ruled-h。 */
.lp-ruled { background-image: repeating-linear-gradient(270deg, transparent 0 calc(var(--pitch) - 1px), var(--ruled) calc(var(--pitch) - 1px) var(--pitch)); }
.lp-ruled-h { background-image: repeating-linear-gradient(180deg, transparent 0 calc(var(--pitch) - 1px), var(--ruled) calc(var(--pitch) - 1px) var(--pitch)); }
`

/** 蓋章：從高處落下、壓扁、回彈，最後停在略透明的位置。--press-rot 決定歪幾度。 */
const press = `
@keyframes lp-press {
  0% { opacity: 0; transform: scale(1.55) rotate(var(--press-rot, -6deg)); }
  55% { opacity: .95; transform: scale(.94) rotate(var(--press-rot, -6deg)); }
  75% { transform: scale(1.03) rotate(var(--press-rot, -6deg)); }
  100% { opacity: .84; transform: scale(1) rotate(var(--press-rot, -6deg)); }
}
.lp-press { opacity: 0; }
.lp-press.pressed { animation: lp-press .42s cubic-bezier(.2, .9, .3, 1) forwards; }

@media (prefers-reduced-motion: reduce) {
  .lp-press { opacity: .84; animation: none; }
  .lp-ch.pending { opacity: 1; }
}
`

export const typesetCss = (o: ResolvedOptions) => {
  const fontFace = o.punctFont
    ? `
@font-face {
  font-family: '${o.punctFont.family}';
  src: url('${o.punctFont.src}') format('woff2');
  font-weight: ${o.punctFont.weight};
  font-display: block;
  unicode-range: ${o.punctFont.unicodeRange};
}
`
    : ''
  return [fontFace, faces, jitterGeometry, jitterWeight, jitterOff, grid, press].join('\n')
}
