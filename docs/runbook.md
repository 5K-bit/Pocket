# Pocket first-use runbook

**Environments:** iPhone Safari (install), any current desktop browser. **Prerequisite:** the Netlify site `obeos-pocket` linked to `main`.

1. Open the deployed Netlify URL in Safari on the iPhone.
2. Share → Add to Home Screen. Open Pocket from the Home Screen.
3. Tap **Edit Links**, set your destinations (HTTPS only), save. Expect the tiles to change and persist after closing the app.
4. Airplane mode, reopen Pocket: the launcher should still open (linked sites will not).

**Manual iPhone acceptance (not yet performed):** steps 1-4, plus: redeploy, open Pocket twice online, confirm the new version string appears.

**Common failures:** edits not saving → private browsing/storage blocked; stale version → open online twice (the service worker is network-first); "Use an HTTPS URL" → remove `http://` or embedded credentials.
**Recovery:** *Restore defaults* in the editor; or delete the Home Screen icon and re-add it. **Rollback:** redeploy the previous release ZIP / commit on Netlify.
**Data:** only destination URLs in local storage; never put tokens in URLs. **Version:** shown on the page (`POCKET 0.1.1`). **Support:** https://github.com/5K-bit/Pocket/issues
