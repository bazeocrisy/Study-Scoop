# Publishing the Website

One GitHub Pages site holds two versions (DECISIONS D15):

| | URL | Built from | Updates when |
|---|---|---|---|
| **Production** | https://bazeocrisy.github.io/Study-Scoop/ | `main` | an approved pull request is merged into `main` |
| **Live preview** | https://bazeocrisy.github.io/Study-Scoop/preview/ | `develop` | Claude pushes work to `develop` |

Every publish rebuilds **both** from their branches, so a preview update never changes production content and vice versa.

## Development flow

1. The Product Architect designs a feature.
2. Claude builds it on `develop` (or a feature branch merged into `develop`), runs the tests, and pushes.
3. GitHub tests both branches, builds both sites and publishes. The preview URL shows the new work within a few minutes.
4. The Product Owner tests the preview on a computer or phone and gives feedback until it is approved.
5. Claude opens (or updates) a pull request `develop` → `main` and names the PR number and head commit.
6. **The Product Owner explicitly approves that merge.** After it is merged, production updates automatically.

Nothing ever merges automatically. A failing test on either branch stops the whole publish, and the live site stays as it was.

## What is published

Only the student-facing runtime files, copied by `scripts/build-site.js` from an explicit allowlist and verified:

| Published | Never published |
|---|---|
| `index.html`, `css/*.css`, `js/` modules | `reference/` (prototypes), `tests/`, `scripts/`, `.github/` |
| `data/weeks.json` and each week **listed** in it | `docs/`, any `.md` file, `package.json` |
| `images/cone.svg`, `images/words/*.svg` | Week files not yet listed (drafts), `images/words/*.png` study cards (D13, D14), photos, scans, private folders |

The verifier fails the build if a forbidden path appears, a reference is missing or absolute, a module is unused, the data is invalid, a picture contains a script, or a personal name from the original materials appears. **The repository itself is public:** leaving a file off the website does not hide it on GitHub.

## Workflow (`.github/workflows/pages.yml`)

- **Pull requests:** all tests, build and verify. Nothing is published.
- **Push to `main` or `develop`:** unit tests for both branches, allowlist builds, browser tests against each built site, then one publish containing production at `/` and preview at `/preview/`.
- **Run workflow (Actions tab):** rebuilds and republishes both; use after a GitHub outage.
- Actions are pinned to commit SHAs; each job has least-privilege permissions. Only `main` and `develop` may deploy (the `github-pages` environment's branch rules).

## Weekly content

Friday newsletter or Monday homework changes follow the same flow: Claude updates the week on `develop`, the Product Owner checks it on the preview (including every vocabulary definition against the class sheet), then approves the `develop` → `main` merge.

## Rollback

- **Production:** revert the bad merge on `main` (GitHub's *Revert* button on the merged pull request); production republishes automatically.
- **Preview:** push a fix or revert to `develop`.
- **Take the whole site down:** Settings → Pages → *Unpublish site*.

## Checking locally

```
npm run build        # builds and verifies _site (prints what was left out)
npm run test:site    # builds, then runs every browser check against _site only
```
