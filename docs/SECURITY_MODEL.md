# ΦShield Security Model

Version 0.1 — Sentinel Genesis

## Trust boundaries

- Browser-only runtime. Source and bundled JavaScript are public; there is no backend.
- GitHub's public REST API is an untrusted source of metadata, not proof of security.
- Source-controlled threat JSON is unsigned and must never authorize automatic enforcement.
- All user-provided targets are validated as GitHub repository names. No secret input fields exist.
- No telemetry, tracking, storage service or third-party logging is implemented. No external font or analytics CDN is used; the scanner communicates with GitHub's documented public API.

## V0.1 scan behavior

- Up to 8 public repos per run.
- Three GET endpoints per repo: latest 100 PRs, first 100 default-branch commits since November 10, 2026, and first 100 current branches.
- No write permissions or authenticated API calls, no automatic quarantine or cleanup.
- A match is an investigative signal. No match is not evidence of safety.
- GitHub API errors and rate-limit failures are displayed; incomplete scans cannot be labeled clean.
- Prior malicious Actions runs may have been deleted and are not reconstructed here.
- Current branches may omit already deleted or short-lived branches.
- Affected private repositories, organization audit logs and secrets are out of scope.

## Incident response

Investigate suspected compromise using the source account's security log, audit logs, branch and commit history, workflow-run sequencing, cloud authentication and IAM changes. Preserve evidence before revoking access when operationally appropriate. If a malicious workflow executed, rotate every credential the runner could access and examine cloud persistence. No third-party intervention without authorization.

## Future trust mesh requirements

Independent cryptographic signatures, pinned publisher identities, expiry and revocation, correction/dispute channels, provenance and independent corroboration, operator-consent gates and privacy-preserving exchange. Shared intelligence is advisory until each independent node validates it.
