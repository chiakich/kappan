// 中日字才吃鉛字歪斜；拉丁字太密，歪起來不自然。空格不包，包了會被 inline-block 吃掉。
const CJ = /[\u2E80-\u9FFF\u3000-\u30FF\uF900-\uFAFF\uFF00-\uFFEF]/

export type RedactToken =
  /** 一根黑條，寬度是 units 個字身。 */
  | { kind: 'bar'; units: number }
  /** 一顆字。cj 決定要不要吃歪斜。 */
  | { kind: 'char'; char: string; cj: boolean }
  /** 空白原樣送出，不包 span。 */
  | { kind: 'space' }

/**
 * 把一段文字切成「一顆字一個 token」，逐字歪斜與逐字打字動畫都靠這個。
 * 純函式，沒有 DOM 也沒有框架 —— 各家轉譯器拿去組自己的節點。
 */
export const splitRedacted = (text: string): RedactToken[] => {
  const out: RedactToken[] = []
  for (const chunk of text.split(/(█+)/)) {
    if (chunk.startsWith('█')) {
      out.push({ kind: 'bar', units: chunk.length })
      continue
    }
    for (const char of chunk) {
      if (char === ' ') out.push({ kind: 'space' })
      else out.push({ kind: 'char', char, cj: CJ.test(char) })
    }
  }
  return out
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** splitRedacted 的 HTML 版，給不用框架的人直接塞 innerHTML。 */
export const redactedHtml = (text: string, barUnit = 14) =>
  splitRedacted(text)
    .map((token) => {
      if (token.kind === 'space') return ' '
      if (token.kind === 'bar') return `<span class="lp-ch bar" style="--bar-w:${token.units * barUnit}px"></span>`
      return `<span class="lp-ch${token.cj ? ' cj' : ''}">${escapeHtml(token.char)}</span>`
    })
    .join('')
