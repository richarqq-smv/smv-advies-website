import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getServiceSchema, getOrganizationSchema, getBlogPostingSchema } from './structuredData.js'
import { PACKAGES } from '../data/packages.js'
import { COMPANY } from '../data/company.js'
import { BLOG_POSTS } from '../data/blogPosts.js'

test('getServiceSchema: één Service-object per pakket, geldig @type en geen verzonnen velden', () => {
  const schemas = getServiceSchema(PACKAGES)
  assert.equal(schemas.length, PACKAGES.length)
  schemas.forEach((schema, index) => {
    const pkg = PACKAGES[index]
    assert.equal(schema['@type'], 'Service')
    assert.equal(schema.description, pkg.description)
    assert.equal(schema.offers.price, pkg.priceTiers[0].prijs)
    assert.equal(schema.offers.priceCurrency, 'EUR')
    assert.equal(schema.offers.description, pkg.priceNote)
    assert.ok(schema.name.includes(pkg.name))
  })
})

test('getServiceSchema: geen Product-type en geen rating-/reviewvelden (adviesdienst, geen fysiek product, geen reviews)', () => {
  const schemas = getServiceSchema(PACKAGES)
  schemas.forEach((schema) => {
    assert.notEqual(schema['@type'], 'Product')
    assert.equal('aggregateRating' in schema, false)
    assert.equal('review' in schema, false)
  })
})

test('getServiceSchema: url verwijst naar het bestaande pakket-anker op /pakketten, geen los verzonnen pad', () => {
  const schemas = getServiceSchema(PACKAGES)
  schemas.forEach((schema, index) => {
    assert.equal(schema.url, `https://smv-advies.nl/pakketten#pakket-${PACKAGES[index].id}`)
  })
})

test('getOrganizationSchema: sameAs bevat het echte LinkedIn-kanaal uit company.js, geen verzonnen KVK-link', () => {
  const schema = getOrganizationSchema()
  assert.deepEqual(schema.sameAs, [COMPANY.linkedinUrl])
  assert.ok(schema.sameAs.every((url) => !url.includes('kvk.nl')))
})

test('getBlogPostingSchema: author is een Person met COMPANY.founder-gegevens, geen verzonnen naam', () => {
  const schema = getBlogPostingSchema(BLOG_POSTS[0])
  assert.equal(schema.author['@type'], 'Person')
  assert.equal(schema.author.name, COMPANY.founder.name)
  assert.equal(schema.author.jobTitle, COMPANY.founder.jobTitle)
  assert.equal(schema.author.url, COMPANY.founder.linkedinUrl)
  assert.deepEqual(schema.author.worksFor, { '@type': 'Organization', name: COMPANY.name })
})
