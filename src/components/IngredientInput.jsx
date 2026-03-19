import { useState, useRef, useCallback } from 'react'
import './IngredientInput.css'

const UNITS = ['個', 'g', 'ml', '枚', '本', '袋', 'パック', '束', 'かけ', '大さじ', '小さじ', '適量', '少々']

const PRESET_CATEGORIES = [
  {
    label: '肉・卵',
    items: ['鶏肉', '豚肉', '牛肉', '卵', '鶏ひき肉', 'ベーコン', 'ソーセージ',
            '豚バラ肉', '鶏もも肉', '鶏胸肉', '合いびき肉', 'ハム'],
  },
  {
    label: '魚介類',
    items: ['鮭', 'まぐろ', 'えび', 'いか', 'あさり', 'しらす', 'ツナ缶',
            'さば缶', '鮭フレーク', 'かにかまぼこ', 'たこ', 'ほたて', 'さんま', 'いわし缶'],
  },
  {
    label: '野菜',
    items: ['玉ねぎ', 'にんじん', 'じゃがいも', 'キャベツ', 'ほうれん草',
            'トマト', 'なす', 'ピーマン', '白菜', 'きゅうり', 'ブロッコリー',
            '大根', 'ねぎ', 'もやし', 'レタス', 'かぼちゃ', 'ごぼう', 'れんこん',
            'セロリ', 'アスパラ', 'ズッキーニ', 'パプリカ'],
  },
  {
    label: 'きのこ・豆腐',
    items: ['しめじ', 'えのき', 'エリンギ', '木綿豆腐', '絹豆腐', '納豆',
            '厚揚げ', '油揚げ', '舞茸', '椎茸'],
  },
  {
    label: '乳製品',
    items: ['牛乳', 'チーズ', 'バター', 'ヨーグルト', '生クリーム', '豆乳',
            'スライスチーズ', 'クリームチーズ', '粉チーズ', 'バター', 'マーガリン'],
  },
  {
    label: '調味料',
    items: ['醤油', 'みりん', '酒', '味噌', '砂糖', '塩', 'ごま油', 'オリーブオイル',
            '酢', 'めんつゆ', '鶏がらスープの素', 'コンソメ', 'ケチャップ',
            'マヨネーズ', 'ソース', '片栗粉', '小麦粉'],
  },
  {
    label: '主食・乾物',
    items: ['ごはん', 'パスタ', 'うどん', '春雨', '食パン', 'そば', '中華麺',
            'ラーメン', '米', '餃子の皮'],
  },
  {
    label: '果物',
    items: ['りんご', 'バナナ', 'みかん', 'いちご', 'ぶどう', 'もも', 'キウイ',
            'レモン', 'メロン', 'なし', 'パイナップル', 'マンゴー'],
  },
]

function serializeIngredient(ing) {
  if (!ing.amount) return ing.name
  if (ing.unit === '適量' || ing.unit === '少々') return `${ing.name}（${ing.unit}）`
  return `${ing.name} ${ing.amount}${ing.unit}`
}

export default function IngredientInput({ onSuggest, loading }) {
  const [ingredients, setIngredients] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [expandedCat, setExpandedCat] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [qtyAmount, setQtyAmount] = useState('')
  const [qtyUnit, setQtyUnit] = useState('個')
  const inputRef = useRef(null)

  const addIngredient = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed || ingredients.some(i => i.name === trimmed)) return
    const id = trimmed + '-' + Date.now()
    setIngredients(prev => [...prev, { id, name: trimmed, amount: '', unit: '個' }])
    setInputValue('')
    inputRef.current?.focus()
  }, [ingredients])

  const removeIngredient = useCallback((id) => {
    setIngredients(prev => prev.filter(i => i.id !== id))
    setEditingId(prev => prev === id ? null : prev)
  }, [])

  function openQtyEditor(id) {
    const ing = ingredients.find(i => i.id === id)
    if (!ing) return
    setEditingId(id)
    setQtyAmount(ing.amount)
    setQtyUnit(ing.unit)
    inputRef.current?.blur()
  }

  function confirmQty() {
    setIngredients(prev =>
      prev.map(i => i.id === editingId ? { ...i, amount: qtyAmount, unit: qtyUnit } : i)
    )
    setEditingId(null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',' || e.key === '　') {
      e.preventDefault()
      if (inputValue.trim()) addIngredient(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && ingredients.length > 0) {
      const last = ingredients[ingredients.length - 1]
      if (editingId === last.id) setEditingId(null)
      setIngredients(prev => prev.slice(0, -1))
    } else if (e.key === 'Escape' && editingId) {
      setEditingId(null)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const pending = inputValue.trim()
    const base = pending
      ? [...ingredients, { id: 'tmp', name: pending, amount: '', unit: '個' }]
      : ingredients
    if (base.length === 0) return
    setInputValue('')
    setEditingId(null)
    onSuggest(base.map(serializeIngredient))
  }

  const hasIngredients = ingredients.length > 0
  const submitDisabled = loading || (!hasIngredients && !inputValue.trim())
  const editingIng = editingId ? ingredients.find(i => i.id === editingId) : null

  return (
    <div className="input-card">
      <h2 className="input-title">
        <span aria-hidden="true">🥦</span> 冷蔵庫の食材を入力
      </h2>
      <p className="input-hint">
        食材を入力してEnterで追加。タグをタップして量を設定できます。
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Tag box ── */}
        <div
          className="tag-input"
          onClick={() => { if (!editingId) inputRef.current?.focus() }}
          role="group"
          aria-label="追加済みの食材"
        >
          {ingredients.map(ing => (
            <span
              key={ing.id}
              className={`tag${editingId === ing.id ? ' tag--editing' : ''}`}
            >
              <button
                type="button"
                className="tag-name-btn"
                onClick={(e) => { e.stopPropagation(); openQtyEditor(ing.id) }}
                title="量を設定"
              >
                {ing.name}
                {ing.amount
                  ? <span className="tag-qty"> {ing.amount}{ing.unit}</span>
                  : (ing.unit === '適量' || ing.unit === '少々')
                    ? <span className="tag-qty"> ({ing.unit})</span>
                    : null
                }
              </button>
              <button
                type="button"
                className="tag-remove"
                onClick={(e) => { e.stopPropagation(); removeIngredient(ing.id) }}
                aria-label={`${ing.name}を削除`}
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

        {/* ── Quantity editor ── */}
        {editingIng && (
          <div className="qty-editor">
            <span className="qty-editor-name">{editingIng.name}の量</span>
            <input
              type="number"
              className="qty-amount-input"
              value={qtyAmount}
              onChange={e => setQtyAmount(e.target.value)}
              min="0"
              step="1"
              placeholder="数量"
              aria-label="数量"
            />
            <select
              className="qty-unit-select"
              value={qtyUnit}
              onChange={e => setQtyUnit(e.target.value)}
              aria-label="単位"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button type="button" className="qty-confirm-btn" onClick={confirmQty}>
              確定
            </button>
            <button type="button" className="qty-cancel-btn" onClick={() => setEditingId(null)}>
              ×
            </button>
          </div>
        )}

        {/* ── Preset categories ── */}
        <div className="presets">
          {PRESET_CATEGORIES.map(cat => {
            const isOpen = expandedCat === cat.label
            const available = cat.items.filter(s => !ingredients.some(i => i.name === s))
            if (available.length === 0) return null
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
              onClick={() => { setIngredients([]); setEditingId(null) }}
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
