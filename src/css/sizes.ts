import type { ResolvedOptions } from '../options'

/**
 * 鉛字的字號。兩套平行的傳統：漢字走號數制，西文走各尺寸的專名。
 *
 * 字號 class 同時給「多大」與「用哪支濾鏡」。這兩件事本來就綁在一起 ——
 * 噪點的週期是絕對長度，不會跟著字級放大，所以幾號字該配哪支濾鏡是固定的。
 * 以前那條「31px 以上要自己加 .lp-xl」的規則沒寫在任何地方，就是因為沒有地方放。
 *
 * 字級用 pt 而不是 px：CSS 的 1pt 就是 1/72 吋，跟鉛字的點制是同一個單位，
 * 寫在樣式裡的數字直接就是那顆鉛字的身號。
 *
 * 注意：點制標準化（1886 美式點制）之前各鑄字廠的實際尺寸有出入，英美用法也不同
 * （Agate 與 Ruby 是同尺寸的兩個名字）。這裡採通行值，不等於任一家鑄字行的實際庫存。
 */

export type FilterTier = 's' | 't' | 'd' | 'x'

export interface TypeSize {
  /** class 名，不含 lp- 前綴。 */
  id: string
  /** 號數名或西文專名。 */
  name: string
  /** 身號，美式點制。 */
  pt: number
  tier: FilterTier
}

// 分界照的是濾鏡本身的適用範圍，不是整齊的數字。
const tierFor = (pt: number): FilterTier =>
  pt <= 8 ? 's' : pt <= 17 ? 't' : pt <= 30 ? 'd' : 'x'

const size = (id: string, name: string, pt: number): TypeSize => ({ id, name, pt, tier: tierFor(pt) })

/** 漢字號數制。初號最大，數字愈大字愈小；「小」是半級。 */
export const HAO_SIZES: TypeSize[] = [
  size('sz-0', '初號', 42),
  size('sz-0s', '小初', 36),
  size('sz-1', '一號', 26),
  size('sz-2', '二號', 22),
  size('sz-3', '三號', 16),
  size('sz-4', '四號', 14),
  size('sz-4s', '小四', 12),
  size('sz-5', '五號', 10.5),
  size('sz-5s', '小五', 9),
  size('sz-6', '六號', 7.5),
  size('sz-7', '七號', 5.5),
]

/** 西文專名。點制標準化之前，每個身號都有自己的名字。 */
export const LATIN_SIZES: TypeSize[] = [
  size('canon', 'Canon', 48),
  size('doublepica', 'Double Pica', 24),
  size('paragon', 'Paragon', 20),
  size('greatprimer', 'Great Primer', 18),
  size('columbian', 'Columbian', 16),
  size('english', 'English', 14),
  size('pica', 'Pica', 12),
  size('smallpica', 'Small Pica', 11),
  size('longprimer', 'Long Primer', 10),
  size('bourgeois', 'Bourgeois', 9),
  size('brevier', 'Brevier', 8),
  size('minion', 'Minion', 7),
  size('nonpareil', 'Nonpareil', 6),
  size('agate', 'Agate', 5.5),
  size('pearl', 'Pearl', 5),
]

export const ALL_SIZES = [...HAO_SIZES, ...LATIN_SIZES]

export const sizesCss = (_o: ResolvedOptions) => {
  const sizeRules = ALL_SIZES.map(
    (s) => `.lp .lp-${s.id} { font-size: calc(${s.pt}pt * var(--lp-scale, 1)); filter: var(--lp-${s.tier}); }`
  ).join('\n')

  // 只換濾鏡、不動字級。自訂字級（clamp()、vw…）時用這組指定該吃哪一支。
  // 放在字號 class 之後，寫在一起時由它說了算。
  const tierRules = (['s', 't', 'd', 'x'] as FilterTier[])
    .map((t) => `.lp .lp-f-${t} { filter: var(--lp-${t}); }`)
    .join('\n')

  return `${sizeRules}\n${tierRules}\n`
}
