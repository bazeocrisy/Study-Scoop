# Publishing the Website

**Status:** not published. GitHub Pages is off. Nothing below happens until the Product Owner approves the release.

## How it works

The website is **not** the whole repository. `scripts/build-site.js` copies only the student-facing runtime files into a `_site` folder, checks that folder, and only that folder can be published (DECISIONS D11).

| Published | Never published |
|---|---|
| `index.html` | `reference/` (prototypes) |
| `css/*.css` | `tests/`, `scripts/`, `.github/` |
| `js/` modules (`js/*.js`, `js/lib/*.js`, `js/views/*.js`) | `docs/` (including the audit report and screenshots) |
| `data/weeks.json` and each week **listed** in it | Week files not yet listed in `weeks.json` (drafts) |
| `images/cone.svg`, `images/words/*.svg` | `images/newsletters/`, photos, scans, PDFs, any `.md` file |
| | `package.json`, `README.md`, `STATUS.md`, `CLAUDE.md`, private and local folders |

Anything not matching the allowlist is left out, even inside an approved folder. Before anything is uploaded, the check fails if:
- a forbidden path is present
- a page, stylesheet or module reference is missing, absolute (it would break under `/Study-Scoop/`) or points to another site
- a module is published but never used
- the weekly data is invalid
- a picture contains a script
- a personal name from the original materials appears

**The repository itself is public.** Leaving a file out of the website does not hide it on GitHub. Never commit private material.

## The workflow (`.github/workflows/pages.yml`)

- **On every pull request** it runs all tests, builds the site, verifies it, and runs the browser tests against the built site. It uploads and publishes nothing, and its access is read-only.
- **It publishes only when the owner starts it by hand.** Go to GitHub → Actions → *Study Scoop site* → *Run workflow*, choose `main`, and type `publish`. Pushing or merging never publishes.
- **The publish job needs all three:** it is running from `main`, it was started by hand, and the word `publish` was typed. It also needs GitHub Pages turned on with Source **GitHub Actions**.
- **The actions are fixed to exact commits**, with each version noted beside it. Each job gets only the permissions it needs.

## One-time setup (owner, only after release approval)

1. Merge the approved work to `main`. The *Run workflow* button only appears once the workflow is on `main`.
2. Go to Settings → Pages and set Source to **GitHub Actions**. Do not choose "Deploy from a branch": that would publish the whole repository.
3. Recommended: go to Settings → Environments → `github-pages`, add yourself as a required reviewer, and allow deployments from `main` only. Every publish then waits for your click.
4. Run the workflow as described above. The site appears at `https://bazeocrisy.github.io/Study-Scoop/`.

## Weekly updates

**Friday newsletter:**
1. Add the new week on a branch (`docs/CONTENT-GUIDE.md`) and open a pull request. The workflow checks it automatically.
2. The owner checks the vocabulary definitions against the class sheet, then merges to `main`.
3. The owner runs the workflow to publish.

**Monday homework:** edit `homework` in the current week's file and follow the same three steps.

The live site changes only at step 3. A merged change waits on `main` until the owner publishes.

## Rollback

1. Revert the bad commit on `main` (GitHub's *Revert* button on the merged pull request), then run the workflow again. The previous version goes back up.
2. To take the site down entirely: Settings → Pages → *Unpublish site*, or set Source to *None*.

## Checking locally before a release

```
npm run build        # builds and verifies _site (prints what was left out)
npm run test:site    # builds, then runs every browser check against _site only
```
