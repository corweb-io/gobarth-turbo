# Rollback Procedures

Quick reference for rolling back failed deployments.

---

## Web (Vercel)

Vercel keeps every deployment as an immutable snapshot. Rollback is instant.

**Via Dashboard:**
1. Go to [Vercel Dashboard](https://vercel.com) → Project → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → **Promote to Production**

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Rollback to previous production deployment
vercel rollback
```

---

## Mobile — OTA Update (EAS Update)

OTA updates are delivered via EAS Update channels. Rolling back means publishing the previous JS bundle.

```bash
# List recent updates on the production channel
eas update:list --branch production

# Re-publish a specific previous update by its group ID
eas update:republish --group <GROUP_ID>
```

If the bad update causes crashes, users will automatically fall back to the embedded bundle from their last binary build.

---

## Mobile — Binary (App Store / Play Store)

Binary releases cannot be instantly rolled back. Options:

1. **Publish a hotfix OTA update** — if the issue is in JS code, push a fix via `eas update` (fastest, minutes)
2. **Submit a new binary build** — fix the issue, build, and submit a patch release via `eas-production.yml`
3. **App Store rollback** — Apple allows selecting a previous build in App Store Connect (Settings → App Version → select previous build). Google Play has no native rollback; submit a new release targeting the previous AAB

**Prevention:** Always test production builds via the `preview` profile first.

---

## Database (Drizzle Migrations)

Drizzle does not auto-generate "down" migrations. For rollback:

1. **Write a corrective migration** that reverses the problematic changes:
   ```bash
   # Create a new migration that undoes the bad one
   # Edit the generated SQL file manually
   pnpm --filter @my-app/db db:generate
   pnpm --filter @my-app/db db:migrate
   ```

2. **For local development**, reset to a clean state:
   ```bash
   pnpm supabase:reset
   ```

**Prevention:** Always test migrations against a staging database before applying to production. Use `DATABASE_DIRECT_URL` (not the pooler) for migrations.
