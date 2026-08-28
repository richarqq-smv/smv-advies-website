import { Seo } from '../components/seo/Seo'
import { Hero } from '../components/home/Hero'
import { UspStrip } from '../components/home/UspStrip'
import { PricingSection } from '../components/home/PricingSection'
import { EnergieCta } from '../components/home/EnergieCta'
import { HowItWorks } from '../components/home/HowItWorks'
import { RegionalBand } from '../components/home/RegionalBand'
import { CasesSection } from '../components/home/CasesSection'
import { ClosingCta } from '../components/home/ClosingCta'

export default function Home() {
  return (
    <>
      <Seo
        title="Verduurzamingsadvies voor het mkb"
        description="Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in de Hoeksche Waard: heldere rapportage, concrete maatregelen en een subsidiecheck."
      />

      <Hero />
      <UspStrip />
      <PricingSection />
      <EnergieCta />
      <HowItWorks />
      <RegionalBand />
      <CasesSection />
      <ClosingCta />
    </>
  )
}
