/**
 * 把 kappan 攤成三個可以直接貼的檔案。
 *
 * 走這條路而不是發 npm，是因為這套東西的受眾是設計的人不是裝套件的人，而且
 * 除了濾鏡參數以外的一切本來就只是 CSS 變數 —— 靜態檔完全夠用，不需要建置步驟、
 * 不需要框架、不用背 semver。要調濾鏡的人才回頭用原始碼或見本帖的試打區。
 *
 *   npm run build
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { letterpressCss, filtersMarkup, splitRedacted, HAO_SIZES, LATIN_SIZES, VARIANT_NAMES } from '../src/index'

// 以腳本自己為基準，從哪裡呼叫都一樣。
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
mkdirSync(OUT, { recursive: true })

const write = (name: string, body: string) => {
  const file = path.join(OUT, name)
  writeFileSync(file, body, 'utf-8')
  return `  ${name.padEnd(20)} ${(Buffer.byteLength(body) / 1024).toFixed(1)} KB`
}

// 變體要成套：CSS 給了 class 而 SVG 沒給濾鏡的話，url(#不存在) 會讓元素整個不渲染。
const OPTIONS = { variants: true }

const css = `/* kappan — 活版印刷質感。整份靠 .lp 上的 CSS 變數客製，見 README。 */\n${letterpressCss(OPTIONS)}`

const svg = `<!-- kappan 的墨壓濾鏡。貼進 <body>，整頁一份就好。 -->
<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
${filtersMarkup('lp', {}, true)}
</svg>
`

// splitRedacted 的獨立版。逐字歪斜需要每個字自己一個 span，而 CSS 碰不到單一字元 ——
// ::nth-letter() 提了十幾年沒有任何瀏覽器實作，所以這件事只能由標記來做。
const redactJs = `// kappan/redact — 把文字逐字包成 .lp-ch，逐字歪斜與濃淡才有東西可以抓。
// 建置期或伺服器端跑完最好，那樣瀏覽器端就完全不需要 JS。
const CJ = /[\\u2E80-\\u9FFF\\u3000-\\u30FF\\uF900-\\uFAFF\\uFF00-\\uFFEF]/

export function redactedHtml(text, barUnit = 14) {
  let out = ''
  for (const chunk of text.split(/(█+)/)) {
    if (chunk.startsWith('█')) {
      out += \`<span class="lp-ch bar" style="--bar-w:\${chunk.length * barUnit}px"></span>\`
      continue
    }
    for (const ch of chunk) {
      if (ch === ' ') { out += ' '; continue }
      const esc = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      out += \`<span class="lp-ch\${CJ.test(ch) ? ' cj' : ''}">\${esc}</span>\`
    }
  }
  return out
}

/** 就地改寫既有 DOM。已經包過的會跳過，所以重複呼叫是安全的。 */
export function redact(el, barUnit = 14) {
  if (el.classList.contains('lp-ch')) return
  for (const node of [...el.childNodes]) {
    if (node.nodeType === 1) { redact(node, barUnit); continue }
    if (node.nodeType !== 3 || !node.textContent.trim()) continue
    const holder = document.createElement('template')
    holder.innerHTML = redactedHtml(node.textContent, barUnit)
    node.replaceWith(holder.content)
  }
}
`

const sizeTable = (rows: typeof HAO_SIZES) =>
  rows.map((s) => `| \`.lp-${s.id}\` | ${s.name} | ${s.pt}pt | \`-${s.tier}\` |`).join('\n')

const readme = `# kappan（貼上版）

活版印刷質感。三個檔案，沒有建置步驟，不綁框架。

\`\`\`html
<link rel="stylesheet" href="kappan.css">

<div class="lp lp-paper">
  <p class="lp-sz-3">常世通信 第一號</p>
</div>

<!-- 濾鏡定義，整頁一份，放哪都行 -->
${svg.split('\n').slice(1, 3).join('\n')}...
\`\`\`

\`.lp\` 給顏色與字體，\`.lp-paper\` 給紙（不用加任何元素）。就這樣。

## 客製

改 \`.lp\` 上的變數就好。全部都可以在任何子樹上覆蓋。

\`\`\`css
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
\`\`\`

## 字號

class 同時決定字級與該用哪支濾鏡 —— 這兩件事本來就綁在一起，噪點的週期是絕對長度，
不會跟著字級放大。字級寫成 pt，數字就是那顆鉛字的身號。

### 漢字 · 號數制

| class | 號 | 身號 | 濾鏡 |
|---|---|---|---|
${sizeTable(HAO_SIZES)}

### 西文 · 專名

| class | 名稱 | 身號 | 濾鏡 |
|---|---|---|---|
${sizeTable(LATIN_SIZES)}

自己指定字級時，用 \`.lp-f-s\` / \`.lp-f-t\` / \`.lp-f-d\` / \`.lp-f-x\` 挑濾鏡。

## 印壞的樣子

換 class 就好，可以只套在某個子樹上。

${VARIANT_NAMES.map((v) => `- \`.lp-${v}\``).join('\n')}

## 逐字歪斜

需要每個字自己一個 \`<span class="lp-ch">\` —— CSS 碰不到單一字元（\`::nth-letter()\`
提了十幾年，沒有任何瀏覽器實作），所以這件事只能由標記來做。

\`redact.js\` 兩個函式：\`redactedHtml(text)\` 吐字串（建置期或 SSR 用，瀏覽器端零 JS），
\`redact(el)\` 就地改寫既有 DOM。不需要逐字歪斜的話這個檔案可以不要。

連續的 \`█\` 會變成一根黑條。

## 其他 class

- \`.lp-v\` 直排、\`.lp-rtl\` 右起橫排（DOM 順序不變，選取複製出來字序是對的）
- \`.lp-ruled\` / \`.lp-ruled-h\` 稿紙格線
- \`.lp-flat\` 關掉歪斜、\`.lp-even\` 關掉濃淡
- \`.lp-fibre\` \`.lp-expose\` \`.lp-grain\` \`.lp-dirt\` \`.lp-spine\` —— 需要各層獨立擺位時才用，
  父層要自己 \`position: relative\`。\`.lp-paper\` 已經涵蓋常見情況。

## 一件要知道的事

這份 CSS 不執行任何東西，但**濾鏡必須是文件裡真的有一個 \`<svg>\`**。
\`filter: url(#lp-t)\` 指向不存在的濾鏡時，元素會整個不渲染 —— 不是靜默忽略。

授權 MIT。字型不含在內，\`--type\` 指到哪套字是你自己的事。
`

console.log('kappan/dist')
console.log(write('kappan.css', css))
console.log(write('kappan-filters.svg', svg))
console.log(write('redact.js', redactJs))
console.log(write('README.md', readme))

// 貼上版的自我檢查：CSS 引用到的每個濾鏡 id，SVG 都必須有。
const ids = new Set([...svg.matchAll(/<filter id="([^"]+)"/g)].map((m) => m[1]))
const missing = [...css.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]).filter((id) => !ids.has(id))
if (missing.length) {
  console.error(`\n✗ CSS 指向不存在的濾鏡：${missing.join(', ')}`)
  process.exit(1)
}
console.log(`\n${ids.size} 支濾鏡，CSS 的引用全部對得上 ✓`)
console.log(`redact.js 與套件同源：${splitRedacted('常 a█').length} 個 token`)
