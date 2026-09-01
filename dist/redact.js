// kappan/redact — 把文字逐字包成 .lp-ch，逐字歪斜與濃淡才有東西可以抓。
// 建置期或伺服器端跑完最好，那樣瀏覽器端就完全不需要 JS。
const CJ = /[\u2E80-\u9FFF\u3000-\u30FF\uF900-\uFAFF\uFF00-\uFFEF]/

export function redactedHtml(text, barUnit = 14) {
  let out = ''
  for (const chunk of text.split(/(█+)/)) {
    if (chunk.startsWith('█')) {
      out += `<span class="lp-ch bar" style="--bar-w:${chunk.length * barUnit}px"></span>`
      continue
    }
    for (const ch of chunk) {
      if (ch === ' ') { out += ' '; continue }
      const esc = ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      out += `<span class="lp-ch${CJ.test(ch) ? ' cj' : ''}">${esc}</span>`
    }
  }
  return out
}

/** 就地改寫既有 DOM。已經包過的會跳過，所以重複呼叫是安全的。 */
export function redact(el, barUnit = 14) {
  if (el.classList.contains('lp-ch')) return
  for (const node of [...el.childNodes]) {
    if (node.nodeType === 1) { redact(node, barUnit); continue }
    if (node.nodeType !== 3 || !node.textContent.trim()) continue
    const holder = document.createElement('template')
    holder.innerHTML = redactedHtml(node.textContent, barUnit)
    node.replaceWith(holder.content)
  }
}
