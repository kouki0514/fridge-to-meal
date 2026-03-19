import { useState } from 'react'
import './FavoritesList.css'

const MEAL_ICONS = ['🍜', '🍱', '🥘', '🍛', '🍲', '🥗', '🍝']

const DIFFICULTY_STYLE = {
  '簡単':  { bg: '#dcfce7', color: '#16a34a' },
  '普通':  { bg: '#fef9c3', color: '#ca8a04' },
  '難しい': { bg: '#fee2e2', color: '#dc2626' },
}

export default function FavoritesList({ favorites, onRemove }) {
  if (favorites.length === 0) {
    return (
      <div className="fav-empty">
        <span className="fav-empty-icon" aria-hidden="true">♡</span>
        <p className="fav-empty-text">保存した献立はありません</p>
        <p className="fav-empty-hint">献立カードの ♡ をタップして保存できます</p>
      </div>
    )
  }

  return (
    <section className="fav-section" aria-label="お気に入りの献立">
      <div className="fav-header">
        <h2 className="fav-title">
          <span aria-hidden="true">♥</span> お気に入りの献立
        </h2>
        <span className="fav-count">{favorites.length}品</span>
      </div>

      <div className="fav-grid">
        {favorites.map((meal, i) => (
          <FavCard
            key={meal._id}
            meal={meal}
            icon={MEAL_ICONS[i % MEAL_ICONS.length]}
            onRemove={() => onRemove(meal._id)}
          />
        ))}
      </div>
    </section>
  )
}

function FavCard({ meal, icon, onRemove }) {
  const [stepsOpen, setStepsOpen] = useState(false)
  const diff = DIFFICULTY_STYLE[meal.difficulty] ?? DIFFICULTY_STYLE['普通']

  return (
    <article className="fav-card">
      <div className="fav-card-header">
        <span className="fav-card-icon" aria-hidden="true">{icon}</span>
        <div className="fav-card-meta">
          <div className="fav-card-badges">
            <span className="badge badge-time">⏱ {meal.time}</span>
            <span className="badge" style={{ background: diff.bg, color: diff.color }}>
              {meal.difficulty}
            </span>
          </div>
          <h3 className="fav-card-name">{meal.name}</h3>
          {meal._savedAt && (
            <p className="fav-card-date">保存日時: {meal._savedAt}</p>
          )}
        </div>

        <button
          type="button"
          className="fav-delete-btn"
          onClick={onRemove}
          aria-label={`${meal.name}をお気に入りから削除`}
          title="削除"
        >
          🗑
        </button>
      </div>

      {meal.description && (
        <p className="fav-card-desc">{meal.description}</p>
      )}

      <div className="fav-card-body">
        <div className="fav-section-block">
          <h4 className="fav-section-label">
            <span aria-hidden="true">🥕</span> 使用食材
          </h4>
          <ul className="fav-ingredient-list">
            {meal.ingredients.map((ing, j) => (
              <li key={j} className="fav-ingredient-item">
                <span className="fav-ingredient-dot" aria-hidden="true" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div className="fav-section-block">
          <button
            type="button"
            className="fav-section-label fav-section-label--toggle"
            onClick={() => setStepsOpen(v => !v)}
            aria-expanded={stepsOpen}
          >
            <span aria-hidden="true">👨‍🍳</span>
            <span>作り方</span>
            <span
              className={`fav-chevron ${stepsOpen ? 'fav-chevron--open' : ''}`}
              aria-hidden="true"
            >▾</span>
          </button>
          <ol className={`fav-step-list ${stepsOpen ? 'fav-step-list--open' : ''}`}>
            {meal.steps.map((step, j) => (
              <li key={j} className="fav-step-item">
                <span className="fav-step-num" aria-hidden="true">{j + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  )
}
