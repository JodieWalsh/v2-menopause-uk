# Vercel Deployment Guide - Multi-Market Menopause Platform

## Overview
This guide covers deploying the multi-market menopause consultation platform to Vercel with subdomain routing for UK, US, and Australian markets.

---

## Prerequisites

✅ **Completed:**
- Multi-market system fully implemented
- Backend functions deployed to Supabase
- Market-specific videos uploaded
- Stripe price IDs configured for all markets

✅ **Required:**
- Vercel account
- Domain ownership:
  - `menopause-uk.com` (main domain)
  - `menopause.com` (for us./au. subdomains)
- DNS access for both domains

---

## Step 1: Prepare Repository

### 1.1 Revert Test Configuration
Make sure the market detection is using automatic detection (not forced):

**File: `src/config/markets.ts`**
- Line 115 should use the automatic detection logic
- Should NOT have `return 'US';` or similar forced returns
- ✅ Already reverted to production mode

### 1.2 Re-enable Stripe Redirect
**File: `src/pages/Register.tsx`**
- Currently disabled for testing (line 161-169)
- Re-enable the automatic redirect before deploying

### 1.3 Commit Final Changes
```bash
git add .
git commit -m "Prepare for Vercel deployment - multi-market ready"
git push origin main
```

---

## Step 2: Create Vercel Project

### 2.1 Import Repository
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `v2-menopause-uk`
4. **Framework Preset**: Vite
5. **Root Directory**: `./` (default)
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`

### 2.2 Environment Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://ppnunnmjvpiwrrrbluno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbnVubm1qdnBpd3JycmJsdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTc2MjgsImV4cCI6MjA2OTY5MzYyOH0.FjMYIRk6t2PO-E4GChTzyQG9vXU-N1hK-53AGmSesCE
```

**Note:** These are already in your local `.env` file, but Vercel needs them too.

### 2.3 Deploy
Click **"Deploy"** and wait for the build to complete (~2-3 minutes).

---

## Step 3: Configure Custom Domains

### 3.1 UK Market Domain (Primary)
1. In Vercel Dashboard → Project → **Settings** → **Domains**
2. Add domain: `menopause-uk.com`
3. Also add: `www.menopause-uk.com` (will redirect to non-www)

**DNS Configuration for `menopause-uk.com`:**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel IP)

- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

### 3.2 US Market Domain
1. Add domain: `us.menopause.com`

**DNS Configuration for `menopause.com`:**
- Type: `CNAME`
- Name: `us`
- Value: `cname.vercel-dns.com`

### 3.3 Australian Market Domain
1. Add domain: `au.menopause.com`

**DNS Configuration for `menopause.com`:**
- Type: `CNAME`
- Name: `au`
- Value: `cname.vercel-dns.com`

---

## Step 4: Verify Deployment

### 4.1 Test Each Market

**UK Market** - https://menopause-uk.com
- ✅ Landing page shows £19 GBP
- ✅ UK video plays
- ✅ Registration redirects to Stripe with £19 GBP
- ✅ Console shows: `Market detected: UK`

**US Market** - https://us.menopause.com
- ✅ Landing page shows $25 USD
- ✅ US video plays
- ✅ Registration redirects to Stripe with $25 USD
- ✅ Console shows: `Market detected: US`

**Australian Market** - https://au.menopause.com
- ✅ Landing page shows AU$39 AUD
- ✅ Australian video plays
- ✅ Medicare support info displayed
- ✅ Registration redirects to Stripe with AU$39 AUD
- ✅ Console shows: `Market detected: AU`

### 4.2 Test Full User Flow
For each market:
1. Register a test user
2. Complete payment in Stripe
3. Verify redirect to welcome page
4. Complete assessment modules
5. Check document generation
6. Verify email delivery

---

## Step 5: DNS Propagation

DNS changes can take 24-48 hours to propagate fully. Use these tools to check:
- https://dnschecker.org
- https://www.whatsmydns.net

You can test immediately using Vercel's preview URLs while waiting for DNS.

---

## Troubleshooting

### Issue: Domain shows 404
**Solution:** DNS not propagated yet. Wait or test with Vercel preview URL.

### Issue: Wrong market detected
**Solution:**
1. Check browser console for "Market detected" log
2. Verify domain matches expected pattern in `markets.ts`
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: Environment variables not working
**Solution:**
1. Verify variables in Vercel Dashboard → Settings → Environment Variables
2. Redeploy after adding variables
3. Check build logs for errors

### Issue: Stripe shows wrong price
**Solution:**
1. Check Supabase function logs
2. Verify `create-checkout-public` function is latest version
3. Test with direct API call using test script

---

## Post-Deployment Tasks

### Immediate
- [ ] Test all three markets thoroughly
- [ ] Verify email delivery works
- [ ] Check Stripe webhooks are working
- [ ] Test discount codes

### Within 24 Hours
- [ ] Monitor error logs in Vercel
- [ ] Check Supabase function logs
- [ ] Verify analytics/tracking (if implemented)
- [ ] Test on mobile devices

### Within 1 Week
- [ ] Set up monitoring/alerts
- [ ] Configure automatic deployments from GitHub
- [ ] Set up staging environment (optional)
- [ ] Document any issues found

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate Rollback:**
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click **"..."** → **"Promote to Production"**

2. **Fix and Redeploy:**
   - Make fixes locally
   - Test thoroughly on localhost
   - Commit and push to trigger new deployment

3. **Emergency:**
   - Temporarily point DNS back to old hosting
   - Fix issues without time pressure

---

## Market-Specific URLs Reference

| Market | Domain | Pricing | Currency | Video |
|--------|--------|---------|----------|-------|
| UK | menopause-uk.com | £19 | GBP | VSL1 Menopause UK 2.mp4 |
| US | us.menopause.com | $25 | USD | VSL Menopause USA V1.mp4 |
| AU | au.menopause.com | AU$39 | AUD | VSL Menopause Australia V4.mp4 |

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **DNS Help**: Check with your domain registrar
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ppnunnmjvpiwrrrbluno

---

## Success Criteria

✅ All three markets accessible via correct domains
✅ Market detection working automatically based on domain
✅ Videos loading correctly for each market
✅ Pricing displays correct currency and amount
✅ Stripe checkout shows correct price
✅ Payment flow completes successfully
✅ Document generation and email delivery working
✅ No console errors on any market

---

**Deployment Date:** _TBD_
**Deployed By:** _TBD_
**Status:** Ready for deployment
