# Runtime Defense Lab (experimental)

This is a browser-only synthetic policy lifecycle exercise, not a Shirudo integration or a security boundary. No host access, eBPF loading, TPM access, credentials, signatures, remote commands or network calls are present in the lab. The existing public GitHub scanner is unchanged.

## 3-6-9 direction
- Awareness: observe, identify, correlate (existing observatory; future authorized host telemetry).
- Adaptation: analyze, propose, simulate, validate, approve, sign (signing is future work).
- Protection: deploy, enforce, attest, monitor, audit, synchronize, recover, patch, retire (real operations are future work).

The lab compares a synthetic targeted mitigation with a collateral-blocking mitigation. Approval is an explicit local UI action after the synthetic test passes; it is not a verified operator identity. Activation is simulated and expires after five minutes. Rollback and retirement are terminal. Exported event history is unsigned and mutable, not an attested ledger.

## Future adapter contract
A separately installed, independently authorized Linux service would accept a versioned proposal with immutable artifact digest, target scope, expiry, tests, rollback plan and provenance. Real deployment requires pinned signer identities, independent validation, separation of proposer and approver, replay protection, monotonic expiry handling, least privilege, fail-safe recovery, durable audit and measured host compatibility. Do not wire browser clicks or unsigned threat feeds to privileged operations.

Shirudo is an upstream candidate, not a dependency of this release. Review upstream licensing, host prerequisites and exact supported interfaces before implementing any connector. Start in a disposable VM, never on production hosts. See https://github.com/shirudo-dev/shirudo and https://docs.shirudo.dev/.

## Acceptance
Run npm test and npm run build. In the Runtime defense tab, monitor the targeted scenario, approve, activate, roll back, retire and export. Reset to collateral scenario; approval must be blocked. No real deployment is possible. A successful synthetic test is not evidence of actual exploit mitigation.
