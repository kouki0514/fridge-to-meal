import { useState, useRef, useCallback } from 'react'
import './IngredientInput.css'

const PRESET_CATEGORIES = [
  {
    label: '肉・卵',
    items: ['鶏肉', '豚肉', '牛肉', '卵', '鶏ひき肉', 'ベーコン'],
  },
  {
    label: '野菜',
    items: ['玉ねぎ', 'にんじん', 'じゃがいも', 'キャベツ', 'ほうれん草',
            'トマト', 'なす', 'ピーマン', '白菜', 'きゅうり', 'ブロッコリー'],
  },
  {
    label: 'きのこ・豆腐',
    items: ['しめじ', 'えのき', 'エリンギ', '木綿豆腐', '絹豆腐', '納豆'],
  },
  {
    label: '主食・乾物',
    items: ['ごはん', 'パスタ', 'うどん', '春雨', '食パン'],
  },
]

export default function IngredientInput({ onSuggest, loading }) {
  const [ingredients, setIngredients] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [expandedCat, setExpandedCat] = useState(null) // null = show first row only
  const inputRef = useRef(null)

  const addIngredient = useCallback((value) => {
    const trimmed = value.trim()
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients(prev => [...prev, trimmed])
    }
    setInputValue('')
    inputRef.current?.focus()
  }, [ingredients])

  const removeIngredient = useCallback((item) => {
    setIngredients(prev => prev.filter(i => i !== item))
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',' || e.key === '　') {
      e.preventDefault()
      if (inputValue.trim()) addIngredient(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && ingredients.length > 0) {
      setIngredients(prev => prev.slice(0, -1))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const pending = inputValue.trim()
    const list = pending ? [...ingredients, pending] : ingredients
    if (list.length === 0) return
    setInputValue('')
    onSuggest(list)
  }

  const hasIngredients = ingredients.length > 0
  const submitDisabled = loading || (!hasIngredients && !inputValue.trim())

  return (
    <div className="input-card">
      <h2 className="input-title">
        <span aria-hidden="true">🥦</span> 冷蔵庫の食材を入力
      </h2>
      <p className="input-hint">
        食材を入力してEnterで追加。複数入力できます。
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Tag box ── */}
        <div
          className="tag-input"
          onClick={() => inputRef.current?.focus()}
          role="group"
          aria-label="追加済みの食材"
        >
          {ingredients.map(item => (
            <span key={item} className="tag">
              {item}
              <button
                type="button"
                className="tag-remove"
                onClick={(e) => { e.stopPropagation(); removeIngredient(item) }}
                aria-label={`${item}を削除`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="tag-text-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ingredients.length === 0 ? '例: 卵、鶏肉、玉ねぎ…' : '食材を追加…'}
            aria-label="食材を入力"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>

        {/* ── Preset categories ── */}
        <div className="presets">
          {PRESET_CATEGORIES.map(cat => {
            const isOpen = expandedCat === cat.label
            const available = cat.items.filter(s => !ingredients.includes(s))
            if (available.length === 0) return null
            // Show first 4 items collapsed, all when expanded
            const visible = isOpen ? available : available.slice(0, 4)

            return (
              <div key={cat.label} className="preset-cat">
                <span className="preset-cat-label">{cat.label}</span>
                <div className="preset-buttons">
                  {visible.map(s => (
                    <button
                      key={s}
                      type="button"
                      className="preset-btn"
                      onClick={() => addIngredient(s)}
                    >
                      {s}
                    </button>
                  ))}
                  {available.length > 4 && (
                    <button
                      type="button"
                      className="preset-btn preset-btn--more"
                      onClick={() => setExpandedCat(isOpen ? null : cat.label)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? '閉じる' : `+${available.length - 4}`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Submit row ── */}
        <div className="submit-row">
          {hasIngredients && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setIngredients([])}
            >
              クリア
            </button>
          )}
          <button
            type="submit"
            className="suggest-btn"
            disabled={submitDisabled}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="btn-spinner" aria-hidden="true" />
                提案中…
              </span>
            ) : (
              '✨ 献立を提案する'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
