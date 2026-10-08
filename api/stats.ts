import { json, guard } from '../lib/util.js';
import { db } from '../lib/db.js';

/**
 * Counts for the admin dashboard.
 *
 * The dashboard previously fetched every gallery row, sermon, contact and
 * category just to call .length on each — downloading the whole database to
 * render four numbers. COUNT(*) does that work in the database instead.
 */
export async function GET(request: Request): Promise<Response> {
  const denied = await guard(request);
  if (denied) return denied;

  const [gallery, sermons, contacts, categories, newsletter, recent] = await Promise.all([
    db().prepare('SELECT COUNT(*) AS n FROM gallery').first<{ n: number }>(),
    db().prepare('SELECT COUNT(*) AS n FROM sermons').first<{ n: number }>(),
    db().prepare('SELECT COUNT(*) AS n FROM contact_submissions').first<{ n: number }>(),
    db().prepare('SELECT COUNT(*) AS n FROM gallery_categories').first<{ n: number }>(),
    db().prepare('SELECT COUNT(*) AS n FROM contact_submissions WHERE newsletter = 1').first<{ n: number }>(),
    db().prepare(
      "SELECT COUNT(*) AS n FROM contact_submissions WHERE submitted_at >= datetime('now', '-7 days')"
    ).first<{ n: number }>()
  ]);

  // Category breakdown powers the dashboard's at-a-glance gallery summary.
  const { results: byCategory } = await db().prepare(`
    SELECT c.slug, c.label, COUNT(g.id) AS total
    FROM gallery_categories c
    LEFT JOIN gallery g ON g.category = c.slug
    GROUP BY c.slug, c.label
    ORDER BY total DESC, c.label ASC
  `).all();

  return json({
    gallery: Number(gallery?.n ?? 0),
    sermons: Number(sermons?.n ?? 0),
    contacts: Number(contacts?.n ?? 0),
    categories: Number(categories?.n ?? 0),
    newsletter: Number(newsletter?.n ?? 0),
    contactsLast7Days: Number(recent?.n ?? 0),
    byCategory: (byCategory || []).map((r: any) => ({
      slug: r.slug, label: r.label, total: Number(r.total)
    }))
  });
}
