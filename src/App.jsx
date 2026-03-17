import { useState } from 'react'
import IngredientInput from './components/IngredientInput.jsx'
import MealSuggestions from './components/MealSuggestions.jsx'
import './App.css'

export default function App() {
  const [meals, setMeals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSuggest(ingredients) {
    setLoading(true)
    setError(null)
    setMeals(null)

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '献立の提案に失敗しました')
      }

      const data = await res.json()
      setMeals(data.meals)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🍳</span>
            <div>
              <h1 className="logo-title">冷蔵庫献立アシスタント</h1>
              <p className="logo-sub">食材を入力して、今日の献立を提案してもらおう</p>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <IngredientInput onSuggest={handleSuggest} loading={loading} />

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="loading-spinner" />
            <p className="loading-text">AIが献立を考えています...</p>
          </div>
        )}

        {meals && !loading && (
          <MealSuggestions meals={meals} />
        )}
      </main>

      <footer className="footer">
        <p>Powered by Claude AI · Anthropic</p>
      </footer>
    </div>
  )
}
