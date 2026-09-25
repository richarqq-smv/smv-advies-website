import { lazy, Suspense } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { RequireAuth } from './components/auth/RequireAuth'
import { RequireAdmin } from './components/auth/RequireAdmin'
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
const Admin = lazy(() => import('./pages/Admin'))
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
        auth-/admin-guards (die zijn layout-agnostisch, zie RequireAuth/
        RequireAdmin).
      */}
      <Route element={<LazyBoundary />}>
        <Route element={<RequireAuth />}>
          <Route element={<RequireAdmin />}>
            <Route path="/dossier/:dossierId/offerte/:offerteId" element={<OffertePreview />} />
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
          <Route path={ROUTES.inloggen} element={<Inloggen />} />
          <Route path={ROUTES.registreren} element={<Registreren />} />
          <Route path={ROUTES.wachtwoordVergeten} element={<WachtwoordVergeten />} />

          <Route element={<RequireAuth />}>
            <Route path={ROUTES.account} element={<Account />} />
            <Route path="/dossier/:dossierId" element={<DossierDetail />} />
            <Route element={<RequireAdmin />}>
              <Route path={ROUTES.admin} element={<Admin />} />
              {/* Intern adviesinstrument van SMV — niet voor klanten of bezoekers. */}
              <Route path={ROUTES.mjopTool} element={<MjopTool />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
