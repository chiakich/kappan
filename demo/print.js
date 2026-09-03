// 把排好的字印成一張圖。
//
// 做法不是把 HTML 塞進 foreignObject —— 那條路在「SVG 當圖片」時濾鏡指不到，整塊不畫。
// 而是先在頁面上偷偷排一次，量出每顆字落在哪、歪多少、墨多濃，再逐字寫成 SVG <text>，
// kappan 的濾鏡直接掛在群組上。得到的是一份真的向量 SVG：字型內嵌、濾鏡在裡面，
// 瀏覽器與 Inkscape 都認得。PNG / JPG 是把它畫到 canvas 上再存。
import { filtersMarkup, redactedHtml, ALL_SIZES } from '../dist/kappan.js'

const toBase64 = (buffer) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.readAsDataURL(new Blob([buffer]))
  })

/** 字型檔要嵌進 SVG 裡：圖片是獨立文件，看不到頁面上 document.fonts 加進去的字。 */
const fontFaceCss = async (fonts) =>
  (
    await Promise.all(
      fonts.map(
        async (f) =>
          `@font-face{font-family:'${f.family}';font-weight:${f.weight ?? 400};src:url(data:font/woff2;base64,${await toBase64(f.buffer)}) format('woff2');}`
      )
    )
  ).join('\n')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const n = (v) => +v.toFixed(2)

// computed 顏色有兩種長相：rgba(r, g, b, a)，以及 color-mix 算出來的 color(srgb r g b / a)。
const COLOR = /(?:rgba?|color)\([^)]*\)/

/** 拆 computed text-shadow。顏色裡也有逗號，所以不能直接 split(',')。 */
const shadows = (value) =>
  value === 'none'
    ? []
    : value.split(/,(?![^(]*\))/).map((s) => {
        const color = s.match(COLOR)?.[0] ?? '#000'
        const [dx = 0, dy = 0, blur = 0] = s.replace(color, '').trim().split(/\s+/).map(Number.parseFloat)
        return { color, dx, dy, blur }
      })

const alphaOf = (color) => {
  const m = color.match(/(?:rgba?|color)\(([^)]*)\)/)
  if (!m) return 1
  const parts = m[1].replace(/^srgb\s+/, '').split(/[\s,/]+/).filter(Boolean)
  return parts.length === 4 ? Number.parseFloat(parts[3]) : 1
}

/** 字號 class → 該吃哪一支濾鏡。 */
const tierOf = (className) => {
  const hit = ALL_SIZES.find((s) => className.split(/\s+/).includes(`lp-${s.id}`))
  return hit?.tier ?? 't'
}

/**
 * 在頁面上排一次，把每顆字的位置與樣子量下來。
 * 橫排固定寬、量高；直排固定高、量寬。內容比編輯區長就跟著長，不裁字。
 */
const layout = (spec) => {
  const stage = document.createElement('div')
  stage.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;z-index:-1;contain:layout'
  const wrap = document.createElement('div')
  wrap.className = 'lp'
  for (const [k, v] of Object.entries(spec.vars)) wrap.style.setProperty(k, v)
  const body = document.createElement('div')
  body.className = spec.className
  body.style.cssText = `white-space:pre-wrap;letter-spacing:${spec.letterSpacing};filter:none`
  body.innerHTML = redactedHtml(spec.text, spec.barUnit ?? 14)
  // 每顆字都變 inline-block，量出來的框才是整個字身（行高那麼高），中心就是字腔中心。
  // 對版面沒影響：inline-block 的基線就是它裡面那行字的基線。
  for (const ch of body.querySelectorAll('.lp-ch')) ch.style.display = 'inline-block'
  wrap.append(body)
  stage.append(wrap)
  document.body.append(stage)

  let w = spec.innerWidth
  let h = spec.innerHeight
  if (spec.vertical) {
    body.style.display = 'inline-block'
    body.style.height = `${h}px`
    w = Math.max(w, body.offsetWidth || 0)
  } else {
    body.style.width = `${w}px`
    h = Math.max(h, body.offsetHeight || 0)
  }
  w = Math.ceil(w)
  h = Math.ceil(h)
  body.style.cssText += `;display:block;width:${w}px;height:${h}px`

  const base = body.getBoundingClientRect()
  const bodyStyle = getComputedStyle(body)
  const glyphs = []
  for (const span of body.querySelectorAll('.lp-ch')) {
    const r = span.getBoundingClientRect()
    const cs = getComputedStyle(span)
    const cx = r.left - base.left + r.width / 2
    const cy = r.top - base.top + r.height / 2
    if (span.classList.contains('bar')) {
      glyphs.push({ kind: 'bar', x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height })
      continue
    }
    const ch = span.textContent ?? ''
    if (!ch.trim()) continue
    // 旋轉從矩陣拿；位移已經含在 rect 裡（rect 是變形後的外框，繞中心轉外框中心不動）。
    const m = cs.transform === 'none' ? null : new DOMMatrix(cs.transform)
    const angle = m ? (Math.atan2(m.b, m.a) * 180) / Math.PI : 0
    // 濃淡是 color 的 alpha；加粗是位移的 text-shadow，換成描邊粗細。模糊那道只是微陰影，不管。
    const bold = shadows(cs.textShadow).reduce((acc, s) => Math.max(acc, Math.hypot(s.dx, s.dy)), 0)
    glyphs.push({ kind: 'char', ch, cx, cy, angle, alpha: alphaOf(cs.color), bold, size: cs.fontSize })
  }
  const font = { size: bodyStyle.fontSize, weight: bodyStyle.fontWeight }
  stage.remove()
  return { w, h, glyphs, font }
}

/** 紙：底色、曝光不均、纖維、噴上去的噪點。照 kappan.css 的 .lp-paper 兩個 pseudo 搬過來。 */
const paperMarkup = (W, H, paper, texture) => `
<defs>
  <radialGradient id="pp-light"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="pp-shade"><stop offset="0" stop-color="#16130f" stop-opacity=".04"/><stop offset=".72" stop-color="#16130f" stop-opacity="0"/></radialGradient>
  <pattern id="pp-fibre" width="4" height="3" patternUnits="userSpaceOnUse">
    <rect width="4" height="1" fill="#16130f" fill-opacity=".03"/><rect width="1" height="3" fill="#16130f" fill-opacity=".02"/>
  </pattern>
  <filter id="pp-grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
</defs>
<rect width="${W}" height="${H}" fill="${paper}"/>
<g opacity="${texture}">
  <ellipse cx="${n(W * 0.5)}" cy="${n(H * 0.26)}" rx="${n(W * 1.15)}" ry="${n(H * 0.62)}" fill="url(#pp-light)"/>
  <ellipse cx="${n(W * 0.5)}" cy="${n(H * 1.04)}" rx="${n(W)}" ry="${n(H * 0.7)}" fill="url(#pp-shade)"/>
  <rect width="${W}" height="${H}" fill="url(#pp-fibre)"/>
</g>`

const grainMarkup = (W, H, texture) =>
  `<rect width="${W}" height="${H}" filter="url(#pp-grain)" opacity="${n(0.211 * texture)}" style="mix-blend-mode:multiply"/>`

/**
 * 組出一張紙的 SVG 字串。
 * spec: { text, className, letterSpacing, vertical, vars, filters, fonts, innerWidth, innerHeight, pad, transparent }
 */
export const sheetSvg = async (spec) => {
  const { w, h, glyphs, font } = layout(spec)
  const [px, py] = spec.pad
  const W = w + px * 2
  const H = h + py * 2
  const ink = spec.vars['--ink']
  const texture = Number(spec.vars['--texture']) || 0
  const tier = tierOf(spec.className)

  const text = glyphs
    .map((g) => {
      if (g.kind === 'bar') return `<rect x="${n(px + g.x)}" y="${n(py + g.y)}" width="${n(g.w)}" height="${n(g.h)}" rx="1"/>`
      const attrs = [
        `transform="translate(${n(px + g.cx)} ${n(py + g.cy)})${g.angle ? ` rotate(${n(g.angle)})` : ''}"`,
        g.alpha < 1 ? `fill-opacity="${n(g.alpha)}"` : '',
        g.bold ? `stroke="${ink}" stroke-width="${n(g.bold)}" stroke-linejoin="round" paint-order="stroke"` : '',
        g.size !== font.size ? `font-size="${g.size}"` : '',
      ]
        .filter(Boolean)
        .join(' ')
      return `<text ${attrs}>${esc(g.ch)}</text>`
    })
    .join('\n')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style><![CDATA[
${await fontFaceCss(spec.fonts)}
text { font-family: ${spec.vars['--type']}; font-size: ${font.size}; font-weight: ${font.weight}; text-anchor: middle; dominant-baseline: central; ${spec.vertical ? 'writing-mode: vertical-rl;' : ''} }
]]></style>
<defs>
${filtersMarkup('lp', spec.filters)}
</defs>
${spec.transparent ? '' : paperMarkup(W, H, spec.vars['--paper'], texture)}
<g fill="${ink}" filter="url(#lp-${tier})">
${text}
</g>
${spec.transparent ? '' : grainMarkup(W, H, texture)}
</svg>`
  return { svg, width: W, height: H }
}

/** SVG 字串 → canvas。scale 是輸出的倍率，濾鏡的噪點在 CSS 像素上算，放大不會變粗。 */
export const rasterize = async (svg, width, height, scale = 2) => {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    img.src = url
    // decode() 會等內嵌字型也載好；只等 onload 的話第一張常常是備用字型。
    // 有些引擎的 decode() 對 SVG 會擲錯，那就退回 onload。
    await img.decode().catch(
      () =>
        new Promise((resolve, reject) => {
          if (img.complete && img.naturalWidth) return resolve()
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('svg image failed to load'))
        })
    )
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const canvasBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality)
  )

/** JPG 沒有 alpha，先鋪一層紙色再疊上去，透明處才不會變黑。 */
export const withBackground = (canvas, color) => {
  const out = document.createElement('canvas')
  out.width = canvas.width
  out.height = canvas.height
  const ctx = out.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, 0, 0)
  return out
}

export const download = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
