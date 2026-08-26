import { useCallback, useEffect, useReducer, useRef } from 'react'
import { berekenResultaat } from '../lib/energieScan/calculations'
import { buildEmailParams } from '../lib/energieScan/emailParams'
import { prepareCalculationInput, validateStep1, validateStep2, validateStep3, validateStep4 } from '../lib/energieScan/validation'
import { BUSINESS_EMAIL, EMAILJS_TEMPLATE_CONFIRM, EMAILJS_TEMPLATE_LEAD, sendEmail } from '../lib/emailjs'

const INITIAL_VALUES = {
  pandtype: null,
  bouwjaar: null,
  oppervlakte: '',
  verdiepingen: null,
  beglazing: null,
  isolatie_gevel: null,
  isolatie_dak: null,
  isolatie_vloer: null,
  verwarming: null,
  gasverbruik: '',
  elekverbruik: '',
  energiekosten: '',
  naam: '',
  bedrijfsnaam: '',
  email: '',
  telefoon: '',
}

const initialState = {
  step: 1,
  values: INITIAL_VALUES,
  errors: {},
  toast: null,
  isSubmitting: false,
  result: null,
  // 'idle' | 'sending' | 'sent' | 'error' — tracks the lead email
  // separately from `result`, since the calculated result always shows
  // regardless of whether sending the lead succeeded.
  leadStatus: 'idle',
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      }
    case 'VALIDATION_FAILED':
      return { ...state, errors: action.errors, toast: action.toast }
    case 'GO_TO_STEP':
      return { ...state, step: action.step, errors: {}, toast: null }
    case 'DISMISS_TOAST':
      return { ...state, toast: null }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true }
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, result: action.result, leadStatus: 'sending' }
    case 'LEAD_SENT':
      return { ...state, leadStatus: 'sent' }
    case 'LEAD_FAILED':
      return { ...state, leadStatus: 'error' }
    case 'RESTART':
      // Deliberately keeps `values` intact (matches the source tool's
      // "Opnieuw invullen" behaviour) — only the step and result reset.
      return { ...state, step: 1, result: null, errors: {}, toast: null, leadStatus: 'idle' }
    default:
      return state
  }
}

const VALIDATORS = { 1: validateStep1, 2: validateStep2, 3: validateStep3, 4: validateStep4 }

/**
 * Drives the 4-step energy scan wizard: field state, per-step validation,
 * navigation, the final calculation, and sending the resulting lead. All
 * the actual maths lives in lib/energieScan — this hook only
 * orchestrates it.
 */
export function useEnergieScan() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const toastTimer = useRef(null)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    if (!state.toast) return undefined
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 3200)
    return () => clearTimeout(toastTimer.current)
  }, [state.toast])

  const setValue = useCallback((field, value) => {
    dispatch({ type: 'SET_VALUE', field, value })
  }, [])

  const goToStep = useCallback((step) => {
    dispatch({ type: 'GO_TO_STEP', step })
  }, [])

  const goNext = useCallback(() => {
    const { isValid, errors, toast } = VALIDATORS[state.step](state.values)
    if (!isValid) {
      dispatch({ type: 'VALIDATION_FAILED', errors, toast })
      return
    }
    dispatch({ type: 'GO_TO_STEP', step: state.step + 1 })
  }, [state])

  const submit = useCallback(() => {
    // Ref-based guard (not state-based): state updates are async, so a
    // fast double-click could fire this twice before a re-render
    // disables the button. The ref flips synchronously.
    if (isSubmittingRef.current) return

    const { isValid, errors, toast } = validateStep4(state.values)
    if (!isValid) {
      dispatch({ type: 'VALIDATION_FAILED', errors, toast })
      return
    }

    isSubmittingRef.current = true
    dispatch({ type: 'SUBMIT_START' })

    // Small artificial delay so the loading state registers as real
    // progress, matching the source tool's UX.
    setTimeout(() => {
      const result = berekenResultaat(prepareCalculationInput(state.values))
      dispatch({ type: 'SUBMIT_SUCCESS', result })
      isSubmittingRef.current = false

      // Sending the lead never blocks or hides the result — it's already
      // shown by the dispatch above. This only updates the small
      // send-status indicator in the results view. Mirrors the original
      // tool's sendLeadEmails(): an internal lead mail to SMV Advies and
      // a separate confirmation mail to the visitor, sent independently
      // so one failing never blocks the other. The indicator reflects
      // the confirmation mail's outcome, matching the original's
      // `sentNote`, which was also wired to that mail only.
      const emailParams = buildEmailParams(state.values, result)
      const leadParams = { ...emailParams, to_email: BUSINESS_EMAIL, maatregelen: emailParams.maatregelen_intern }
      const confirmParams = { ...emailParams, to_email: state.values.email, maatregelen: emailParams.maatregelen_klant }

      sendEmail(EMAILJS_TEMPLATE_LEAD, leadParams).catch(() => {})
      sendEmail(EMAILJS_TEMPLATE_CONFIRM, confirmParams)
        .then(() => dispatch({ type: 'LEAD_SENT' }))
        .catch(() => dispatch({ type: 'LEAD_FAILED' }))
    }, 650)
  }, [state.values])

  const restart = useCallback(() => dispatch({ type: 'RESTART' }), [])

  return {
    step: state.step,
    values: state.values,
    errors: state.errors,
    toast: state.toast,
    isSubmitting: state.isSubmitting,
    result: state.result,
    leadStatus: state.leadStatus,
    setValue,
    goToStep,
    goNext,
    submit,
    restart,
  }
}
