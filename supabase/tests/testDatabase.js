/**
 * Testharnas voor de Supabase-migrations: draait ALLE bestanden uit
 * supabase/migrations/ in volgorde tegen een lokale, in-process Postgres
 * (PGlite), zodat RLS-policies, triggers en RPC's echt worden uitgevoerd
 * in plaats van alleen gelezen. Geen netwerk, geen Supabase-project, geen
 * credentials.
 *
 * Wat hier wordt nagebootst (en alleen dat) is het deel van Supabase waar
 * de migrations op leunen: de rollen `anon`/`authenticated`, het schema
 * `auth` met `auth.users` en `auth.uid()`, en de standaardrechten die
 * Supabase op het `public`-schema toekent. `auth.uid()` leest — net als in
 * Supabase — de `sub`-claim van het request; hier gezet via `alsGebruiker()`.
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

const SUPABASE_BASIS = `
  create role anon nologin;
  create role authenticated nologin;

  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;

  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`

export async function maakTestDatabase() {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(SUPABASE_BASIS)
  const bestanden = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
  for (const bestand of bestanden) {
    await db.exec(await readFile(path.join(MIGRATIONS_DIR, bestand), 'utf-8'))
  }
  return db
}

/** Voert `fn` uit als ingelogde gebruiker (rol authenticated, auth.uid() = uid), of als anon bij uid null. */
export async function alsGebruiker(db, uid, fn) {
  await db.exec(uid ? 'set role authenticated' : 'set role anon')
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? ''])
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.query(`select set_config('request.jwt.claim.sub', '', false)`)
  }
}

/** Maakt een account aan zoals Supabase Auth dat doet (trigger handle_new_user vult profiles/user_roles). */
export async function maakAccount(db, { id, email, admin = false }) {
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, email])
  if (admin) await db.query(`update public.user_roles set role = 'admin' where user_id = $1`, [id])
}
