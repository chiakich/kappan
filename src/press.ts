import { FILTER_DEFAULTS, type BleedKernel, type ChipTuning, type FilterTuning, type InkTuning } from './filters'

/**
 * 用印刷的成因當參數，而不是用濾鏡的參數。
 *
 * 底下那七十幾個欄位是實作，沒有人想設 chipFrequency；大家想設的是「紙粗一點」。
 * 一個成因會同時牽動好幾道濾鏡 —— 上墨量一動，缺塊、拉硬、墨暈都得跟著改，
 * 因為墨多本來就同時讓筆畫變胖、少缺、邊緣更實。那個對應關係就是這個檔案。
 *
 * 四個成因全設 1 時，每一級都精確落回自己的預設值。所以這是預設值的延伸，
 * 不是另一套 —— 外側的錨點一律寫成各級預設的倍數，換級也成立。
 */

export interface Press {
  /** 上墨量。少了筆畫會斷，多了糊成一團。 */
  ink: number
  /** 壓力。輕了印不滿，重了墨被擠出邊緣。 */
  pressure: number
  /** 紙的粗糙與吸墨程度。光滑塗佈紙 0，粗糙的手工紙 2。 */
  paper: number
  /** 鉛字用了多久。新字 0，崩角的舊字 2。 */
  wear: number
}

export const NEUTRAL_PRESS: Press = { ink: 1, pressure: 1, paper: 1, wear: 1 }

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
/** 0→1→2 三點折線。1 一律落在 at1 上。 */
const ramp = (v: number, at0: number, at1: number, at2: number) =>
  v <= 1 ? at0 + (at1 - at0) * v : at1 + (at2 - at1) * (v - 1)

/**
 * 印不滿的程度。這一個量餵給「缺塊」那道濾鏡，而缺塊模擬的是行話講的
 * saltiness —— 壓力不足時墨到不了紙纖維的凹谷，影像就破成鹽粒狀。
 *
 * 所以它的成因是「壓力不足 × 紙的粗糙」。文獻講得很明確：深色印在棉紙上最鹽，
 * 淺色印在光滑紙上幾乎不鹽 —— 強度由紙決定，尺度是紙纖維的尺度（所以
 * voidFrequency 用絕對值是對的，那本來就不該跟著字級縮放）。
 *
 * 上墨量刻意不在裡面。缺墨在真實印刷裡的表現是「弱、灰、patchy」，補墨就好；
 * 沒有任何一種缺陷是「缺墨把筆畫打出洞」。以前缺墨在這裡佔最大權重 0.5，
 * 結果小字被一個根本不該觸發它的成因打碎 —— 缺墨改走 inkedOf，那才是「淡」。
 */
const starveOf = (p: Press) =>
  (1 - p.pressure) * 0.55 + (p.paper - 1) * 0.35 + Math.max(0, p.wear - 1) * 0.3

/**
 * 整體墨量。壓力不足、字面磨低於字身高度、墨本來就少 —— 這三件事都是
 * 墨轉印不完全，而那先表現成整篇發灰，不是形狀缺一塊。
 *
 * 之前整條鏈路沒有任何一道能讓字印得比較淡：contrast 是硬化曲線，只會讓字更黑
 * 或更瘦。所以「壓力輕」以前只能靠缺形狀來表現，那不對 —— 壓輕的版是灰的。
 *
 * 四個成因全設 1 時回 1，也就是這一道整個不作用。
 */
const inkedOf = (p: Press) =>
  clamp(
    1 - (1 - p.pressure) * 0.45 - Math.max(0, p.wear - 1) * 0.2 - Math.max(0, 1 - p.ink) * 0.4,
    0.3,
    1
  )

/**
 * 等效墨量。把「把墨往外推」的成因合成一個 0~2 的量，1 是中性。
 *
 * 文獻把 loss of sharpness、thickened counters、haloing 同時列在「上墨量過多」
 * 與「壓力過大」底下 —— 那是同一組缺陷，因為壓力跟墨都是把墨往外擠。
 *
 * 但只有往上那一段合流。壓力不足不會讓筆畫變細，它讓整版發灰（走 inkedOf），
 * 所以往下那一段只認上墨量 —— 否則「墨少壓力大」會被算成偏胖，那是反的：
 * 那個組合印出來是又瘦又乾淨。
 */
const inkEqOf = (p: Press) =>
  clamp(1 - Math.max(0, 1 - p.ink) + Math.max(0, p.ink - 1) + Math.max(0, p.pressure - 1) * 0.6, 0, 2)

/**
 * 四級共通的部分。錨點都是 d 的倍數，所以每一級各自成立。
 *
 * fill 是這一級對「墨太多」的敏感度。這是整套裡唯一一個反方向的尺度問題：
 * 其他效應都是絕對長度在小字上顯得太強，而 filling 是真的物理上小字先滿 ——
 * 同一層墨膜會把 9pt 的字腔糊掉，24pt 完全正常（Briar Press 上有一模一樣的案例：
 * 小字的字腔全是 blob，同一版的大字沒事，結論是 over-inking）。所以小字級的
 * 錨點要拉得比大字級遠。
 */
const common = (
  p: Press,
  d: { displace: number; voidThreshold: number; contrast: number; threshold: number; round: BleedKernel; roundThreshold: number },
  fill: number
) => ({
  // 圓角是印刷這個動作本身造成的，跟墨量無關，所以核心不動。但積墨的程度會 ——
  // 墨愈多，交會處填得愈滿，門檻就愈低。
  round: d.round,
  // 墨愈多，交會處填得愈滿，門檻就愈低。字愈舊則相反 —— 字面被磨鈍，門檻往上
  // 等於多削掉一點，那就是磨圓。核心大小換不了（3×3 已經是最小的一格），
  // 所以「更圓」只能靠門檻連續地推，不能靠換核心跳一階。
  roundThreshold: d.round
    ? clamp(
        ramp(inkEqOf(p), d.roundThreshold + 0.1, d.roundThreshold, d.roundThreshold - 0.12) +
          Math.max(0, p.wear - 1) * 0.06,
        0.2,
        0.6
      )
    : d.roundThreshold,
  // 紙愈粗，纖維把筆畫推得愈歪；壓力愈大，紙被壓平，推歪反而變少。
  displace: clamp(d.displace * ramp(p.paper, 0.4, 1, 1.6) * ramp(p.pressure, 1.5, 1, 0.8), 0, 4),
  voidThreshold: clamp(d.voidThreshold - starveOf(p) * 0.28, 0.35, 1),
  // 吸墨的紙會讓邊緣滲開；墨上太多的話，再光滑的紙也擋不住。
  // 一律用 5：3 的暈圈只有 1px，拉硬還沒推到底就把它吃完了，再推也不會更胖。
  bleed: (p.paper >= 0.5 || inkEqOf(p) >= 1.3 ? 5 : false) as 5 | false,
  // 拉硬同時管兩件事：墨少時把淡的部分吃掉（筆畫變細），墨多時把卷積暈出來的
  // 那一圈全部變實心（筆畫變胖）。threshold 到 0 為止 —— 再正下去連全透明的
  // 地方都會被拉起來，整個方框會發灰。
  contrast: clamp(ramp(inkEqOf(p), d.contrast * 0.625, d.contrast, d.contrast * fill), 1, 12),
  threshold: clamp(ramp(inkEqOf(p), d.threshold * 2.5, d.threshold, 0), -0.5, 0),
  fade: inkedOf(p),
})

const chip = (p: Press, d: typeof FILTER_DEFAULTS.text, fill: number): Partial<ChipTuning> => ({
  ...common(p, d, fill),
  // 脹開維持各級的預設，成因不去動它。feMorphology 的半徑會被取整到整數裝置像素，
  // 拿滑桿掃過去會在 0.24→0.27 之間突然粗一圈，而且門檻隨螢幕的 DPR 跑。
  // 固定值不會跳，所以留著沒關係；「墨往外擠」改由墨暈加拉硬去做。
  dilate: d.dilate,
  // 崩角只跟字的年紀有關。新字的缺陷是表面細斑點，舊字是真的崩掉一角 ——
  // 所以年紀一大不只變多，尺度也要變大（頻率降低＝單個缺口變大）。
  chipAmount: clamp(ramp(p.wear, 0, d.chipAmount, d.chipAmount * 2.24), 0, 0.5),
  // 舊字的缺口比新字大，但別放大到內文級數也長出標題那種尺度的blob ——
  // 遠端錨點從 0.4 收到 0.7。缺口變大主要交給邊緣帶去限位，不靠把噪點調粗。
  chipFrequency: clamp(ramp(p.wear, d.chipFrequency * 1.62, d.chipFrequency, d.chipFrequency * 0.7), 0.15, 3),
  chipEdge: d.chipEdge,
})

const ink = (p: Press, d: typeof FILTER_DEFAULTS.large, fill: number): Partial<InkTuning> => ({
  ...common(p, d, fill),
  // 大字走的是調密度不是挖。墨多則濃淡趨於均勻，墨少則斑塊拉開。
  inkFloor: clamp(ramp(p.ink, d.inkFloor * 0.6, d.inkFloor, 1), 0, 1),
  // 字面磨損在大字上是砂眼變多，同樣限在邊緣帶內。
  pinAmount: clamp(ramp(p.wear, 0, d.pinAmount, d.pinAmount * 2.4), 0, 0.4),
  chipEdge: d.chipEdge,
})

/**
 * 成因 → 四級的濾鏡參數。丟給 letterpressCss / filtersMarkup 的 filters 就好。
 */
export const pressTuning = (p: Partial<Press> = {}): FilterTuning => {
  const press = { ...NEUTRAL_PRESS, ...p }
  // 字愈小，同一層墨膜愈快把字腔填滿。
  return {
    small: chip(press, FILTER_DEFAULTS.small, 3.6),
    text: chip(press, FILTER_DEFAULTS.text, 3),
    heading: chip(press, FILTER_DEFAULTS.heading, 2.5),
    large: ink(press, FILTER_DEFAULTS.large, 2),
  }
}

/** 紙粗糙的話紙紋本身也該濃一點 —— 那是同一張紙。搭配 --texture 用。 */
export const pressTexture = (p: Partial<Press> = {}) =>
  clamp(ramp({ ...NEUTRAL_PRESS, ...p }.paper, 0.35, 1, 1), 0, 1)
