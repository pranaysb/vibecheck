import { test } from "node:test";
import assert from "node:assert/strict";
import { safeFetch, BlockedDestinationError } from "../src/lib/net/safe-fetch";

test("safeFetch refuses private, loopback and metadata destinations before connecting", async () => {
  for (const url of ["http://127.0.0.1/", "http://localhost:3000/", "http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://10.0.0.5/", "http://0x7f000001/"]) {
    await assert.rejects(safeFetch(url), BlockedDestinationError, url);
  }
});
