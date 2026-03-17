import { useState } from 'react'
import './MealSuggestions.css'

const DIFFICULTY_STYLE = {
  '簡単':  { bg: '#dcfce7', color: '#16a34a' },
  '普通':  { bg: '#fef9c3', color: '#ca8a04' },
  '難しい': { bg: '#fee2e2', color: '#dc2626' },
}

const MEAL_ICONS = ['🍜', '🍱', '🥘', '🍛', '🍲', '🥗', '🍝']

export default function MealSuggestions({ meals }) {
  return (
    <section className="suggestions" aria-label="献立の提案">
      <div className="suggestions-header">
        <h2 className="suggestions-title">
          <span aria-hidden="true">✨</span> 今日のおすすめ献立
        </h2>
        <span className="suggestions-count">{meals.length}品</span>
      </div>

      <div className="meal-grid">
        {meals.map((meal, i) => (
          <MealCard
            key={i}
            meal={meal}
            icon={MEAL_ICONS[i % MEAL_ICONS.length]}
            index={i}
          />
        ))}
      </div>
    </section>
  )
}

function MealCard({ meal, icon, index }) {
  const [stepsOpen, setStepsOpen] = useState(false)
  const diff = DIFFICULTY_STYLE[meal.difficulty] ?? DIFFICULTY_STYLE['普通']

  return (
    <article
      className="meal-card"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* ── Card header ── */}
      <div className="meal-header">
        <span className="meal-icon" aria-hidden="true">{icon}</span>
        <div className="meal-meta">
          <div className="meal-badges">
            <span className="badge badge-time">⏱ {meal.time}</span>
            <span
              className="badge"
              style={{ background: diff.bg, color: diff.color }}
            >
              {meal.difficulty}
            </span>
          </div>
          <h3 className="meal-name">{meal.name}</h3>
        </div>
      </div>

      {/* ── Description ── */}
      {meal.description && (
        <p className="meal-description">{meal.description}</p>
      )}

      <div className="meal-body">
        {/* ── Ingredients ── */}
        <div className="meal-section">
          <h4 className="section-label">
            <span aria-hidden="true">🥕</span> 使用食材
          </h4>
          <ul className="ingredient-list">
            {meal.ingredients.map((ing, j) => (
              <li key={j} className="ingredient-item">
                <span className="ingredient-dot" aria-hidden="true" />
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Steps (collapsible on mobile) ── */}
        <div className="meal-section">
          <button
            type="button"
            className="section-label section-label--toggle"
            onClick={() => setStepsOpen(v => !v)}
            aria-expanded={stepsOpen}
          >
            <span aria-hidden="true">👨‍🍳</span>
            <span>作り方</span>
            <span className={`toggle-chevron ${stepsOpen ? 'toggle-chevron--open' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>

          <ol className={`step-list ${stepsOpen ? 'step-list--open' : ''}`}>
            {meal.steps.map((step, j) => (
              <li key={j} className="step-item">
                <span className="step-num" aria-hidden="true">{j + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  )
}
