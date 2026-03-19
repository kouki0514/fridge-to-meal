import { useState, useCallback } from 'react'

const STORAGE_KEY = 'fridge-to-meal-favorites'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(load)

  const addFavorite = useCallback((meal) => {
    setFavorites(prev => {
      // Avoid exact-name duplicates
      if (prev.some(m => m.name === meal.name)) return prev
      const entry = {
        ...meal,
        _id: Date.now() + Math.random(),
        _savedAt: new Date().toLocaleString('ja-JP'),
      }
      const next = [entry, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeFavorite = useCallback((_id) => {
    setFavorites(prev => {
      const next = prev.filter(m => m._id !== _id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback((mealName) => {
    return favorites.some(m => m.name === mealName)
  }, [favorites])

  const getFavoriteId = useCallback((mealName) => {
    return favorites.find(m => m.name === mealName)?._id ?? null
  }, [favorites])

  return { favorites, addFavorite, removeFavorite, isFavorite, getFavoriteId }
}
