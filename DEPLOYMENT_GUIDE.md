# Multi-Market Deployment Guide

## ✅ COMPLETED - Critical Steps Done

### 1. Stripe Price IDs ✅ COMPLETED

**Status**: All price IDs created and implemented

**Confirmed Working Price IDs**:
- **UK**: price_1RrcsPATHqCGypnRMPr4nbKE (£19 GBP)
- **US**: price_1SGDyQATHqCGypnRmfWlO9GF ($25 USD)  
- **AU**: price_1RqY9xATHqCGypnRNTqcJwXN (AU$39 AUD)

### 2. Function Deployment ✅ COMPLETED

**Status**: create-checkout-public function deployed successfully
- **Version**: 46
- **Deployed**: October 9, 2025, 08:39:52 UTC
- **Dashboard**: https://supabase.com/dashboard/project/ppnunnmjvpiwrrrbluno/functions

## CURRENT STATUS - Ready for Testing

1. **US Market Price ($25 USD)**:
   - Go to Stripe Dashboard → Products → Create Price
   - Amount: $25.00 USD
   - Currency: USD
   - Copy the price ID (starts with `price_`)
   - Update `MARKET_PRICE_IDS.US` in `supabase/functions/create-checkout-public/index.ts`

2. **AU Market Price (AU$35 AUD)**:
   - Go to Stripe Dashboard → Products → Create Price  
   - Amount: AU$35.00 AUD
   - Currency: AUD
   - Copy the price ID (starts with `price_`)
   - Update `MARKET_PRICE_IDS.AU` in `supabase/functions/create-checkout-public/index.ts`

### 2. Deploy Updated Function

```bash
cd C:\Users\Jodie Ralph\Documents\v2-menopause-uk
supabase functions deploy create-checkout-public
```

## Local Testing Strategy

### Test Market Detection
Since localhost defaults to UK market, you can test by temporarily modifying the detection logic:

**In `src/config/markets.ts`**, temporarily change:
```typescript
export function detectMarketFromHostname(hostname: string): MarketCode {
  // For testing - force specific market
  return 'AU'; // Change to 'UK', 'US', or 'AU' to test different markets
  
  // Original logic (uncomment for production)
  // for (const [marketCode, config] of Object.entries(MARKET_CONFIGS)) {
  //   if (config.domains.some(domain => hostname.includes(domain))) {
  //     return marketCode as MarketCode;
  //   }
  // }
  // return 'UK';
}
```

### Testing Checklist

**Landing Page** (`http://localhost:5173/`):
- [ ] Correct pricing displays (£19/£25/AU$35)
- [ ] Correct video loads
- [ ] Terminology is correct (GP vs doctor)
- [ ] Australian government support info shows (AU only)

**Register Page** (`http://localhost:5173/register`):
- [ ] Form submits correctly
- [ ] Market code sent to backend (check console logs)
- [ ] Redirects to Stripe with correct pricing

**Welcome Page** (`http://localhost:5173/welcome`):
- [ ] Correct welcome video loads
- [ ] Market-specific terminology in content

**Module Pages**:
- [ ] Module6: Shows correct regulatory info for market
- [ ] Module2c: Shows correct mammogram guidance

## Production Deployment (Vercel)

### 1. Domain Setup
Configure these subdomains to point to your Vercel deployment:
- `uk.menopause-uk.com` → UK market
- `us.menopause-uk.com` → US market  
- `au.menopause-uk.com` → AU market

### 2. Environment Variables in Vercel
Ensure all Supabase and Stripe environment variables are configured in Vercel dashboard.

### 3. Reset Market Detection
Before deploying, **revert the temporary test changes** in `src/config/markets.ts` to use the original hostname detection logic.

## Video Content Tasks

### Upload US Videos
Currently missing US-specific videos. Upload to Supabase storage:
- US landing video → update `MARKET_CONFIGS.US.videos.landing`
- US welcome video → update `MARKET_CONFIGS.US.videos.welcome`

## Troubleshooting

### Market Detection Issues
- Check browser console for market detection logs
- Verify hostname detection logic
- Test with different domains

### Payment Issues
- Verify Stripe price IDs are correct
- Check Supabase function logs
- Test with valid discount codes

### Video Issues  
- Verify video URLs are accessible
- Check Supabase storage permissions
- Test video loading in different browsers

## Post-Testing Tasks

1. **Stripe Dashboard**: Monitor test payments across different currencies
2. **Analytics**: Track user behavior by market
3. **Content Review**: Ensure all market-specific content is accurate
4. **Performance**: Test loading times with different video content

## Emergency Rollback
If issues arise, you can quickly disable multi-market by:
1. Force UK market in `detectMarketFromHostname()` function
2. Redeploy create-checkout-public function
3. All users will see UK content and pricing