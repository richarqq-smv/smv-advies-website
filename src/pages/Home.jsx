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
        description="SMV Advies brengt in een heldere rapportage in kaart hoe uw bedrijfspand energiezuiniger, comfortabeler en toekomstbestendig wordt. Onafhankelijk advies voor mkb-bedrijfspanden in de Hoeksche Waard."
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
