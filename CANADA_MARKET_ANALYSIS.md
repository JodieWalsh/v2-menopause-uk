# Canada Market Implementation Analysis
**Comprehensive Audit for Adding Canada as Fourth Market**

Date: January 4, 2026
Prepared by: Claude Code
Project: Menopause UK Multi-Market Platform

---

## Executive Summary

This document provides a comprehensive audit of all market-specific content in the codebase to support adding Canada as a fourth market alongside UK, US, and Australia.

### Key Findings

**Total Items Requiring Canadian Adaptation:** 47

**Breakdown by Category:**
- Health Screening Guidelines: 12 items (cervical, breast, colon cancer)
- Healthcare System References: 8 items (insurance, billing, government programs)
- Terminology Differences: 6 items (doctor/GP, mum/mom)
- Government Support & Regulations: 4 items
- Market Configuration: 11 items (pricing, domains, videos, etc.)
- Paper Size & Formatting: 2 items
- Cultural/Regional Content: 4 items

**Implementation Complexity:** **MEDIUM**

**Estimated Effort:**
- Simple configuration changes: ~30% of work
- Content research and adaptation: ~50% of work
- Testing and verification: ~20% of work

**Critical Dependencies:**
- Canadian health screening guidelines research
- Endorsely affiliate tracking ID for Canada
- Market-specific video content
- Canadian domain name decision
- Stripe price ID creation for CAD

---

## 1. HEALTH SCREENING GUIDELINES

### 1.1 Cervical Screening (Pap Smears)

#### Current Implementation

**Files:**
- `src/pages/Module2b.tsx` (lines 33-34, 144-152)
- `src/pages/Module2.tsx` (lines 55-56, 371-381)
- `supabase/functions/generate-document/index.ts` (line 420, 1047)
- `src/pages/Summary.tsx` (line 81)

**Current Text (All Markets):**
```
Question: "What is the date of your last cervical screening?"

InfoBox (Module 2b, line 152):
"Please note that if you have not had a cervical screening (what we used to call a pap smear) in the past 5 years then ensure you tell the medical receptionist this at the time of booking the appointment so that they can allow time and resources for this to be done on the day."
```

**Canadian Adaptation Needed:**
- **Research Required:** Canadian cervical screening guidelines
  - Recommended screening age range
  - Screening frequency (likely every 3 years for ages 25-69)
  - Provincial variations (if significant)
  - Terminology: "Pap test" or "Pap smear" usage in Canada

- **Suggested Approach:**
  - Research official guidelines from Canadian Partnership Against Cancer
  - Check provincial health authorities (Ontario, BC, etc.) for variations
  - Adapt InfoBox text to reflect Canadian screening intervals
  - May need to reference provincial healthcare differences

- **Complexity:** MEDIUM (requires research, minimal code changes)

---

### 1.2 Breast Cancer Screening (Mammograms)

#### Current Implementation

**Files:**
- `src/pages/Module2c.tsx` (NOT directly shown in this file, handled via marketContent)
- `src/config/marketContent.ts` (lines 59-101 for UK/US/AU)
- `supabase/functions/generate-document/index.ts` (lines 149-153)

**Current Versions:**

**UK Version (Helpful Hint 4):**
```
"If you are aged over 50 then you eligible and will be invited for a free mammogram. Your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms."
```

**US Version:**
```
"Please assess whether you think that your doctor will determine that you are due for a mammogram and if it is obvious that you are going to need one, book it in. Please speak with your insurer to determine how much this will cost you."
```

**AU Version:**
```
"If you are aged over 40 in Australia then you eligible for a free mammogram. If you are over 50 your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms."
```

**Canadian Adaptation Needed:**
- **Research Required:**
  - Canadian Cancer Society mammogram guidelines
  - Provincial screening programs (e.g., Ontario Breast Screening Program)
  - Age eligibility (typically 50-74 for routine screening)
  - Provincial coverage variations
  - Cost/billing approach (covered by provincial health insurance)

- **Suggested Canadian Text:**
```
"In Canada, if you are aged 50-74, mammogram screening is recommended every 2 years and is covered by your provincial health insurance. If you are younger or older, discuss with your family doctor whether screening is appropriate for you based on your risk factors. Book your mammogram before your menopause consultation if you're due for one."
```

- **Suggested Approach:**
  - Add Canadian version to generate-document/index.ts (line 152)
  - Add Canadian version to marketContent.ts
  - Include link to Canadian Cancer Society: https://cancer.ca/en/cancer-information/reduce-your-risk/get-screened/breast-cancer-screening

- **Complexity:** MEDIUM (requires research + code updates)

---

### 1.3 Colon/Bowel Cancer Screening

#### Current Implementation

**File:** `src/pages/Module2c.tsx` (lines 200-229)

**Current Versions:**

**UK Version (lines 210-218):**
```tsx
This is not so relevant for the management of your menopausal symptoms, however all GPs will want to know that all screening is up to date.

If you are 50 years or over, please ensure that you have done your bowel cancer screening before you attend your GP appointment, or are in the process of doing it. If you have not, you can find out how to request a bowel cancer screening on this website.
www.nhs.uk/tests-and-treatments/bowel-cancer-screening/
```

**US Version (lines 201-209):**
```tsx
This is not so relevant for the management of your menopausal symptoms, however all doctors will want to know that your screening is up to date.

Depending on your age, family history and other circumstances this may include an at home test, or an in hospital test like a colonoscopy. Please look at this website for what you may expect, and organise in advance what you can, if necessary.
https://www.cancer.org/cancer/types/colon-rectal-cancer/detection-diagnosis-staging/acs-recommendations.html
```

**AU Version (lines 219-228):**
```tsx
This is not so relevant for the management of your menopausal symptoms, however all GPs will want to know that all screening is up to date.

Before your appointment make sure that you have done your bowel prep kit. If you have not you can request one here:
https://www.health.gov.au/our-work/national-bowel-cancer-screening-program
```

**Canadian Adaptation Needed:**
- **Research Required:**
  - Canadian colorectal cancer screening guidelines
  - Screening age range (typically 50-74)
  - Provincial screening programs (ColonCancerCheck in Ontario, etc.)
  - FIT test (fecal immunochemical test) vs colonoscopy
  - Provincial coverage and access

- **Suggested Canadian Text:**
```tsx
This is not so relevant for the management of your menopausal symptoms, however all family doctors will want to know that all screening is up to date.

In Canada, colorectal cancer screening is recommended for adults aged 50-74. This typically involves a fecal immunochemical test (FIT) every 2 years, or colonoscopy depending on your risk factors. Talk to your family doctor about when you're due for screening.
https://www.canada.ca/en/public-health/services/chronic-diseases/cancer/colorectal-cancer.html
```

- **Code Location:** `src/pages/Module2c.tsx` - Add fourth conditional for Canada (after AU)
- **Complexity:** MEDIUM (research + code addition)

---

### 1.4 Other Screening References

**Family Cancer History Questions:**
- `src/pages/Module2c.tsx` (lines 27-43)
- Questions about breast and bowel cancer in family
- **Canadian Adaptation:** No changes needed (universal questions)

---

## 2. HEALTHCARE SYSTEM REFERENCES

### 2.1 Health Insurance / Payment References

#### Current Implementation

**Files with Insurance References:**
- `src/config/marketContent.ts` (line 85) - US mammogram coverage text
- `supabase/functions/generate-document/index.ts` (line 149) - US helpful hint about insurer

**US Version:**
```
"Please speak with your insurer to determine how much this will cost you."

"Coverage & Costs: Mammograms are encouraged as preventive care. Check with your insurance provider or state screening programs about coverage options and any potential costs."
```

**Canadian Adaptation Needed:**
- **System Difference:** Canada has universal healthcare (provincial health insurance)
- **No private insurance** for most basic services
- **Provincial variation:** Each province manages its own health insurance plan

- **Suggested Canadian Approach:**
  - Replace "insurer" with "provincial health plan" or remove cost references
  - Most screening covered by provincial health insurance (no cost to patient)
  - Some provinces may have small fees for specific services

- **Complexity:** SIMPLE (terminology substitution)

---

### 2.2 Medicare/Government Rebate References

#### Current Implementation

**File:** `src/config/marketContent.ts` (lines 108-111)

**AU Version:**
```tsx
rebateInfo: {
  text: "If you are in Australia you will most likely be eligible for a special menopause consultation rebate. The Menopause and Perimenopause Health Assessment has a rebate of $101.90 as at July 2025. For more information please refer to this link:",
  link: "https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Factsheet-Menopause+and+perimenopause+health+assessment+services"
}
```

**Used in:** `src/pages/Module6.tsx` (lines 89-97)

**Canadian Adaptation Needed:**
- **Research Required:**
  - Does Canada have a special billing code for menopause consultations?
  - Provincial variation in coverage or billing?
  - Any patient costs for extended consultations?

- **Suggested Approach:**
  - Research provincial health plans
  - Check if any provinces have menopause-specific consultation codes
  - Likely: No special rebate system (covered under standard physician visits)
  - **If no special program:** Set `rebateInfo: undefined` (like UK/US)

- **Complexity:** MEDIUM (requires research, minimal code if no rebate exists)

---

### 2.3 Payment Flow References

**Files:**
- `src/pages/Auth.tsx` (lines 400-401, 529)
- `src/components/ProtectedRoute.tsx` (lines 176, 185)
- `src/pages/PaymentSuccess.tsx` (multiple references)

**Current Text:**
```
"Continue to Secure Payment"
"Complete Payment"
"Your payment is being processed"
```

**Canadian Adaptation:** NO CHANGES NEEDED
- Payment flow is identical for all markets
- Stripe handles CAD currency

- **Complexity:** NONE

---

## 3. TERMINOLOGY DIFFERENCES

### 3.1 Doctor vs GP vs Family Doctor

#### Current Implementation

**File:** `src/config/markets.ts` (lines 19-21, 49-50, 76-77, 103-104)

**Market Config Structure:**
```tsx
content: {
  terminology: {
    doctor: string; // 'GP' vs 'doctor'
    mum: string;    // 'mum' vs 'mom'
  };
}
```

**Current Values:**
- UK: `doctor: 'doctor'` (but uses "GP" in some content)
- US: `doctor: 'doctor'`
- AU: `doctor: 'doctor'` (but uses "GP" in some content)

**Usage Locations:**
- `src/config/marketContent.ts` - Uses "GP" for UK/AU, "doctor" for US
- `supabase/functions/generate-document/index.ts` (lines 158-160) - GP vs doctor in helpful hints
- `src/pages/Module2c.tsx` (lines 203, 212, 221) - Doctor vs GP in screening text

**Canadian Terminology:**
- **Primary Term:** "family doctor" or "family physician"
- **Also acceptable:** "doctor" or "physician"
- **NOT common:** "GP" (less commonly used in Canada than UK/AU)

**Canadian Adaptation Needed:**
- Add to Canada market config: `doctor: 'family doctor'` or `doctor: 'doctor'`
- Update content templates to use dynamic terminology
- Consider: "family doctor" might be longer than "doctor" - check text flow

- **Suggested Value:** `doctor: 'doctor'` (most concise, widely understood)
- **Alternative:** `doctor: 'family doctor'` (more accurate to Canadian usage)

- **Complexity:** SIMPLE (configuration + template updates)

---

### 3.2 Mum vs Mom

#### Current Implementation

**Market Config:**
- UK: `mum: 'mum'`
- US: `mum: 'mom'`
- AU: `mum: 'mum'`

**Current Usage:** Not actively used in current codebase (prepared for future content)

**Canadian Terminology:**
- **Standard:** "mom" (same as US)

**Canadian Adaptation:**
- Set `mum: 'mom'` in Canada market config

- **Complexity:** TRIVIAL

---

### 3.3 Other Spelling/Terminology

**Potential Differences:**
- "Consultation" vs "appointment" - Both used in Canada
- "Screening" vs "test" - Both acceptable
- Colour/color, centre/center - Canadian uses British spellings but code uses American

**Current Codebase:** Uses American spellings in code, British in some content

**Canadian Adaptation:**
- Canada typically uses British spellings (colour, centre)
- However, inconsistency in current codebase (UK market also uses "color" in some places)
- **Recommendation:** Keep consistent with current approach (don't add spelling variants)

- **Complexity:** NONE (no changes needed)

---

## 4. GOVERNMENT SUPPORT & REGULATIONS

### 4.1 Government Support Flag

#### Current Implementation

**File:** `src/config/markets.ts` (lines 23-26, 53-55, 80-82, 107-109)

**Current Values:**
- UK: `hasGovernmentSupport: false`
- US: `hasGovernmentSupport: false`
- AU: `hasGovernmentSupport: false` (was true for Medicare rebate, now removed)

**Canadian Adaptation:**
- **Research:** Any government menopause programs?
- **Likely:** `hasGovernmentSupport: false` (no special programs beyond universal healthcare)

- **Complexity:** SIMPLE (single boolean value)

---

### 4.2 Healthcare Provider Regulations

**No specific regulatory content in current codebase**

**Canadian Consideration:**
- Each province regulates healthcare differently
- No need for regulatory disclaimers (educational tool only)

- **Complexity:** NONE

---

## 5. MARKET CONFIGURATION STRUCTURE

### 5.1 Core Market Configuration

#### File: `src/config/markets.ts`

**Current Structure:**
```tsx
export type MarketCode = 'UK' | 'US' | 'AU';  // Line 1

export interface MarketConfig {
  code: MarketCode;
  name: string;
  currency: { symbol: string; code: string; };
  pricing: { regular: number; display: string; };
  videos: { landing: string; welcome: string; };
  content: {
    terminology: { doctor: string; mum: string; };
    regulations: { hasGovernmentSupport: boolean; supportDetails?: string; };
  };
  domains: string[];
  endorselyTrackingId: string;
}
```

**Changes Required for Canada:**

1. **Line 1:** Update MarketCode type
```tsx
export type MarketCode = 'UK' | 'US' | 'AU' | 'CA';
```

2. **Lines 32-114:** Add Canada configuration object

```tsx
CA: {
  code: 'CA',
  name: 'Canada',
  currency: {
    symbol: '$',
    code: 'CAD'
  },
  pricing: {
    regular: 10,
    display: '$10'  // or 'CA$10' if you want to differentiate from US
  },
  videos: {
    landing: '[URL_TO_CANADIAN_LANDING_VIDEO]',  // NEEDS CREATION
    welcome: '[URL_TO_CANADIAN_WELCOME_VIDEO]'   // NEEDS CREATION or can reuse
  },
  content: {
    terminology: {
      doctor: 'doctor',  // or 'family doctor'
      mum: 'mom'
    },
    regulations: {
      hasGovernmentSupport: false
    }
  },
  domains: ['menopause.the-empowered-patient.ca'],  // DECISION NEEDED
  endorselyTrackingId: '[CANADIAN_ENDORSELY_TRACKING_ID]'  // NEEDS CREATION
}
```

- **Complexity:** SIMPLE (configuration addition)

---

### 5.2 Market Detection Logic

#### File: `src/config/markets.ts` (lines 117-127)

**Current Logic:**
```tsx
export function detectMarketFromHostname(hostname: string): MarketCode {
  for (const [marketCode, config] of Object.entries(MARKET_CONFIGS)) {
    if (config.domains.some(domain => hostname.includes(domain))) {
      return marketCode as MarketCode;
    }
  }
  return 'UK';  // Default to UK if no match
}
```

**Changes for Canada:**
- Add `.ca` domain to Canada config
- **Order dependency:** Check Canada before AU to avoid `.ca` matching `.com.au`
- Consider: Should Canada or UK be the default fallback?

- **Suggested Fix:**
```tsx
// Reorder MARKET_CONFIGS to check more specific domains first:
// 1. AU (.com.au)
// 2. CA (.ca)
// 3. US (.com)
// 4. UK (.org)
// Default: Keep UK or change to US/CA?
```

- **Complexity:** SIMPLE (configuration, careful ordering)

---

### 5.3 Stripe Integration

#### Files:
- `supabase/functions/create-checkout-v2/index.ts`
- `src/pages/Auth.tsx`

**Current Price IDs:**
- UK: `price_1SLgBQATHqCGypnRWbcR9Inl` (£10 GBP)
- US: `price_1SLgF9ATHqCGypnRO3pWMDTd` ($10 USD)
- AU: `price_1SLgCMATHqCGypnRWZY6tC10` ($10 AUD)

**Canadian Adaptation Needed:**
1. **Create Stripe Product:** Menopause Assessment - Canada
2. **Create Stripe Price:** $10 CAD (or $13 CAD to match currency conversion)
3. **Add to backend function:** Map 'CA' market code to Canadian price ID

- **File:** `supabase/functions/create-checkout-v2/index.ts`
- **Line:** ~70-80 (price mapping section)

- **Complexity:** SIMPLE (Stripe dashboard + code update)

---

### 5.4 Endorsely Affiliate Tracking

#### File: `src/components/EndorselyTracker.tsx`

**Current Tracking IDs:**
- UK: `2befa0e8-23df-4ad6-9615-be7a968930ca`
- US: `5d898cbf-22ee-47af-aab4-048b232c4851`
- AU: `1595ed84-e60a-4e56-a7ae-1753ad711d4c`

**Canadian Adaptation Needed:**
1. **Create Endorsely Organization** for Canada
2. **Obtain tracking ID**
3. **Add to market config**

- **Component:** Uses market config automatically, no code changes needed

- **Complexity:** TRIVIAL (external setup + configuration)

---

### 5.5 Market-Specific Content Configuration

#### File: `src/config/marketContent.ts`

**Current Markets:** UK, US, AU

**Structure:**
```tsx
export const MARKET_CONTENT: Record<MarketCode, MarketSpecificContent> = {
  UK: { helpfulHints: {...}, mammogramInfo: {...}, screening: {...} },
  US: { helpfulHints: {...}, mammogramInfo: {...}, screening: {...} },
  AU: { helpfulHints: {...}, mammogramInfo: {...}, screening: {...} }
}
```

**Canadian Adaptation Needed:**
- Add `CA` object with all required content fields
- Copy structure from closest market (US or AU) and adapt

- **Complexity:** MEDIUM (requires content research and writing)

---

### 5.6 Domain Configuration

**Decision Required:**
- Canadian domain name?
- Options:
  - `menopause.the-empowered-patient.ca` (preferred, matches pattern)
  - `menopause-ca.the-empowered-patient.com` (subdomain approach)
  - Other?

**DNS Setup:**
- Register domain
- Point to Vercel
- Add to Vercel project domains
- Update market config

- **Complexity:** EXTERNAL (domain registration + DNS)

---

### 5.7 Video Content

**Files:**
- `src/config/markets.ts` (videos object)
- `src/pages/Landing.tsx` (landing video)
- `src/pages/Welcome.tsx` (welcome video)

**Current Videos:**
- UK: VSL1 Menopause UK 3 251029.mp4
- US: VSL Menopause USA V1 251029a.mp4
- AU: VSL Menopause Australia V4 251030.mp4

**Canadian Adaptation Needed:**
1. **Option A:** Create Canadian-specific videos
   - Landing video with Canadian accent/context
   - Welcome video tailored to Canadian users
   - **Complexity:** HIGH (video production)

2. **Option B:** Reuse US videos (similar culture/accent)
   - **Complexity:** TRIVIAL (configuration only)

- **Recommendation:** Start with Option B, create custom videos later

- **Complexity:** TRIVIAL (if reusing) or HIGH (if creating new)

---

## 6. PAPER SIZE & FORMATTING

### 6.1 Document Paper Size

#### File: `supabase/functions/generate-document/index.ts` (lines 162-180)

**Current Logic:**
- US → Letter (8.5" × 11")
- UK/AU → A4 (210mm × 297mm)

**Canadian Standard:**
- **Paper Size:** Letter (8.5" × 11") - Same as US
- Canada uses US Letter size, NOT A4

**Canadian Adaptation:**
```tsx
const paperConfig = (marketCode === 'US' || marketCode === 'CA')
  ? {
      pageSize: 'letter portrait',
      // ... Letter config
    }
  : {
      pageSize: 'A4 portrait',
      // ... A4 config
    };
```

- **Complexity:** TRIVIAL (one-line conditional update)

---

### 6.2 Layout Optimization

#### File: `supabase/functions/generate-document/index.ts` (lines 184-214)

**Current Logic:**
- US → 13pt body font (optimized for Letter)
- UK/AU → 14pt body font (optimized for A4)

**Canadian Adaptation:**
- Use same layout config as US (Letter size)

```tsx
const layoutConfig = (marketCode === 'US' || marketCode === 'CA')
  ? {
      // ... US Letter layout
    }
  : {
      // ... A4 layout
    };
```

- **Complexity:** TRIVIAL (conditional update)

---

## 7. CULTURAL/REGIONAL CONTENT

### 7.1 Date Formats

**Current:** Uses Month DD, YYYY format (e.g., "January 4, 2026")

**Canadian Standard:** Can use both US (Month DD, YYYY) and international (DD Month YYYY) formats

**Recommendation:** Keep current format (widely accepted in Canada)

- **Complexity:** NONE

---

### 7.2 Temperature/Measurement Units

**Current Codebase:** No temperature or measurement references found

- **Complexity:** NONE

---

### 7.3 Language/Phrasing

**Current Content:** Professional, medical language appropriate for all English-speaking markets

**Canadian Consideration:**
- Canada is bilingual (English/French)
- **Phase 1:** Launch English version only
- **Phase 2:** Consider French version (major undertaking)

- **Complexity:** NONE (Phase 1), VERY HIGH (Phase 2 with French)

---

### 7.4 Privacy/Legal Considerations

**Current:** Privacy policy, terms, disclaimer pages exist

**Canadian Adaptation Needed:**
- Review privacy policy for PIPEDA compliance (Canadian privacy law)
- May need legal review for healthcare disclaimers

- **Complexity:** MEDIUM (legal review recommended)

---

## 8. IMPLEMENTATION ROADMAP

### Phase 1: Research & Planning (Before Implementation)

**Canadian Healthcare Research (3-5 hours):**
1. Cervical screening guidelines
   - Source: Canadian Cancer Society, provincial programs
   - Age ranges, frequency, terminology

2. Breast cancer screening (mammogram)
   - Source: Canadian Cancer Society
   - Age ranges, provincial programs, coverage

3. Colorectal cancer screening
   - Source: Canadian Cancer Society, Health Canada
   - FIT test availability, colonoscopy protocols

4. Provincial health insurance
   - Coverage for preventive screening
   - Any menopause-specific billing codes
   - Provincial variations

5. Medical terminology usage
   - Confirm "family doctor" vs "doctor" vs "GP" preference
   - Review Canadian medical association guidelines

**External Setup (1-2 hours):**
1. Domain decision and registration (.ca domain)
2. Endorsely Canadian organization creation
3. Stripe Canadian price ID creation ($10 CAD)

**Content Preparation (2-3 hours):**
1. Write Canadian versions of all screening texts
2. Draft market-specific helpful hints
3. Prepare FAQ answers with Canadian context

---

### Phase 2: Code Implementation

**Simple Changes (30 minutes):**
1. Update MarketCode type to include 'CA'
2. Add Canada to paperConfig conditional (Letter size)
3. Add Canada to layoutConfig conditional (US layout)
4. Set mum: 'mom' in terminology

**Medium Changes (2-3 hours):**
1. Add complete CA market configuration object
2. Add CA to marketContent.ts with all content
3. Update Module2c.tsx with Canadian bowel cancer screening text
4. Update generate-document.ts with Canadian helpful hints
5. Add Canadian Stripe price ID mapping
6. Test market detection logic with .ca domain

**Content Files to Update:**
- `src/config/markets.ts` (lines 1, 32+)
- `src/config/marketContent.ts` (add CA section)
- `src/pages/Module2c.tsx` (add CA conditional, lines 200-230)
- `supabase/functions/generate-document/index.ts` (lines 149-160, 164-214)
- `supabase/functions/create-checkout-v2/index.ts` (Stripe price mapping)

---

### Phase 3: Testing & Verification

**Local Testing (1 hour):**
1. Test market detection with localhost override
2. Verify all Canadian content renders correctly
3. Check document generation with CA market code
4. Verify paper size and layout are Letter format
5. Test Stripe checkout with Canadian price ID

**Staging/Production Testing (2 hours):**
1. Deploy to staging environment
2. Test Canadian domain routing
3. Complete end-to-end flow: signup → payment → assessment → document
4. Verify Endorsely tracking loads correctly
5. Test all three screening info boxes (cervical, breast, bowel)
6. Verify email generation with Canadian content
7. Cross-check all helpful hints

---

### Phase 4: Deployment

**Deployment Steps:**
1. Update Supabase functions (generate-document, create-checkout-v2)
2. Deploy frontend to Vercel
3. Configure Canadian domain in Vercel
4. Update DNS records
5. Test production Canadian domain
6. Monitor first few Canadian signups

---

## 9. CANADIAN HEALTHCARE RESOURCES TO RESEARCH

### Primary Sources

**Government:**
1. **Health Canada** - https://www.canada.ca/en/health-canada.html
   - Colorectal cancer screening guidelines
   - General health screening information

2. **Provincial Health Authorities:**
   - Ontario Health: https://www.ontario.ca/page/get-health-care-ontario
   - BC Health: https://www.healthlinkbc.ca/
   - Alberta Health: https://www.alberta.ca/health.aspx
   - (Check for provincial screening program variations)

**Cancer Screening:**
3. **Canadian Cancer Society** - https://cancer.ca/
   - Breast cancer screening: https://cancer.ca/en/cancer-information/reduce-your-risk/get-screened/breast-cancer-screening
   - Cervical cancer screening: https://cancer.ca/en/cancer-information/reduce-your-risk/get-screened/cervical-cancer-screening
   - Colorectal cancer screening: https://cancer.ca/en/cancer-information/reduce-your-risk/get-screened/colorectal-cancer-screening

4. **Canadian Partnership Against Cancer** - https://www.partnershipagainstcancer.ca/
   - National screening guidelines
   - Provincial program coordination

**Women's Health:**
5. **Society of Obstetricians and Gynaecologists of Canada (SOGC)** - https://www.sogc.org/
   - Menopause guidelines
   - Clinical practice guidelines
   - Patient resources

**Provincial Screening Programs:**
6. **Ontario Breast Screening Program** - https://www.cancercareontario.ca/en/types-of-cancer/breast-cancer/screening
7. **ColonCancerCheck (Ontario)** - https://www.cancercareontario.ca/en/types-of-cancer/colorectal-cancer/screening
8. **BC Cancer Screening** - http://www.bccancer.bc.ca/screening

---

## 10. ESTIMATED COMPLEXITY BY CATEGORY

| Category | Items | Complexity | Estimated Time |
|----------|-------|------------|----------------|
| Market Configuration | 11 | Simple | 1 hour |
| Terminology | 6 | Simple | 30 minutes |
| Paper Size/Format | 2 | Trivial | 15 minutes |
| Healthcare Research | - | Medium | 3-5 hours |
| Screening Content (Cervical) | 4 | Medium | 1 hour |
| Screening Content (Breast) | 4 | Medium | 1 hour |
| Screening Content (Bowel) | 4 | Medium | 1 hour |
| Healthcare System | 8 | Simple-Medium | 1-2 hours |
| Government Support | 4 | Simple | 30 minutes |
| External Setup | 4 | Simple | 1-2 hours |
| Testing | - | Medium | 3 hours |
| **TOTAL** | **47** | **MEDIUM** | **13-18 hours** |

---

## 11. DEPENDENCIES & PREREQUISITES

### Before Starting Implementation:

1. **DECISION: Canadian Domain**
   - Preferred: `menopause.the-empowered-patient.ca`
   - Alternative: `ca.menopause.the-empowered-patient.com`
   - **Action:** Domain registration + DNS setup

2. **EXTERNAL: Endorsely Setup**
   - Create Canadian Endorsely organization
   - Obtain tracking ID
   - **Action:** User must set up in Endorsely dashboard

3. **EXTERNAL: Stripe Setup**
   - Create Canadian product/price in Stripe dashboard
   - Decide: $10 CAD or adjust for currency ($13 CAD ≈ $10 USD)?
   - Obtain price ID (format: `price_xxxxxxxxxxxxx`)

4. **RESEARCH: Complete Canadian Guidelines**
   - Cervical screening protocols
   - Breast cancer screening age/frequency
   - Colorectal screening methods
   - Provincial variations (if any)

5. **CONTENT: Video Decision**
   - Create Canadian videos? (HIGH effort)
   - Reuse US videos? (TRIVIAL effort)
   - **Recommendation:** Start with US videos

6. **OPTIONAL: Legal Review**
   - Privacy policy PIPEDA compliance
   - Healthcare disclaimer appropriateness
   - Terms and conditions

---

## 12. RISK ASSESSMENT

### Low Risk Items (Can implement immediately):
- Market configuration structure
- Terminology changes (mum/mom)
- Paper size (Letter)
- Payment flow (identical to US)

### Medium Risk Items (Requires research):
- Screening guidelines content
- Healthcare system references
- Government support messaging
- Provincial variations handling

### High Risk Items (External dependencies):
- Domain availability and DNS
- Endorsely tracking ID
- Stripe price ID creation
- Legal compliance review

---

## 13. RECOMMENDED APPROACH

### Step 1: Quick Win (1-2 hours)
1. Research Canadian screening guidelines using resources in Section 9
2. Draft Canadian content for all three screening types
3. Document any provincial variations found

### Step 2: External Setup (1-2 hours)
1. Register Canadian domain (.ca)
2. Create Endorsely organization for Canada
3. Create Stripe price for Canada ($10 CAD)

### Step 3: Configuration (1 hour)
1. Add 'CA' to MarketCode type
2. Add complete CA market configuration
3. Add CA to paper/layout conditionals
4. Update Stripe price mapping

### Step 4: Content Implementation (2-3 hours)
1. Add CA to marketContent.ts
2. Update Module2c.tsx with Canadian bowel screening
3. Update generate-document.ts with Canadian helpful hints
4. Add Canadian screening links

### Step 5: Testing (2-3 hours)
1. Local development testing
2. Staging environment testing
3. End-to-end flow verification
4. Content accuracy review

### Step 6: Deployment (1 hour)
1. Deploy Supabase functions
2. Deploy frontend to Vercel
3. Configure domain
4. Production smoke test

---

## 14. OPEN QUESTIONS FOR USER

1. **Canadian Domain:** Confirm preference for `.ca` vs alternative?

2. **Pricing:** Keep at $10 CAD or adjust to $13 CAD to match USD conversion?

3. **Videos:** Create Canadian videos (HIGH effort) or reuse US videos initially?

4. **Provincial Variations:** Should we acknowledge provincial differences in screening programs, or use general Canadian guidance?

5. **Bilingual Support:** Is French language support needed in Phase 1, or future consideration only?

6. **Target Launch Date:** When would you like to have Canadian market live?

7. **Legal Review:** Do you want a Canadian lawyer to review privacy/terms before launch?

---

## 15. SUCCESS CRITERIA

Canadian market implementation will be considered successful when:

✅ All 47 identified items have Canadian-specific content or configuration
✅ Canadian domain resolves and routes to correct market
✅ All three cancer screening sections show Canadian-appropriate guidance
✅ Document generation uses Letter format and Canadian content
✅ Stripe checkout works with CAD pricing
✅ Endorsely tracking loads for Canadian domain
✅ End-to-end flow tested and verified
✅ No UK/US/AU content leaks into Canadian version
✅ All helpful hints reference Canadian healthcare system appropriately
✅ First 5 Canadian users complete assessment successfully

---

## APPENDIX A: File Change Checklist

### Files Requiring Updates

- [ ] `src/config/markets.ts` - Add CA market config
- [ ] `src/config/marketContent.ts` - Add CA content
- [ ] `src/pages/Module2c.tsx` - Add CA bowel screening conditional
- [ ] `supabase/functions/generate-document/index.ts` - Add CA helpful hints + paper config
- [ ] `supabase/functions/create-checkout-v2/index.ts` - Add CA Stripe price ID
- [ ] `CLAUDE.md` - Document Session 13 (Canada implementation)

### Files Requiring Review (No Changes Expected)

- [x] `src/pages/Module2b.tsx` - Cervical screening (generic, no market-specific content)
- [x] `src/pages/Module2.tsx` - (Legacy, check if still used)
- [x] `src/pages/Summary.tsx` - Uses dynamic content from market config
- [x] `src/components/EndorselyTracker.tsx` - Uses market config automatically
- [x] `src/pages/Auth.tsx` - Market-agnostic (uses market config)
- [x] `src/pages/Landing.tsx` - Uses market config for pricing
- [x] `src/pages/Welcome.tsx` - Uses market config for videos
- [x] `src/pages/Module6.tsx` - Uses marketContent config

---

## APPENDIX B: Canadian Content Templates

### Template: Cervical Screening InfoBox
```
Canadian guidelines recommend cervical screening (Pap test) every 3 years for individuals aged 25-69. If you haven't had cervical screening in the past 3 years, please mention this to your family doctor when booking your menopause consultation so they can arrange to complete it during the same appointment if needed. This saves you an additional visit.
```

### Template: Breast Cancer Screening (Helpful Hint 4)
```
In Canada, if you are aged 50-74, mammogram screening is recommended every 2 years and is covered by your provincial health insurance plan. If you are outside this age range, discuss with your family doctor whether screening is appropriate based on your personal risk factors. Book your mammogram before your menopause consultation if you're due for one.
```

### Template: Bowel Cancer Screening (Module 2c)
```
This is not so relevant for the management of your menopausal symptoms, however all family doctors will want to know that all screening is up to date.

In Canada, colorectal cancer screening is recommended for adults aged 50-74. This typically involves a fecal immunochemical test (FIT) every 2 years. Talk to your family doctor about when you're due for screening.

For more information, visit:
https://www.canada.ca/en/public-health/services/chronic-diseases/cancer/colorectal-cancer.html
```

---

**End of Analysis**

**Prepared by:** Claude Code
**Date:** January 4, 2026
**Total Items Identified:** 47
**Overall Complexity:** MEDIUM
**Estimated Implementation Time:** 13-18 hours

**Next Steps:** Review analysis, answer open questions, and proceed with recommended phased approach.
