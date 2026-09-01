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

/** 墨暈的核心大小。數字是 feConvolveMatrix 的 order。 */
export type BleedKernel = false | 3 | 5

/**
 * 噪點的亂數種子、疊代次數、缺塊邊緣硬度、濾鏡區域留邊。
 *
 * 這些不對外開放：調它們不會讓字更像鉛字，只會讓紋理換一個長相或讓濾鏡被裁掉。
 * 真正值得調的是成因，見 press.ts。
 */
interface Internals {
  grainOctaves: number
  voidOctaves: number
  voidHardness: number
  seed: number
  voidSeed: number
  /** 濾鏡區域要留多少邊，位移大就要留多一點。 */
  margin: number
}
interface ChipInternals extends Internals {
  chipOctaves: number
  chipSeed: number
}
interface InkInternals extends Internals {
  inkOctaves: number
  pinOctaves: number
  inkSeed: number
  pinSeed: number
}
type ChipSpec = ChipTuning & ChipInternals
type InkSpec = InkTuning & InkInternals

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
  /** 缺塊的尺度。比 chipFrequency 低一個數量級，洞才大得到能咬斷筆畫。 */
  voidFrequency: number
  /** 缺塊的門檻，0~1。愈高洞愈稀疏；1 為完全不缺。見 voidPass。 */
  voidThreshold: number
  /** 墨暈的核心大小：false 不暈、3 暈一像素、5 暈兩像素。見 bleedFilter。 */
  bleed: BleedKernel
  /** 最後把 alpha 拉硬的斜率。太低會糊，太高會把濃淡壓平。 */
  contrast: number
  /** 拉硬時的偏移，負值等於把淡的部分吃掉。 */
  threshold: number
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
  /** 缺塊。欄位意義同 ChipTuning。 */
  voidFrequency: number
  voidThreshold: number
  /** 墨暈的核心大小：false 不暈、3 暈一像素、5 暈兩像素。見 bleedFilter。 */
  bleed: BleedKernel
  contrast: number
  threshold: number
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

// 小字要墨暈才讀得出吃墨；大字的缺角與位移本來就看得見，再柔化只會把它糊掉。
// 缺塊反過來：小字級破得重（門檻 .66），大字級較輕（.72）—— 見本比對出來的。
const SMALL: ChipSpec = {
  grainFrequency: 1.1, displace: 0.55, dilate: 0, chipFrequency: 1.7, chipAmount: 1 / 7,
  voidFrequency: 0.35, voidThreshold: 0.66, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  bleed: 3, contrast: 2.7, threshold: -0.1,
  grainOctaves: 2, chipOctaves: 3, seed: 4, chipSeed: 31, margin: 14,
}
const TEXT: ChipSpec = {
  grainFrequency: 0.88, displace: 1.1, dilate: 0, chipFrequency: 1.05, chipAmount: 1 / 7,
  voidFrequency: 0.35, voidThreshold: 0.66, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  bleed: 3, contrast: 3.2, threshold: -0.12,
  grainOctaves: 3, chipOctaves: 4, seed: 9, chipSeed: 27, margin: 16,
}
const HEADING: ChipSpec = {
  grainFrequency: 0.6, displace: 1.5, dilate: 0.2, chipFrequency: 0.5, chipAmount: 0.25,
  voidFrequency: 0.35, voidThreshold: 0.72, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  bleed: false as BleedKernel, contrast: 3.3, threshold: -0.07,
  grainOctaves: 3, chipOctaves: 4, seed: 13, chipSeed: 19, margin: 22,
}
const LARGE: InkSpec = {
  grainFrequency: 0.34, displace: 1.6, inkFrequency: 0.055, inkFloor: 0.52,
  pinFrequency: 0.55, pinAmount: 1 / 12,
  voidFrequency: 0.35, voidThreshold: 0.72, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  bleed: false as BleedKernel, contrast: 1.25, threshold: -0.03,
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

/**
 * 缺塊：整塊筆畫不見，或一條筆畫斷成兩截。chipFrequency 那道砂眼的洞只有 1px 左右，
 * 在內文級數是斑駁，但咬不斷任何東西；這一道的頻率低一個數量級，洞才吃得掉筆畫。
 *
 * 門檻直接砍在原始噪點上，不先正規化再取「最亮的百分之幾」。feTurbulence 的輸出
 * 集中在 0.5 附近，拿 0~1 的均勻刻度去取百分比，整個可用範圍會被壓進 0.60~0.62
 * 那一小段 —— 參數從 1/16 調到 1/140 看似動了九倍，實際只移動 0.013，畫面幾乎不變。
 * 所以這裡的 threshold 就是噪點上的絕對位置，斜率只負責把邊緣切硬。
 */
const voidPass = (t: { voidFrequency: number; voidThreshold: number; voidHardness: number; voidOctaves: number; voidSeed: number }, input: string, strength: number) => {
  // 跟其他參數一致：strength 0 等於整道關掉，2 等於破得更兇。
  const threshold = 1 - (1 - t.voidThreshold) * strength
  if (threshold >= 1) return { markup: '', out: input }
  const k = t.voidHardness
  return {
    markup: `  <feTurbulence type="fractalNoise" baseFrequency="${t.voidFrequency}" numOctaves="${t.voidOctaves}" seed="${t.voidSeed}" result="vn"/>
  <feColorMatrix in="vn" type="luminanceToAlpha" result="vnl"/>
  <feComponentTransfer in="vnl" result="vm"><feFuncA type="linear" slope="${k}" intercept="${+(-k * threshold).toFixed(3)}"/></feComponentTransfer>
  <feComposite in="${input}" in2="vm" operator="out" result="voided"/>\n`,
    out: 'voided',
  }
}

/**
 * 墨暈這一道不能用 feGaussianBlur。次像素的 σ 兩個引擎算出來的東西不一樣：
 * WebKit 走規格書那套三次 box blur 近似、box 寬取整數，Skia 在小 σ 走真高斯。
 * 本來只差一點，但緊接著的 feFuncA 會把 alpha 拉硬，那點誤差被斜率放大就成了
 * 整片筆畫脹開黏死 —— Safari 上缺角與濃淡會被吃得一乾二淨。
 *
 * 改用固定係數的高斯核心：規格把 kernelMatrix 寫死，引擎沒有近似的餘地，兩邊逐像素相同。
 *
 * 3 的暈圈只有一像素寬（緊鄰筆畫那圈 alpha = 4/16，再外一圈是 0），所以配上拉硬之後
 * 「把筆畫變胖」的上限就是一邊 1px；要更胖得用 5，暈圈兩像素、上限加倍。
 * 代價是取樣數從 9 變 25，所以預設留在 3，需要範圍的人才指定 5。
 */
const KERNELS = {
  3: { matrix: '1 2 1 2 4 2 1 2 1', divisor: 16 },
  5: { matrix: '1 4 6 4 1 4 16 24 16 4 6 24 36 24 6 4 16 24 16 4 1 4 6 4 1', divisor: 256 },
} as const

const bleedFilter = (input: string, bleed: BleedKernel) => {
  if (!bleed) return ''
  const k = KERNELS[bleed]
  return `  <feConvolveMatrix in="${input}" order="${bleed}" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="b"/>\n`
}

const chipFilter = (id: string, t: ChipSpec, strength: number) => {
  const displace = t.displace * strength
  const dilate = t.dilate * strength
  const size = 100 + t.margin * 2
  const gap = voidPass(t, 'chipped', strength)
  return `
<filter id="${id}" x="-${t.margin}%" y="-${t.margin}%" width="${size}%" height="${size}%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${t.grainFrequency}" numOctaves="${t.grainOctaves}" seed="${t.seed}" result="fib"/>
  <feDisplacementMap in="SourceGraphic" in2="fib" scale="${+displace.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
${dilate > 0 ? `  <feMorphology in="rough" operator="dilate" radius="${+dilate.toFixed(3)}" result="gain"/>\n` : ''}  <feTurbulence type="fractalNoise" baseFrequency="${t.chipFrequency}" numOctaves="${t.chipOctaves}" seed="${t.chipSeed}" result="mot"/>
  <feColorMatrix in="mot" type="luminanceToAlpha" result="motl"/>
  <feComponentTransfer in="motl" result="chip"><feFuncA type="discrete" tableValues="${discreteTable(clamp01(t.chipAmount * strength))}"/></feComponentTransfer>
  <feComposite in="${dilate > 0 ? 'gain' : 'rough'}" in2="chip" operator="out" result="chipped"/>
${gap.markup}${bleedFilter(gap.out, t.bleed)}  <feComponentTransfer in="${t.bleed ? 'b' : gap.out}"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
</filter>`
}

const inkFilter = (id: string, t: InkSpec, strength: number) => {
  const size = 100 + t.margin * 2
  // strength 0 = 完全均勻；strength 2 = 淡處再淡一倍。
  const floor = clamp01(1 - (1 - t.inkFloor) * strength)
  const gap = voidPass(t, 'chipped', strength)
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
${gap.markup}${bleedFilter(gap.out, t.bleed)}  <feComponentTransfer in="${t.bleed ? 'b' : gap.out}"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
</filter>`
}

/**
 * 預先調好的幾種狀態。靜態發布時 CSS 檔調不動濾鏡（那是 SVG 不是變數），
 * 所以與其開一堆參數，不如直接附幾套換 class 就能切。
 *
 * 命名照的是實體的失敗模式：墨太多會糊胖，墨太少會斷，字太舊會崩角。
 */
export const FILTER_VARIANTS = {
  /** 新字新墨，幾乎不破。小字級的內文或介面用。 */
  clean: { strength: 0.35 },
  /**
   * 吃墨：滾筒上墨太多，筆畫脹開糊在一起，但不太破。
   *
   * 沒有反方向的「破更兇」那一套 —— 實測 strength 1.15 跟預設幾乎分不出來、
   * 1.3 就已經難看，中間沒有可用區間。預設值本身就接近破損的上限了。
   */
  inky: {
    small: { dilate: 0.2, chipAmount: 0.04, voidThreshold: 0.9, contrast: 3.4 },
    text: { dilate: 0.26, chipAmount: 0.04, voidThreshold: 0.9, contrast: 4 },
    heading: { bleed: 3 as const, dilate: 0.45, chipAmount: 0.08, voidThreshold: 0.92, contrast: 4.2 },
    large: { bleed: 3 as const, inkFloor: 0.78, pinAmount: 0.02, voidThreshold: 0.92, contrast: 1.6 },
  },
} satisfies Record<string, FilterTuning>

export type VariantName = keyof typeof FILTER_VARIANTS

/** CSS 那邊要照這份產 class，兩邊名字必須同源，否則會出現指向不存在濾鏡的 class。 */
export const VARIANT_NAMES = Object.keys(FILTER_VARIANTS) as VariantName[]

const oneSet = (idPrefix: string, tuning: FilterTuning) => {
  const strength = tuning.strength ?? 1
  return [
    chipFilter(`${idPrefix}-s`, { ...SMALL, ...tuning.small }, strength),
    chipFilter(`${idPrefix}-t`, { ...TEXT, ...tuning.text }, strength),
    chipFilter(`${idPrefix}-d`, { ...HEADING, ...tuning.heading }, strength),
    inkFilter(`${idPrefix}-x`, { ...LARGE, ...tuning.large }, strength),
  ].join('\n')
}

/**
 * 產生濾鏡的 SVG 字串。純函式，沒有任何框架成分；React 版把它塞進 <svg> 就好。
 *
 * variants 打開才會多產那三套。務必跟 letterpressCss 的同名選項一致 ——
 * CSS 給了 class 而 SVG 沒給濾鏡的話，`filter: url(#不存在)` 會讓元素整個不渲染，
 * 不是靜默忽略。
 */
export const filtersMarkup = (idPrefix = 'lp', tuning: FilterTuning = {}, variants = false) => {
  const sets = [oneSet(idPrefix, tuning)]
  if (variants) {
    for (const [name, v] of Object.entries(FILTER_VARIANTS)) {
      sets.push(oneSet(`${idPrefix}-${name}`, { ...tuning, ...v }))
    }
  }
  return sets.join('\n')
}

export const FILTER_DEFAULTS = { small: SMALL, text: TEXT, heading: HEADING, large: LARGE } as const
