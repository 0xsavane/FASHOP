import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  category: string
  supplierId: string
  supplierName: string
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  commune: string
  landmark?: string
}

interface CartStore {
  items: CartItem[]
  deliveryAddress: DeliveryAddress | null
  paymentMethod: 'orange_money' | 'card' | null
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  
  setDeliveryAddress: (address: DeliveryAddress) => void
  setPaymentMethod: (method: 'orange_money' | 'card') => void
  
  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: (id: string) => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryAddress: null,
      paymentMethod: null,
      
      addItem: (newItem) => {
        const items = get().items
        const existingItem = items.find(item => item.id === newItem.id)
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          })
        } else {
          set({
            items: [...items, { ...newItem, quantity: 1 }]
          })
        }
      },
      
      removeItem: (id) => {
        set({
          items: get().items.filter(item => item.id !== id)
        })
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        })
      },
      
      clearCart: () => {
        set({ items: [], deliveryAddress: null, paymentMethod: null })
      },
      
      setDeliveryAddress: (address) => {
        set({ deliveryAddress: address })
      },
      
      setPaymentMethod: (method) => {
        set({ paymentMethod: method })
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
      
      getItemCount: (id) => {
        const item = get().items.find(item => item.id === id)
        return item ? item.quantity : 0
      }
    }),
    {
      name: 'fashop-cart',
      partialize: (state) => ({
        items: state.items,
        deliveryAddress: state.deliveryAddress,
        paymentMethod: state.paymentMethod
      })
    }
  )
)
