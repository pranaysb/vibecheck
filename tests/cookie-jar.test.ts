import { test } from "node:test";
import assert from "node:assert/strict";
import { CookieJar } from "../src/lib/net/cookie-jar";

test("cookie jar follows browser rules for host, domain, path, secure and expiry", () => {
  const jar = new CookieJar();
  const now = Date.UTC(2026, 0, 1);
  jar.store(
    [
      "__session=abc; Path=/; HttpOnly; Secure",
      "wide=1; Domain=.example.com; Path=/",
      "scoped=2; Path=/app",
      "evil=3; Domain=attacker.com",
      "gone=4; Max-Age=0",
      "later=5; Expires=Thu, 01 Jan 2099 00:00:00 GMT",
    ],
    "https://www.example.com/login",
    now
  );
  assert.equal(jar.header("https://www.example.com/", now), "__session=abc; wide=1; later=5");
  assert.equal(jar.header("https://www.example.com/app/x", now), "scoped=2; __session=abc; wide=1; later=5", "longer paths first");
  assert.equal(jar.header("https://api.example.com/", now), "wide=1", "host-only cookies stay on their host");
  assert.equal(jar.header("http://www.example.com/", now), "wide=1; later=5", "Secure cookies need https");
  assert.equal(jar.header("https://attacker.com/", now), undefined, "a cookie for an unrelated domain is rejected");
  assert.equal(jar.header("https://www.example.com/application", now)?.includes("scoped"), false, "/app does not match /application");

  jar.store(["__session=; Max-Age=0"], "https://www.example.com/", now);
  assert.equal(jar.header("https://www.example.com/", now), "wide=1; later=5", "Max-Age=0 deletes");
});
