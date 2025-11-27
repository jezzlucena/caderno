import { create } from 'zustand'
import { switchesApi, type DeadManSwitch, type SwitchRecipient, ApiError } from '../lib/api'
import { useCryptoStore } from './cryptoStore'
import { encrypt, decrypt } from '../lib/crypto'

// Decrypted switch for UI display
export interface DecryptedSwitch {
  id: number
  userId: number
  name: string  // Decrypted name
  timerDays: number
  lastCheckIn: string
  isActive: boolean
  triggerMessage: string | null
  encryptedPayload: string | null
  payloadIv: string | null
  hasPayload: boolean
  hasTriggered: boolean
  triggeredAt: string | null
  createdAt: string
  updatedAt: string
  recipients: SwitchRecipient[]
}

interface SwitchesState {
  switches: DecryptedSwitch[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchSwitches: () => Promise<void>
  createSwitch: (data: {
    name: string
    timerDays: number
    triggerMessage?: string
    recipients: { email: string; name?: string }[]
    encryptedPayload?: string
    payloadIv?: string
    payloadKey?: string
  }) => Promise<DecryptedSwitch>
  updateSwitch: (id: number, data: {
    name?: string
    timerDays?: number
    triggerMessage?: string
    isActive?: boolean
    recipients?: { email: string; name?: string }[]
  }) => Promise<void>
  deleteSwitch: (id: number) => Promise<void>
  checkIn: (id: number) => Promise<{ nextDeadline: string }>
  checkInAll: () => Promise<number>
  clearError: () => void
}

let isFetching = false

export const useSwitchesStore = create<SwitchesState>((set, get) => ({
  switches: [],
  isLoading: false,
  error: null,

  fetchSwitches: async () => {
    if (isFetching || get().isLoading) return

    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      set({ error: 'Encryption key not available' })
      return
    }

    isFetching = true
    set({ isLoading: true, error: null })
    try {
      const { switches } = await switchesApi.list()

      // Decrypt all switch names
      const decryptedSwitches: DecryptedSwitch[] = await Promise.all(
        switches.map(async (sw: DeadManSwitch) => {
          const name = await decrypt(
            cryptoStore.encryptionKey!,
            sw.encryptedName,
            sw.iv
          )
          return {
            id: sw.id,
            userId: sw.userId,
            name,
            timerDays: sw.timerDays,
            lastCheckIn: sw.lastCheckIn,
            isActive: sw.isActive,
            triggerMessage: sw.triggerMessage,
            encryptedPayload: sw.encryptedPayload,
            payloadIv: sw.payloadIv,
            hasPayload: sw.hasPayload,
            hasTriggered: sw.hasTriggered,
            triggeredAt: sw.triggeredAt,
            createdAt: sw.createdAt,
            updatedAt: sw.updatedAt,
            recipients: sw.recipients
          }
        })
      )

      set({ switches: decryptedSwitches, isLoading: false })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch switches'
      set({ error: message, isLoading: false })
      console.error('Failed to fetch switches:', error)
    } finally {
      isFetching = false
    }
  },

  createSwitch: async (data) => {
    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      throw new Error('Encryption key not available')
    }

    set({ isLoading: true, error: null })
    try {
      // Encrypt the switch name client-side
      const { ciphertext: encryptedName, iv } = await encrypt(
        cryptoStore.encryptionKey,
        data.name
      )

      // Send encrypted data to server
      const result = await switchesApi.create({
        encryptedName,
        iv,
        timerDays: data.timerDays,
        triggerMessage: data.triggerMessage,
        recipients: data.recipients,
        encryptedPayload: data.encryptedPayload,
        payloadIv: data.payloadIv,
        payloadKey: data.payloadKey
      })

      // Create decrypted switch for local state
      const decryptedSwitch: DecryptedSwitch = {
        id: result.switch.id,
        userId: result.switch.userId,
        name: data.name, // We already have the plaintext
        timerDays: result.switch.timerDays,
        lastCheckIn: result.switch.lastCheckIn,
        isActive: result.switch.isActive,
        triggerMessage: result.switch.triggerMessage,
        encryptedPayload: result.switch.encryptedPayload,
        payloadIv: result.switch.payloadIv,
        hasPayload: result.switch.hasPayload,
        hasTriggered: result.switch.hasTriggered,
        triggeredAt: result.switch.triggeredAt,
        createdAt: result.switch.createdAt,
        updatedAt: result.switch.updatedAt,
        recipients: result.switch.recipients
      }

      set((state) => ({
        switches: [decryptedSwitch, ...state.switches],
        isLoading: false
      }))
      return decryptedSwitch
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create switch'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  updateSwitch: async (id, data) => {
    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      throw new Error('Encryption key not available')
    }

    set({ isLoading: true, error: null })
    try {
      // Build update data, encrypting name if provided
      const updateData: {
        encryptedName?: string
        iv?: string
        timerDays?: number
        triggerMessage?: string
        isActive?: boolean
        recipients?: { email: string; name?: string }[]
      } = {}

      if (data.name !== undefined) {
        const { ciphertext: encryptedName, iv } = await encrypt(
          cryptoStore.encryptionKey,
          data.name
        )
        updateData.encryptedName = encryptedName
        updateData.iv = iv
      }
      if (data.timerDays !== undefined) updateData.timerDays = data.timerDays
      if (data.triggerMessage !== undefined) updateData.triggerMessage = data.triggerMessage
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.recipients !== undefined) updateData.recipients = data.recipients

      const result = await switchesApi.update(id, updateData)

      // Decrypt the returned switch name
      const name = await decrypt(
        cryptoStore.encryptionKey,
        result.switch.encryptedName,
        result.switch.iv
      )

      const decryptedSwitch: DecryptedSwitch = {
        id: result.switch.id,
        userId: result.switch.userId,
        name,
        timerDays: result.switch.timerDays,
        lastCheckIn: result.switch.lastCheckIn,
        isActive: result.switch.isActive,
        triggerMessage: result.switch.triggerMessage,
        encryptedPayload: result.switch.encryptedPayload,
        payloadIv: result.switch.payloadIv,
        hasPayload: result.switch.hasPayload,
        hasTriggered: result.switch.hasTriggered,
        triggeredAt: result.switch.triggeredAt,
        createdAt: result.switch.createdAt,
        updatedAt: result.switch.updatedAt,
        recipients: result.switch.recipients
      }

      set((state) => ({
        switches: state.switches.map((s) => (s.id === id ? decryptedSwitch : s)),
        isLoading: false
      }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update switch'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  deleteSwitch: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await switchesApi.delete(id)
      set((state) => ({
        switches: state.switches.filter((s) => s.id !== id),
        isLoading: false
      }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete switch'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  checkIn: async (id) => {
    const cryptoStore = useCryptoStore.getState()
    if (!cryptoStore.encryptionKey) {
      throw new Error('Encryption key not available')
    }

    try {
      const result = await switchesApi.checkIn(id)

      // Decrypt the returned switch name
      const name = await decrypt(
        cryptoStore.encryptionKey,
        result.switch.encryptedName,
        result.switch.iv
      )

      const decryptedSwitch: DecryptedSwitch = {
        id: result.switch.id,
        userId: result.switch.userId,
        name,
        timerDays: result.switch.timerDays,
        lastCheckIn: result.switch.lastCheckIn,
        isActive: result.switch.isActive,
        triggerMessage: result.switch.triggerMessage,
        encryptedPayload: result.switch.encryptedPayload,
        payloadIv: result.switch.payloadIv,
        hasPayload: result.switch.hasPayload,
        hasTriggered: result.switch.hasTriggered,
        triggeredAt: result.switch.triggeredAt,
        createdAt: result.switch.createdAt,
        updatedAt: result.switch.updatedAt,
        recipients: result.switch.recipients
      }

      set((state) => ({
        switches: state.switches.map((s) => (s.id === id ? decryptedSwitch : s))
      }))
      return { nextDeadline: result.nextDeadline }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to check in'
      set({ error: message })
      throw error
    }
  },

  checkInAll: async () => {
    try {
      const result = await switchesApi.checkInAll()
      // Refresh switches to get updated lastCheckIn times
      await get().fetchSwitches()
      return result.switches.length
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to check in'
      set({ error: message })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))
