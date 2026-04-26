# solidcore-watcher

Local `solidcore` watcher for member-only schedule releases.

It logs into your member account once, saves the browser session locally, checks selected studios for next month's classes, and sends an iPhone push notification through `Pushover` when classes open.

## What this repo includes

- Manual login flow with saved browser session
- Pushover test notifications
- Three-studio filtering support
- Release detection using both visible date text and direct checks of next-month day buttons
- One combined release push per target month across all selected studios
- Session-expiry reminders if `solidcore` asks you to log in again
- Optional macOS `launchd` installer for overnight background checks

## Requirements

- macOS
- Node.js 20+
- A `solidcore` member account
- The `Pushover` iPhone app and your own `User Key` + `App Token`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the env template:

```bash
cp .env.example .env
```

3. Fill in:

- `PUSHOVER_USER_KEY`
- `PUSHOVER_APP_TOKEN`
- Optional: adjust `SOLIDCORE_TARGET_STUDIOS`

4. Test phone notifications:

```bash
npm run test-notify
```

5. Log into `solidcore` and save your member session:

```bash
npm run login
```

6. Run one check:

```bash
npm run check
```

## macOS auto-run

Install the background job:

```bash
npm run install:launchd
```

Check status:

```bash
npm run status:launchd
```

Remove it:

```bash
npm run uninstall:launchd
```

The launch agent checks every 5 minutes from `00:00` through `05:55` local time. The watcher itself only alerts on configured release days, defaulting to the `23rd` and `24th`.
Manual `npm run check` runs and background `launchd` runs share the same notification lock, so once a target month has triggered a release alert, it will not alert again for that month.

## Useful files

- Local state: `.local/solidcore/state.json`
- Latest result: `.local/solidcore/debug/latest-result.json`
- Latest page text: `.local/solidcore/debug/latest-page-text.txt`
- Latest screenshot: `.local/solidcore/debug/latest-schedule.png`
- Background logs: `.local/solidcore/logs/`

## Privacy

Do not commit `.env`, `.local`, or any saved browser session files. Each friend should use their own `solidcore` login and their own `Pushover` keys.
