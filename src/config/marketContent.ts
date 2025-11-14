import { MarketCode } from './markets';

export interface MarketSpecificContent {
  helpfulHints: {
    rebateInfo?: {
      text: string;
      link?: string;
    };
    mammogramInfo: {
      text: string;
      link?: string;
    };
    terminology: {
      gp: string;
      consultation: string;
    };
  };
}

export const MARKET_CONTENT: Record<MarketCode, MarketSpecificContent> = {
  UK: {
    helpfulHints: {
      mammogramInfo: {
        text: `<div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #0066cc; margin-top: 0; margin-bottom: 15px; font-weight: 600;">🇬🇧 NHS Breast Screening Programme</h4>
          
          <div style="margin-bottom: 15px;">
            <strong>Eligibility & Automatic Invitations:</strong><br>
            The NHS automatically invites people registered as female with a doctor who are aged 50-71 for breast screening every three years. You'll receive a letter by post - no doctor referral is required for routine screening.<sup style="color: #0066cc;">[5,9]</sup>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Key Details:</strong><br>
            • <strong>Ages 50-71:</strong> Automatic invitations every 3 years<sup style="color: #0066cc;">[5,9]</sup><br>
            • <strong>Over 71:</strong> Can self-refer for continued screening<sup style="color: #0066cc;">[7,9]</sup><br>
            • <strong>Under 50:</strong> May be eligible if higher risk (family history, genetic factors)<sup style="color: #0066cc;">[5,9]</sup><br>
            • <strong>Cost:</strong> Completely free under the NHS<sup style="color: #0066cc;">[2,5]</sup>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>The Process:</strong><br>
            The mammogram involves X-ray images of both breasts, takes just a few minutes, with the whole appointment lasting around 30 minutes. Most scans are performed by female technicians at clinics or mobile units.<sup style="color: #0066cc;">[5,7]</sup>
          </div>
          
          <div style="background: #e8f4f8; padding: 12px; border-radius: 6px; border: 1px solid #bee5eb;">
            <strong>💡 For Menopause Consultations:</strong> If you're approaching or over 50, consider timing your mammogram before your menopause consultation, as your doctor may ask about recent screening as part of your overall health assessment.
          </div>
          
          <div style="margin-top: 15px; font-size: 12px; color: #666;">
            <strong>References:</strong><br>
            [2] <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6525304/" style="color: #0066cc;">PMC Study on NHS Screening</a><br>
            [5] <a href="https://www.cancerresearchuk.org/about-cancer/breast-cancer/getting-diagnosed/screening-breast" style="color: #0066cc;">Cancer Research UK - Breast Screening</a><br>
            [7] <a href="https://www.gov.uk/government/publications/breast-screening-pathway-requirements-specification/breast-screening-pathway-requirements-specification" style="color: #0066cc;">NHS Breast Screening Pathway</a><br>
            [9] <a href="https://www.nhs.uk/tests-and-treatments/breast-screening-mammogram/when-youll-be-invited-and-who-should-go/" style="color: #0066cc;">NHS Official Screening Information</a>
          </div>
        </div>`,
        link: "https://www.nhs.uk/tests-and-treatments/breast-screening-mammogram/when-youll-be-invited-and-who-should-go/"
      },
      terminology: {
        gp: "doctor",
        consultation: "appointment"
      }
    }
  },
  US: {
    helpfulHints: {
      mammogramInfo: {
        text: `<div style="background: #f8f9fa; border-left: 4px solid #d63384; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #d63384; margin-top: 0; margin-bottom: 15px; font-weight: 600;">🇺🇸 US Breast Cancer Screening Guidelines</h4>
          
          <div style="margin-bottom: 15px;">
            <strong>Current Recommendations (2024):</strong><br>
            Major medical organizations now recommend that women begin mammogram screening at age 40. The U.S. Preventive Services Task Force recommends screening every 2 years from ages 40-74, while the American Cancer Society suggests annual screening from age 45.<sup style="color: #d63384;">[1,2]</sup>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Key Guidelines:</strong><br>
            • <strong>Ages 40-44:</strong> Screening available, discuss with your doctor<sup style="color: #d63384;">[2]</sup><br>
            • <strong>Ages 45-54:</strong> Annual mammograms recommended (ACS)<sup style="color: #d63384;">[2]</sup><br>
            • <strong>Ages 55+:</strong> Every 1-2 years, based on individual risk<sup style="color: #d63384;">[2]</sup><br>
            • <strong>High Risk:</strong> May need earlier/more frequent screening<sup style="color: #d63384;">[2]</sup>
          </div>
          
          <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border: 1px solid #ffeaa7; margin-bottom: 15px;">
            <strong>💰 Coverage & Costs:</strong> Mammograms are encouraged as preventive care. Check with your insurance provider or state screening programs about coverage options and any potential costs.
          </div>
          
          <div style="background: #e8f4f8; padding: 12px; border-radius: 6px; border: 1px solid #bee5eb;">
            <strong>💡 For Menopause Consultations:</strong> Consider scheduling your mammogram before your menopause consultation, as your doctor may ask about recent screening as part of your overall health assessment.
          </div>
          
          <div style="margin-top: 15px; font-size: 12px; color: #666;">
            <strong>References:</strong><br>
            [1] <a href="https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/breast-cancer-screening" style="color: #d63384;">U.S. Preventive Services Task Force - Breast Cancer Screening (2024)</a><br>
            [2] <a href="https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection/american-cancer-society-recommendations-for-the-early-detection-of-breast-cancer.html" style="color: #d63384;">American Cancer Society - Breast Cancer Screening Guidelines</a>
          </div>
        </div>`,
        link: "https://www.cancer.org/cancer/types/breast-cancer/screening-tests-and-early-detection/american-cancer-society-recommendations-for-the-early-detection-of-breast-cancer.html"
      },
      terminology: {
        gp: "doctor",
        consultation: "appointment"
      }
    }
  },
  AU: {
    helpfulHints: {
      rebateInfo: {
        text: "If you are in Australia you will most likely be eligible for a special menopause consultation rebate. The Menopause and Perimenopause Health Assessment has a rebate of $101.90 as at July 2025. For more information please refer to this link:",
        link: "https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Factsheet-Menopause+and+perimenopause+health+assessment+services"
      },
      mammogramInfo: {
        text: "If you are aged over 40 in Australia then you eligible for a free mammogram. If you are over 50 your doctor will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your doctor for your menopause symptoms.",
        link: "https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen"
      },
      terminology: {
        gp: "doctor",
        consultation: "appointment"
      }
    }
  }
};