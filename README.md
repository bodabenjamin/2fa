# 2FA Auth – web source for Lovable

This is the actual browser website, not the Windows EXE or desktop vault.
The nine HTML/CSS/JS/SVG assets in the project root are the complete static application.
There is no build step, runtime package dependency, database, or backend.
`package.json` supplies the validation command, not a framework starter.

## Local preview

Serve this folder over localhost, for example:
`python -m http.server 8793 --bind 127.0.0.1`
Then open http://127.0.0.1:8793/ .
Deploy over HTTPS for Web Crypto and clipboard support.

## Current behavior

- Responsive light layout, one visible setup-key field with optional masking.
- A localized note below the generator tells customers to paste the 2FA key from their order.
- The field shows allowed Base32 characters (A-Z, 2-7), a live normalized character
  count, and a visual example grouped in fours. The example is not a required length.
- Inline feedback distinguishes keys shorter than the supported 16 Base32 characters
  and longer than the existing 1024-character limit. Separators/padding are excluded.
  Bad characters or invalid Base32 lengths also show feedback; invalid input cannot
  generate a code. These checks validate format, not ownership or a key's correctness.
- The countdown includes a numeric ring. A standard 30-second code turns amber at
  10 seconds and red at 5 seconds, with translated warnings and reduced-motion support.
  Short custom periods use proportionally shorter warning thresholds.
- TOTP via Web Crypto: SHA1, SHA256, SHA512; 6/8 digits; configurable period.
- Defaults: SHA1, six digits, 30 seconds.
- Base32 and otpauth://totp inputs. HOTP and migration QR imports are unsupported.
- Live code and countdown; click the code or the Copy button to copy once.
- 59 locale dictionaries, IP-country-first language selection, manual switching; RTL support.
- geo.js requests https://api.country.is/ once per page load, directly from the browser.
  The country provider sees the connection IP; no key, code, cookie, page URL or body is sent.
  The request explicitly omits credentials and referrer, uses no cache and has a 2.5s timeout.
  A successful country result overrides the initial browser/link language. For multilingual
  countries, prefer a matching browser language among the country's configured languages.
  A user's manual language choice always wins, even over a delayed location response.
  If lookup fails, preserve the link/browser language, with English as the final default.
  A country without a configured supported language uses English. VPNs expose the exit country.
  Location is approximate and unavailable offline; code generation never waits for it.
- Customer links: /#key=YOUR_OWN_BASE32_KEY&lang=en . The placeholder is not a real key.
- Existing short fragment and #secret aliases are preserved by links.js.
- Import a fragment in the browser, then remove the key from the address bar.
- Input edits and clearing invalidate the old code and pending asynchronous calculations.
- Secret keys are held in page memory only. Refresh/closing clears them.
- No localStorage, cookies, key database, server-side code generation, or secret upload.
- An access link deliberately contains its secret; keep the existing sharing notice.

## Files

index.html: semantic markup and CSP
style.css: layout and responsive styles
totp.js: Base32 parsing and RFC 6238 code generation
auth-session.js: session, rollover and asynchronous cancellation
links.js: key fragment and locale parsing
geo.js: country lookup, timeout and country-to-supported-language selection
i18n.js: 59 full locale dictionaries
app.js: controller, clipboard and localization
favicon.svg: original icon

## Validation

Run `npm test` with Node 22 or newer.
Tests cover 18 public RFC 6238 vectors, boundary changes, URI settings, invalid inputs,
late-result cancellation, link roundtrips, 59 dictionaries, RTL and controller behavior.
Country tests cover request isolation, country priority, multilingual countries, manual
choice races, changed hashes, timeout, malformed data, rate limits and offline fallback.
The external provider connection was not live-tested: automated approval rejected that
request pending consent to disclose the visitor's connection IP to api.country.is.
The UI controller tests use a DOM fixture, not a real browser.
Test credentials are public RFC fixtures only, not real account credentials.

## Lovable migration

Read LOVABLE_PROMPT.txt before adapting this project. Preserve the existing design,
all locale keys and the local-only secret-handling behavior when converting to the
Lovable framework. Browser APIs must run on the client, never during SSR.
The brand is still the neutral "2FA Auth"; a final domain/name has not been chosen.
Customer tutorial pages are a possible later extension, not present in this source.
There is no database or user data to migrate. The desktop encrypted vault is excluded.
