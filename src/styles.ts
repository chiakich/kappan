import { resolveOptions, type LetterpressOptions } from './options'
import { tokensCss } from './css/tokens'
import { textureCss } from './css/texture'
import { typesetCss } from './css/typeset'

/**
 * 組出完整的一份質感 CSS。純函式、沒有 DOM 也沒有框架。
 *
 * 這些規則全走任意值（紙紋、混色、writing-mode），交給 atomic CSS 產生器
 * 會在 cssgen 沒掃到時整條消失，所以刻意集中成一條字串一次注入。
 */
export const letterpressCss = (options: LetterpressOptions = {}) => {
  const o = resolveOptions(options)
  return [tokensCss(o), textureCss(o), typesetCss(o)].join('\n')
}
