import { resolveOptions, type LetterpressOptions } from './options'
import { tokensCss } from './css/tokens'
import { textureCss } from './css/texture'
import { typesetCss } from './css/typeset'
import { sizesCss } from './css/sizes'

/**
 * 組出完整的一份質感 CSS。純函式、沒有 DOM 也沒有框架。
 *
 * 這些規則全走任意值（紙紋、混色、writing-mode），交給 atomic CSS 產生器
 * 會在 cssgen 沒掃到時整條消失，所以刻意集中成一條字串一次注入。
 */
export const letterpressCss = (options: LetterpressOptions = {}) => {
  const o = resolveOptions(options)
  // sizes 排最後：字號 class 要蓋得過 texture 那邊按字面指定的濾鏡。
  return [tokensCss(o), textureCss(o), typesetCss(o), sizesCss(o)].join('\n')
}
