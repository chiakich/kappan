# kappan 活版

活版印刷質感 + 中文直排／右起橫排的排版套件。紙紋、墨壓濾鏡、逐字歪斜。

**核心不依賴任何框架**，是一組純函式與 DOM API；React 那層只是薄殼，要接 Vue、Svelte 或原生就照著抄一份。

| 入口 | 內容 |
|---|---|
| `kappan` | `letterpressCss()`、`filtersMarkup()`、`splitRedacted()`、`redactedHtml()`、`mount()`、`redact()` — 全部零依賴 |
| `kappan/react` | `<LetterpressStyles>`、`<LetterpressFilters>`、`<Redacted>` — 只是把上面的結果掛成節點 |

## 三層

| 層 | 內容 |
|---|---|
| tokens | `.lp` 上的 CSS 變數。所有規則只讀變數，換色只要改 options。 |
| texture | 紙纖維、曝光不均、噪點、髒污、裝訂陰影，以及三支墨壓濾鏡的套用規則。 |
| typeset | 字面（活字／西文）、逐字歪斜、直排、右起橫排、蓋章動畫。 |

版面（相片台紙、舞台、捲軸…）不在套件裡，那是使用端自己的事。

## 用法

不用框架：

```js
import { mount, redact } from 'kappan'

// 注入樣式與濾鏡，回傳解除函式
const dispose = mount({ songFamily: "'I.Ming', serif" })

// 把文字逐字拆成 .lp-ch，逐字歪斜才有東西可以抓
document.querySelectorAll('.sg').forEach((el) => redact(el))
```

React：

```tsx
import { LetterpressStyles, LetterpressFilters, Redacted } from 'kappan/react'

const options = {
  songFamily: "'I.Ming', 'Noto Serif TC', serif",
  punctFont: { family: 'lp-punct', src: '/fonts/lp-punct.woff2', weight: 600 },
}

<div className="lp">
  <LetterpressStyles {...options} />
  <LetterpressFilters />
  <div style={{ position: 'relative' }}>
    <i className="lp-fibre" /><i className="lp-expose" /><i className="lp-grain" />
    {/* 直排加 .lp-v，橫排拿掉就好；.lp-rtl 是活版時代的右起橫排 */}
    <p className="sg lp-v lp-typed"><Redacted text="千秋稻荷社 ███ 電子神道" /></p>
  </div>
</div>
```

`letterpressCss(options)` 回傳同一份 CSS 字串，要自己塞進既有的 style pipeline 時用。

## class 一覽

- `.lp` — 根容器，必須。
- 字面：`.sg` 活字、`.tp` 西文、`.lbl` 小標籤、`.bar` 黑條（寬度用 `--bar-w`）。
- 紙：`.lp-paper` —— 加在 `.lp` 上就有紙，不用任何額外元素（纖維、曝光不均、噪點都在 `::before` / `::after` 裡）。代價是直接子元素會被設成 `position:relative`。
- 質感疊層（要各層獨立擺位時才用）：`.lp-fibre` `.lp-expose` `.lp-grain` `.lp-dirt` `.lp-spine` — 都是 `position:absolute; inset:0`，**父層要自己 `position:relative`**。`.lp-dirt` 裡放 `<i>`（加 `.hair` 變髮絲）。裝訂陰影與髒污不在 `.lp-paper` 裡，那兩個是敘事道具不是紙的物理性質。
- 濃度一律用 `texture` / `--texture`（0~1）調，0 就是白紙一張；超過 1 沒有意義，opacity 封頂在 1。
- 排版：`.lp-v` 直排、`.lp-rtl` 右起橫排（活版時代的橫排字序）、`.lp-cell` 直排格內置中、`.lp-typed` 吃 `--pitch` 行高、`.lp-ruled` 直書格線、`.lp-ruled-h` 橫書格線（格線畫在字行之間，方向與書寫方向相反）。
- 逐字：`.lp-ch`（由 `<Redacted>` / `redactedHtml()` 產生）。歪斜與濃淡是分開的兩組，歪斜與濃淡各有一個無段的旋鈕：`lean` / `--lean`（0 = 排正）與 `weight` / `--weight`（0 = 墨色均勻），`.lp-flat` 與 `.lp-even` 分別是兩者設 0 的捷徑；`.lp-even` 關掉濃淡（墨色深淺與加粗）。
- 大字：`.lp-f-x` 換上第四支濾鏡。前三支靠「挖掉像素」做缺角，在內文級數是斑駁，放大到 60px 以上會變成整塊筆畫被剪掉；`.lp-f-x` 改成調墨的密度（低頻噪點乘進 alpha），筆畫結構保留，只是有的地方吃墨飽、有的地方虛，像印章蓋不勻。

## 調濾鏡

四支濾鏡的每個數字都開放。最省事的是一個全域倍率：

```js
letterpressCss({ filters: { strength: 0.5 } })   // 破壞程度砍半，0 等於不破
```

要細調就針對某一支：

```js
filters: {
  large: { inkFloor: 0.7, pinAmount: 0 },   // 大字：淡處別太淡，砂眼不要
  heading: { chipAmount: 0.15, dilate: 0 }, // 標題：缺角少一點，不脹墨
}
```

`small` / `text` / `heading` 是挖式（`ChipTuning`：`chipAmount` 缺角比例、`chipFrequency` 缺口尺度、`displace` 邊緣位移、`dilate` 吃墨脹開…），`large` 是調密度式（`InkTuning`：`inkFloor` 最淡處還剩多少墨、`inkFrequency` 斑塊尺度、`pinAmount` 細砂眼…）。預設值可以從 `FILTER_DEFAULTS` 讀出來當基準。

濾鏡參數要跟樣式傳同一份 options，`<LetterpressFilters {...options} />` 才生得出對得上的 id 與參數。

## 注意

- **`url(#…)` 的老問題**：濾鏡靠 `filter: url(#lp-t)` 指過去。頁面若有 `<base href>` 會解析失敗；Shadow DOM 內也拿不到外部 SVG。
- **同頁多份**：filter id 預設 `lp-s/t/d`。掛第二份要給不同 `idPrefix`，`<LetterpressStyles>` 和 `<LetterpressFilters>` 兩邊都要傳同一個值。刻意不用隨機值，SSR 兩邊才算得出同一組 id。
- **效能**：`filter` 疊 `mix-blend-mode: multiply` 在 Safari 上大面積文字會掉幀。文字量大時考慮只在標題套 `.lp-d`。

## 換字體

`typeFamily` / `latinFamily` 就是兩個字型堆字串，套件不綁任何一套字，也不幫你載字體檔。

**傳統活版不只有宋體** —— 黑體、楷書、仿宋都鑄過鉛字，所以參數名稱刻意不叫 `songFamily`：`typeFamily` 就是「活字用什麼字」，給什麼排什麼。

- **開源自架**：預設指向一點明體 I.Ming（IPA Font License 1.0）。原檔 24MB，實務上要自己切子集；注意 IPA 授權把子集視為派生程式，**必須改掉字型名稱並附上授權全文**。
- **商用 webfont**：申請 justfont 的 webfont 服務後，把它給的別名填進 `typeFamily` 就好（本站的角色檔案頁用的日星宋體貳號就是這樣來的）。
- **完全自訂**：任何 `@font-face` 或系統字都可以，套件只把字串塞進 `--song` 之類的變數。

直排另外要注意標點：多數明體沒有直排替代字形，要用 `punctFont` 指一套含 `vert`/`vrt2` 的字型頂上，套件會自動把它排到 `typeFamily` 前面。woff2 由使用端自己放。
