import { Seo } from '../components/seo/Seo'
import { Hero } from '../components/home/Hero'
import { ProblemRecognition } from '../components/home/ProblemRecognition'
import { UspStrip } from '../components/home/UspStrip'
import { PricingSection } from '../components/home/PricingSection'
import { EnergieCta } from '../components/home/EnergieCta'
import { HowItWorks } from '../components/home/HowItWorks'
import { RegionalBand } from '../components/home/RegionalBand'
import { Independence } from '../components/home/Independence'
import { ClosingCta } from '../components/home/ClosingCta'

export default function Home() {
  return (
    <>
      <Seo
        title="Verduurzamingsadvies voor het mkb"
        description="Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in de Hoeksche Waard: heldere rapportage, concrete maatregelen en een subsidiecheck."
      />

      <Hero />
      <ProblemRecognition />
      <UspStrip />
      <PricingSection />
      <EnergieCta />
      <HowItWorks />
      <RegionalBand />
      <Independence />
      <ClosingCta />
    </>
  )
}
