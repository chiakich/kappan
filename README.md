# kappan 活版

在網頁上重現鉛字印刷的樣子：紙的纖維、墨的濃淡、字被壓歪、鉛字崩角。順便處理中文直排與活版時代的右起橫排。

這個套件不執行任何東西。質感全部是 CSS 加一段 SVG 濾鏡定義，逐字歪斜需要的標記可以在建置期或伺服器端產好，瀏覽器端零 JS。

## 最快的方式

抓 [`dist/`](dist/) 裡的兩個檔案貼上，不用建置也不綁框架：

```html
<link rel="stylesheet" href="kappan.css">
<!-- kappan-filters.svg 的內容貼進 <body>，整頁一份 -->

<div class="lp lp-paper">
  <p class="lp-sz-3">常世通信 第一號</p>
</div>
```

`.lp` 給顏色與字體，`.lp-paper` 給紙，字號 class 給字級。客製改 `.lp` 上的 CSS 變數就好，細節在 [dist/README.md](dist/README.md)。

想要逐字歪斜再多拿一個 `redact.js`。那件事非得由標記來做不可 —— CSS 碰不到單一字元，`::nth-letter()` 提了十幾年沒有任何瀏覽器實作。

## 接進專案

`kappan` 是一組純函式與 DOM API，零依賴；`kappan/react` 只是把結果掛成節點，要接 Vue 或 Svelte 照著抄一份就好。

```tsx
import { LetterpressStyles, LetterpressFilters, Redacted } from 'kappan/react'

const options = {
  typeFamily: "'I.Ming', 'Noto Serif TC', serif",
  punctFont: { family: 'lp-punct', src: '/fonts/lp-punct.woff2', weight: 600 },
}

<div className="lp lp-paper">
  <LetterpressStyles {...options} />
  <LetterpressFilters {...options} />
  <p className="sg lp-v lp-typed lp-sz-3">
    <Redacted text="千秋稻荷社 ███ 電子神道" />
  </p>
</div>
```

兩個元件要傳同一份 options，濾鏡的 id 與參數才對得上。不用框架的話 `mount(options)` 做一樣的事並回傳解除函式，`letterpressCss(options)` 則是回傳那份 CSS 字串，方便塞進既有的 style pipeline。

重新產 `dist/`：`npm install && npm run build`。

## 字號

class 同時決定字級與該用哪支濾鏡。這兩件事本來就綁在一起：噪點的週期是絕對長度，不會跟著字級放大，所以幾號字配哪支濾鏡是固定的。

漢字走號數制 `.lp-sz-0`（初號）到 `.lp-sz-6`（六號），西文走點制標準化之前的專名 `.lp-pica`、`.lp-brevier`、`.lp-canon` 之類。字級寫成 pt，樣式表裡的數字就是那顆鉛字的身號。完整對照表在 dist 的說明裡，程式裡可以從 `HAO_SIZES` / `LATIN_SIZES` 讀。

號數制其實是倍數制：二號正好是五號的兩倍、三號是六號的兩倍。美華書館的見本帖上，五號標 Small Pica、二號標 Double Small Pica，名字本身就在講這件事。

自己指定字級時用 `.lp-f-s` / `.lp-f-t` / `.lp-f-d` / `.lp-f-x` 挑濾鏡，`--lp-scale` 可以整體縮放而不破壞號數之間的比例。

## 調整

日常會動的只有三個 CSS 變數，都可以在任何子樹上覆蓋：`--texture` 紙紋濃度、`--lean` 逐字歪斜、`--weight` 逐字濃淡，各自設 0 就是關掉（也可以用 `.lp-flat` 與 `.lp-even` 兩個捷徑）。

濾鏡是 SVG 不是變數，所以改不動。附了兩套調好的，換 class 就能切：`.lp-clean` 是新字新墨，`.lp-inky` 是滾筒上墨太多、筆畫糊在一起。

要無段調整就用印刷的成因，不必碰濾鏡參數：

```js
letterpressCss({ filters: pressTuning({ ink: 1.6, paper: 2 }) })
```

`pressTuning({ ink, pressure, paper, wear })` 四個都設 1 就是預設值。一個成因會同時牽動好幾道濾鏡 —— 墨上多了本來就同時讓筆畫變胖、少缺、邊緣更實。真的要逐項調的話 `FilterTuning` 開放了每一支的參數，`FILTER_DEFAULTS` 可以讀出預設值當基準。

## 四支濾鏡

`-s` 內文小字、`-t` 一般行文、`-d` 標題（多一道吃墨脹開）、`-x` 大字。

前三支靠挖掉像素做缺角，在內文級數看起來是斑駁；但噪點的週期不跟著字級放大，放到 60px 以上就變成整塊筆畫被剪掉，字會散掉。所以 `-x` 改成調墨的密度 —— 低頻噪點乘進 alpha，筆畫結構完整保留，只是有的地方吃墨飽、有的地方虛，像印章蓋不勻。

每一支都是五道：紙面推歪、砂眼（或濃淡場）、缺塊、墨暈（或脹開）、把 alpha 拉硬。

## class 一覽

- `.lp` 根容器，必須。`.lp-paper` 加上去就有紙，不需要任何額外元素。
- 字面 `.sg` 活字、`.tp` 西文、`.lbl` 小標籤、`.bar` 黑條（寬度吃 `--bar-w`）。
- 排版 `.lp-v` 直排、`.lp-rtl` 右起橫排、`.lp-cell` 直排格內置中、`.lp-typed` 吃 `--pitch` 當行高、`.lp-ruled` 與 `.lp-ruled-h` 稿紙格線。格線畫在字行之間，方向與書寫方向相反。
- 逐字 `.lp-ch`，由 `<Redacted>` 或 `redactedHtml()` 產生。連續的 `█` 會變成一根黑條。
- 質感疊層 `.lp-fibre` `.lp-expose` `.lp-grain` `.lp-dirt` `.lp-spine` 只在需要各層獨立擺位時才用（例如質感要延伸到容器之外），它們是 `position:absolute; inset:0`，父層得自己 `position:relative`。裝訂陰影與髒污不在 `.lp-paper` 裡，那兩個是敘事道具不是紙的物理性質。

## 幾個坑

濾鏡靠 `filter: url(#lp-t)` 指過去，而**指向不存在的濾鏡會讓元素整個不渲染**，不是靜默忽略。頁面若有 `<base href>` 會解析失敗，Shadow DOM 內也拿不到外部的 SVG。同一頁掛兩份要給不同的 `idPrefix`，樣式與濾鏡兩邊都要傳 —— 刻意不用隨機值，SSR 兩邊才算得出同一組 id。

`filter` 疊 `mix-blend-mode: multiply` 在 Safari 上大面積文字會掉幀。文字量大時考慮只在標題套 `.lp-f-d`。

還有一件學到的事寫在 `filters.ts` 的註解裡：SVG 濾鏡中凡是空間性的運算，在次像素尺度不是引擎分歧就是量化。`feGaussianBlur` 的 σ 小於 1 時 WebKit 與 Skia 算出來的東西不一樣，`feMorphology` 的半徑會被取整到整數裝置像素、跳階位置還隨螢幕的 DPR 跑。逐像素的查表運算沒有這個問題，所以墨暈用的是固定係數的卷積核。

## 換字體

`typeFamily` 與 `latinFamily` 就是兩個字型堆字串，套件不綁任何一套字，也不幫你載字體檔。

參數名刻意不叫 `songFamily`，因為傳統活版不只有宋體 —— 黑體、楷書、仿宋都鑄過鉛字，給什麼就排什麼。

預設指向開源的一點明體 I.Ming，但原檔 24MB，實務上得自己切子集。注意 IPA 授權把子集視為派生程式，必須改掉字型名稱並附上授權全文。商用的話，申請 justfont 之類的 webfont 服務後把它給的別名填進去就好。

直排要另外注意標點：多數明體沒有直排替代字形，得用 `punctFont` 指一套含 `vert`/`vrt2` 的字型頂上，套件會自動把它排到 `typeFamily` 前面。woff2 由使用端自己放。

MIT。字型不含在內。
