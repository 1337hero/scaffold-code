# scaffold-code — design notes

## Where it sits in the stack (three separate concerns)
- **client-os** (per client) — high-level, non-coding: politics, radar, product portfolio, strategy.
- **scaffold-code** (per repo) — *this*: engineering rails + project memory.
- **the-library** (`disler/the-library`) — distribution: how scaffold-code and skills get pulled
  into new repos/devices/agents and kept in sync. scaffold-code can be a catalog entry.

References are one-way: scaffold-code may *read* client-os for grounding; the-library *deploys*
scaffold-code. Keep the three separate — don't fuse them the way a single combined repo would.

> **Status:** client-os and the-library are external/future concerns. scaffold-code stands alone
> today; this note records the intended boundaries, not a system that already exists.

## Lineage
Distilled from Michael Losee's "Context-OS" (the Guides Collective platform) — see
`../../archive/`. scaffold-code deliberately keeps the operating loop, the derive-don't-ask
escalation gradient, and the failing-first discipline, and deliberately drops the property
graph, the bitemporal store, and the disposition state machine — those earn their weight at
40+ docs, not at a per-project 5–15.
