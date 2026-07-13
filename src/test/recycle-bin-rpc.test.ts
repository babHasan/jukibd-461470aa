import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard: the list_deleted_rows RPC MUST label jobs using the real
 * `job_number` column. It previously broke because it referenced a
 * non-existent `ticket_number` column, so we lock this in with a test
 * against the latest migration that defines the function.
 */
function latestListDeletedRowsMigration(): string {
  const dir = join(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (let i = files.length - 1; i >= 0; i--) {
    const sql = readFileSync(join(dir, files[i]), "utf8");
    if (/FUNCTION\s+public\.list_deleted_rows/i.test(sql)) return sql;
  }
  throw new Error("No migration defines public.list_deleted_rows");
}

describe("list_deleted_rows RPC (latest migration)", () => {
  const sql = latestListDeletedRowsMigration();

  it("labels jobs with job_number, not ticket_number", () => {
    expect(sql).toMatch(/JOB-''\s*\|\|\s*job_number/);
    expect(sql).not.toMatch(/ticket_number/);
  });

  it("keeps super-admin gating and safe search_path", () => {
    expect(sql).toMatch(/is_super_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(/SET\s+search_path\s+TO\s+'public'/i);
  });

  it("covers every whitelisted recycle-bin table", () => {
    const expected = [
      "jobs","clients","expenses","incomes","inventory","warranties",
      "brands","models","boards","chart_of_accounts","branches",
      "expense_categories","income_categories",
    ];
    for (const t of expected) {
      expect(sql).toContain(`'${t}'`);
    }
  });
});