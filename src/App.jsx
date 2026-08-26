import { lazy, Suspense } from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { ROUTES } from './lib/routes'
import Home from './pages/Home'

// Home loads eagerly (it's the most likely entry point). Every other page
// is code-split so a visitor landing on any single page only downloads
// that page's code, not the whole site.
const Pakketten = lazy(() => import('./pages/Pakketten'))
const EnergieIndicatie = lazy(() => import('./pages/EnergieIndicatie'))
const Over = lazy(() => import('./pages/Over'))
const Werkwijze = lazy(() => import('./pages/Werkwijze'))
const Cases = lazy(() => import('./pages/Cases'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Faq = lazy(() => import('./pages/Faq'))
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Voorwaarden = lazy(() => import('./pages/Voorwaarden'))
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
      <Route element={<MainLayout />}>
        <Route path={ROUTES.home} element={<Home />} />

        <Route element={<LazyBoundary />}>
          <Route path={ROUTES.pakketten} element={<Pakketten />} />
          <Route path={ROUTES.energieIndicatie} element={<EnergieIndicatie />} />
          <Route path={ROUTES.over} element={<Over />} />
          <Route path={ROUTES.werkwijze} element={<Werkwijze />} />
          <Route path={ROUTES.cases} element={<Cases />} />
          <Route path={ROUTES.blog} element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path={ROUTES.faq} element={<Faq />} />
          <Route path={ROUTES.contact} element={<Contact />} />
          <Route path={ROUTES.privacy} element={<Privacy />} />
          <Route path={ROUTES.voorwaarden} element={<Voorwaarden />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
