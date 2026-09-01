import React from 'react'
import { resolveOptions, type LetterpressOptions } from './options'
import { letterpressCss } from './styles'
import { filtersMarkup } from './filters'
import { splitRedacted } from './redact'

/**
 * React 這一層刻意只是薄殼：所有內容都由無框架的核心算出來，
 * 這裡負責的只有「掛成節點」。要接別的框架照這份抄一份就好。
 */

/** 注入質感層的規則。每頁一次就好，要搭配同一組 idPrefix 的 <LetterpressFilters />。 */
export const LetterpressStyles = (options: LetterpressOptions = {}) => (
  <style dangerouslySetInnerHTML={{ __html: letterpressCss(options) }} />
)

/**
 * 濾鏡本體。整頁只掛一份，CSS 那邊用 var(--lp-*) 指過來。
 * 傳跟 <LetterpressStyles> 同一份 options，idPrefix 與濾鏡參數才會對得上。
 */
export const LetterpressFilters = (options: LetterpressOptions = {}) => {
  const o = resolveOptions(options)
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute' }}
      dangerouslySetInnerHTML={{ __html: filtersMarkup(o.idPrefix, o.filters, o.variants) }}
    />
  )
}

/** 逐字包成 .lp-ch，讓逐字歪斜與打字動畫有東西可以抓。連續的 █ 換成一根黑條。 */
export const Redacted = ({ text, barUnit = 14 }: { text: string; barUnit?: number }) => (
  <>
    {splitRedacted(text).map((token, i) => {
      if (token.kind === 'space') return ' '
      if (token.kind === 'bar') {
        return <span key={i} className="lp-ch bar" style={{ '--bar-w': `${token.units * barUnit}px` } as React.CSSProperties} />
      }
      return (
        <span key={i} className={token.cj ? 'lp-ch cj' : 'lp-ch'}>
          {token.char}
        </span>
      )
    })}
  </>
)

export type { LetterpressOptions } from './options'
