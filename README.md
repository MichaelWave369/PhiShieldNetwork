# ΦShield Network

**Protect the Field. Protect Each Other.**

ΦShield Network is an open-source, local-first security observatory for independently operated software ecosystems. The first release, **Sentinel Genesis**, is a read-only React dashboard that helps developers review public GitHub repositories for indicators associated with the November 2026 `wfx-loot` GitHub Actions credential-stealing campaign.

> **Status:** experimental research tool. No finding is proof of compromise; no matches do **not** certify a repository as safe.

## What v0.1 does

- Run a **browser-only, unauthenticated, read-only** scan of up to eight public GitHub repositories at once.
- Review recent pull request titles/heads, default-branch commits and current branches for documented campaign indicators.
- Surface linked evidence and distinguish a **match**, **partial scan** and **no observed match**.
- Export a JSON report with scope, errors, timestamps, and limitations.
- Publish an attributed, **unsigned** threat-intelligence feed for future federation.
- Present a GitHub Pages-ready React dashboard, with automated test + build checks.

## Quick start

Requires Node.js 22 or later.

```bash
npm install
npm test
npm run dev
npm run build
```

## GitHub Pages

The included `.github/workflows/pages.yml` tests, builds and deploys on pushes to `main`. In repository **Settings → Pages**, select **GitHub Actions** as the source. Deployment URL will ordinarily be `https://michaelwave369.github.io/PhiShieldNetwork/` once configured and successful.

## Non-goals and limitations

- No credentials, personal access tokens, or secrets are requested or stored.
- The app reads **public repositories only** through GitHub's public REST API. Browser/API rate limits apply.
- Current branches and default-branch commit history are **not** comprehensive forensic records. Deleted PRs, branches, workflow runs, private repositories and short-lived attacks can be missed.
- The tool does not automatically quarantine, revert, delete, rotate secrets or accuse contributors.
- A matching campaign string is a **review trigger**, not proof of exploit execution.
- The public threat feed is **unsigned**. Do not automate enforcement based on it.

For serious incident response, verify GitHub audit logs, historical Actions run IDs, credential activity, cloud IAM, and preserved evidence independently.

## Sources

- [Aikido Security: wfx-loot campaign](https://www.aikido.dev/blog/compromised-github-accounts-push-ci-secret-stealer-to-tens-of-thousands-of-repositories) (2026-11-12)
- [StepSecurity: WFX Phantom](https://www.stepsecurity.io/blog/wfx-phantom-the-github-actions-secret-stealer) (2026-11-12)

## Security design and development

Read [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) and [docs/ROADMAP.md](docs/ROADMAP.md).

**Principles:** consent, least privilege, evidence before enforcement, transparency, local-first operation, interoperability, and contributor safety.

MIT licensed. No telemetry.
