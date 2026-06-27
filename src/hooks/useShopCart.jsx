import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../config/api'

const ShopCartContext = createContext(null)

export function ShopCartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/shop/cart')
      setCart(data || { items: [], itemCount: 0, subtotal: 0 })
    } catch {
      setCart({ items: [], itemCount: 0, subtotal: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateItem = useCallback(
    async (productId, quantity) => {
      const { data } = await api.put('/shop/cart/items', { productId, quantity })
      setCart(data || { items: [], itemCount: 0, subtotal: 0 })
      return data
    },
    [],
  )

  const clear = useCallback(async () => {
    const { data } = await api.delete('/shop/cart')
    setCart(data || { items: [], itemCount: 0, subtotal: 0 })
  }, [])

  const value = useMemo(
    () => ({ cart, loading, refresh, updateItem, clear, itemCount: cart.itemCount || 0 }),
    [cart, loading, refresh, updateItem, clear],
  )

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext)
  if (!ctx) throw new Error('useShopCart must be used within ShopCartProvider')
  return ctx
}
