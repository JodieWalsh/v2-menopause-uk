# Final Deployment Guide - The Empowered Patient (Menopause Tool)

## 🎯 Final URL Structure

| Market | Production URL | Pricing |
|--------|---------------|---------|
| UK | `menopause.the-empowered-patient.org` | £19 GBP |
| US | `menopause.the-empowered-patient.com` | $25 USD |
| AU | `menopause.the-empowered-patient.com.au` | AU$39 AUD |

**Future expansion ready:**
- `endo.the-empowered-patient.org` (Endometriosis tool - UK)
- `endo.the-empowered-patient.com` (Endometriosis tool - US)
- `reflux.the-empowered-patient.org` (Reflux tool - UK)
- etc.

---

## 📋 Pre-Deployment Checklist

### Code Ready ✅
- [x] Market detection configured for subdomains
- [x] All three regional videos uploaded
- [x] Backend functions deployed to Supabase
- [x] Stripe price IDs configured
- [x] CSS styling complete
- [x] Register form redirects to Stripe

### Domains Ready
- [x] `the-empowered-patient.org` owned (Hostinger)
- [x] `the-empowered-patient.com` owned (transferring to Hostinger)
- [x] `the-empowered-patient.com.au` owned (Hostinger)
- [x] DNS access available

---

## 🚀 Deployment Steps

### Step 1: Commit and Push to GitHub

```bash
cd "C:\Users\Jodie Ralph\Documents\v2-menopause-uk"

git add .
git commit -m "Deploy menopause tool with subdomain routing

- Configured for menopause.the-empowered-patient.org (UK)
- Configured for menopause.the-empowered-patient.com (US)
- Configured for menopause.the-empowered-patient.com.au (AU)
- All regional videos and pricing configured
- Ready for production deployment"

git push origin main
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://ppnunnmjvpiwrrrbluno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbnVubm1qdnBpd3JycmJsdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTc2MjgsImV4cCI6MjA2OTY5MzYyOH0.FjMYIRk6t2PO-E4GChTzyQG9vXU-N1hK-53AGmSesCE
```

### Step 4: Initial Deploy

Click **"Deploy"** and wait for build to complete (~2-3 minutes).

You'll get a temporary URL like: `your-project.vercel.app`

**Test this URL first** before configuring custom domains!

---

## 🌐 DNS Configuration (After Testing)

### UK Domain - menopause.the-empowered-patient.org

**In Hostinger DNS settings for `the-empowered-patient.org`:**

| Type | Name | Value |
|------|------|-------|
| CNAME | menopause | cname.vercel-dns.com |

### US Domain - menopause.the-empowered-patient.com

**In Hostinger DNS settings for `the-empowered-patient.com`:**

| Type | Name | Value |
|------|------|-------|
| CNAME | menopause | cname.vercel-dns.com |

### AU Domain - menopause.the-empowered-patient.com.au

**In Hostinger DNS settings for `the-empowered-patient.com.au`:**

| Type | Name | Value |
|------|------|-------|
| CNAME | menopause | cname.vercel-dns.com |

**Note:** DNS changes can take 5-60 minutes to propagate.

---

## ✅ Testing Checklist

### Test on Vercel Preview URL First

Before configuring DNS, test everything on `your-project.vercel.app`:

#### Functional Tests
- [ ] Landing page loads
- [ ] All images and videos load
- [ ] Navigation works
- [ ] Registration form works
- [ ] Can create test user

#### Market Detection Test
Since all three markets will initially show as UK on the preview URL (localhost defaults to UK), you can:
1. Use the test script to verify backend works for all markets
2. OR temporarily force different markets to test

### After DNS Configuration

#### UK Market - menopause.the-empowered-patient.org
- [ ] Landing page loads
- [ ] Shows £19 GBP pricing
- [ ] UK video plays
- [ ] Console shows: `Market detected: UK`
- [ ] Registration → Stripe shows £19 GBP
- [ ] Complete payment flow
- [ ] Document email arrives

#### US Market - menopause.the-empowered-patient.com
- [ ] Landing page loads
- [ ] Shows $25 USD pricing
- [ ] US video plays
- [ ] Console shows: `Market detected: US`
- [ ] Registration → Stripe shows $25 USD
- [ ] Complete payment flow
- [ ] Document email arrives

#### AU Market - menopause.the-empowered-patient.com.au
- [ ] Landing page loads
- [ ] Shows AU$39 AUD pricing
- [ ] AU video plays
- [ ] Medicare info displays
- [ ] Console shows: `Market detected: AU`
- [ ] Registration → Stripe shows AU$39 AUD
- [ ] Complete payment flow
- [ ] Document email arrives

---

## 🔧 Troubleshooting

### Market Detection Not Working

**Check browser console:**
```
Market detected: [market_code] from hostname: [domain]
```

If wrong market detected:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check DNS has propagated (use https://dnschecker.org)

### Wrong Pricing Showing

If pricing is incorrect:
1. Check console for market detection
2. Verify backend function is latest version
3. Test with direct API call using test script
4. Check Supabase function logs

### DNS Not Resolving

- Allow up to 60 minutes for propagation
- Check DNS records are correct in Hostinger
- Use `nslookup menopause.the-empowered-patient.org` to verify

---

## 🔄 Making Updates After Deployment

### Automatic Deployment
Once set up, any changes you push to GitHub will automatically deploy to Vercel.

**Workflow:**
1. Make code changes locally
2. Test locally (`npm run dev`)
3. Commit and push to GitHub
4. Vercel automatically rebuilds and deploys (~2-3 minutes)
5. Changes live on all three domains

### Manual Redeployment
If needed, go to Vercel Dashboard → Deployments → Click "Redeploy"

---

## 🎉 Success Criteria

✅ All three domain URLs accessible
✅ Market detection automatic based on domain
✅ Correct pricing and videos for each market
✅ Stripe checkout shows correct amounts
✅ Payment flow completes successfully
✅ Document generation and email delivery working
✅ No console errors on any market

---

## 📞 Support Resources

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/ppnunnmjvpiwrrrbluno
- **Stripe Dashboard**: https://dashboard.stripe.com
- **DNS Checker**: https://dnschecker.org

---

## 🔮 Future Projects

This deployment sets up the foundation for additional condition tools:

### Planned Structure:
```
UK Domain (.org):
├── menopause.the-empowered-patient.org (LIVE)
├── endo.the-empowered-patient.org (future)
└── reflux.the-empowered-patient.org (future)

US Domain (.com):
├── menopause.the-empowered-patient.com (LIVE)
├── endo.the-empowered-patient.com (future)
└── reflux.the-empowered-patient.com (future)

AU Domain (.com.au):
├── menopause.the-empowered-patient.com.au (LIVE)
├── endo.the-empowered-patient.com.au (future)
└── reflux.the-empowered-patient.com.au (future)
```

Each condition tool will be a separate Vercel project with the same multi-market setup.

---

**Last Updated:** October 14, 2025
**Status:** Ready for deployment
**Next Step:** Push to GitHub and create Vercel project
