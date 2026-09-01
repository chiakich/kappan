import type { FilterTuning } from './filters'

/**
 * 鉛字質感的可調參數。全部有預設值，只傳想改的那幾個就好。
 */
export interface LetterpressOptions {
  /** 紙色。整層質感都疊在這個底色上。 */
  paper?: string
  /** 主墨色。 */
  ink?: string
  /** 次墨色，給小字級的標籤用。 */
  inkMuted?: string
  /** 硃色。傳統雙色刷的第二次落版：印章、格線都用它。 */
  red?: string
  /**
   * 活字的字堆（.sg）。傳統活版不只有宋體，黑體、楷書、仿宋都鑄過，
   * 所以這裡不綁字體風格 —— 給什麼就排什麼。
   * 預設是開源的一點明體 I.Ming（IPA 授權），字體檔要自己放；
   * 換成日星、思源黑體、蘭陽黑或 justfont 的 webfont 服務都只是改這個字串。
   */
  typeFamily?: string
  /** 西文與標籤的字堆（.tp / .lbl）。打字機體、羅馬體都行。 */
  latinFamily?: string
  /** 四支墨壓濾鏡的參數。見 FilterTuning。 */
  filters?: FilterTuning
  /**
   * 多產幾套預調好的濾鏡（.lp-clean / .lp-worn / .lp-inky），換 class 就能切。
   * filtersMarkup 也要傳同一個值 —— CSS 給了 class 而 SVG 沒給濾鏡的話，
   * `filter: url(#不存在)` 會讓元素整個不渲染。
   */
  variants?: boolean
  /** 直排格線間距，也是 .lp-typed 的行高。 */
  pitch?: string
  /**
   * 逐字歪斜的程度。0 是完全排正，1 是預設。也可以在任何一段上直接改 --lean。
   */
  lean?: number
  /** 逐字墨色濃淡的程度。0 是墨色完全均勻，1 是預設。對應 --weight。 */
  weight?: number
  /** 紙紋疊層的濃度，0~1。0 是白紙一張，1 是預設。對應 --texture；超過 1 沒有意義，opacity 本來就封頂。 */
  texture?: number
  /**
   * SVG filter 的 id 前綴。同一頁掛兩份以上時要給不同前綴，否則 id 會撞在一起。
   * 刻意不用隨機值 —— SSR 兩邊要算出同一組 id。
   */
  idPrefix?: string
  /**
   * 直排標點的補充字型。日星宋體沒有直排替代字形，標點碼位要另外指一套含
   * vert/vrt2 的字型頂上。傳 null 表示不需要（例如只跑橫排，或字型已自備）。
   */
  punctFont?: PunctFont | null
}

export interface PunctFont {
  family: string
  /** woff2 的 URL。由使用端自己決定放哪。 */
  src: string
  weight?: string | number
  /** 預設涵蓋 CJK 標點與全形符號。 */
  unicodeRange?: string
}

export type ResolvedOptions = Required<Omit<LetterpressOptions, 'punctFont' | 'filters'>> & {
  punctFont: Required<PunctFont> | null
  filters: FilterTuning
}

const DEFAULT_PUNCT_RANGE =
  'U+2013-2015, U+2018-201D, U+2025-2026, U+3001-3011, U+3014-301F, U+30FB, U+FF01-FF0F, U+FF1A-FF20, U+FF3B-FF40, U+FF5B-FF65'

export const resolveOptions = (o: LetterpressOptions = {}): ResolvedOptions => ({
  paper: o.paper ?? '#efe9db',
  ink: o.ink ?? '#000',
  inkMuted: o.inkMuted ?? '#000',
  red: o.red ?? '#a2372a',
  typeFamily: o.typeFamily ?? "'I.Ming', 'IMing', 'Noto Serif TC', 'Songti TC', serif",
  latinFamily: o.latinFamily ?? "'Courier New', ui-monospace, monospace",
  filters: o.filters ?? {},
  variants: o.variants ?? false,
  pitch: o.pitch ?? '46px',
  lean: o.lean ?? 1,
  weight: o.weight ?? 1,
  texture: o.texture ?? 1,
  idPrefix: o.idPrefix ?? 'lp',
  punctFont:
    o.punctFont === null || o.punctFont === undefined
      ? null
      : {
          family: o.punctFont.family,
          src: o.punctFont.src,
          weight: o.punctFont.weight ?? 400,
          unicodeRange: o.punctFont.unicodeRange ?? DEFAULT_PUNCT_RANGE,
        },
})
