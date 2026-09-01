# kappan（貼上版）

活版印刷質感。三個檔案，沒有建置步驟，不綁框架。

```html
<link rel="stylesheet" href="kappan.css">

<div class="lp lp-paper">
  <p class="lp-sz-3">常世通信 第一號</p>
</div>

<!-- 濾鏡定義，整頁一份，放哪都行 -->
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
...
```

`.lp` 給顏色與字體，`.lp-paper` 給紙（不用加任何元素）。就這樣。

## 客製

改 `.lp` 上的變數就好。全部都可以在任何子樹上覆蓋。

```css
.lp {
  --paper: #efe9db;   /* 紙色 */
  --ink:   #000;      /* 墨色 */
  --red:   #a2372a;   /* 硃色：印章與格線 */
  --type:  'I.Ming', serif;        /* 活字 */
  --latin: 'Courier New', monospace;
  --pitch: 46px;      /* 直排格線間距，也是 .lp-typed 的行高 */

  --texture: 1;       /* 紙紋濃度 0~1，0 是白紙一張 */
  --lean:    1;       /* 逐字歪斜，0 是完全排正 */
  --weight:  1;       /* 逐字濃淡，0 是墨色完全均勻 */
  --lp-scale: 1;      /* 字號整體倍率 */
}
```

## 字號

class 同時決定字級與該用哪支濾鏡 —— 這兩件事本來就綁在一起，噪點的週期是絕對長度，
不會跟著字級放大。字級寫成 pt，數字就是那顆鉛字的身號。

### 漢字 · 號數制

| class | 號 | 身號 | 濾鏡 |
|---|---|---|---|
| `.lp-sz-0` | 初號 | 42pt | `-x` |
| `.lp-sz-1` | 一號 | 27.5pt | `-d` |
| `.lp-sz-2` | 二號 | 21pt | `-d` |
| `.lp-sz-3` | 三號 | 15.75pt | `-t` |
| `.lp-sz-4` | 四號 | 13.75pt | `-t` |
| `.lp-sz-5` | 五號 | 10.5pt | `-t` |
| `.lp-sz-6` | 六號 | 7.875pt | `-s` |

### 西文 · 專名

| class | 名稱 | 身號 | 濾鏡 |
|---|---|---|---|
| `.lp-canon` | Canon | 48pt | `-x` |
| `.lp-doublepica` | Double Pica | 24pt | `-d` |
| `.lp-doublesmallpica` | Double Small Pica | 22pt | `-d` |
| `.lp-paragon` | Paragon | 20pt | `-d` |
| `.lp-greatprimer` | Great Primer | 18pt | `-d` |
| `.lp-columbian` | Columbian | 16pt | `-t` |
| `.lp-twolinebrevier` | Two-line Brevier | 16pt | `-t` |
| `.lp-english` | English | 14pt | `-t` |
| `.lp-threelinediamond` | Three-line Diamond | 13.5pt | `-t` |
| `.lp-pica` | Pica | 12pt | `-t` |
| `.lp-smallpica` | Small Pica | 11pt | `-t` |
| `.lp-longprimer` | Long Primer | 10pt | `-t` |
| `.lp-bourgeois` | Bourgeois | 9pt | `-t` |
| `.lp-brevier` | Brevier | 8pt | `-s` |
| `.lp-minion` | Minion | 7pt | `-s` |
| `.lp-nonpareil` | Nonpareil | 6pt | `-s` |
| `.lp-agate` | Agate | 5.5pt | `-s` |
| `.lp-pearl` | Pearl | 5pt | `-s` |
| `.lp-diamond` | Diamond | 4.5pt | `-s` |

自己指定字級時，用 `.lp-f-s` / `.lp-f-t` / `.lp-f-d` / `.lp-f-x` 挑濾鏡。

## 印壞的樣子

換 class 就好，可以只套在某個子樹上。

- `.lp-clean`
- `.lp-inky`

## 逐字歪斜

需要每個字自己一個 `<span class="lp-ch">` —— CSS 碰不到單一字元（`::nth-letter()`
提了十幾年，沒有任何瀏覽器實作），所以這件事只能由標記來做。

`redact.js` 兩個函式：`redactedHtml(text)` 吐字串（建置期或 SSR 用，瀏覽器端零 JS），
`redact(el)` 就地改寫既有 DOM。不需要逐字歪斜的話這個檔案可以不要。

連續的 `█` 會變成一根黑條。

## 其他 class

- `.lp-v` 直排、`.lp-rtl` 右起橫排（DOM 順序不變，選取複製出來字序是對的）
- `.lp-ruled` / `.lp-ruled-h` 稿紙格線
- `.lp-flat` 關掉歪斜、`.lp-even` 關掉濃淡
- `.lp-fibre` `.lp-expose` `.lp-grain` `.lp-dirt` `.lp-spine` —— 需要各層獨立擺位時才用，
  父層要自己 `position: relative`。`.lp-paper` 已經涵蓋常見情況。

## 一件要知道的事

這份 CSS 不執行任何東西，但**濾鏡必須是文件裡真的有一個 `<svg>`**。
`filter: url(#lp-t)` 指向不存在的濾鏡時，元素會整個不渲染 —— 不是靜默忽略。

授權 MIT。字型不含在內，`--type` 指到哪套字是你自己的事。
