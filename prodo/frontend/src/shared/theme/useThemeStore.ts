import { create } from 'zustand'

interface ThemeStore {
  variant: string
  setVariant: (v: string) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  variant: 'default-light',
  setVariant: (v) => set({ variant: v }),
}))
