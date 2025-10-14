# Pre-Deployment Checklist

## Code Preparation

### Configuration Files
- [x] `vercel.json` created with correct build settings
- [x] Market detection using automatic hostname detection (not forced)
- [x] Stripe redirect re-enabled in Register.tsx
- [ ] All console.log statements reviewed (can leave for debugging)

### Market Configuration (`src/config/markets.ts`)
- [x] UK domain: `menopause-uk.com`, `localhost`
- [x] US domain: `us.menopause.com`
- [x] AU domain: `au.menopause.com`
- [x] UK pricing: £19 GBP
- [x] US pricing: $25 USD
- [x] AU pricing: AU$39 AUD

### Video URLs
- [x] UK landing video: VSL1 Menopause UK 2.mp4
- [x] US landing video: VSL Menopause USA V1.mp4
- [x] AU landing video: VSL Menopause Australia V4.mp4
- [x] Welcome video: Same for all markets

### Stripe Price IDs
- [x] UK: `price_1RrcsPATHqCGypnRMPr4nbKE` (£19)
- [x] US: `price_1SGDyQATHqCGypnRmfWlO9GF` ($25)
- [x] AU: `price_1RqY9xATHqCGypnRNTqcJwXN` (AU$39)

---

## Supabase Backend

### Edge Functions Deployed
- [x] `create-checkout-public` - Latest version with market-specific pricing
- [x] `generate-document` - Beautiful email formatting
- [x] `send-document-email` - Responsive email templates
- [x] `stripe-webhook` - Payment confirmation handling

### Database Schema
- [x] `user_subscriptions` table
- [x] `user_progress` table
- [x] `user_responses` table
- [x] Market code stored in subscription metadata

---

## Testing Completed

### Local Testing
- [x] UK market detection works (localhost → UK)
- [x] US market pricing tested with direct API call ($25 USD confirmed)
- [x] Backend function correctly uses market-specific price IDs
- [x] CSS styling restored and working
- [x] Landing page displays correctly

### Backend API Testing
- [x] Tested `create-checkout-public` with US market code
- [x] Verified Stripe URL generation
- [x] Confirmed correct currency selection
- [ ] Test AU market (can do after deployment)

---

## Vercel Setup Requirements

### Repository
- [ ] All changes committed to Git
- [ ] Pushed to GitHub/GitLab main branch
- [ ] Repository accessible to Vercel

### Environment Variables Ready
```
VITE_SUPABASE_URL=https://ppnunnmjvpiwrrrbluno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Domain Access
- [ ] Access to DNS settings for `menopause-uk.com`
- [ ] Access to DNS settings for `menopause.com`
- [ ] Ability to add A/CNAME records

---

## Post-Deployment Testing Plan

### UK Market (menopause-uk.com)
- [ ] Landing page loads
- [ ] Shows £19 GBP pricing
- [ ] UK video plays
- [ ] Registration form works
- [ ] Stripe checkout shows £19 GBP
- [ ] Payment flow completes
- [ ] Document email sends

### US Market (us.menopause.com)
- [ ] Landing page loads
- [ ] Shows $25 USD pricing
- [ ] US video plays
- [ ] Registration form works
- [ ] Stripe checkout shows $25 USD
- [ ] Payment flow completes
- [ ] Document email sends

### AU Market (au.menopause.com)
- [ ] Landing page loads
- [ ] Shows AU$39 AUD pricing
- [ ] AU video plays
- [ ] Medicare support info displays
- [ ] Registration form works
- [ ] Stripe checkout shows AU$39 AUD
- [ ] Payment flow completes
- [ ] Document email sends

---

## Known Issues (None Critical)

### Non-Critical
- Console shows detailed debug logs (can be cleaned up later if desired)
- Test checkout script in repository (can be removed or moved to dev-tools folder)

---

## Deployment Day Tasks

1. [ ] Commit all final changes
2. [ ] Push to main branch
3. [ ] Create Vercel project and connect repository
4. [ ] Add environment variables in Vercel
5. [ ] Deploy and wait for build
6. [ ] Configure UK domain (menopause-uk.com)
7. [ ] Configure US subdomain (us.menopause.com)
8. [ ] Configure AU subdomain (au.menopause.com)
9. [ ] Test all three markets
10. [ ] Monitor for errors in first 24 hours

---

## Emergency Contacts

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ppnunnmjvpiwrrrbluno
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: (your repo URL)

---

## Rollback Plan

If deployment fails:
1. Vercel allows instant rollback to previous deployment
2. DNS can be pointed back to old hosting if needed
3. Supabase functions already deployed and stable

---

**Status**: ✅ **READY FOR DEPLOYMENT**

All critical components tested and working. Multi-market system operational. Backend functions deployed. Only remaining task is Vercel deployment and DNS configuration.
