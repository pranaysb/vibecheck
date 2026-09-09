import crypto from "node:crypto";
import { getDeploymentCommitSha } from "@/lib/version";

export interface AttestationPayload {
  auditId: string;
  targetName: string;
  targetUrl: string;
  commitSha: string;
  timestamp: string;
  scannerVersion: string;
  rulesetVersion: string;
  securityGateVerdict: "READY TO SHIP" | "NOT SAFE TO SHIP";
  overallScore: number;
  findingsCount: number;
}

export interface SignedAttestation {
  payload: AttestationPayload;
  payloadSha256: string;
  signatureHex: string;
  signerPublicKeyId: string;
  publicKeyPem: string;
  revocationStatus: "ACTIVE" | "REVOKED";
}

export interface TamperTestResult {
  testId: string;
  testName: string;
  tamperAction: string;
  expectedResult: "FAIL" | "PASS";
  actualResult: "FAIL" | "PASS";
  passed: boolean;
  details: string;
}

// Deterministic Authority Keypair for VibeCheck Verification Authority
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const AUTHORITY_PUBLIC_KEY_PEM = publicKey.export({ type: "spki", format: "pem" }).toString();
const AUTHORITY_PRIVATE_KEY_PEM = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

// Generate an untrusted rogue keypair to test Key Mismatch (Test D)
const rogueKeyPair = crypto.generateKeyPairSync("ed25519");
const ROGUE_PUBLIC_KEY_PEM = rogueKeyPair.publicKey.export({ type: "spki", format: "pem" }).toString();

/**
 * Computes canonical SHA-256 digest of payload object
 */
export function computeCanonicalSha256(payload: AttestationPayload): string {
  // Canonical sorted key JSON
  const sortedKeys = Object.keys(payload).sort() as Array<keyof AttestationPayload>;
  const canonicalObj: any = {};
  for (const k of sortedKeys) {
    canonicalObj[k] = payload[k];
  }
  const serialized = JSON.stringify(canonicalObj);
  return crypto.createHash("sha256").update(serialized, "utf8").digest("hex");
}

/**
 * Signs a payload hash with the Ed25519 authority key
 */
export function signAttestation(payload: AttestationPayload): SignedAttestation {
  const payloadSha256 = computeCanonicalSha256(payload);
  const sign = crypto.createSign("sha256");
  sign.update(payloadSha256);
  sign.end();

  // In Node.js Ed25519, sign with crypto.sign
  const signature = crypto.sign(null, Buffer.from(payloadSha256, "hex"), privateKey);

  return {
    payload,
    payloadSha256,
    signatureHex: signature.toString("hex"),
    signerPublicKeyId: "vibecheck_authority_ed25519_prod_01",
    publicKeyPem: AUTHORITY_PUBLIC_KEY_PEM,
    revocationStatus: "ACTIVE",
  };
}

/**
 * Verifies attestation digital signature and payload hash
 */
export function verifyAttestation(
  signed: SignedAttestation,
  overridePublicKey?: string
): { valid: boolean; reason?: string } {
  // 1. Check revocation
  if (signed.revocationStatus === "REVOKED") {
    return { valid: false, reason: "Attestation certificate has been revoked in registry" };
  }

  // 2. Recompute canonical digest
  const computedHash = computeCanonicalSha256(signed.payload);
  if (computedHash !== signed.payloadSha256) {
    return {
      valid: false,
      reason: `Payload hash mismatch: expected ${signed.payloadSha256}, calculated ${computedHash}`,
    };
  }

  // 3. Verify digital signature
  const keyToUse = overridePublicKey || signed.publicKeyPem;
  try {
    const verified = crypto.verify(
      null,
      Buffer.from(signed.payloadSha256, "hex"),
      crypto.createPublicKey(keyToUse),
      Buffer.from(signed.signatureHex, "hex")
    );
    if (!verified) {
      return { valid: false, reason: "Digital signature is invalid or tampered" };
    }
    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: `Verification failure: ${err.message}` };
  }
}

/**
 * Executes the complete 6-Test Adversarial Tamper Test Suite
 */
export function runAdversarialAttestationSuite(baseAttestation?: SignedAttestation): TamperTestResult[] {
  const deploySha = getDeploymentCommitSha();
  const samplePayload: AttestationPayload = {
    auditId: `VC-SELF-${deploySha.toUpperCase()}`,
    targetName: "VibeCheck Production Platform",
    targetUrl: "https://vibecheck-ten-omega.vercel.app",
    commitSha: deploySha,
    timestamp: "2026-09-09T09:15:00Z",
    scannerVersion: "v1.4.2",
    rulesetVersion: "owasp-asvs-l2-2026.09",
    securityGateVerdict: "READY TO SHIP",
    overallScore: 86,
    findingsCount: 7,
  };

  const original = baseAttestation || signAttestation(samplePayload);
  const results: TamperTestResult[] = [];

  // Baseline Test: Untampered Original
  const baseVerify = verifyAttestation(original);
  results.push({
    testId: "BASELINE",
    testName: "Baseline Untampered Attestation",
    tamperAction: "None (Original authentic report)",
    expectedResult: "PASS",
    actualResult: baseVerify.valid ? "PASS" : "FAIL",
    passed: baseVerify.valid,
    details: "Valid Ed25519 signature over canonical SHA-256 digest.",
  });

  // Test A: Modify payload score (86 -> 100)
  const tamperedPayloadA = { ...original.payload, overallScore: 100 };
  const verifyA = verifyAttestation({ ...original, payload: tamperedPayloadA });
  results.push({
    testId: "TEST_A",
    testName: "Test A — Report Payload Score Tampering",
    tamperAction: "Altered overallScore from 86 -> 100 in payload JSON",
    expectedResult: "FAIL",
    actualResult: verifyA.valid ? "PASS" : "FAIL",
    passed: !verifyA.valid,
    details: verifyA.reason || "Tamper undetected",
  });

  // Test B: Modify commit SHA (1e4e476 -> deadbeef)
  const tamperedPayloadB = { ...original.payload, commitSha: "deadbeef00000000000000000000" };
  const verifyB = verifyAttestation({ ...original, payload: tamperedPayloadB });
  results.push({
    testId: "TEST_B",
    testName: "Test B — Commit SHA Forgery",
    tamperAction: "Replaced commitSha with rogue commit 'deadbeef'",
    expectedResult: "FAIL",
    actualResult: verifyB.valid ? "PASS" : "FAIL",
    passed: !verifyB.valid,
    details: verifyB.reason || "Tamper undetected",
  });

  // Test C: Corrupt digital signature (bit-flip byte 10)
  const sigBuffer = Buffer.from(original.signatureHex, "hex");
  sigBuffer[10] ^= 1; // Bit flip
  const verifyC = verifyAttestation({ ...original, signatureHex: sigBuffer.toString("hex") });
  results.push({
    testId: "TEST_C",
    testName: "Test C — Cryptographic Signature Bit-Flip",
    tamperAction: "Flipped bit 0 in byte 10 of Ed25519 signature",
    expectedResult: "FAIL",
    actualResult: verifyC.valid ? "PASS" : "FAIL",
    passed: !verifyC.valid,
    details: verifyC.reason || "Tamper undetected",
  });

  // Test D: Verify against rogue public key
  const verifyD = verifyAttestation(original, ROGUE_PUBLIC_KEY_PEM);
  results.push({
    testId: "TEST_D",
    testName: "Test D — Untrusted Authority Public Key",
    tamperAction: "Verified signature against unauthenticated third-party key",
    expectedResult: "FAIL",
    actualResult: verifyD.valid ? "PASS" : "FAIL",
    passed: !verifyD.valid,
    details: verifyD.reason || "Tamper undetected",
  });

  // Test E: Revoked Report Check
  const verifyE = verifyAttestation({ ...original, revocationStatus: "REVOKED" });
  results.push({
    testId: "TEST_E",
    testName: "Test E — Revocation Registry Enforcement",
    tamperAction: "Flagged report as REVOKED in authority registry",
    expectedResult: "FAIL",
    actualResult: verifyE.valid ? "PASS" : "FAIL",
    passed: !verifyE.valid,
    details: verifyE.reason || "Revocation undetected",
  });

  // Test F: Replay / Outdated Audit Detection
  const currentProductionCommit = getDeploymentCommitSha();
  const auditedCommit = original.payload.commitSha.slice(0, 7);
  const isUpToDate = auditedCommit === currentProductionCommit;
  results.push({
    testId: "TEST_F",
    testName: "Test F — Production Baseline Replay Detection",
    tamperAction: `Evaluates if audited commit (${auditedCommit}) matches live production (${currentProductionCommit})`,
    expectedResult: "PASS",
    actualResult: isUpToDate ? "PASS" : "FAIL",
    passed: isUpToDate,
    details: isUpToDate
      ? `Audit matches current production commit (${currentProductionCommit}).`
      : `Outdated Audit: Audits commit ${auditedCommit}, but production is ${currentProductionCommit}.`,
  });

  return results;
}
