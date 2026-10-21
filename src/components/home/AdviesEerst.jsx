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
 *
 * Toon (pro-design-ronde 2026-10-21): `muted`, en Independence `white` —
 * voorheen stonden RegionalBand en Independence allebei op `muted` direct
 * onder elkaar (dubbele sectiepadding, ~220px leeg grijs vlak), terwijl
 * de rest van de homepage netjes wit/grijs afwisselt.
 *
 * Anti-slop-ronde (2026-10-21): links uitgelijnd op de gedeelde linkerrand
 * van de pagina, zonder decoratief icoon erboven, lopende tekst in volle
 * inktkleur.
 */
export function AdviesEerst() {
  return (
    <Section tone="muted">
      <Container>
        <Reveal className="max-w-3xl">
          <h2 className="text-3xl text-primary sm:text-4xl">Waarom we niet meteen naar offertes kijken</h2>
          <p className="mt-5 text-lg leading-relaxed text-foreground">
            Pas als u weet wat voor uw pand verstandig is, heeft een offerte echt betekenis.
            Daarom beginnen wij met onafhankelijk advies: wat moet nu, wat kan wachten, en in
            welke volgorde. Zo weet u bij een offerteaanvraag precies waar u om vraagt.
          </p>
          <p className="mt-4 text-base text-foreground-muted">
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
