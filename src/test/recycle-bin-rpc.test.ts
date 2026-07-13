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

  // Real column set per table (from current DB schema). If a table schema
  // changes, update this map — the test then catches label expressions
  // that reference non-existent columns (the class of bug that produced
  // "column X does not exist" runtime errors).
  const TABLE_COLUMNS: Record<string, string[]> = {
    jobs: ["job_number","customer_name","branch_name","factory_challan_number","status"],
    clients: ["company_name","client_name","contact_number","email"],
    expenses: ["service_provider","remarks","category_name","memo_no","tr_no"],
    incomes: ["category_name","remarks","tr_no"],
    inventory: ["part_name","part_number","category","brand","supplier"],
    warranties: ["job_number","customer_name","warranty_type","status"],
    brands: ["name","remarks"],
    models: ["name","remarks"],
    boards: ["name","remarks"],
    chart_of_accounts: ["account_code","account_name","account_type"],
    branches: ["name","address","phone","email"],
    expense_categories: ["name","remarks"],
    income_categories: ["name","remarks"],
  };

  // Extract "WHEN '<table>' THEN '<label_expr>'" pairs from the migration.
  function extractLabelExprs(): Record<string, string> {
    const re = /WHEN\s+'([a-z_]+)'\s+THEN\s+'([^']*(?:''[^']*)*)'/g;
    const out: Record<string, string> = {};
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) out[m[1]] = m[2];
    return out;
  }

  it("only references columns that exist in each table", () => {
    const exprs = extractLabelExprs();
    for (const [table, cols] of Object.entries(TABLE_COLUMNS)) {
      const expr = exprs[table];
      expect(expr, `missing label expression for ${table}`).toBeTruthy();
      // Strip literal strings ('JOB-' → doubled '' inside outer quotes) and
      // pull bare identifiers (letters/underscores) that look like columns.
      const stripped = expr.replace(/''[^']*''/g, "");
      const idents = new Set(
        (stripped.match(/\b[a-z_][a-z0-9_]*\b/g) ?? []).filter(
          (w) => !["COALESCE","id","text","JOB"].includes(w) && isNaN(Number(w))
        )
      );
      const allowed = new Set([...cols, "id"]);
      for (const ident of idents) {
        expect(
          allowed.has(ident),
          `${table}.${ident} does not exist (label expr: ${expr})`,
        ).toBe(true);
      }
    }
  });
});