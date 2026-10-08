import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth/session";
import { canViewAudit } from "@/lib/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Files", robots: { index: false } };

export default async function FilesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ path?: string }> }) {
  const [{ id }, { path }, user] = await Promise.all([params, searchParams, getUser()]);
  const audit = await prisma.audit.findUnique({ where: { id }, select: { id: true, label: true, source: true, ownerId: true, requests: { select: { status: true, expertId: true } } } });
  if (!audit || !user || !canViewAudit(audit, user)) notFound();
  if (!(audit.ownerId === user.id || user.isAdmin || user.expertStatus === "APPROVED")) notFound();

  const files = await prisma.auditFile.findMany({ where: { auditId: id }, select: { path: true, size: true, contentType: true }, orderBy: { path: "asc" } });
  const selected = path ? await prisma.auditFile.findUnique({ where: { auditId_path: { auditId: id, path } } }) : null;
  const isText = selected && /^(text\/|application\/(json|xml|manifest))|svg/.test(selected.contentType);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <Link href={`/audits/${id}`} className="text-sm text-muted hover:text-fg">← {audit.label}</Link>
      <h1 className="mt-2 text-2xl font-semibold">Files</h1>
      <p className="mt-1 text-sm text-muted">{files.length} files kept for review. Real .env files are never stored; node_modules and build caches are skipped.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr] items-start">
        <nav aria-label="Files" className="card p-2 max-h-[70vh] overflow-auto">
          <ul className="font-mono text-[12.5px]">
            {files.map((f) => (
              <li key={f.path}>
                <Link
                  href={`?path=${encodeURIComponent(f.path)}`}
                  aria-current={f.path === path ? "page" : undefined}
                  className={`flex justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-surface ${f.path === path ? "bg-surface text-fg" : "text-muted"}`}
                >
                  <span className="truncate">{f.path}</span>
                  <span className="text-faint shrink-0 tabular-nums">{f.size < 1024 ? `${f.size} B` : `${(f.size / 1024).toFixed(0)} KB`}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="card min-w-0">
          {!selected ? (
            <p className="p-6 text-sm text-muted">Select a file.</p>
          ) : isText ? (
            <>
              <p className="px-4 py-3 border-b border-line font-mono text-[12.5px]">{selected.path}</p>
              <pre className="p-4 font-mono text-[12.5px] leading-relaxed overflow-auto max-h-[70vh]">
                {Buffer.from(selected.data).toString("utf8").split("\n").map((line, i) => (
                  <div key={i} className="flex">
                    <span className="select-none w-10 shrink-0 pr-3 text-right text-faint">{i + 1}</span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                ))}
              </pre>
            </>
          ) : (
            <p className="p-6 text-sm text-muted">
              {selected.path} is a binary file ({selected.contentType}).{" "}
              {selected.contentType.startsWith("image/") && audit.source !== "URL" ? "Open the preview to see it in context." : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
