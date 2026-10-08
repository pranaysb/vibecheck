import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Nothing here</h1>
      <p className="mt-2 text-muted">This page doesn&rsquo;t exist, or you don&rsquo;t have access to it.</p>
      <Link href="/" className="btn btn-primary mt-6">Go home</Link>
    </div>
  );
}
