import { useParams } from 'react-router-dom'
import { ArrowLeft, CalendarBlank, Clock, Info } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { getBlogPostBySlug } from '../data/blogPosts'
import { ROUTES } from '../lib/routes'
import NotFound from './NotFound'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return <NotFound />
  }

  return (
    <>
      <Seo title={post.title} description={post.excerpt} />

      <Section tone="white">
        <Container className="max-w-2xl">
          <Button to={ROUTES.blog} variant="ghost" size="sm" className="-ml-3 mb-6">
            <ArrowLeft size={16} />
            Terug naar blog
          </Button>

          <Badge tone="muted">{post.category}</Badge>
          <h1 className="mt-3 text-3xl text-primary sm:text-4xl">{post.title}</h1>

          <div className="mt-4 flex items-center gap-4 text-sm font-medium text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <CalendarBlank size={15} />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} />
              {post.readTime}
            </span>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-foreground-muted">{post.excerpt}</p>

          {!post.bodyAvailable ? (
            <div className="mt-8 flex items-start gap-3 rounded-lg bg-muted px-5 py-4 text-sm leading-relaxed text-foreground-muted">
              <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
              <p>
                De volledige tekst van dit artikel is nog niet beschikbaar in dit project — alleen
                titel, samenvatting en publicatiedatum konden worden geverifieerd. De originele
                artikeltekst moet nog worden aangeleverd voordat deze pagina compleet is.
              </p>
            </div>
          ) : null}

          <Button to={ROUTES.blog} variant="outline" className="mt-10">
            <ArrowLeft size={16} />
            Alle artikelen
          </Button>
        </Container>
      </Section>
    </>
  )
}
