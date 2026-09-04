// ?tune 模式：把濾鏡的原始參數直接開成滑桿，旁邊擺一張實印照片對著調。
// 這是調預設值用的工具，不是產品功能；沒有 ?tune 時 demo.js 連這個檔都不會載。
import { FILTER_DEFAULTS, ALL_SIZES, pressTuning, NEUTRAL_PRESS } from '../dist/kappan.js'

const TIER_KEY = { s: 'small', t: 'text', d: 'heading', x: 'large' }
const TIER_NAME = { s: '-s 內文小字', t: '-t 一般行文', d: '-d 標題', x: '-x 大字' }

// [min, max, step]。只有列在這裡的欄位會開成滑桿，Internals（種子、疊代、留邊）不開。
const RANGE = {
  grainFrequency: [0.05, 2, 0.01],
  displace: [0, 4, 0.05],
  warp: [0, 6, 0.1],
  dilate: [0, 1, 0.05],
  squash: [0, 4, 0.1],
  rim: [0, 0.5, 0.01],
  deboss: [0, 1, 0.02],
  chipFrequency: [0.1, 3, 0.05],
  chipAmount: [0, 0.5, 0.005],
  voidFrequency: [0.05, 1, 0.01],
  voidThreshold: [0.3, 1, 0.005],
  roundThreshold: [0.2, 0.6, 0.01],
  contrast: [0.5, 8, 0.05],
  threshold: [-0.5, 0, 0.005],
  fade: [0.3, 1, 0.01],
  inkFrequency: [0.005, 0.2, 0.001],
  inkFloor: [0, 1, 0.01],
  pinFrequency: [0.1, 2, 0.05],
  pinAmount: [0, 0.3, 0.005],
}
// 核心大小是三選一，不是連續量。
const KERNELS = ['chipEdge', 'round', 'bleed']
// 拉桿正中間永遠是預設值：左半段 [lo, d]、右半段 [d, hi]，兩側刻度不同但整個範圍都到得了。
// 預設剛好在邊界時沒有可分的兩段，退回線性。
const toVal = (k, d, t) => {
  const [lo, hi] = RANGE[k]
  if (d <= lo || d >= hi) return lo + (hi - lo) * t
  return t < 0.5 ? lo + (d - lo) * (t / 0.5) : d + (hi - d) * ((t - 0.5) / 0.5)
}
const toT = (k, d, v) => {
  const [lo, hi] = RANGE[k]
  if (d <= lo || d >= hi) return (v - lo) / (hi - lo)
  return v <= d ? ((v - lo) / (d - lo)) * 0.5 : 0.5 + ((v - d) / (hi - d)) * 0.5
}


const $ = (id) => document.getElementById(id)

export const init = (api) => {
  const values = {} // tier key → 該級目前的公開欄位值
  let tier = 'd'
  let refUrl = ''

  /* ── 版面 ── */
  const panel = document.createElement('section')
  panel.className = 'tune'
  panel.id = 'tune'
  panel.innerHTML = `
  <div class="toolbar">
    <div class="group"><p class="lbl">調參</p><span class="tp" id="tune-tier"></span><span class="tp" id="tune-dpr"></span></div>
    <div class="group"><p class="lbl">字型檔</p><input type="file" id="tune-font" accept=".woff,.woff2,.ttf,.otf"></div>
    <div class="group"><p class="lbl">參考圖</p><input type="file" id="tune-ref" accept="image/*"><input type="range" id="tune-ref-w" min="120" max="1200" step="2" value="342" aria-label="參考圖寬度"></div>
    <div class="group">
      <button type="button" class="sg key" id="tune-from-press">從成因帶入</button>
      <button type="button" class="sg key" id="tune-defaults">回預設</button>
      <button type="button" class="sg key" id="tune-copy">複製參數</button>
    </div>
  </div>
  <div class="dials" id="tune-dials"></div>
  <pre class="tp" id="tune-out"></pre>`
  api.sheet.before(panel)

  const stage = document.createElement('div')
  stage.className = 'tune-stage'
  api.sheet.before(stage)
  stage.append(api.sheet)
  const ref = document.createElement('img')
  ref.id = 'tune-ref-img'
  ref.alt = ''
  ref.hidden = true
  stage.append(ref)

  $('tune-dpr').textContent = `devicePixelRatio ${window.devicePixelRatio}`

  /* ── 欄位 ── */
  const tierOf = () => {
    const id = api.sizeValue().replace(/^lp-/, '')
    return ALL_SIZES.find((s) => s.id === id)?.tier ?? 'd'
  }
  const fieldsOf = (t) => Object.keys(FILTER_DEFAULTS[TIER_KEY[t]]).filter((k) => k in RANGE || KERNELS.includes(k))
  // pressTuning 只回它有動到的欄位，沒動的要從預設補齊。
  const publicOf = (t, src) => {
    const full = { ...FILTER_DEFAULTS[TIER_KEY[t]], ...src }
    return Object.fromEntries(fieldsOf(t).map((k) => [k, full[k]]))
  }
  const fmt = (v) => (typeof v === 'number' ? +v.toFixed(3) : v)
// 基準是中性成因算出來的那份，不是 filters.ts 的常數：兩者只差 press.ts 在中性紙下
// 把墨暈升到 5。套件實際印出來的預設是前者，回預設、居中、差異都以它為準。
const baselineOf = (t) => publicOf(t, pressTuning(NEUTRAL_PRESS)[TIER_KEY[t]])

  const build = () => {
    tier = tierOf()
    const key = TIER_KEY[tier]
    values[key] ??= publicOf(tier, api.pressFilters()[key])
    const base = baselineOf(tier)
    $('tune-tier').textContent = TIER_NAME[tier]
    $('tune-dials').innerHTML = fieldsOf(tier)
      .map((k) => {
        const v = values[key][k]
        if (KERNELS.includes(k)) {
          const opts = [false, 3, 5]
            .map((o) => `<option value="${o}"${String(o) === String(v) ? ' selected' : ''}>${o === false ? '關' : `${o}×${o}`}</option>`)
            .join('')
          return `<div class="dial"><div class="head"><p class="tp name">${k}</p></div><select class="sg" data-k="${k}">${opts}</select></div>`
        }
        const d = base[k]
        return `<div class="dial">
  <div class="head"><p class="tp name">${k}</p><span class="val" id="tune-${k}-val">${fmt(v)}</span></div>
  <input type="range" data-k="${k}" min="0" max="1" step="0.002" value="${toT(k, d, v)}" aria-label="${k}" title="預設 ${fmt(d)}">
</div>`
      })
      .join('')
    print()
  }

  const print = () => {
    const key = TIER_KEY[tier]
    const d = baselineOf(tier)
    const cur = values[key]
    const lit = (k, v) => (typeof v === 'boolean' ? `${k}: ${v} as BleedKernel` : `${k}: ${fmt(v)}`)
    const diff = Object.entries(cur).filter(([k, v]) => String(fmt(v)) !== String(fmt(d[k])))
    $('tune-out').textContent =
      (diff.length ? `// 跟預設不同的\n${key}: { ${diff.map(([k, v]) => lit(k, v)).join(', ')} }\n\n` : '// 目前跟預設相同\n\n') +
      `// 全部\n${key}: { ${Object.entries(cur).map(([k, v]) => lit(k, v)).join(', ')} }`
  }

  /* ── 套用 ── */
  // 有值的級數整組蓋掉 pressTuning 的結果；沒動過的級數維持成因算出來的。
  api.setOverride((filters) => {
    for (const [key, v] of Object.entries(values)) filters[key] = { ...filters[key], ...v }
  })

  $('tune-dials').addEventListener('input', (e) => {
    const k = e.target.dataset?.k
    if (!k) return
    const key = TIER_KEY[tier]
    const base = baselineOf(tier)
    if (KERNELS.includes(k)) values[key][k] = e.target.value === 'false' ? false : Number(e.target.value)
    else {
      const [, , step] = RANGE[k]
      const raw = toVal(k, base[k], Number(e.target.value))
      values[key][k] = +(Math.round(raw / step) * step).toFixed(4)
      $(`tune-${k}-val`).textContent = fmt(values[key][k])
    }
    print()
    api.remount()
  })

  $('tune-from-press').addEventListener('click', () => {
    const key = TIER_KEY[tier]
    delete values[key]
    // 先讓成因算一次乾淨的，再把結果帶進來當起點。
    values[key] = publicOf(tier, api.pressFilters()[key])
    build()
    api.remount()
  })
  $('tune-defaults').addEventListener('click', () => {
    values[TIER_KEY[tier]] = baselineOf(tier)
    build()
    api.remount()
  })
  $('tune-copy').addEventListener('click', async () => {
    const text = $('tune-out').textContent
    try {
      await navigator.clipboard.writeText(text)
      $('tune-copy').textContent = '已複製'
      setTimeout(() => ($('tune-copy').textContent = '複製參數'), 1200)
    } catch {
      // 剪貼簿拿不到就算了，文字本來就顯示在下面。
    }
  })

  /* ── 字型檔 ── */
  $('tune-font').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const name = `tune-${file.name.replace(/\W+/g, '-')}`
    const face = new FontFace(name, buffer)
    await face.load()
    document.fonts.add(face)
    api.setFace({ family: name, weight: 400, buffer })
  })

  /* ── 參考圖 ── */
  $('tune-ref').addEventListener('change', (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (refUrl) URL.revokeObjectURL(refUrl)
    refUrl = URL.createObjectURL(file)
    ref.src = refUrl
    ref.hidden = false
    ref.style.width = `${$('tune-ref-w').value}px`
  })
  $('tune-ref-w').addEventListener('input', (e) => {
    ref.style.width = `${e.target.value}px`
  })

  api.onSizeChange(build)
  build()
  api.remount()
}
