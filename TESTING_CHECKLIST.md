# Multi-Market Testing Checklist - October 9, 2025

## Testing Environment Status
- **App Running**: http://localhost:8081
- **Function Deployed**: create-checkout-public v46 (October 9, 2025)
- **Stripe Integration**: All three price IDs confirmed working
- **Default Market**: UK (localhost)

---

## 🇬🇧 UK Market Testing (Default)

### Visual/Content Tests
- [ ] **Landing Page**: Shows £19 GBP pricing
- [ ] **Landing Video**: UK video plays correctly
- [ ] **Register Page**: Form loads with UK terminology
- [ ] **Module 2c**: Shows UK mammogram info with NHS references and proper links
- [ ] **Module 6**: Shows UK helpful hints, "doctor" terminology, no Medicare info
- [ ] **Pricing Display**: Consistently shows £19 throughout app

### Functional Tests  
- [ ] **Register Flow**: Complete form → redirects to Stripe
- [ ] **Stripe Checkout**: Shows £19 GBP charge
- [ ] **Payment Success**: Redirects back to welcome page
- [ ] **Assessment Access**: Can access modules after payment

---

## 🇺🇸 US Market Testing

### To Test US Market:
1. Temporarily modify `src/config/markets.ts` detectMarketFromHostname() to return 'US'
2. Refresh browser to see US market
3. Test all functionality below

### Visual/Content Tests
- [ ] **Landing Page**: Shows $25 USD pricing
- [ ] **Landing Video**: Placeholder video (until real US video uploaded)
- [ ] **Register Page**: Form loads with US terminology
- [ ] **Module 2c**: Shows US mammogram info with insurance guidance
- [ ] **Module 6**: Shows US helpful hints with "doctor" terminology
- [ ] **Pricing Display**: Consistently shows $25 throughout app

### Functional Tests
- [ ] **Register Flow**: Complete form → redirects to Stripe  
- [ ] **Stripe Checkout**: Shows $25 USD charge
- [ ] **Payment Success**: Redirects back to welcome page
- [ ] **Assessment Access**: Can access modules after payment

---

## 🇦🇺 Australian Market Testing

### To Test AU Market:
1. Temporarily modify `src/config/markets.ts` detectMarketFromHostname() to return 'AU'
2. Refresh browser to see Australian market
3. Test all functionality below

### Visual/Content Tests
- [ ] **Landing Page**: Shows AU$39 AUD pricing
- [ ] **Landing Video**: Real Australian video plays (VSL1 Menopause Aus.mp4)
- [ ] **Government Support Box**: Medicare rebate information displayed
- [ ] **Register Page**: Form loads with AU terminology
- [ ] **Module 2c**: Shows AU mammogram info with BreastScreen Australia links
- [ ] **Module 6**: Shows Medicare rebate details ($101.90)
- [ ] **Pricing Display**: Consistently shows AU$39 throughout app

### Functional Tests
- [ ] **Register Flow**: Complete form → redirects to Stripe
- [ ] **Stripe Checkout**: Shows AU$39 AUD charge  
- [ ] **Payment Success**: Redirects back to welcome page
- [ ] **Assessment Access**: Can access modules after payment

---

## Cross-Market Content Verification

### Medical Content Accuracy
- [ ] **UK**: NHS breast screening (ages 50-71, automatic invitations)
- [ ] **US**: USPSTF/ACS guidelines (screening from age 40, insurance varies)
- [ ] **AU**: BreastScreen Australia + Medicare rebates

### Terminology Consistency
- [ ] **All Markets**: Use "doctor" (not "GP") throughout
- [ ] **UK**: "mum" terminology where applicable  
- [ ] **US**: "mom" terminology where applicable
- [ ] **AU**: "mum" terminology where applicable

### Videos Working
- [ ] **UK**: Landing video plays
- [ ] **US**: Placeholder shows (real video needed)
- [ ] **AU**: Real landing video plays correctly

---

## Payment Integration Tests

### Stripe Price ID Verification
- [ ] **UK Payment**: Confirms price_1RrcsPATHqCGypnRMPr4nbKE (£19)
- [ ] **US Payment**: Confirms price_1SGDyQATHqCGypnRmfWlO9GF ($25)
- [ ] **AU Payment**: Confirms price_1RqY9xATHqCGypnRNTqcJwXN (AU$39)

### Payment Flow End-to-End
- [ ] **Market Code Transmission**: Register form sends correct market code
- [ ] **Function Processing**: Backend uses correct price ID for market
- [ ] **Stripe Integration**: Correct currency and amount charged
- [ ] **Success Handling**: User redirected and can access content

---

## Error Testing

### Invalid Scenarios
- [ ] **Invalid Market Code**: App defaults to UK market
- [ ] **Missing Market Code**: App defaults to UK market  
- [ ] **Network Issues**: Appropriate error messages shown
- [ ] **Payment Failures**: Graceful error handling

---

## Browser/Device Testing

### Compatibility
- [ ] **Chrome**: All markets work
- [ ] **Firefox**: All markets work
- [ ] **Edge**: All markets work
- [ ] **Mobile Safari**: All markets work
- [ ] **Mobile Chrome**: All markets work

---

## Outstanding Items

### Immediate
- [ ] Complete multi-market testing per checklist above
- [ ] Create US landing page video (placeholder currently used)

### Near Future  
- [ ] Set up Vercel deployment with subdomain routing
- [ ] Configure DNS for uk./us./au. subdomains
- [ ] Test production deployment

### Long Term
- [ ] Plan endometriosis tool architecture
- [ ] Plan reflux tool architecture  
- [ ] Consider multi-condition platform strategy

---

## Testing Notes

**How to Switch Markets for Testing**:
1. Edit `src/config/markets.ts`
2. In `detectMarketFromHostname()` function, temporarily return 'UK', 'US', or 'AU'
3. Refresh browser to see that market
4. Test functionality
5. Revert change when done

**Success Criteria**:
- All three markets display correct pricing and content
- Payment flow works for all three markets with correct amounts
- Medical information is accurate and properly referenced
- User experience is consistent across markets
- Videos play correctly (where available)

**Critical Issues to Watch For**:
- Incorrect pricing displayed vs charged
- Wrong Stripe price ID used
- Missing or incorrect medical references
- Video playback failures
- Mobile responsiveness issues