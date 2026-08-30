/**
 * 四支墨壓濾鏡。前三支由輕到重分給小字、行文與標題，第四支專給大字。
 *
 *   -s 內文小字（位移小、缺角少）
 *   -t 一般行文
 *   -d 標題與印章（多一道 dilate 模擬吃墨脹開）
 *   -x 大字／見本級數（印章式的沾墨不勻）
 *
 * 前三支走的是「挖」：用 discrete 化的遮罩把零星像素 composite out 掉，做鉛字缺角。
 * 那一招在內文級數看起來是斑駁，但噪點的週期是絕對長度不會跟著字級放大 ——
 * 放到 60px 以上就變成整塊筆畫被剪掉，字會散掉。
 *
 * 所以 -x 走的是「調密度」：低頻噪點映射成一張大多接近 1、偶爾掉到 inkFloor 的
 * 濃淡場，再用 operator="in" 乘進來源的 alpha。筆畫結構完整保留，只是有的地方
 * 吃墨飽、有的地方虛 —— 印章蓋不勻就是這樣。真正挖掉的只有最後那道細砂眼。
 *
 * 每一支的參數都開放調整，見 FilterTuning。
 */

/** 挖式濾鏡（-s / -t / -d）的參數。 */
export interface ChipTuning {
  /** 紙面起伏的細緻度。數字愈大顆粒愈細。 */
  grainFrequency: number
  /** 邊緣被紙面推開幾個像素。 */
  displace: number
  /** 吃墨脹開的半徑，0 為不脹。 */
  dilate: number
  /** 缺角的尺度。數字愈小，單個缺口愈大。 */
  chipFrequency: number
  /** 缺角佔的比例，0~1。0 為完全不缺。 */
  chipAmount: number
  blur: number
  /** 最後把 alpha 拉硬的斜率。太低會糊，太高會把濃淡壓平。 */
  contrast: number
  /** 拉硬時的偏移，負值等於把淡的部分吃掉。 */
  threshold: number
  grainOctaves: number
  chipOctaves: number
  seed: number
  chipSeed: number
  /** 濾鏡區域要留多少邊，位移大就要留多一點。 */
  margin: number
}

/** 調密度式濾鏡（-x）的參數。 */
export interface InkTuning {
  grainFrequency: number
  displace: number
  /** 濃淡斑塊的尺度。數字愈小，斑塊愈大。 */
  inkFrequency: number
  /** 最淡處還剩多少墨，0~1。設 1 就是完全均勻。 */
  inkFloor: number
  /** 細砂眼佔的比例，0~1。 */
  pinFrequency: number
  pinAmount: number
  blur: number
  contrast: number
  threshold: number
  grainOctaves: number
  inkOctaves: number
  pinOctaves: number
  seed: number
  inkSeed: number
  pinSeed: number
  margin: number
}

export interface FilterTuning {
  /**
   * 全域強度倍率。1 為預設，0 等於整組關掉（字還在，只是不再破）。
   * 會同時縮放位移、脹開、缺角比例，並把濃淡往均勻拉。
   */
  strength?: number
  /** 內文小字 */
  small?: Partial<ChipTuning>
  /** 一般行文 */
  text?: Partial<ChipTuning>
  /** 標題與印章 */
  heading?: Partial<ChipTuning>
  /** 大字／見本級數 */
  large?: Partial<InkTuning>
}

const SMALL: ChipTuning = {
  grainFrequency: 1.1, displace: 0.55, dilate: 0, chipFrequency: 1.7, chipAmount: 1 / 7,
  blur: 0.2, contrast: 2.7, threshold: -0.1,
  grainOctaves: 2, chipOctaves: 3, seed: 4, chipSeed: 31, margin: 14,
}
const TEXT: ChipTuning = {
  grainFrequency: 0.88, displace: 1.1, dilate: 0, chipFrequency: 1.05, chipAmount: 1 / 7,
  blur: 0.28, contrast: 3.2, threshold: -0.12,
  grainOctaves: 3, chipOctaves: 4, seed: 9, chipSeed: 27, margin: 16,
}
const HEADING: ChipTuning = {
  grainFrequency: 0.6, displace: 1.5, dilate: 0.2, chipFrequency: 0.5, chipAmount: 0.25,
  blur: 0.22, contrast: 5.6, threshold: -0.14,
  grainOctaves: 3, chipOctaves: 4, seed: 13, chipSeed: 19, margin: 22,
}
const LARGE: InkTuning = {
  grainFrequency: 0.34, displace: 1.6, inkFrequency: 0.055, inkFloor: 0.52,
  pinFrequency: 0.55, pinAmount: 1 / 12,
  blur: 0.22, contrast: 1.45, threshold: -0.05,
  grainOctaves: 3, inkOctaves: 3, pinOctaves: 2, seed: 7, inkSeed: 23, pinSeed: 47, margin: 12,
}

// 48 段夠細，1/7、1/4、1/12 都落得回原本的門檻上。1 一律放在最亮那端。
const STEPS = 48
const discreteTable = (amount: number) => {
  const ones = Math.max(0, Math.min(STEPS, Math.round(amount * STEPS)))
  return Array.from({ length: STEPS }, (_, i) => (i >= STEPS - ones ? 1 : 0)).join(' ')
}

/** 濃淡場：兩端淡、中間飽，形狀固定，深淺由 floor 決定。 */
const inkTable = (floor: number) => {
  const f = Math.max(0, Math.min(1, floor))
  const at = (t: number) => +(f + (1 - f) * t).toFixed(3)
  return [at(0), at(0.65), at(0.94), 1, 1, 1, at(0.8), at(0.35)].join(' ')
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const chipFilter = (id: string, t: ChipTuning, strength: number) => {
  const displace = t.displace * strength
  const dilate = t.dilate * strength
  const size = 100 + t.margin * 2
  return `
<filter id="${id}" x="-${t.margin}%" y="-${t.margin}%" width="${size}%" height="${size}%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${t.grainFrequency}" numOctaves="${t.grainOctaves}" seed="${t.seed}" result="fib"/>
  <feDisplacementMap in="SourceGraphic" in2="fib" scale="${+displace.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
${dilate > 0 ? `  <feMorphology in="rough" operator="dilate" radius="${+dilate.toFixed(3)}" result="gain"/>\n` : ''}  <feTurbulence type="fractalNoise" baseFrequency="${t.chipFrequency}" numOctaves="${t.chipOctaves}" seed="${t.chipSeed}" result="mot"/>
  <feColorMatrix in="mot" type="luminanceToAlpha" result="motl"/>
  <feComponentTransfer in="motl" result="chip"><feFuncA type="discrete" tableValues="${discreteTable(clamp01(t.chipAmount * strength))}"/></feComponentTransfer>
  <feComposite in="${dilate > 0 ? 'gain' : 'rough'}" in2="chip" operator="out" result="chipped"/>
  <feGaussianBlur in="chipped" stdDeviation="${t.blur}" result="b"/>
  <feComponentTransfer in="b"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
</filter>`
}

const inkFilter = (id: string, t: InkTuning, strength: number) => {
  const size = 100 + t.margin * 2
  // strength 0 = 完全均勻；strength 2 = 淡處再淡一倍。
  const floor = clamp01(1 - (1 - t.inkFloor) * strength)
  return `
<filter id="${id}" x="-${t.margin}%" y="-${t.margin}%" width="${size}%" height="${size}%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${t.grainFrequency}" numOctaves="${t.grainOctaves}" seed="${t.seed}" result="fib"/>
  <feDisplacementMap in="SourceGraphic" in2="fib" scale="${+(t.displace * strength).toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
  <feTurbulence type="fractalNoise" baseFrequency="${t.inkFrequency}" numOctaves="${t.inkOctaves}" seed="${t.inkSeed}" result="ink"/>
  <feColorMatrix in="ink" type="luminanceToAlpha" result="inkl"/>
  <feComponentTransfer in="inkl" result="inkmask"><feFuncA type="table" tableValues="${inkTable(floor)}"/></feComponentTransfer>
  <feComposite in="rough" in2="inkmask" operator="in" result="uneven"/>
  <feTurbulence type="fractalNoise" baseFrequency="${t.pinFrequency}" numOctaves="${t.pinOctaves}" seed="${t.pinSeed}" result="pin"/>
  <feColorMatrix in="pin" type="luminanceToAlpha" result="pinl"/>
  <feComponentTransfer in="pinl" result="pinmask"><feFuncA type="discrete" tableValues="${discreteTable(clamp01(t.pinAmount * strength))}"/></feComponentTransfer>
  <feComposite in="uneven" in2="pinmask" operator="out" result="chipped"/>
  <feGaussianBlur in="chipped" stdDeviation="${t.blur}" result="b"/>
  <feComponentTransfer in="b"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
</filter>`
}

/**
 * 產生四支濾鏡的 SVG 字串。純函式，沒有任何框架成分；React 版把它塞進 <svg> 就好。
 */
export const filtersMarkup = (idPrefix = 'lp', tuning: FilterTuning = {}) => {
  const strength = tuning.strength ?? 1
  return [
    chipFilter(`${idPrefix}-s`, { ...SMALL, ...tuning.small }, strength),
    chipFilter(`${idPrefix}-t`, { ...TEXT, ...tuning.text }, strength),
    chipFilter(`${idPrefix}-d`, { ...HEADING, ...tuning.heading }, strength),
    inkFilter(`${idPrefix}-x`, { ...LARGE, ...tuning.large }, strength),
  ].join('\n')
}

export const FILTER_DEFAULTS = { small: SMALL, text: TEXT, heading: HEADING, large: LARGE } as const
