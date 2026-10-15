import { test } from "node:test";
import assert from "node:assert/strict";
import { safeFetch, BlockedDestinationError } from "../src/lib/net/safe-fetch";

test("safeFetch refuses private, loopback and metadata destinations before connecting", async () => {
  for (const url of ["http://127.0.0.1/", "http://localhost:3000/", "http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://10.0.0.5/", "http://0x7f000001/"]) {
    await assert.rejects(safeFetch(url), BlockedDestinationError, url);
  }
});

test("a server that trickles bytes forever is cut off by the total deadline, not just the idle timeout", async () => {
  const { createServer } = await import("node:http");
  const { requestOnce } = await import("../src/lib/net/safe-fetch");
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    const t = setInterval(() => res.write("."), 100); // never idle for long, never finishes
    res.on("close", () => clearInterval(t));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const started = Date.now();
  try {
    await assert.rejects(requestOnce(`http://127.0.0.1:${port}/`, "127.0.0.1", 10 * 1024 * 1024, 500), /Timed out after 1000ms in total/);
    assert.ok(Date.now() - started < 3000, "gave up around the 1 s total limit");
  } finally {
    server.close();
  }
});
