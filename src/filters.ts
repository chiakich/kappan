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
  /** 邊緣帶的內部門檻。.8 剛好切出最外面那一圈，調它只會讓帶變胖或整個消失。 */
  edgeThreshold: number
  seed: number
  voidSeed: number
  /** 濾鏡區域要留多少邊，位移大就要留多一點。 */
  margin: number
  /** 整體彎曲的噪點頻率。要比字身大得多才會是「彎」而不是「抖」。 */
  warpFrequency: number
  warpSeed: number
  /** 壓痕比墨面大出幾個像素。0 為這一級不做壓痕。 */
  pitRadius: number
}
interface ChipInternals extends Internals {
  chipOctaves: number
  chipSeed: number
  inkOctaves: number
  inkSeed: number
  /** 墨暈圈自己的噪點頻率。介於纖維與彎曲之間，暈圈才會是一圈起伏而不是毛邊。 */
  squashFrequency: number
  squashSeed: number
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
  /**
   * 整條筆畫被推彎幾個像素，0 為不彎。
   *
   * displace 是纖維尺度的高頻抖動，波長只有幾個像素，在大字上看起來是毛邊。
   * 鉛字沒坐平、紙面本身起伏，造成的是另一種尺度的變形：整條筆畫微微不直，
   * 波長跟字身差不多。內文級數上這個尺度大過字本身所以看不見，大字才開。
   */
  warp: number
  /** 吃墨脹開的半徑，0 為不脹。 */
  dilate: number
  /**
   * 被擠出去的那圈墨，邊緣要比字面本身抖多少像素。只在 dilate > 0 時作用。
   *
   * 字面壓到紙的那塊是清楚的，被壓力擠到外圍的墨（squash）才是不規則的 ——
   * 它順著纖維走，哪裡吸得多就往哪裡溢。所以脹開那圈單獨再位移一次，
   * 再把原本的字身蓋回去：核心不動，只有暈圈在晃。
   */
  squash: number
  /**
   * 邊實中淡的程度，0~1。0 為不作用。
   *
   * 壓力把墨往外擠，筆畫中央的墨膜變薄、邊緣堆起來一圈 —— 印壓過重的字看起來
   * 是「描了邊」的。這是印壓獨有的簽名，墨多不會這樣（墨多是整條均勻地胖）。
   * 用 edgeBand 算出來的內部遮罩把中央的 alpha 壓下去，最外一圈保持實心。
   */
  rim: number
  /**
   * 壓痕的深度，0~1。0 為不作用。
   *
   * 壓痕本身看不見，看得見的是光打在坑壁上：光從左上來，筆畫左上側的坑壁背光
   * 多一條暗線，右下側受光多一條亮線。坑比墨面大一點（字面有肩，紙也跟著陷），
   * 所以兩條線落在墨外面那圈紙上。純 alpha 疊層，紙是什麼顏色都成立。
   */
  deboss: number
  /** 缺角的尺度。數字愈小，單個缺口愈大。 */
  chipFrequency: number
  /** 缺角佔的比例，0~1。0 為完全不缺。 */
  chipAmount: number
  /**
   * 把缺角限制在筆畫邊緣多寬的一圈內：false 不限制、3 一像素、5 兩像素。
   *
   * 不限制的話噪點會從筆畫中央挖出洞來，那看起來是墨沾不勻，不是鉛字磨損 ——
   * 金屬的字面是一塊平頂台地，磨損攻擊的是它的邊緣與高度，不會從中間蛀穿。
   */
  chipEdge: BleedKernel
  /** 缺塊的尺度。比 chipFrequency 低一個數量級，洞才大得到能咬斷筆畫。 */
  voidFrequency: number
  /** 缺塊的門檻，0~1。愈高洞愈稀疏；1 為完全不缺。見 voidPass。 */
  voidThreshold: number
  /** 圓角與積墨的核心大小，false 為不做。見 roundFilter。 */
  round: BleedKernel
  /** 圓角與積墨的門檻。.5 接近純圓角，愈低愈偏積墨（整體也會胖一點）。 */
  roundThreshold: number
  /** 墨暈的核心大小：false 不暈、3 暈一像素、5 暈兩像素。見 bleedFilter。 */
  bleed: BleedKernel
  /** 最後把 alpha 拉硬的斜率。太低會糊，太高會把濃淡壓平。 */
  contrast: number
  /** 拉硬時的偏移，負值等於把淡的部分吃掉。 */
  threshold: number
  /**
   * 最後整體的墨量，0~1。1 是印飽，愈低愈灰。
   *
   * 壓力不足、字面磨低於字身高度，墨都轉印不完全 —— 那先表現成整體發灰，
   * 而不是形狀缺一塊。這道是純粹的 per-pixel alpha 縮放，任何字級都精確。
   */
  fade: number
  /**
   * 字內濃淡的尺度。數字愈小斑塊愈大；要像鉛字沒坐平，波長得跟字身差不多。
   *
   * 這跟 -x 的密度場是同一道，但排在拉硬之後：挖式濾鏡的拉硬斜率會把任何灰階
   * 推回實心，先乘再拉硬等於白做。放在拉硬之後就是純粹的 alpha 縮放，任何字級都準。
   * 實印上一顆字一側飽一側虛（「日」上半淡、「鑄」左半飽），就是這一道在做。
   */
  inkFrequency: number
  /** 最淡處還剩多少墨，0~1。1 為完全均勻（不作用）。 */
  inkFloor: number
}

/** 調密度式濾鏡（-x）的參數。 */
export interface InkTuning {
  grainFrequency: number
  displace: number
  /** 整條筆畫被推彎幾個像素。欄位意義同 ChipTuning。 */
  warp: number
  /** 邊實中淡的程度。欄位意義同 ChipTuning。 */
  rim: number
  /** 壓痕的深度。欄位意義同 ChipTuning。 */
  deboss: number
  /** 濃淡斑塊的尺度。數字愈小，斑塊愈大。 */
  inkFrequency: number
  /** 最淡處還剩多少墨，0~1。設 1 就是完全均勻。 */
  inkFloor: number
  /** 細砂眼佔的比例，0~1。 */
  pinFrequency: number
  pinAmount: number
  /** 砂眼限制在邊緣多寬的一圈內。欄位意義同 ChipTuning。 */
  chipEdge: BleedKernel
  /** 缺塊。欄位意義同 ChipTuning。 */
  voidFrequency: number
  voidThreshold: number
  /** 圓角與積墨。欄位意義同 ChipTuning。 */
  round: BleedKernel
  roundThreshold: number
  /** 墨暈的核心大小：false 不暈、3 暈一像素、5 暈兩像素。見 bleedFilter。 */
  bleed: BleedKernel
  contrast: number
  threshold: number
  /** 整體墨量。欄位意義同 ChipTuning。 */
  fade: number
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
// 缺塊門檻 .66 / .68 / .72 / .66，崩角 .16 / .15 / .295 —— 對著實印見本調出來的；
// -d 與 -x 是分別在二號、初號上直接對出來的，-s / -t 是平滑過的一組，兩邊在三號／二號之間有一階。
// 墨暈寫的是中性紙下實際渲染的值：press.ts 中性時沿用這裡，紙粗或墨多才一律升到 5。
// -s / -t 是「平滑過」的一組：位移 .55 → .65 緩升、墨暈一律 3（一像素，髮絲不會被兩像素的暈吞掉）、
// 拉硬內文略高於標題。字內濃淡的波長取字身一半；六號字身裡塞不下濃淡，floor 留 1（關）。
const SMALL: ChipSpec = {
  grainFrequency: 1.1, displace: 0.55, warp: 0, dilate: 0, squash: 0.8, rim: 0, deboss: 0, chipFrequency: 1.7, chipAmount: 0.16,
  voidFrequency: 0.35, voidThreshold: 0.66, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  round: false as BleedKernel, roundThreshold: 0.41,
  chipEdge: 3, bleed: 3, contrast: 1.5, threshold: -0.1, fade: 1, inkFrequency: 0.2, inkFloor: 1,
  grainOctaves: 2, chipOctaves: 3, seed: 4, chipSeed: 31, inkOctaves: 2, inkSeed: 23, margin: 14, edgeThreshold: 0.8,
  warpFrequency: 0.03, warpSeed: 3, squashFrequency: 0.14, squashSeed: 37, pitRadius: 0,
}
// 這一級涵蓋 8 到 17pt，只有一支濾鏡，斑塊相對字身的比例會隨字號略變。
const TEXT: ChipSpec = {
  grainFrequency: 0.88, displace: 0.65, warp: 0, dilate: 0, squash: 1, rim: 0, deboss: 0, chipFrequency: 1.05, chipAmount: 0.15,
  voidFrequency: 0.35, voidThreshold: 0.68, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  round: false as BleedKernel, roundThreshold: 0.41,
  chipEdge: 3, bleed: 3, contrast: 1.4, threshold: -0.1, fade: 1, inkFrequency: 0.13, inkFloor: 0.8,
  grainOctaves: 3, chipOctaves: 4, seed: 9, chipSeed: 27, inkOctaves: 2, inkSeed: 23, margin: 16, edgeThreshold: 0.8,
  warpFrequency: 0.03, warpSeed: 3, squashFrequency: 0.14, squashSeed: 37, pitRadius: 0,
}
// -d 這組是拿日星鑄字行貳號宋體的實印照片並排、在二號字上調出來的：邊緣不拉硬（contrast 1），
// 墨暈 3 留一像素的柔邊而不糊；積墨門檻 .41 接近純圓角；位移 .65 給輪廓一點紙纖維感。
// 字內濃淡取 .157 / .87：比「一顆字一塊」細得多，是筆畫上細碎的沾墨不勻。
const HEADING: ChipSpec = {
  grainFrequency: 0.6, displace: 0.65, warp: 0.4, dilate: 0.1, squash: 0.8, rim: 0, deboss: 0, chipFrequency: 0.5, chipAmount: 0.295,
  voidFrequency: 0.35, voidThreshold: 0.72, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  round: 3 as BleedKernel, roundThreshold: 0.41,
  chipEdge: 5, bleed: 3, contrast: 1, threshold: -0.095, fade: 1, inkFrequency: 0.157, inkFloor: 0.87,
  grainOctaves: 3, chipOctaves: 4, seed: 13, chipSeed: 19, inkOctaves: 2, inkSeed: 23, margin: 22, edgeThreshold: 0.8,
  warpFrequency: 0.03, warpSeed: 3, squashFrequency: 0.14, squashSeed: 37, pitRadius: 1,
}
// -x 對著實印照片在初號上調過：密度場換成拉開對比的版本後 floor 留在 .5，
// 位移放到 1.2，拉硬 1.8 讓砂眼與缺塊的邊乾淨一點。
const LARGE: InkSpec = {
  grainFrequency: 0.34, displace: 1.2, warp: 0.8, rim: 0, deboss: 0, inkFrequency: 0.06, inkFloor: 0.5,
  pinFrequency: 0.55, pinAmount: 1 / 12,
  voidFrequency: 0.35, voidThreshold: 0.66, voidHardness: 40, voidOctaves: 3, voidSeed: 71,
  round: false as BleedKernel, roundThreshold: 0.49,
  chipEdge: 5, bleed: 5, contrast: 1.8, threshold: -0.03, fade: 1,
  grainOctaves: 3, inkOctaves: 3, pinOctaves: 2, seed: 7, inkSeed: 23, pinSeed: 47, margin: 12, edgeThreshold: 0.8,
  warpFrequency: 0.02, warpSeed: 3, pitRadius: 1,
}

// 48 段夠細，1/7、1/4、1/12 都落得回原本的門檻上。1 一律放在最亮那端。
const STEPS = 48
const discreteTable = (amount: number) => {
  const ones = Math.max(0, Math.min(STEPS, Math.round(amount * STEPS)))
  return Array.from({ length: STEPS }, (_, i) => (i >= STEPS - ones ? 1 : 0)).join(' ')
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
const voidPass = (
  t: { voidFrequency: number; voidThreshold: number; voidHardness: number; voidOctaves: number; voidSeed: number },
  input: string,
  strength: number,
  /**
   * 「內部」遮罩。給了就把洞限制在有內部的地方 —— 一像素寬的髮絲筆畫算不出內部，
   * 所以永遠不會被打斷。物理上也對：鹽粒感是墨沒填進紙的凹谷，那要有面積才顯得出來；
   * 髮絲要嘛印出來要嘛整條不見，不會中間破一個洞。
   */
  interior?: string
) => {
  // 跟其他參數一致：strength 0 等於整道關掉，2 等於破得更兇。
  const threshold = 1 - (1 - t.voidThreshold) * strength
  if (threshold >= 1) return { markup: '', out: input }
  const k = t.voidHardness
  return {
    markup: `  <feTurbulence type="fractalNoise" baseFrequency="${t.voidFrequency}" numOctaves="${t.voidOctaves}" seed="${t.voidSeed}" result="vn"/>
  <feColorMatrix in="vn" type="luminanceToAlpha" result="vnl"/>
  <feComponentTransfer in="vnl" result="vm"><feFuncA type="linear" slope="${k}" intercept="${+(-k * threshold).toFixed(3)}"/></feComponentTransfer>
  ${interior ? `<feComposite in="vm" in2="${interior}" operator="in" result="vmi"/>\n  ` : ''}<feComposite in="${input}" in2="${interior ? 'vmi' : 'vm'}" operator="out" result="voided"/>\n`,
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

/**
 * 圓角與積墨。鉛字的字面是銳利的金屬，但印出來不是 —— 起收筆沒有尖角，
 * 而橫筆起頭那類筆畫交會處會看得到積墨。這兩件事其實是同一個運算：
 * 模糊之後在中值附近砍門檻。凸角周圍的墨少，模糊後掉到門檻下就被削圓；
 * 凹角周圍的墨多，模糊後高過門檻就被填起來。
 *
 * 門檻 .5 大致保持面積（純圓角），往下走就偏積墨。排在整條鏈路最前面：
 * 墨轉印的當下字形就已經圓了，之後才被紙面推歪、才被磨損咬掉。
 *
 * 圓的半徑是絕對長度（核心大小決定），所以字級愈小佔比愈大 —— 這一點決定了誰能開。
 *
 * -s 與 -t 預設關掉。明體的橫畫在五號、六號上是次像素的：假設反鋸齒後是 0.6 的一列
 * 加上下各 0.2，3×3 卷積後峰值只剩 (4×.6 + 4×.2 + 4×.2)/16 = 0.25，低於門檻 .42，
 * 整條橫畫在進入後面所有濾鏡之前就被切掉了。看起來像缺損變多，其實是先被削掉一截，
 * 剩下的殘骸再去吃缺角與缺塊。實心一像素的筆畫則是 (2+4+2)/16 = .5，過得了門檻 ——
 * 所以大字沒事，在 probe 上調出來的 .42 換到內文級數就是災難。
 *
 * 要在內文級數也吃圓角的話，門檻得壓到 .2 上下才留得住次像素的橫畫，但那時整體會胖
 * 一大圈，就不叫圓角叫積墨了。-x 一樣關掉，理由相反：初號 42pt 上的一像素看不出來。
 */
const roundFilter = (t: { round: BleedKernel; roundThreshold: number }, out: string) => {
  if (!t.round) return { markup: '', out: 'SourceGraphic' }
  const k = KERNELS[t.round]
  const K = 60
  return {
    markup: `  <feConvolveMatrix in="SourceGraphic" order="${t.round}" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="rb"/>
  <feComponentTransfer in="rb" result="${out}"><feFuncA type="linear" slope="${K}" intercept="${+(-K * t.roundThreshold).toFixed(2)}"/></feComponentTransfer>\n`,
    out,
  }
}

/**
 * 邊緣帶。把一個遮罩限制在筆畫最外面那一圈之內。
 *
 * 做法跟 roundFilter 同源：固定核心卷積一次，再用高門檻切出「內部」——
 * 鄰域幾乎全是墨的才算內部。原圖減掉內部，剩下的就是一圈邊緣。
 * 直邊上算得出來剛好是最外面一像素（3×3 的話中心值 .75 < .8 被切掉，
 * 往內一格是 1 留下來），5×5 則是兩像素。
 *
 * 為什麼要這一道：噪點直接對整個字身做 operator="out" 的話，洞會從筆畫中央
 * 冒出來，那是墨沾不勻的樣子。金屬的字面是一塊平頂台地，磨損攻擊的是它的
 * 邊緣與高度 —— 崩角發生在邊上，不會從中間蛀穿。
 */
const edgeBand = (t: { chipEdge: BleedKernel; edgeThreshold: number }, input: string) => {
  if (!t.chipEdge) return { markup: '', out: '' }
  const k = KERNELS[t.chipEdge]
  const K = 60
  return {
    markup: `  <feConvolveMatrix in="${input}" order="${t.chipEdge}" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="eb"/>
  <feComponentTransfer in="eb" result="einner"><feFuncA type="linear" slope="${K}" intercept="${+(-K * t.edgeThreshold).toFixed(2)}"/></feComponentTransfer>
  <feComposite in="${input}" in2="einner" operator="out" result="eband"/>\n`,
    out: 'eband',
  }
}

/**
 * 邊實中淡。要排在拉硬之後 —— 拉硬的斜率會把任何小於 1 的內部 alpha 又推回 1。
 * 內部遮罩借 edgeBand 的 einner，所以沒有邊緣帶的濾鏡做不了這一道。
 */
const rimPass = (rim: number, input: string, interior: string | undefined, out: string) => {
  if (rim <= 0 || !interior) return { markup: '', out: input }
  return {
    markup: `  <feComposite in="${input}" in2="${interior}" operator="in" result="rimIn"/>
  <feComponentTransfer in="rimIn" result="rimDim"><feFuncA type="linear" slope="${+(1 - Math.min(1, rim)).toFixed(3)}"/></feComponentTransfer>
  <feComposite in="${input}" in2="${interior}" operator="out" result="rimEdge"/>
  <feComposite in="rimEdge" in2="rimDim" operator="over" result="${out}"/>\n`,
    out,
  }
}

/** 整體墨量。壓力不足或字面磨低都是墨轉印不完全，先發灰才缺形狀。 */
const fadePass = (fade: number, input: string, out: string) =>
  fade >= 1
    ? { markup: '', out: input }
    : {
        markup: `  <feComponentTransfer in="${input}" result="${out}"><feFuncA type="linear" slope="${+fade.toFixed(3)}"/></feComponentTransfer>\n`,
        out,
      }

/**
 * 濃淡場。fractalNoise 取亮度後擠在 0.5 附近，直接查表只有極少數像素會掉到 floor，
 * 整張遮罩幾乎都是 1。先以 0.5 為中心拉開 3.2 倍，再用一張前半段下沉的表：
 * 大約四分之一的面積會淡下去，其餘保持飽滿 —— 一顆字一側虛一側飽。-x 與挖式三級共用。
 */
const densityMask = (
  t: { inkFrequency: number; inkOctaves: number; inkSeed: number },
  floor: number,
  out: string
) => {
  const K = 3.2
  const at = (x: number) => +(floor + (1 - floor) * x).toFixed(3)
  const table = [at(0), at(0.45), at(0.85), 1, 1].join(' ')
  return `  <feTurbulence type="fractalNoise" baseFrequency="${t.inkFrequency}" numOctaves="${t.inkOctaves}" seed="${t.inkSeed}" result="${out}N"/>
  <feColorMatrix in="${out}N" type="luminanceToAlpha" result="${out}L"/>
  <feComponentTransfer in="${out}L" result="${out}S"><feFuncA type="linear" slope="${K}" intercept="${+(0.5 - 0.5 * K).toFixed(3)}"/></feComponentTransfer>
  <feComponentTransfer in="${out}S" result="${out}"><feFuncA type="table" tableValues="${table}"/></feComponentTransfer>
`
}

/**
 * 字內濃淡。低頻噪點映射成一張大多接近 1、偶爾掉到 floor 的濃淡場，乘進 alpha。
 * 跟 -x 的密度場同一張表，差別在這裡排在拉硬之後 —— 見 ChipTuning.inkFrequency。
 */
const inkPass = (
  t: { inkFrequency: number; inkFloor: number; inkOctaves: number; inkSeed: number },
  input: string,
  strength: number,
  out: string
) => {
  const floor = clamp01(1 - (1 - t.inkFloor) * strength)
  if (floor >= 1) return { markup: '', out: input }
  return {
    markup: `${densityMask(t, floor, 'cinkmask')}  <feComposite in="${input}" in2="cinkmask" operator="in" result="${out}"/>\n`,
    out,
  }
}

/**
 * 壓痕。用位移差取坑壁，不用打光濾鏡。
 *
 * 坑的範圍是字身脹開 pitRadius；往右下平移一像素之後沒被蓋到的那圈是左上壁
 * （背光，暗），反向平移剩下的那圈是右下壁（受光，亮）。兩條帶都挖掉墨本身，
 * 只留在紙上。每一步都是整數位移與布林合成，兩個引擎逐像素相同 ——
 * feDiffuseLighting 要先模糊高度圖，又會回到次像素模糊不一致的老問題。
 *
 * 坑的形狀取 rough（彎過、被纖維推過、還沒脹開的字身）：壓痕跟著鉛字走，
 * 不跟著擠出去的墨走。白紙上亮線會消失只剩暗線，那也對，白紙上本來就只看得到影子。
 */
const debossPass = (
  t: { deboss: number; pitRadius: number },
  shape: string,
  ink: string,
  strength: number,
  out: string
) => {
  const depth = Math.min(1, t.deboss * strength)
  if (depth <= 0 || t.pitRadius <= 0) return { markup: '', out: ink }
  const shade = +(0.16 * depth).toFixed(3)
  // 亮線壓得比暗線低很多：紙不是純白，亮線一明顯就跟暗線湊成浮雕邊。
  const light = +(0.1 * depth).toFixed(3)
  // 坑壁不是一條硬線，紙是被慢慢壓下去的。用寫死的 3×3 核心柔化，兩個引擎才一致。
  // 上色不用 feFlood + feComposite in：Chrome 把濾鏡套在 HTML 元素上時會把低 flood-opacity
  // 畫成實心，暗線亮線變成浮雕邊（同一支濾鏡在 SVG 圖檔裡是對的）。feColorMatrix 直接把
  // 牆帶的 alpha 乘成目標濃度並填色，兩條路徑結果相同。
  const k = KERNELS[3]
  const soften = (input: string, out: string) =>
    `  <feConvolveMatrix in="${input}" order="3" kernelMatrix="${k.matrix}" divisor="${k.divisor}" edgeMode="none" result="${out}"/>\n`
  return {
    markup: `  <feMorphology in="${shape}" operator="dilate" radius="${t.pitRadius}" result="pit"/>
  <feOffset in="pit" dx="1" dy="1" result="pitSE"/>
  <feComposite in="pit" in2="pitSE" operator="out" result="wallNW"/>
  <feComposite in="wallNW" in2="${ink}" operator="out" result="wallNWp"/>
${soften('wallNWp', 'wallNWs')}  <feColorMatrix in="wallNWs" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${shade} 0" result="shade"/>
  <feOffset in="pit" dx="-1" dy="-1" result="pitNW"/>
  <feComposite in="pit" in2="pitNW" operator="out" result="wallSE"/>
  <feComposite in="wallSE" in2="${ink}" operator="out" result="wallSEp"/>
${soften('wallSEp', 'wallSEs')}  <feColorMatrix in="wallSEs" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${light} 0" result="light"/>
  <feMerge result="${out}"><feMergeNode in="shade"/><feMergeNode in="light"/><feMergeNode in="${ink}"/></feMerge>\n`,
    out,
  }
}

/**
 * 整體彎曲。一張頻率極低的噪點當位移圖，整條筆畫跟著微微彎。
 *
 * 跟 fib 那道是同一個 primitive，差在尺度：fib 的波長幾個像素，是纖維把邊緣
 * 推歪；這道的波長幾十個像素，是鉛字沒坐平或紙面起伏，把整條筆畫推彎。
 * 兩者疊起來才像 —— 只有高頻是毛邊，只有低頻是字型做壞了。
 * 排在 fib 之前：先是版面歪，然後才是紙面在邊緣上作用。
 */
const warpPass = (
  t: { warp: number; warpFrequency: number; warpSeed: number },
  input: string,
  strength: number
) => {
  const scale = t.warp * strength
  if (scale <= 0) return { markup: '', out: input }
  return {
    markup: `  <feTurbulence type="fractalNoise" baseFrequency="${t.warpFrequency}" numOctaves="1" seed="${t.warpSeed}" result="wp"/>
  <feDisplacementMap in="${input}" in2="wp" scale="${+scale.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="warped"/>\n`,
    out: 'warped',
  }
}

/**
 * 墨暈圈單獨抖。脹開之後的形狀再位移一次，然後把沒脹開的字身蓋回去。
 *
 * 位移量比暈圈本身寬，所以有的地方暈圈被拉進字身底下（等於沒暈），
 * 有的地方被推出去（暈得更開）—— 那就是墨順著纖維不均勻地溢出來的樣子。
 * 核心 over 在上面，字面接觸的那塊永遠清楚。
 */
const squashPass = (
  t: { squash: number; squashFrequency: number; squashSeed: number },
  core: string,
  halo: string,
  strength: number,
  out: string
) => {
  const scale = t.squash * strength
  if (scale <= 0) return ''
  return `  <feTurbulence type="fractalNoise" baseFrequency="${t.squashFrequency}" numOctaves="2" seed="${t.squashSeed}" result="sq"/>
  <feDisplacementMap in="${halo}" in2="sq" scale="${+scale.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="squashed"/>
  <feComposite in="${core}" in2="squashed" operator="over" result="${out}"/>\n`
}

const chipFilter = (id: string, t: ChipSpec, strength: number) => {
  const displace = t.displace * strength
  const dilate = t.dilate * strength
  const size = 100 + t.margin * 2
  const shaped = roundFilter(t, 'shaped')
  const warped = warpPass(t, shaped.out, strength)
  const base = dilate > 0 ? 'gain' : 'rough'
  const band = edgeBand(t, base)
  // einner 由 edgeBand 產生，順序上排在 gap 前面，所以拿得到。
  const gap = voidPass(t, 'chipped', strength, band.out ? 'einner' : undefined)
  // squash 有開就把脹開的結果先抖過再叫 gain，沒開就直接叫 gain。
  const squash = dilate > 0 ? squashPass(t, 'rough', 'grown', strength, 'gain') : ''
  const inked = inkPass(t, 'hard', strength, 'inked')
  const rim = rimPass(t.rim, inked.out, band.out ? 'einner' : undefined, 'rimmed')
  const fade = fadePass(t.fade, rim.out, 'faded')
  const deboss = debossPass(t, 'rough', fade.out, strength, 'pressed')
  const grow =
    dilate > 0
      ? `  <feMorphology in="rough" operator="dilate" radius="${+dilate.toFixed(3)}" result="${squash ? 'grown' : 'gain'}"/>\n${squash}`
      : ''
  return `
<filter id="${id}" x="-${t.margin}%" y="-${t.margin}%" width="${size}%" height="${size}%" color-interpolation-filters="sRGB">
${shaped.markup}${warped.markup}  <feTurbulence type="fractalNoise" baseFrequency="${t.grainFrequency}" numOctaves="${t.grainOctaves}" seed="${t.seed}" result="fib"/>
  <feDisplacementMap in="${warped.out}" in2="fib" scale="${+displace.toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
${grow}  <feTurbulence type="fractalNoise" baseFrequency="${t.chipFrequency}" numOctaves="${t.chipOctaves}" seed="${t.chipSeed}" result="mot"/>
  <feColorMatrix in="mot" type="luminanceToAlpha" result="motl"/>
  <feComponentTransfer in="motl" result="chip"><feFuncA type="discrete" tableValues="${discreteTable(clamp01(t.chipAmount * strength))}"/></feComponentTransfer>
${band.markup}${band.out ? `  <feComposite in="chip" in2="${band.out}" operator="in" result="chipRim"/>\n` : ''}  <feComposite in="${base}" in2="${band.out ? 'chipRim' : 'chip'}" operator="out" result="chipped"/>
${gap.markup}${bleedFilter(gap.out, t.bleed)}  <feComponentTransfer in="${t.bleed ? 'b' : gap.out}" result="hard"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
${inked.markup}${rim.markup}${fade.markup}${deboss.markup}</filter>`
}

const inkFilter = (id: string, t: InkSpec, strength: number) => {
  const size = 100 + t.margin * 2
  // strength 0 = 完全均勻；strength 2 = 淡處再淡一倍。
  const floor = clamp01(1 - (1 - t.inkFloor) * strength)
  const shaped = roundFilter(t, 'shaped')
  const warped = warpPass(t, shaped.out, strength)
  // 砂眼也限在邊緣：新字的砂眼是鑄造缺陷（會在面上），但 wear 拉高時多出來的
  // 是磨損，那發生在邊上。兩者共用一道遮罩，取磨損那個位置比較不會像髒點。
  const band = edgeBand(t, 'uneven')
  const gap = voidPass(t, 'chipped', strength, band.out ? 'einner' : undefined)
  const rim = rimPass(t.rim, 'hard', band.out ? 'einner' : undefined, 'rimmed')
  const fade = fadePass(t.fade, rim.out, 'faded')
  const deboss = debossPass(t, 'rough', fade.out, strength, 'pressed')
  return `
<filter id="${id}" x="-${t.margin}%" y="-${t.margin}%" width="${size}%" height="${size}%" color-interpolation-filters="sRGB">
${shaped.markup}${warped.markup}  <feTurbulence type="fractalNoise" baseFrequency="${t.grainFrequency}" numOctaves="${t.grainOctaves}" seed="${t.seed}" result="fib"/>
  <feDisplacementMap in="${warped.out}" in2="fib" scale="${+(t.displace * strength).toFixed(3)}" xChannelSelector="R" yChannelSelector="G" result="rough"/>
${densityMask(t, floor, 'inkmask')}  <feComposite in="rough" in2="inkmask" operator="in" result="uneven"/>
  <feTurbulence type="fractalNoise" baseFrequency="${t.pinFrequency}" numOctaves="${t.pinOctaves}" seed="${t.pinSeed}" result="pin"/>
  <feColorMatrix in="pin" type="luminanceToAlpha" result="pinl"/>
  <feComponentTransfer in="pinl" result="pinmask"><feFuncA type="discrete" tableValues="${discreteTable(clamp01(t.pinAmount * strength))}"/></feComponentTransfer>
${band.markup}${band.out ? `  <feComposite in="pinmask" in2="${band.out}" operator="in" result="pinRim"/>\n` : ''}  <feComposite in="uneven" in2="${band.out ? 'pinRim' : 'pinmask'}" operator="out" result="chipped"/>
${gap.markup}${bleedFilter(gap.out, t.bleed)}  <feComponentTransfer in="${t.bleed ? 'b' : gap.out}" result="hard"><feFuncA type="linear" slope="${t.contrast}" intercept="${t.threshold}"/></feComponentTransfer>
${rim.markup}${fade.markup}${deboss.markup}</filter>`
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
