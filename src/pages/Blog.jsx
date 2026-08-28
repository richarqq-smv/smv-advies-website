import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { BlogCard } from '../components/blog/BlogCard'
import { BLOG_POSTS } from '../data/blogPosts'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

export default function Blog() {
  return (
    <>
      <Seo
        title="Blog"
        description="Praktische kennis voor verduurzaming van uw bedrijfspand: isolatie, subsidies, installaties en verborgen energieverbruik."
        structuredData={[getBreadcrumbSchema([{ name: 'Blog', path: ROUTES.blog }])]}
      />

      <PageHero
        eyebrow="Kennis & inzicht"
        title="Praktische kennis voor verduurzaming van uw bedrijfspand"
        description="Artikelen over isolatie, subsidies, installaties en verborgen energieverbruik. Heldere kennis, geschreven voor ondernemers."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <h2 className="sr-only">Artikelen</h2>
          <div className="flex flex-col gap-8">
            {BLOG_POSTS.map((post, index) => (
              <BlogCard key={post.slug} post={post} delay={index * 60} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
