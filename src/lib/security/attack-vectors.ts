export interface AttackVector {
  name: string;
  url: string;
  expectedBlocked: boolean;
  category: "Loopback" | "Hostname" | "IPv6" | "PrivateNet" | "Protocol" | "PublicTarget";
}

export const SSRF_ATTACK_VECTORS: AttackVector[] = [
  // 1. IPv4 Loopback & Canonical representations
  { name: "IPv4 Standard Loopback (127.0.0.1)", url: "http://127.0.0.1", expectedBlocked: true, category: "Loopback" },
  { name: "IPv4 Shorthand 127.1", url: "http://127.1", expectedBlocked: true, category: "Loopback" },
  { name: "IPv4 Shorthand 127.0.1", url: "http://127.0.1", expectedBlocked: true, category: "Loopback" },
  { name: "Decimal Encoded 127.0.0.1 (2130706433)", url: "http://2130706433", expectedBlocked: true, category: "Loopback" },
  { name: "Hexadecimal Encoded 127.0.0.1 (0x7f000001)", url: "http://0x7f000001", expectedBlocked: true, category: "Loopback" },
  { name: "Octal Component IPv4 (0177.0.0.1)", url: "http://0177.0.0.1", expectedBlocked: true, category: "Loopback" },
  { name: "Mixed Hex/Dot IPv4 (0x7f.0.0.1)", url: "http://0x7f.0.0.1", expectedBlocked: true, category: "Loopback" },
  { name: "Zero Source Address (0.0.0.0)", url: "http://0.0.0.0", expectedBlocked: true, category: "Loopback" },

  // 2. Localhost Domain & Internal Cloud Metadata Hostnames
  { name: "Localhost Hostname", url: "http://localhost", expectedBlocked: true, category: "Hostname" },
  { name: "Localhost Subdomain (app.localhost)", url: "http://app.localhost", expectedBlocked: true, category: "Hostname" },
  { name: "GCP Metadata Hostname", url: "http://metadata.google.internal", expectedBlocked: true, category: "Hostname" },
  { name: "AWS Instance Data Hostname", url: "http://instance-data", expectedBlocked: true, category: "Hostname" },

  // 3. IPv6 Loopback, Translations & Special Prefixes
  { name: "IPv6 Loopback ([::1])", url: "http://[::1]", expectedBlocked: true, category: "IPv6" },
  { name: "IPv6 Full Form Loopback ([0:0:0:0:0:0:0:1])", url: "http://[0:0:0:0:0:0:0:1]", expectedBlocked: true, category: "IPv6" },
  { name: "IPv4-Mapped IPv6 Loopback ([::ffff:127.0.0.1])", url: "http://[::ffff:127.0.0.1]", expectedBlocked: true, category: "IPv6" },
  { name: "Hex IPv4-Mapped IPv6 ([::ffff:7f00:1])", url: "http://[::ffff:7f00:1]", expectedBlocked: true, category: "IPv6" },
  { name: "IPv6 Link-Local ([fe80::1])", url: "http://[fe80::1]", expectedBlocked: true, category: "IPv6" },
  { name: "IPv6 Unique Local Address ([fc00::1])", url: "http://[fc00::1]", expectedBlocked: true, category: "IPv6" },
  { name: "IPv6 Unique Local Address ([fd00::1])", url: "http://[fd00::1]", expectedBlocked: true, category: "IPv6" },
  { name: "IPv6 Multicast ([ff02::1])", url: "http://[ff02::1]", expectedBlocked: true, category: "IPv6" },
  { name: "IPv6 Zone Identifier / Malformed URL Rejection (http://[fe80::1%25eth0])", url: "http://[fe80::1%25eth0]", expectedBlocked: true, category: "IPv6" },

  // 4. Cloud Metadata & Private Networks (RFC-1918, CGNAT, Documentation)
  { name: "Cloud Metadata IP AWS/GCP (169.254.169.254)", url: "http://169.254.169.254", expectedBlocked: true, category: "PrivateNet" },
  { name: "RFC-1918 Class A (10.0.0.1)", url: "http://10.0.0.1", expectedBlocked: true, category: "PrivateNet" },
  { name: "RFC-1918 Class B (172.16.0.1)", url: "http://172.16.0.1", expectedBlocked: true, category: "PrivateNet" },
  { name: "RFC-1918 Class C (192.168.1.1)", url: "http://192.168.1.1", expectedBlocked: true, category: "PrivateNet" },
  { name: "Carrier-Grade NAT (100.64.0.1)", url: "http://100.64.0.1", expectedBlocked: true, category: "PrivateNet" },
  { name: "TEST-NET-1 Documentation IP (192.0.2.1)", url: "http://192.0.2.1", expectedBlocked: true, category: "PrivateNet" },
  { name: "TEST-NET-2 Documentation IP (198.51.100.1)", url: "http://198.51.100.1", expectedBlocked: true, category: "PrivateNet" },
  { name: "Multicast Network (224.0.0.1)", url: "http://224.0.0.1", expectedBlocked: true, category: "PrivateNet" },
  { name: "Reserved Class E Network (240.0.0.1)", url: "http://240.0.0.1", expectedBlocked: true, category: "PrivateNet" },

  // 5. Protocol Whitelisting & Valid Public Destinations
  { name: "Non-HTTP Scheme (ftp://127.0.0.1)", url: "ftp://127.0.0.1", expectedBlocked: true, category: "Protocol" },
  { name: "Non-HTTP Scheme (gopher://127.0.0.1)", url: "gopher://127.0.0.1", expectedBlocked: true, category: "Protocol" },
  { name: "Non-HTTP Scheme (file:///etc/passwd)", url: "file:///etc/passwd", expectedBlocked: true, category: "Protocol" },
  { name: "Valid Public Target (https://example.com)", url: "https://example.com", expectedBlocked: false, category: "PublicTarget" },
];
