import { create } from 'zustand'

export const useStore = create((set) => ({
  user: undefined,
  userProfile: null,
  desafios: [],
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setDesafios: (desafios) => set({ desafios }),
}))
