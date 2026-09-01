import { resolveOptions, type LetterpressOptions } from './options'
import { letterpressCss } from './styles'
import { filtersMarkup } from './filters'
import { redactedHtml } from './redact'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * 不用框架的掛法：把樣式與濾鏡塞進文件，回傳一個拆掉它們的函式。
 * 整份文件掛一次就好；同頁要掛第二份記得換 idPrefix。
 */
export const mount = (options: LetterpressOptions = {}, root: Document | ShadowRoot = document) => {
  const o = resolveOptions(options)
  const host = root instanceof Document ? root.head : root

  const style = document.createElement('style')
  style.dataset.letterpress = o.idPrefix
  style.textContent = letterpressCss(options)

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('style', 'position:absolute')
  svg.innerHTML = filtersMarkup(o.idPrefix, o.filters, o.variants)

  host.append(style, svg)
  return () => {
    style.remove()
    svg.remove()
  }
}

/**
 * 把元素裡的文字逐字包成 .lp-ch，逐字歪斜與打字動畫才有東西可以抓。
 * 會往下走訪整棵子樹，已經包過的（.lp-ch）跳過，所以重複呼叫是安全的。
 *
 * 注意：不要對 contenteditable 正在編輯的元素呼叫 —— 邊打字邊換掉節點會打斷
 * 輸入法的組字。要嘛在失焦後才排，要嘛把編輯區與輸出分開。
 */
export const redact = (el: Element, barUnit = 14) => {
  if (el.classList.contains('lp-ch')) return
  for (const node of [...el.childNodes]) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      redact(node as Element, barUnit)
      continue
    }
    if (node.nodeType !== Node.TEXT_NODE) continue
    const text = node.textContent ?? ''
    if (!text.trim()) continue
    const holder = document.createElement('template')
    holder.innerHTML = redactedHtml(text, barUnit)
    node.replaceWith(holder.content)
  }
}
