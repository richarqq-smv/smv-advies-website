import { useRef, useState } from 'react'
import { CheckCircle, LockSimple, SpinnerGap, WarningCircle } from '@phosphor-icons/react'
import { TextField } from '../ui/TextField'
import { TextArea } from '../ui/TextArea'
import { Button } from '../ui/Button'
import { sendEmail, EMAILJS_TEMPLATE_CONTACT } from '../../lib/emailjs'
import { validateContactForm, buildContactEmailParams } from '../../lib/contactForm'
import { ROUTES } from '../../lib/routes'

const LEEG = { naam: '', bedrijfsnaam: '', plaats: '', email: '', telefoon: '', vraag: '' }

/**
 * Kort, laagdrempelig contactformulier (websiteoptimalisatieronde
 * 2026-10-02) — ALTERNATIEF naast de bestaande mailto/tel-knoppen op
 * Contact.jsx, geen vervanging: wie liever belt of mailt kan dat gewoon
 * blijven doen. Alleen naam, e-mailadres en de vraag zelf zijn verplicht
 * (zie lib/contactForm.js) — bedrijfsnaam, plaats en telefoon zijn
 * optioneel, om de drempel zo laag mogelijk te houden.
 *
 * Verzending loopt via de bestaande EmailJS-infrastructuur (lib/emailjs.js,
 * dezelfde die de energie-indicatie en de MJOP-tool al gebruiken) — geen
 * nieuw backend-systeem.
 */
export function ContactForm() {
  const [values, setValues] = useState(LEEG)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // 'idle' | 'submitting' | 'success' | 'error'
  // Ref-guard (niet alleen de disabled-knop): state-updates zijn async, dus
  // een snel dubbelklik kan dit twee keer aanroepen vóór een re-render de
  // knop echt disabled toont — zelfde patroon als useEnergieScan.js.
  const bezigRef = useRef(false)

  function setValue(id, v) {
    setValues((prev) => ({ ...prev, [id]: v }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (bezigRef.current) return
    const nieuweErrors = validateContactForm(values)
    setErrors(nieuweErrors)
    if (Object.keys(nieuweErrors).length > 0) return

    bezigRef.current = true
    setStatus('submitting')
    try {
      await sendEmail(EMAILJS_TEMPLATE_CONTACT, buildContactEmailParams(values))
      setStatus('success')
      setValues(LEEG)
    } catch {
      setStatus('error')
    } finally {
      bezigRef.current = false
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-muted px-5 py-4 text-left">
        <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-accent" />
        <p className="text-sm leading-relaxed text-foreground-muted">
          <strong className="font-semibold text-primary">Uw bericht is verstuurd.</strong> We reageren binnen 1
          werkdag.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 text-left">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="naam" label="Naam" autoComplete="name" value={values.naam} onChange={(v) => setValue('naam', v)} error={errors.naam} required />
        <TextField
          id="bedrijfsnaam"
          label="Bedrijfsnaam"
          autoComplete="organization"
          value={values.bedrijfsnaam}
          onChange={(v) => setValue('bedrijfsnaam', v)}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="plaats"
          label="Plaats van uw pand"
          autoComplete="address-level2"
          value={values.plaats}
          onChange={(v) => setValue('plaats', v)}
        />
        <TextField
          id="telefoon"
          label="Telefoonnummer"
          type="tel"
          autoComplete="tel"
          value={values.telefoon}
          onChange={(v) => setValue('telefoon', v)}
        />
      </div>
      <TextField
        id="email"
        label="E-mailadres"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(v) => setValue('email', v)}
        error={errors.email}
        required
      />
      <TextArea id="vraag" label="Uw vraag" value={values.vraag} onChange={(v) => setValue('vraag', v)} error={errors.vraag} required rows={4} />

      <div className="flex items-start gap-2.5 rounded-lg bg-muted px-4 py-3.5 text-sm text-foreground-muted">
        <LockSimple size={18} weight="fill" className="mt-0.5 shrink-0 text-primary/60" />
        <p>
          We gebruiken uw gegevens uitsluitend om op deze vraag te reageren. Geen spam, geen doorverkoop aan derden —
          zie onze{' '}
          <a href={ROUTES.privacy} className="font-medium text-accent underline underline-offset-2 hover:text-secondary">
            privacyverklaring
          </a>
          .
        </p>
      </div>

      {status === 'error' ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircle size={15} weight="fill" />
          Verzenden is niet gelukt. Gebruik gerust de e-mail- of belknop hierboven.
        </p>
      ) : null}

      <Button type="submit" disabled={status === 'submitting'} className="self-start">
        {status === 'submitting' ? <SpinnerGap size={18} weight="bold" className="animate-spin motion-reduce:animate-none" /> : null}
        {status === 'submitting' ? 'Bezig met versturen…' : 'Verstuur uw vraag'}
      </Button>
    </form>
  )
}
