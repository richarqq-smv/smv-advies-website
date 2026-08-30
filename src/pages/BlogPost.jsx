import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarBlank, Clock, Info } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { getBlogPostBySlug } from '../data/blogPosts'
import { getBreadcrumbSchema, getBlogPostingSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'
import NotFound from './NotFound'

const LINK_CLASSNAME = 'font-medium text-accent underline underline-offset-2 hover:text-secondary'

function renderParts(parts) {
  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return <span key={index}>{part}</span>
    }
    // External source links use `href` (opens in a new tab); internal
    // cross-links use `to`, as every existing article already does.
    if (part.href) {
      return (
        <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASSNAME}>
          {part.text}
        </a>
      )
    }
    return (
      <Link key={index} to={part.to} className={LINK_CLASSNAME}>
        {part.text}
      </Link>
    )
  })
}

function renderSection(section, index) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 key={index} className="mt-10 text-2xl text-primary sm:text-[1.7rem]">
          {section.text}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={index} className="mt-7 text-lg font-semibold text-primary">
          {section.text}
        </h3>
      )
    case 'p':
      return (
        <p key={index} className="mt-4 text-base leading-relaxed text-foreground-muted">
          {renderParts(section.parts)}
        </p>
      )
    case 'ul':
      return (
        <ul key={index} className="mt-4 space-y-2.5 pl-1">
          {section.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2.5 text-base leading-relaxed text-foreground-muted">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>{typeof item === 'string' ? item : renderParts(item)}</span>
            </li>
          ))}
        </ul>
      )
    case 'callout':
      return (
        <div key={index} className="mt-6 flex items-start gap-3 rounded-lg bg-muted px-5 py-4">
          <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
          <div className="text-sm leading-relaxed text-foreground-muted">
            {section.title ? <p className="mb-1 font-semibold text-primary">{section.title}</p> : null}
            <p>{typeof section.text === 'string' ? section.text : renderParts(section.text)}</p>
          </div>
        </div>
      )
    default:
      return null
  }
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = getBlogPostBySlug(slug)

  if (!post) {
    return <NotFound />
  }

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt}
        structuredData={[
          getBreadcrumbSchema([
            { name: 'Blog', path: ROUTES.blog },
            { name: post.title, path: ROUTES.blogPost(post.slug) },
          ]),
          getBlogPostingSchema(post),
        ]}
      />

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

          {post.bodyAvailable ? (
            <>
              {post.sections.map((section, index) => renderSection(section, index))}

              {post.cta ? (
                <div className="mt-10 rounded-xl bg-muted p-6 sm:p-8">
                  <p className="text-base leading-relaxed text-foreground-muted">{post.cta.text}</p>
                  <Button to={post.cta.to} className="mt-4">
                    {post.cta.label}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-8 flex items-start gap-3 rounded-lg bg-muted px-5 py-4 text-sm leading-relaxed text-foreground-muted">
              <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
              <p>
                De volledige tekst van dit artikel is nog niet beschikbaar in dit project — alleen
                titel, samenvatting en publicatiedatum konden worden geverifieerd. De originele
                artikeltekst moet nog worden aangeleverd voordat deze pagina compleet is.
              </p>
            </div>
          )}

          <Button to={ROUTES.blog} variant="outline" className="mt-10">
            <ArrowLeft size={16} />
            Alle artikelen
          </Button>
        </Container>
      </Section>
    </>
  )
}
