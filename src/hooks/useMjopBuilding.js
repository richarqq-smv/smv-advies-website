import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { createEmptyBuilding, createEmptyComponent, loadBuilding, saveBuilding, clearBuilding } from '../lib/mjop/storage'
import { triggerJsonDownload, parseImportedJson } from '../lib/mjop/importExport'
import { buildInsights } from '../lib/mjop/linking'
import { buildMjopEmailParams } from '../lib/mjop/emailParams'
import { sendEmail, EMAILJS_TEMPLATE_MJOP, EMAILJS_PUBLIC_KEY_MJOP } from '../lib/emailjs'
import { saveMjopSnapshotToPand } from '../lib/dossier'

export const STEPS = [
  { n: 1, id: 'pand', label: 'Pandgegevens' },
  { n: 2, id: 'energie', label: 'Energie' },
  { n: 3, id: 'bouwdelen', label: 'Bouwdelen & installaties' },
  { n: 4, id: 'onderhoud', label: 'Onderhoud en vervanging' },
  { n: 5, id: 'koppeling', label: 'Verduurzamingskoppeling' },
  { n: 6, id: 'planning', label: 'Planning' },
  { n: 7, id: 'advies', label: 'Adviesoverzicht' },
]

function initState() {
  const loaded = typeof window !== 'undefined' ? loadBuilding() : null
  return {
    building: loaded ?? createEmptyBuilding(),
    step: 1,
    toast: null,
    // 'idle' | 'sending' | 'sent' | 'error' — status van het versturen van
    // de analyse naar SMV Advies (stap 7), los van het lokaal opslaan.
    sendStatus: 'idle',
    // 'idle' | 'saving' | 'saved' | 'error' — status van het opslaan van de
    // MJOP-situatie bij het Pand (dossierlaag). Losstaand van sendStatus:
    // dit is geen verzending, alleen lokale structurele opslag.
    saveMjopStatus: 'idle',
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BUILDING_FIELD':
      return { ...state, building: { ...state.building, [action.field]: action.value } }
    case 'SET_ENERGY_FIELD':
      return { ...state, building: { ...state.building, energy: { ...state.building.energy, [action.field]: action.value } } }
    case 'SET_CONTACT_FIELD':
      return { ...state, building: { ...state.building, contact: { ...state.building.contact, [action.field]: action.value } } }
    case 'ADD_COMPONENT':
      return { ...state, building: { ...state.building, components: [...state.building.components, action.component] } }
    case 'UPDATE_COMPONENT':
      return {
        ...state,
        building: {
          ...state.building,
          components: state.building.components.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
        },
      }
    case 'REMOVE_COMPONENT':
      return {
        ...state,
        building: { ...state.building, components: state.building.components.filter((c) => c.id !== action.id) },
      }
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'SET_TOAST':
      return { ...state, toast: action.toast }
    case 'REPLACE_BUILDING':
      return { ...state, building: action.building, step: 1, toast: action.toast ?? null }
    case 'RESET':
      return { ...state, building: createEmptyBuilding(), step: 1, toast: 'Nieuw pand aangemaakt.', sendStatus: 'idle', saveMjopStatus: 'idle' }
    case 'SEND_START':
      return { ...state, sendStatus: 'sending' }
    case 'SEND_SUCCESS':
      return { ...state, sendStatus: 'sent' }
    case 'SEND_ERROR':
      return { ...state, sendStatus: 'error' }
    case 'SAVE_MJOP_START':
      return { ...state, saveMjopStatus: 'saving' }
    case 'SAVE_MJOP_SUCCESS':
      return { ...state, saveMjopStatus: 'saved' }
    case 'SAVE_MJOP_ERROR':
      return { ...state, saveMjopStatus: 'error' }
    default:
      return state
  }
}

/**
 * Beheert het pandprofiel van de MJOP-tool: veldwaarden, bouwdelen,
 * stapnavigatie en persistentie in localStorage. Rekenregels (status,
 * koppeling, tijdlijn) staan bewust niet hier maar in lib/mjop/linking.js —
 * deze hook orkestreert alleen, net als useEnergieScan dat doet voor de
 * energie-indicatie.
 */
export function useMjopBuilding() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const toastTimer = useRef(null)

  useEffect(() => {
    saveBuilding(state.building)
  }, [state.building])

  useEffect(() => {
    if (!state.toast) return undefined
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => dispatch({ type: 'SET_TOAST', toast: null }), 3200)
    return () => clearTimeout(toastTimer.current)
  }, [state.toast])

  const setBuildingField = useCallback((field, value) => dispatch({ type: 'SET_BUILDING_FIELD', field, value }), [])
  const setEnergyField = useCallback((field, value) => dispatch({ type: 'SET_ENERGY_FIELD', field, value }), [])
  const setContactField = useCallback((field, value) => dispatch({ type: 'SET_CONTACT_FIELD', field, value }), [])

  const addComponent = useCallback((typeId) => {
    dispatch({ type: 'ADD_COMPONENT', component: createEmptyComponent(typeId) })
  }, [])

  const updateComponent = useCallback((id, patch) => dispatch({ type: 'UPDATE_COMPONENT', id, patch }), [])
  const removeComponent = useCallback((id) => dispatch({ type: 'REMOVE_COMPONENT', id }), [])

  const goToStep = useCallback((step) => {
    dispatch({ type: 'SET_STEP', step })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const exportJson = useCallback(() => {
    triggerJsonDownload(state.building)
  }, [state.building])

  const importJson = useCallback((rawText) => {
    const result = parseImportedJson(rawText)
    if (!result.ok) {
      dispatch({ type: 'SET_TOAST', toast: result.error })
      return false
    }
    dispatch({ type: 'REPLACE_BUILDING', building: result.building, toast: 'Pandprofiel geïmporteerd.' })
    return true
  }, [])

  const loadTestBuilding = useCallback((building) => {
    dispatch({ type: 'REPLACE_BUILDING', building, toast: 'Testdata geladen (alleen voor ontwikkeldoeleinden).' })
  }, [])

  const resetAll = useCallback(() => {
    clearBuilding()
    dispatch({ type: 'RESET' })
  }, [])

  const insights = useMemo(() => buildInsights(state.building), [state.building])

  const isSavingMjopRef = useRef(false)
  const saveMjopSnapshot = useCallback(() => {
    // Ref-guard i.p.v. alleen state, zelfde patroon als sendAnalysis
    // hieronder, om dubbel opslaan door een snelle dubbele klik te
    // voorkomen. Synchroon (localStorage), maar hetzelfde start/success/
    // error-patroon houdt de UI-status consistent met sendAnalysis.
    if (isSavingMjopRef.current) return
    isSavingMjopRef.current = true
    dispatch({ type: 'SAVE_MJOP_START' })
    try {
      saveMjopSnapshotToPand(state.building)
      dispatch({ type: 'SAVE_MJOP_SUCCESS' })
    } catch {
      dispatch({ type: 'SAVE_MJOP_ERROR' })
    } finally {
      isSavingMjopRef.current = false
    }
  }, [state.building])

  const isSendingRef = useRef(false)
  const sendAnalysis = useCallback(async () => {
    // Ref-guard i.p.v. alleen state, om dubbel verzenden door een snelle
    // dubbele klik te voorkomen (zelfde patroon als useEnergieScan.submit).
    if (isSendingRef.current) return
    isSendingRef.current = true
    dispatch({ type: 'SEND_START' })
    try {
      const params = buildMjopEmailParams(state.building, insights)
      await sendEmail(EMAILJS_TEMPLATE_MJOP, params, EMAILJS_PUBLIC_KEY_MJOP)
      dispatch({ type: 'SEND_SUCCESS' })
    } catch {
      dispatch({ type: 'SEND_ERROR' })
    } finally {
      isSendingRef.current = false
    }
  }, [state.building, insights])

  return {
    building: state.building,
    step: state.step,
    toast: state.toast,
    insights,
    sendStatus: state.sendStatus,
    saveMjopStatus: state.saveMjopStatus,
    saveMjopSnapshot,
    setBuildingField,
    setEnergyField,
    setContactField,
    addComponent,
    updateComponent,
    removeComponent,
    goToStep,
    exportJson,
    importJson,
    loadTestBuilding,
    resetAll,
    sendAnalysis,
  }
}
