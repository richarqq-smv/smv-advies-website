import { ListChecks } from '@phosphor-icons/react'
import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../lib/routes'

/**
 * Waarom deze volgorde: een offerte van een installateur gaat uit van wat
 * hij verkoopt, niet van wat voor uw pand verstandig is. Dat is precies het
 * onderscheid met Independence.jsx (geen belang bij een leverancier) —
 * vandaar direct erna geplaatst. Verwijst naar de daadwerkelijke Gold-scope
 * (max. 3 aanbieders per maatregel, zie data/packages.js) i.p.v. een losse
 * belofte, zodat dit consistent blijft met de pakketpagina.
 */
export function AdviesEerst() {
  return (
    <Section tone="white">
      <Container className="max-w-3xl text-center">
        <Reveal>
          <ListChecks size={32} weight="light" className="mx-auto text-accent" />
          <h2 className="mt-5 text-3xl text-primary sm:text-4xl">Eerst advies, dan pas offertes</h2>
          <p className="mt-5 text-lg leading-relaxed text-foreground-muted">
            Een offerte van een installateur gaat uit van wat hij verkoopt, niet van wat voor uw
            pand verstandig is. Daarom beginnen wij met onafhankelijk advies: wat moet nu, wat kan
            wachten, en in welke volgorde. Pas daarna heeft een offerte betekenis — u weet dan
            precies waar u om vraagt.
          </p>
          <p className="mt-4 text-sm text-foreground-muted">
            Wilt u dat wij ook de offertes voor u verzamelen en vergelijken? Dat kan binnen het{' '}
            <Link to={ROUTES.pakketten} className="font-medium text-accent underline underline-offset-2 hover:text-secondary">
              Gold Pakket
            </Link>
            , bij maximaal 3 aanbieders per maatregel.
          </p>
        </Reveal>
      </Container>
    </Section>
  )
}
