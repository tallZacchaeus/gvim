import { createClient, type Client, type InValue, type Row } from '@libsql/client';

/**
 * Turso (libSQL) replacement for the Cloudflare D1 binding.
 *
 * The handlers were written against D1's prepare/bind/all/first/run API, so this
 * exposes the same shape. That keeps the migration off Cloudflare mechanical:
 * `ctx.env.DB` becomes `db()` and the query bodies are untouched.
 */

let client: Client | null = null;

function rawClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is not set');

  client = createClient({ url, authToken });
  return client;
}

/** libSQL Rows carry numeric indices and `length` alongside the column names;
 *  rebuild them as plain records so JSON responses stay clean. */
function toPlain(columns: string[], rows: Row[]): Record<string, any>[] {
  return rows.map(row => {
    const out: Record<string, any> = {};
    for (const col of columns) out[col] = row[col];
    return out;
  });
}

class Statement {
  constructor(private sql: string, private args: InValue[] = []) {}

  bind(...args: unknown[]): Statement {
    return new Statement(this.sql, args as InValue[]);
  }

  async all<T = Record<string, any>>(): Promise<{ results: T[]; success: true }> {
    const rs = await rawClient().execute({ sql: this.sql, args: this.args });
    return { results: toPlain(rs.columns, rs.rows) as T[], success: true };
  }

  async first<T = Record<string, any>>(): Promise<T | null> {
    const rs = await rawClient().execute({ sql: this.sql, args: this.args });
    if (rs.rows.length === 0) return null;
    return toPlain(rs.columns, rs.rows)[0] as T;
  }

  async run(): Promise<{ success: true; meta: { changes: number; last_row_id: number } }> {
    const rs = await rawClient().execute({ sql: this.sql, args: this.args });
    return {
      success: true,
      meta: { changes: rs.rowsAffected, last_row_id: Number(rs.lastInsertRowid ?? 0) }
    };
  }
}

export interface Db {
  prepare(sql: string): Statement;
  batch(statements: { sql: string; args?: InValue[] }[]): Promise<void>;
}

export function db(): Db {
  return {
    prepare: (sql: string) => new Statement(sql),
    batch: async (statements) => {
      await rawClient().batch(
        statements.map(s => ({ sql: s.sql, args: s.args ?? [] })),
        'write'
      );
    }
  };
}
