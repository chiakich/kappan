// 示範頁。kappan 本身沒有這些東西 —— 它只吐 CSS 與濾鏡，介面是使用端的事。
import {
  mount,
  redact,
  redactedHtml,
  pressTuning,
  pressTexture,
  NEUTRAL_PRESS,
  HAO_SIZES,
  LATIN_SIZES,
} from '../dist/kappan.js'
import { sheetSvg, rasterize, canvasBlob, withBackground, download } from './print.js'

const $ = (id) => document.getElementById(id)
const sheet = document.body
const editor = $('editor')

const START_TEXT = '千秋印書館謹啟　承印中西書籍章程契據\n打一段字，調墨、調紙、調壓力，看它被印出來的樣子。'

/* ── 字號 ────────────────────────────────────────────────── */
// 字號 class 同時給字級與濾鏡，所以這裡只換 class，不必分開設兩個東西。
$('size').innerHTML = [
  ['漢字 · 號數制', HAO_SIZES],
  ['西文 · 專名', LATIN_SIZES],
]
  .map(
    ([label, rows]) =>
      `<optgroup label="${label}">` +
      rows.map((s) => `<option value="lp-${s.id}">${s.name}　${s.pt}pt</option>`).join('') +
      '</optgroup>'
  )
  .join('')
$('size').value = 'lp-sz-3'

/* ── 調節鈕 ──────────────────────────────────────────────── */
// live 的只改 CSS 變數，拖動就即時反應；會重建整棵濾鏡樹的等放開才套用。
const DIALS = [
  { id: 'ink', label: '上墨量', why: '少了筆畫會斷，多了糊成一團', max: 2, press: true },
  { id: 'pressure', label: '壓力', why: '輕了墨轉不滿、整體發灰，重了墨被擠到邊上，邊實中淡、紙上留壓痕', max: 2, press: true },
  { id: 'paper-grade', label: '紙的粗糙', why: '光滑的塗佈紙，到粗糙吸墨的手工紙', max: 2, press: true },
  { id: 'wear', label: '鉛字年紀', why: '舊字的字面被磨鈍、邊上崩角、也印得比較淡', max: 2, press: true },
  { id: 'lean', label: '歪斜', why: '每顆字擺進去都差那麼一點', max: 2, live: true },
  { id: 'jitter', label: '濃淡差異', why: '這一顆吃飽了墨，那一顆沾得少', max: 2, live: true },
  { id: 'texture', label: '紙紋', why: '', max: 1, live: true },
  { id: 'pitch', label: '行距', why: '', min: 1, max: 3, value: 1.9, live: true, unit: 'em' },
  { id: 'tracking', label: '字距', why: '', max: 0.6, step: 0.02, value: 0, live: true, unit: 'em' },
]
$('dials').innerHTML = DIALS.map(
  (d) => `<div class="dial">
  <div class="head"><p class="lbl">${d.label}</p><span class="val" id="${d.id}-val"></span></div>
  <input id="${d.id}" type="range" min="${d.min ?? 0}" max="${d.max}" step="${d.step ?? 0.05}" value="${d.value ?? 1}" aria-label="${d.label}">
  ${d.why ? `<p class="sg why">${d.why}</p>` : ''}
</div>`
).join('')

const PRESS = { ink: 'ink', pressure: 'pressure', paper: 'paper-grade', wear: 'wear' }
const readPress = () => Object.fromEntries(Object.entries(PRESS).map(([k, id]) => [k, Number($(id).value)]))

/* ── 印壞的幾種樣子 ──────────────────────────────────────── */
// 四個成因同時往缺墨的方向偏，缺塊會疊到字整個碎掉。這幾組都留在讀得出字的範圍內。
const PRESETS = {
  標準: NEUTRAL_PRESS,
  墨上太多: { ink: 1.75, pressure: 1.3, paper: 1, wear: 1 },
  墨不夠: { ink: 0.6, pressure: 0.8, paper: 1.1, wear: 1 },
  粗紙手刷: { ink: 1.05, pressure: 0.8, paper: 1.7, wear: 1.15 },
  新字好紙: { ink: 1, pressure: 1.4, paper: 0.2, wear: 0 },
}
$('presets').innerHTML = Object.keys(PRESETS)
  .map((n) => `<button type="button" class="sg key" data-preset="${n}">${n}</button>`)
  .join('')

/* ── 濾鏡 ────────────────────────────────────────────────── */
// 濾鏡是唯一需要重新產生 markup 的東西；顏色、紙紋、歪斜全都只是 CSS 變數。
let dispose = null
let textureTouched = false
let raf = 0

const remount = () => {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const press = readPress()
    const filters = pressTuning(press)
    dispose?.()
    dispose = mount({ filters })
    // 紙粗糙的話紙紋本身也該濃一點 —— 那是同一張紙。使用者拉過之後就以他的為準。
    if (!textureTouched) $('texture').value = pressTexture(press).toFixed(2)
    const t = filters.text
    // 彎曲、暈圈抖動、壓痕在內文級數上關著，拿標題級的值來顯示才看得出成因在動。
    const h = filters.heading
    $('recipe').textContent = [
      `圓角／積墨   ${t.round ? `${t.round}×${t.round}　門檻 ${t.roundThreshold.toFixed(2)}` : '關'}`,
      `推歪         ${t.displace.toFixed(2)}`,
      `崩角         ${t.chipAmount.toFixed(3)}　尺度 ${t.chipFrequency.toFixed(2)}　${t.chipEdge ? `限在邊緣 ${t.chipEdge === 5 ? '兩' : '一'}像素` : '不限位'}`,
      `缺塊門檻     ${t.voidThreshold.toFixed(3)}`,
      `墨暈         ${t.bleed ? `${t.bleed}×${t.bleed}` : '關'}`,
      `拉硬         ${t.contrast.toFixed(2)}　位移 ${t.threshold.toFixed(3)}`,
      `邊實中淡     ${t.rim.toFixed(3)}${t.rim > 0 ? '　（壓過頭，墨被擠到邊上）' : ''}`,
      `整體墨量     ${t.fade.toFixed(3)}${t.fade < 1 ? '　（墨轉印不完全，整體發灰）' : ''}`,
      `標題級以上   彎曲 ${h.warp.toFixed(2)}　暈圈抖動 ${h.squash.toFixed(2)}　壓痕 ${h.deboss.toFixed(2)}`,
    ].join('\n')
    paint()
  })
}

/* ── 畫面 ────────────────────────────────────────────────── */
let family = ''
let direction = 'h'

const paint = () => {
  editor.className = `sg lp-typed ${$('size').value}` + (direction === 'v' ? ' lp-v' : direction === 'rtl' ? ' lp-rtl' : '')
  editor.style.letterSpacing = `${$('tracking').value}em`

  const vars = {
    // 色票的 id 一律 c- 前綴：上墨量那根滑桿本來就叫 ink，撞名的話 getElementById
    // 會拿到 DOM 裡先出現的那個，--ink 就變成 "1"，整條顏色宣告作廢而且不會報錯。
    '--paper': $('c-paper').value,
    '--ink': $('c-ink').value,
    '--ink3': $('c-ink').value,
    '--texture': $('texture').value,
    '--lean': $('lean').value,
    '--weight': $('jitter').value,
    '--pitch': `${$('pitch').value}em`,
  }
  if (family) vars['--type'] = `'lp-punct', '${family}', 'Songti TC', serif`
  for (const [k, v] of Object.entries(vars)) sheet.style.setProperty(k, v)

  for (const d of DIALS) {
    const v = Number($(d.id).value)
    $(`${d.id}-val`).textContent = d.unit ? `${v.toFixed(2)}${d.unit}` : v.toFixed(2)
  }
}

/* ── 排版 ────────────────────────────────────────────────── */
const BAR_UNIT = 14

/** 把 redact() 包出來的 .lp-ch 拆回純文字，點回來才編輯得動。 */
const unredact = () => {
  for (const span of [...editor.querySelectorAll('.lp-ch')]) {
    const w = Number.parseFloat(span.style.getPropertyValue('--bar-w'))
    span.replaceWith(
      document.createTextNode(
        span.classList.contains('bar') ? '█'.repeat(Math.max(1, Math.round(w / BAR_UNIT))) : span.textContent ?? ''
      )
    )
  }
  // 相鄰的文字節點合回去，之後打字與游標移動才正常。
  editor.normalize()
}

let composed = false
const compose = () => {
  if (composed) return
  redact(editor)
  composed = true
  void loadFace()
}
const decompose = () => {
  if (!composed) return
  unredact()
  composed = false
}

/* ── 字體 ────────────────────────────────────────────────── */
// emfont（font.emtech.cc，Apache-2.0）按實際文字現切子集，所以「換一套字」幾乎沒有成本。
const EMFONT = 'https://font.emtech.cc'
const status = $('status')
const statusText = status.innerHTML
let faces = []
let ticket = 0
// 存圖時要把字型檔嵌進 SVG，所以子集的 buffer 要留著。
let faceFile = null

const loadFace = async () => {
  const id = $('face').value
  if (!id) {
    family = ''
    faceFile = null
    paint()
    return
  }
  const words = [...new Set((editor.textContent ?? '').replace(/\s/g, ''))].join('')
  if (!words) return
  const weight = Number($('weight').value) || 400
  const mine = ++ticket
  status.textContent = '切字中…'
  try {
    const res = await fetch(`${EMFONT}/g/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, weight, min: true, format: 'woff2' }),
    })
    const payload = await res.json()
    const url = payload?.location?.[0]
    if (!res.ok || !url) throw new Error(payload?.message ?? res.status)
    const buffer = await (await fetch(url)).arrayBuffer()
    if (mine !== ticket) return
    // family 帶上字重：同名不同檔會互相蓋掉。
    const name = `emfont-${id}-${weight}`
    const face = new FontFace(name, buffer)
    await face.load()
    document.fonts.add(face)
    if (mine !== ticket) return
    family = name
    faceFile = { family: name, weight, buffer }
    status.textContent = `${(buffer.byteLength / 1024).toFixed(1)} KB · ${words.length} 字`
    paint()
  } catch (error) {
    if (mine !== ticket) return
    // 取不到就維持前一套字，畫面不會空掉。
    console.warn(error)
    status.textContent = '這套字取不到，先用著上一套。'
  }
}

const fillWeights = () => {
  const face = faces.find((f) => f.id === $('face').value)
  const list = face?.weight?.length ? face.weight : [400]
  $('weight').innerHTML = list.map((w) => `<option value="${w}">${w}</option>`).join('')
  $('weight').value = list.includes(400) ? 400 : list[Math.floor(list.length / 2)]
}

fetch(`${EMFONT}/list`)
  .then((r) => r.json())
  .then((data) => {
    const items = Array.isArray(data) ? data : data.fonts ?? data.data ?? []
    // weight 是空陣列的那幾套在 /g 端點一律回 500，不要讓人選到會壞的。
    faces = items.filter((f) => (f.weight?.length ?? 0) > 0)
    const groups = {}
    for (const f of faces) (groups[f.category || '其他'] ||= []).push(f)
    $('face').innerHTML =
      '<option value="">系統明體</option>' +
      Object.entries(groups)
        .map(
          ([g, list]) =>
            `<optgroup label="${g}">` +
            list.map((f) => `<option value="${f.id}">${f.name ?? f.id}</option>`).join('') +
            '</optgroup>'
        )
        .join('')
  })
  .catch(() => {
    status.textContent = '字體清單取不到，先用系統的字。'
  })

/* ── 存成圖 ──────────────────────────────────────────────── */
// 把編輯區現在的樣子印成一張圖。紙的大小跟編輯區一樣，內容比它長就跟著長。
const PAD = [38, 34]
const SCALE = 2

/** 編輯區的純文字。排過版的話黑條已經是空的 span，要照寬度還原成 █。 */
const plainText = () => {
  const clone = editor.cloneNode(true)
  for (const span of clone.querySelectorAll('.lp-ch.bar')) {
    const w = Number.parseFloat(span.style.getPropertyValue('--bar-w'))
    span.replaceWith('█'.repeat(Math.max(1, Math.round(w / BAR_UNIT))))
  }
  clone.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:pre-wrap'
  document.body.append(clone)
  const text = clone.innerText.replace(/\n$/, '')
  clone.remove()
  return text
}

const sheetSpec = (transparent) => {
  const vars = {}
  for (const k of ['--paper', '--ink', '--ink3', '--texture', '--lean', '--weight', '--pitch', '--type'])
    vars[k] = sheet.style.getPropertyValue(k) || getComputedStyle(sheet).getPropertyValue(k)
  return {
    text: plainText(),
    className: editor.className,
    letterSpacing: editor.style.letterSpacing || '0em',
    vertical: direction === 'v',
    vars,
    filters: pressTuning(readPress()),
    fonts: faceFile ? [faceFile] : [],
    innerWidth: editor.clientWidth - PAD[0] * 2,
    innerHeight: editor.clientHeight - PAD[1] * 2,
    pad: PAD,
    barUnit: BAR_UNIT,
    transparent,
  }
}

document.querySelector('.downloads').addEventListener('click', async (e) => {
  const kind = e.target.dataset?.dl
  if (!kind) return
  const stem = `kappan-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}`
  const before = status.textContent
  status.textContent = '印一張…'
  try {
    await document.fonts.ready
    const s = await sheetSvg(sheetSpec(kind === 'png'))
    if (kind === 'svg') {
      download(new Blob([s.svg], { type: 'image/svg+xml;charset=utf-8' }), `${stem}.svg`)
    } else {
      const canvas = await rasterize(s.svg, s.width, s.height, SCALE)
      if (kind === 'jpg') download(await canvasBlob(withBackground(canvas, $('c-paper').value), 'image/jpeg', 0.92), `${stem}.jpg`)
      else download(await canvasBlob(canvas, 'image/png'), `${stem}.png`)
    }
    status.textContent = before
  } catch (error) {
    console.error(error)
    status.textContent = '存檔失敗，看看主控台。'
  }
})

/* ── 接線 ────────────────────────────────────────────────── */
for (const d of DIALS) {
  $(d.id).addEventListener('input', d.live ? paint : () => {})
  if (d.press) $(d.id).addEventListener('input', remount)
}
$('texture').addEventListener('input', () => {
  textureTouched = true
})
for (const id of ['c-paper', 'c-ink']) $(id).addEventListener('input', paint)
$('size').addEventListener('change', paint)

document.querySelectorAll('[data-dir]').forEach((btn) => {
  btn.addEventListener('click', () => {
    direction = btn.dataset.dir
    for (const b of document.querySelectorAll('[data-dir]')) b.setAttribute('aria-pressed', String(b === btn))
    paint()
  })
})

$('presets').addEventListener('click', (e) => {
  const name = e.target.dataset?.preset
  if (!name) return
  for (const [k, id] of Object.entries(PRESS)) $(id).value = PRESETS[name][k]
  textureTouched = false
  remount()
})

// 排版會把選取指到的節點換掉，所以焦點真的離開才做。
editor.addEventListener('pointerdown', decompose)
editor.addEventListener('focus', decompose)
editor.addEventListener('blur', compose)

$('face').addEventListener('change', () => {
  fillWeights()
  void loadFace()
})
$('weight').addEventListener('change', () => void loadFace())

// id 撞名是這頁最容易犯又最難看出來的錯（滑桿與色票各有一組同名的 ink/paper），
// 所以啟動時自己查一次，撞了就吵。
const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
if (dupes.length) console.error('duplicate id:', [...new Set(dupes)])

editor.textContent = START_TEXT
compose()
remount()
