import { Link } from 'react-router-dom'
import { CalendarBlank, Clock } from '@phosphor-icons/react'
import { Badge } from '../ui/Badge'
import { Reveal } from '../ui/Reveal'
import { ROUTES } from '../../lib/routes'

export function BlogCard({ post, delay = 0 }) {
  return (
    <Reveal as="article" delay={delay} className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      <Badge tone="muted">{post.category}</Badge>
      <h3 className="mt-3 text-xl font-semibold text-primary">
        <Link to={ROUTES.blogPost(post.slug)} className="hover:text-secondary">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-foreground-muted">{post.excerpt}</p>
      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <CalendarBlank size={14} />
          {post.date}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} />
          {post.readTime}
        </span>
      </div>
    </Reveal>
  )
}
