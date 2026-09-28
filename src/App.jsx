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
            <Route path="/dossier/:dossierId" element={<DossierDetail />} />
            {/*
              Admin-ronde (2026-09-28): AdminLayout geeft elke admin-
              subpagina dezelfde navigatiebalk (Dashboard/Planning/
              Klanten & dossiers/Wat kan wachten/Archief) — dat is ook de
              "terug naar Admin Dashboard"-mogelijkheid, dus de losse
              pagina's hoeven daar zelf niets meer voor te bouwen.
            */}
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path={ROUTES.admin} element={<Admin />} />
                <Route path={ROUTES.adminPlanning} element={<AdminPlanning />} />
                <Route path={ROUTES.adminDossiers} element={<AdminDossiers />} />
                <Route path={ROUTES.watKanWachten} element={<WatKanWachten />} />
                <Route path={ROUTES.archief} element={<Archief />} />
                <Route path={ROUTES.adminKansen} element={<AdminKansen />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
