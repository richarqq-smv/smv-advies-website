import { lazy, Suspense } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireAdmin } from './components/auth/RequireAdmin'
import { AdminLayout } from './components/admin/AdminLayout'
import { ROUTES } from './lib/routes'
import Home from './pages/Home'

// Home loads eagerly (it's the most likely entry point). Every other page
// is code-split so a visitor landing on any single page only downloads
// that page's code, not the whole site.
const Pakketten = lazy(() => import('./pages/Pakketten'))
const EnergieIndicatie = lazy(() => import('./pages/EnergieIndicatie'))
const Over = lazy(() => import('./pages/Over'))
const Werkwijze = lazy(() => import('./pages/Werkwijze'))
const Werkgebied = lazy(() => import('./pages/Werkgebied'))
const Cases = lazy(() => import('./pages/Cases'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Faq = lazy(() => import('./pages/Faq'))
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Voorwaarden = lazy(() => import('./pages/Voorwaarden'))
const MjopTool = lazy(() => import('./pages/MjopTool'))
const Inloggen = lazy(() => import('./pages/Inloggen'))
const Registreren = lazy(() => import('./pages/Registreren'))
const WachtwoordVergeten = lazy(() => import('./pages/WachtwoordVergeten'))
const Account = lazy(() => import('./pages/Account'))
const DossierDetail = lazy(() => import('./pages/DossierDetail'))
const OffertePreview = lazy(() => import('./pages/OffertePreview'))
const Klantgesprek = lazy(() => import('./pages/Klantgesprek'))
const WatKanWachten = lazy(() => import('./pages/WatKanWachten'))
const Archief = lazy(() => import('./pages/Archief'))
const Admin = lazy(() => import('./pages/Admin'))
const AdminDossiers = lazy(() => import('./pages/AdminDossiers'))
const AdminPlanning = lazy(() => import('./pages/AdminPlanning'))
const AdminKansen = lazy(() => import('./pages/AdminKansen'))
const AdminOffertes = lazy(() => import('./pages/AdminOffertes'))
const AdminFacturen = lazy(() => import('./pages/AdminFacturen'))
const FactuurDetail = lazy(() => import('./pages/FactuurDetail'))
const AdminAdministratie = lazy(() => import('./pages/AdminAdministratie'))
const AdminOmzet = lazy(() => import('./pages/AdminOmzet'))
const AdminOpenstaand = lazy(() => import('./pages/AdminOpenstaand'))
const AdminResultaat = lazy(() => import('./pages/AdminResultaat'))
const AdminKosten = lazy(() => import('./pages/AdminKosten'))
const AdminBtw = lazy(() => import('./pages/AdminBtw'))
const AdminInstellingen = lazy(() => import('./pages/AdminInstellingen'))
const AdminOpname = lazy(() => import('./pages/AdminOpname'))
const NotFound = lazy(() => import('./pages/NotFound'))

function LazyBoundary() {
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      {/*
        Buiten <MainLayout />: de offerte-preview/print-pagina mag nooit
        site-header/nav/footer bevatten, ook niet als printCSS die zou
        moeten wegwerken — dus geen gedeelde layout hier, alleen de
        auth-guard (layout-agnostisch, zie RequireAuth).
        Werkfase Fase 3 (SMV-audit-opvolging): geen RequireAdmin meer — een
        klant mag zijn eigen offerte nu ook bekijken (RLS-policy
        offertes_select_klant, 0007_offertes_klant_select.sql, is de enige
        echte toegangsgrens: is_member_of_klant() geeft alleen de eigen
        offerte terug, nooit die van een andere klant; getOfferte() in
        OffertePreview.jsx behandelt "geen rij" al als "niet gevonden").
      */}
      <Route element={<LazyBoundary />}>
        <Route element={<RequireAuth />}>
          <Route path="/dossier/:dossierId/offerte/:offerteId" element={<OffertePreview />} />
          {/*
            Werkfase Fase 7: "Klaar voor klantgesprek" is een
            voorbereidingsscherm voor de adviseur, geen klantfunctie —
            daarom wél RequireAdmin (in tegenstelling tot de offerte-preview
            hierboven, die sinds Fase 3 bewust breder is).
          */}
          <Route element={<RequireAdmin />}>
            <Route path="/dossier/:dossierId/klantgesprek" element={<Klantgesprek />} />
          </Route>
        </Route>
      </Route>

      {/*
        Admin-webapp (mobiele-adminronde, 2026-09-30) — een bewuste,
        volledig aparte routetak, GEEN kind van <MainLayout /> meer: de
        vorige opzet nestte deze admin-routes binnen MainLayout, waardoor
        elke adminpagina de publieke site-Header/MobileNav/Footer/
        ContactFab/CookieBanner meekreeg. AdminLayout is nu zelf de
        volledige shell (eigen topbar/navigatie, zie
        components/admin/AdminLayout.jsx) — precies zoals gevraagd: /admin
        is een eigen ingang, geen publieke navigatie eromheen. Zelfde
        RequireAuth -> RequireAdmin-bewaking als voorheen, ongewijzigd
        (RLS blijft de echte toegangsgrens, zie SECURITY_MODEL.md); alleen
        de laag ERBOVEN (welke layout de routes omringt) is verplaatst.
      */}
      <Route element={<LazyBoundary />}>
        <Route element={<RequireAuth />}>
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path={ROUTES.admin} element={<Admin />} />
              <Route path={ROUTES.adminPlanning} element={<AdminPlanning />} />
              <Route path={ROUTES.adminDossiers} element={<AdminDossiers />} />
              {/*
                Mobiele-opnameronde: hergebruikt letterlijk hetzelfde
                DossierDetail-component als /dossier/:dossierId hieronder
                (zelfde interne isAdmin-check, zelfde secties) — alleen nu
                gerouteerd onder AdminLayout in plaats van MainLayout, dus
                geen publieke header/footer meer als een admin vanuit
                /admin/dossiers doorklikt. Geen inhoud gedupliceerd.
              */}
              <Route path="/admin/dossiers/:dossierId" element={<DossierDetail />} />
              <Route path="/admin/dossiers/:dossierId/opnames/:opnameId" element={<AdminOpname />} />
              <Route path={ROUTES.watKanWachten} element={<WatKanWachten />} />
              <Route path={ROUTES.archief} element={<Archief />} />
              <Route path={ROUTES.adminKansen} element={<AdminKansen />} />
              <Route path={ROUTES.adminOffertes} element={<AdminOffertes />} />
              <Route path={ROUTES.adminFacturen} element={<AdminFacturen />} />
              <Route path="/admin/facturen/:factuurId" element={<FactuurDetail />} />
              <Route path={ROUTES.adminAdministratie} element={<AdminAdministratie />} />
              <Route path={ROUTES.adminOmzet} element={<AdminOmzet />} />
              <Route path={ROUTES.adminOpenstaand} element={<AdminOpenstaand />} />
              <Route path={ROUTES.adminResultaat} element={<AdminResultaat />} />
              <Route path={ROUTES.adminKosten} element={<AdminKosten />} />
              <Route path={ROUTES.adminBtw} element={<AdminBtw />} />
              <Route path={ROUTES.adminInstellingen} element={<AdminInstellingen />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<MainLayout />}>
        <Route path={ROUTES.home} element={<Home />} />

        <Route element={<LazyBoundary />}>
          <Route path={ROUTES.pakketten} element={<Pakketten />} />
          <Route path={ROUTES.energieIndicatie} element={<EnergieIndicatie />} />
          <Route path={ROUTES.over} element={<Over />} />
          <Route path={ROUTES.werkwijze} element={<Werkwijze />} />
          <Route path={ROUTES.werkgebied} element={<Werkgebied />} />
          <Route path={ROUTES.cases} element={<Cases />} />
          <Route path={ROUTES.blog} element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path={ROUTES.faq} element={<Faq />} />
          <Route path={ROUTES.contact} element={<Contact />} />
          <Route path={ROUTES.privacy} element={<Privacy />} />
          <Route path={ROUTES.voorwaarden} element={<Voorwaarden />} />
          <Route path={ROUTES.mjopTool} element={<MjopTool />} />
          <Route path={ROUTES.inloggen} element={<Inloggen />} />
          <Route path={ROUTES.registreren} element={<Registreren />} />
          <Route path={ROUTES.wachtwoordVergeten} element={<WachtwoordVergeten />} />

          <Route element={<RequireAuth />}>
            <Route path={ROUTES.account} element={<Account />} />
            {/*
              Klantomgeving-uitbreiding (2026-09-28) — "Mijn facturen":
              hergebruikt FactuurDetail.jsx (zelfde component als de
              admin-route hierboven), maar bewust BUITEN de RequireAdmin-
              boom: RLS (facturen_select_klant, 0017) is de toegangsgrens,
              FactuurDetail.jsx verbergt de admin-acties zelf al via een
              eigen isAdmin-check.
            */}
            <Route path="/account/facturen/:factuurId" element={<FactuurDetail />} />
            {/*
              /dossier/:id blijft bewust hier, ONDER MainLayout — dit is een
              gedeelde route (dezelfde DossierDetail.jsx voor zowel de eigen
              klant als een admin die een dossier bekijkt, met een interne
              isAdmin-check die admin-only secties toont). Een klant die
              zijn eigen dossier bekijkt hoort de gewone site-chrome te
              zien, dus deze route kan niet zomaar naar de Admin-shell
              verhuizen — AdminDossiers.jsx linkt er gewoon naartoe (zelfde
              gedrag als voorheen), en "Terug naar dossiers" wijst een
              admin terug naar /admin/dossiers (bepaalDossierOverzichtRoute).
            */}
            <Route path="/dossier/:dossierId" element={<DossierDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
