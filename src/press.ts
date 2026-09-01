import { FILTER_DEFAULTS, type ChipTuning, type FilterTuning, type InkTuning } from './filters'

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

/** 缺墨、壓不足、紙太粗、字面磨損都會讓筆畫印不滿，疊加成同一個量。 */
const starveOf = (p: Press) =>
  (1 - p.ink) * 0.5 + (1 - p.pressure) * 0.4 + (p.paper - 1) * 0.25 + Math.max(0, p.wear - 1) * 0.5

/** 四級共通的部分。錨點都是 d 的倍數，所以每一級各自成立。 */
const common = (p: Press, d: { displace: number; voidThreshold: number; contrast: number; threshold: number }) => ({
  // 紙愈粗，纖維把筆畫推得愈歪；壓力愈大，紙被壓平，推歪反而變少。
  displace: clamp(d.displace * ramp(p.paper, 0.4, 1, 1.6) * ramp(p.pressure, 1.5, 1, 0.8), 0, 4),
  voidThreshold: clamp(d.voidThreshold - starveOf(p) * 0.28, 0.35, 1),
  // 吸墨的紙會讓邊緣滲開；墨上太多的話，再光滑的紙也擋不住。
  // 一律用 5：3 的暈圈只有 1px，拉硬還沒推到底就把它吃完了，再推也不會更胖。
  bleed: (p.paper >= 0.5 || p.ink >= 1.3 ? 5 : false) as 5 | false,
  // 拉硬同時管兩件事：墨少時把淡的部分吃掉（筆畫變細），墨多時把卷積暈出來的
  // 那一圈全部變實心（筆畫變胖）。threshold 到 0 為止 —— 再正下去連全透明的
  // 地方都會被拉起來，整個方框會發灰。
  contrast: clamp(ramp(p.ink, d.contrast * 0.625, d.contrast, d.contrast * 2.8), 1, 12),
  threshold: clamp(ramp(p.ink, d.threshold * 2.5, d.threshold, 0), -0.5, 0),
})

const chip = (p: Press, d: typeof FILTER_DEFAULTS.text): Partial<ChipTuning> => ({
  ...common(p, d),
  // 脹開維持各級的預設，成因不去動它。feMorphology 的半徑會被取整到整數裝置像素，
  // 拿滑桿掃過去會在 0.24→0.27 之間突然粗一圈，而且門檻隨螢幕的 DPR 跑。
  // 固定值不會跳，所以留著沒關係；「墨往外擠」改由墨暈加拉硬去做。
  dilate: d.dilate,
  // 崩角只跟字的年紀有關。新字的缺陷是表面細斑點，舊字是真的崩掉一角 ——
  // 所以年紀一大不只變多，尺度也要變大（頻率降低＝單個缺口變大）。
  chipAmount: clamp(ramp(p.wear, 0, d.chipAmount, d.chipAmount * 2.24), 0, 0.5),
  chipFrequency: clamp(ramp(p.wear, d.chipFrequency * 1.62, d.chipFrequency, d.chipFrequency * 0.4), 0.15, 3),
})

const ink = (p: Press, d: typeof FILTER_DEFAULTS.large): Partial<InkTuning> => ({
  ...common(p, d),
  // 大字走的是調密度不是挖。墨多則濃淡趨於均勻，墨少則斑塊拉開。
  inkFloor: clamp(ramp(p.ink, d.inkFloor * 0.6, d.inkFloor, 1), 0, 1),
  // 字面磨損在大字上是砂眼變多。
  pinAmount: clamp(ramp(p.wear, 0, d.pinAmount, d.pinAmount * 2.4), 0, 0.4),
})

/**
 * 成因 → 四級的濾鏡參數。丟給 letterpressCss / filtersMarkup 的 filters 就好。
 */
export const pressTuning = (p: Partial<Press> = {}): FilterTuning => {
  const press = { ...NEUTRAL_PRESS, ...p }
  return {
    small: chip(press, FILTER_DEFAULTS.small),
    text: chip(press, FILTER_DEFAULTS.text),
    heading: chip(press, FILTER_DEFAULTS.heading),
    large: ink(press, FILTER_DEFAULTS.large),
  }
}

/** 紙粗糙的話紙紋本身也該濃一點 —— 那是同一張紙。搭配 --texture 用。 */
export const pressTexture = (p: Partial<Press> = {}) =>
  clamp(ramp({ ...NEUTRAL_PRESS, ...p }.paper, 0.35, 1, 1), 0, 1)
