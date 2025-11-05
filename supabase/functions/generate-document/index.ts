import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responses, market_code = 'UK' } = await req.json();
    console.log("Received responses:", JSON.stringify(responses, null, 2));
    console.log("Number of responses:", Object.keys(responses).length);
    console.log("Market code:", market_code);
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Generate document content
    const userName = user.user_metadata?.first_name || 'Patient';
    const htmlContent = generateBrandedHTMLDocument(responses, userName, market_code);
    
    // Check for recent email sends to prevent duplicates (within last 2 minutes)
    // Using a simple in-memory cache approach instead of database table for now
    const requestId = `${user.id}_${Math.floor(Date.now() / (2 * 60 * 1000))}`; // 2-minute window
    
    // Simple duplicate check using request timestamp in user metadata or session
    const lastEmailTime = user.user_metadata?.last_document_email_time;
    const currentTime = Date.now();
    
    if (lastEmailTime && (currentTime - lastEmailTime) < 2 * 60 * 1000) {
      console.log('Recent email found, skipping duplicate send within 2 minutes');
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Document email was recently sent, skipping duplicate",
        documentContent: htmlContent
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send HTML email directly (PDF generation temporarily disabled due to missing API key)
    console.log('Sending HTML document email directly (PDF generation disabled)');
    
    const { error: emailError } = await supabaseClient.functions.invoke('send-document-email', {
      body: {
        email: user.email,
        documentContent: htmlContent,
        userName: userName,
        isBase64PDF: false
      }
    });

    if (emailError) {
      console.error('HTML email sending failed:', emailError);
      throw new Error(`Failed to send document email: ${emailError.message || JSON.stringify(emailError)}`);
    }

    // Update user metadata to record the email send time
    await supabaseClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        last_document_email_time: currentTime
      }
    });

    console.log('HTML document email sent successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Document generated and email sent successfully",
      documentContent: htmlContent // Return for direct view
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Document generation error:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Document generation failed. Please try again or contact support.' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateBrandedHTMLDocument(responses: any, userName: string, marketCode: string = 'UK'): string {
  // Debug logging for marketCode
  console.log('generateBrandedHTMLDocument called with marketCode:', marketCode);

  // Format date as "19th July, 2025"
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'long' });
    const year = date.getFullYear();
    
    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };
  
  const currentDate = formatDate(new Date());
  
  // Modified Greene Scale questions mapping
  const greeneScaleQuestions = [
    { id: 'hot_flushes', label: 'Hot Flushes' },
    { id: 'light_headedness', label: 'Light headed feelings' },
    { id: 'headaches', label: 'Headaches' },
    { id: 'brain_fog', label: 'Brain fog' },
    { id: 'irritability', label: 'Irritability' },
    { id: 'depression', label: 'Depression' },
    { id: 'unloved', label: 'Unloved feelings' },
    { id: 'anxiety', label: 'Anxiety' },
    { id: 'mood_fluctuations', label: 'Mood changes' },
    { id: 'sleeplessness', label: 'Sleeplessness' },
    { id: 'tiredness', label: 'Unusual tiredness' },
    { id: 'backaches', label: 'Backache' },
    { id: 'joint_pains', label: 'Joint Pains' },
    { id: 'muscle_pains', label: 'Muscle Pains' },
    { id: 'facial_hair', label: 'New facial hair' },
    { id: 'skin_dryness', label: 'Dry skin' },
    { id: 'crawling_skin', label: 'Crawling feelings under skin' },
    { id: 'sex_drive', label: 'Less sexual feelings' },
    { id: 'vaginal_dryness', label: 'Dry vagina' },
    { id: 'intercourse_comfort', label: 'Uncomfortable intercourse' },
    { id: 'urination_frequency', label: 'Urinary frequency' }
  ];
  
  // Calculate Greene Scale scores
  let totalScore = 0;
  const greeneScaleRows = greeneScaleQuestions.map(question => {
    const response = responses[question.id];
    let score = 0;
    
    console.log(`Greene Scale - Question: ${question.id}, Response: ${response}`);
    
    if (response) {
      // Direct mapping of exact answer text to scores (0-3)
      // Based on the specific answer options in Module1.tsx
      const scoreMap: { [key: string]: number } = {
        // Hot flushes
        "No hot flushes at all": 0,
        "Some occasional hot flushes with only a very mild impact on my life": 1,
        "Regular hot flushes with a moderate impact on my life": 2,
        "Severe hot flushes that are having a serious impact on my life": 3,

        // Light headedness
        "No, I have not been experiencing any new feeling of light headedness": 0,
        "Yes I have experienced some mild new light headedness": 1,
        "I have been experiencing light headedness that is having a moderate impact on my life": 2,
        "I have been experiencing new light headedness which is severe": 3,

        // Headaches
        "No, I have not had more headaches than normal": 0,
        "I have had some extra headaches - a mild amount more than normal": 1,
        "I have had a moderate number of extra headaches with a moderate impact on my life": 2,
        "I have been having quite a few extra headaches": 3,

        // Irritability
        "No - just my usual amount of irritability": 0,
        "I have been mildly more irritable": 1,
        "I have been moderately more irritable": 2,
        "Yes, I have been severely more irritable": 3,

        // Depression
        "No, I have not felt any extra depression": 0,
        "Yes I have been mildly more depressed": 1,
        "I have been moderately more depressed than previously": 2,
        "My depression is much more severe than previously": 3,

        // Unloved
        "No, I have felt as loved as normal": 0,
        "I have felt mildly more unloved than previously": 1,
        "I have felt moderately more unloved than previously": 2,
        "I have felt severely more unloved than previously": 3,

        // Anxiety
        "No - my anxiety level has been the same": 0,
        "Yes I am a small amount more anxious than previously. Mild": 1,
        "I am moderately more anxious than previously": 2,
        "I am severely more anxious than previously": 3,

        // Mood fluctuations
        "No, my mood fluctuates as normal": 0,
        "I have a mild increase in mood fluctuations": 1,
        "My mood is fluctuating quite a bit more than normal": 2,
        "I am having severe mood fluctuations compared to normal": 3,

        // Sleeplessness
        "No, my sleep is the same as normal": 0,
        "I am having a mild amount of extra sleeplessness compared to normal": 1,
        "I am having a moderate amount of extra sleeplessness compared to normal": 2,
        "My sleep has been severely affected": 3,

        // Tiredness
        "No, I am experiencing the same amount of tiredness as before": 0,
        "I have been mildly more tired than previously": 1,
        "I have been moderately more tired than previously": 2,
        "I have been severely more tired than previously": 3,

        // Backaches
        "No, I have not been experiencing any new backaches": 0,
        "I have been experiencing some mild new backaches compared to normal": 1,
        "I have been having moderately more back aches than usual": 2,
        "I have been having many more backaches than normal which are affecting my life": 3,

        // Joint pains
        "No, I have not been experiencing any new joint pains": 0,
        "I have had some mild new joint pains": 1,
        "I have had some joint pains which are moderately affecting my life": 2,
        "I have had new joint pains which are severely affecting my life": 3,

        // Muscle pains
        "No, I have not been suffering from any new muscle pains": 0,
        "I have been experiencing some new mild muscle pains": 1,
        "I have been experiencing some new muscle pains which are having a moderate impact on my life": 2,
        "I have been experiencing some muscle pains which are having a severe impact on my life": 3,

        // Facial hair
        "No, I have not noticed any new facial hair": 0,
        "I have noticed a mild increase in facial hair": 1,
        "I have noticed a moderate increase in facial hair": 2,
        "I have noticed a severe increase in facial hair": 3,

        // Skin dryness
        "No, my skin has felt the same as it normally does": 0,
        "My skin is experiencing some mild extra dryness": 1,
        "My skin is moderately more dry than previously": 2,
        "My skin is severely more dry than previously": 3,

        // Crawling skin
        "No, I have not noticed any new feelings a crawling under or on my skin": 0,
        "I have had some new mild feelings of crawling under my skin": 1,
        "I have had some moderate feelings of crawling under my skin": 2,
        "I have been experiencing some severe feelings of crawling under my skin": 3,

        // Sex drive
        "No, my sex drive is the same a normal": 0,
        "I have had a mild reduction in my sex drive": 1,
        "I have experienced a moderate reduction in my sex drive": 2,
        "I have experienced a severe reduction in my sex drive": 3,

        // Vaginal dryness
        "No, my vagina feels the same as normal": 0,
        "I have been experiencing some mild vaginal dryness or irritation": 1,
        "My vagina is moderately more irritated or dry than normal": 2,
        "My vagina is severely more dry or irritated than normal": 3,

        // Intercourse comfort
        "No, intercourse is the same level of comfort as always": 0,
        "Intercourse is mildly more uncomfortable than normal": 1,
        "Intercourse is moderately more uncomfortable than normal": 2,
        "Intercourse is severely more uncomfortable than normal": 3,

        // Urination frequency
        "No, my urine frequency is the same as it normally is": 0,
        "I have had a mild increase in the frequency of urination": 1,
        "My urine frequency has increased moderately": 2,
        "My urine frequency has increased severely": 3,

        // Brain fog
        "No, I do not feel any more foggy than normal": 0,
        "I have had a mild increase in brain fog": 1,
        "My brain fog has increased moderately": 2,
        "My brain fog has increased severely": 3
      };

      // Use exact match for scoring
      if (scoreMap.hasOwnProperty(response)) {
        score = scoreMap[response];
      } else {
        // If response doesn't match exactly, log it for debugging
        console.log(`Greene Scale - Unmatched response for ${question.id}: "${response}"`);
        score = 0;
      }
    }
    
    totalScore += score;
    
    return `
      <tr>
        <td>${question.label}</td>
        <td style="text-align: center; font-weight: 600;">${score}</td>
        <td style="text-align: center;"></td>
        <td style="text-align: center;"></td>
      </tr>
    `;
  }).join('');
  
  // Process all questions from all modules
  const allQuestions = [
    // Module 1 long answer questions
    { id: 'top_three_symptoms', text: 'What are your top three symptoms that you desperately need help with?', module: 'Module 1: Symptoms Assessment' },
    { id: 'sleeplessness_details', text: 'Please describe your sleep patterns and any difficulties', module: 'Module 1: Symptoms Assessment' },
    { id: 'joint_pains_details', text: 'Please describe your joint pains in detail', module: 'Module 1: Symptoms Assessment' },
    { id: 'muscle_pains_details', text: 'Please describe your muscle pains in detail', module: 'Module 1: Symptoms Assessment' },
    
    // Module 2 questions - Your health at a top level
    { id: 'chronic_disease', text: 'Have you ever been diagnosed with a chronic disease? For example, epilepsy, diabetes, asthma, kidney disease? If so please document the current management for these diseases.', module: 'Module 2: Your Health History', section: 'Your health at a top level' },
    { id: 'current_medications', text: 'What medications are you currently taking. Please write down the name of the medication, the dosage and how frequently you take this medication.', module: 'Module 2: Your Health History', section: 'Your health at a top level' },
    { id: 'medication_allergies', text: 'Do you have any allergies or reactions to medications?', module: 'Module 2: Your Health History', section: 'Your health at a top level' },
    { id: 'supplements', text: 'Are you taking any supplements? Please note down then name of the supplement, the dose, how often you take it and why you are taking it.', module: 'Module 2: Your Health History', section: 'Your health at a top level' },
    
    // Module 2 - Gynaecological History
    { id: 'last_menstrual_period', text: 'Do you know the date of the start of your last menstrual period? Please note this down. If not, give an estimate of a month and a year.', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'period_changes', text: 'If you are still having periods, have they changed? Are the periods heavier?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'contraception', text: 'What contraception are you currently using? How are you finding it.', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'last_cervical_screening', text: 'What is the date of your last cervical screening?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'endometriosis', text: 'Have you ever been diagnosed with endometriosis? If so, what treatment did you receive?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'pcos', text: 'Have you ever been diagnosed with polycystic ovarian syndrome? If so, what treatment did you receive?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'gynaecological_procedures', text: 'Have you had any gynaecological procedures? Hysterectomy? Surgery for fallopian tube removal or ovarian cyst management? Hysteroscopy? For what reasons?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'pregnancies', text: 'How many pregnancies did you have?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'delivery_dates', text: 'What are the dates of your deliveries?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'other_gynaecological', text: 'Any other relevant gynaecological information?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },
    { id: 'menopause_family_history', text: 'Do you know the age at which your mother or sisters started their menopause journey?', module: 'Module 2: Your Health History', section: 'Gynaecological History' },

    // Module 2 - Family and Personal Breast Cancer History
    { id: 'last_mammogram', text: 'What is the date of your last mammogram?', module: 'Module 2: Your Health History', section: 'Family and Personal Breast Cancer History' },
    { id: 'family_breast_cancer', text: 'Do you have any family history of breast cancer, either in males or females', module: 'Module 2: Your Health History', section: 'Family and Personal Breast Cancer History' },
    { id: 'breast_cancer_ages', text: 'How old was each of those relatives when they were diagnosed with breast cancer?', module: 'Module 2: Your Health History', section: 'Family and Personal Breast Cancer History' },

    // Module 2 - Bowel cancer history
    { id: 'family_bowel_cancer', text: 'Has anyone in your family been diagnosed with bowel cancer?', module: 'Module 2: Your Health History', section: 'Bowel cancer history' },
    { id: 'bowel_cancer_ages', text: 'How old was each of those relatives when they were diagnosed with breast cancer?', module: 'Module 2: Your Health History', section: 'Bowel cancer history' },

    // Module 2 - Cardiovascular Health
    { id: 'blood_clot_history', text: 'Have you ever had a blood clot? If so, please give details.', module: 'Module 2: Your Health History', section: 'Cardiovascular Health' },
    { id: 'cardiovascular_conditions', text: 'Have you ever been diagnosed with high blood pressure, high cholesterol or had a stroke?', module: 'Module 2: Your Health History', section: 'Cardiovascular Health' },
    { id: 'family_heart_disease', text: 'Do you or any of your family have a history of heart disease? If so, please give details.', module: 'Module 2: Your Health History', section: 'Cardiovascular Health' },

    // Module 2 - Bone Health
    { id: 'osteoporosis_diagnosis', text: 'Have you been diagnosed with osteoporosis?', module: 'Module 2: Your Health History', section: 'Bone Health' },
    { id: 'bone_fractures', text: 'Have you ever had a bone fracture which occurred without a serious accident or fall?', module: 'Module 2: Your Health History', section: 'Bone Health' },
    { id: 'bone_density_screening', text: 'Have you ever had a bone density screening?', module: 'Module 2: Your Health History', section: 'Bone Health' },
    { id: 'family_osteoporosis', text: 'Do you have a family history of osteoporosis?', module: 'Module 2: Your Health History', section: 'Bone Health' },

    // Module 2 - Mental Health
    { id: 'mental_health', text: 'How is your mental health at the moment? Is there anything you would like the doctor to know about your personal or family history of mental health?', module: 'Module 2: Your Health History', section: 'Mental Health' },
    
    // Module 3 questions
    { id: 'investigation_questions', text: 'Do you have any specific questions for your doctor about investigations? If so, please write them here.', module: 'Module 3: Investigations' },
    
    // Module 4 questions
    { id: 'doctor_questions', text: 'Do you have any specific questions for your doctor or thoughts that you wish to discuss? If so, please write them here.', module: 'Module 4: Medical Treatments' },
    
    // Module 5 questions
    { id: 'other_questions', text: 'Do you have any other questions that you would like to ask the doctor? Here is a good place to record them.', module: 'Module 5: Your Questions' }
  ];
  
  // Group questions by module and section
  const groupedQuestions = allQuestions.reduce((acc, question) => {
    const moduleKey = question.module;
    const sectionKey = question.section || 'General';
    
    if (!acc[moduleKey]) {
      acc[moduleKey] = {};
    }
    if (!acc[moduleKey][sectionKey]) {
      acc[moduleKey][sectionKey] = [];
    }
    acc[moduleKey][sectionKey].push(question);
    return acc;
  }, {} as Record<string, Record<string, typeof allQuestions>>);

  // Generate HTML sections with selective page breaks
  const questionSections = Object.entries(groupedQuestions).map(([module, sections], moduleIndex) => {
    const isFirstModule = moduleIndex === 0;
    
    // Only add page breaks for modules 1, 2, and 5+ (skip page breaks for modules 3 and 4)
    const shouldAddPageBreak = !isFirstModule && !module.includes('Module 3') && !module.includes('Module 4');
    
    const modulePageStart = shouldAddPageBreak ? `
    </div>
    
    <!-- ${module} Page -->
    <div class="page">
        <div class="page-header">
            <img src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos/website_logo_transparent.png" alt="Menopause UK" class="header-logo" style="max-width: 80px !important; height: auto !important; display: block; border: 0; outline: none; text-decoration: none;">
            <h2 class="page-title">${module}</h2>
        </div>
    ` : '';
    
    const moduleHeader = `
      <div class="section-divider"></div>
      <h2 style="font-size: 16pt; font-weight: 700; color: #333333; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #A8DADC;">
        ${module}
      </h2>
    `;
    
    const sectionContent = Object.entries(sections).map(([section, questions]) => {
      const sectionHeader = section !== 'General' ? `
        <h3 style="font-size: 14pt; font-weight: 600; color: #333333; margin: 20px 0 15px 0;">
          ${section}
        </h3>
      ` : '';
      
      const questionBlocks = questions.map(question => {
        const answer = responses[question.id] || 'No answer provided yet';
        return `
          <div class="question-block">
            <h4 class="question-title">${question.text}</h4>
            <div class="answer-content">${answer}</div>
          </div>
        `;
      }).join('');
      
      return sectionHeader + questionBlocks;
    }).join('');

    return modulePageStart + (shouldAddPageBreak ? '' : moduleHeader) + sectionContent;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Menopause Consultation</title>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Open Sans', sans-serif;
            font-size: 14pt;
            line-height: 1.5;
            color: #333333;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
        }
        
        .page {
            width: 100%;
            max-width: 1000px;
            min-height: 100vh;
            margin: 0 auto;
            padding: 40px;
            background: #FFFFFF;
            page-break-after: always;
            position: relative;
        }
        
        .page:last-child {
            page-break-after: avoid;
        }
        
        /* Cover Page - Professional redesign */
        .cover-page {
            height: 100vh;
            min-height: 297mm;
            padding: 60px 40px;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
        }
        
        .cover-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(168, 218, 220, 0.06) 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(168, 218, 220, 0.04) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .cover-header {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            z-index: 2;
            max-width: 800px;
            width: 100%;
            flex-grow: 1;
            gap: 50px;
        }
        
        .document-title {
            font-size: clamp(32pt, 6vw, 42pt);
            font-weight: 300;
            color: #2c5f61;
            margin: 0;
            line-height: 1.3;
            font-family: 'Open Sans', sans-serif;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            border-bottom: 2px solid rgba(168, 218, 220, 0.3);
            padding-bottom: 20px;
        }
        
        .patient-info-container {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 20px;
            padding: 40px 30px;
            box-shadow: 0 8px 32px rgba(44, 95, 97, 0.1);
            border: 1px solid rgba(168, 218, 220, 0.2);
            backdrop-filter: blur(10px);
            width: 100%;
            max-width: 700px;
        }
        
        .patient-name {
            font-size: clamp(22pt, 4vw, 28pt);
            font-weight: 600;
            color: #2c5f61;
            margin: 0 0 15px 0;
            font-family: 'Open Sans', sans-serif;
            line-height: 1.3;
        }
        
        .creation-date {
            font-size: clamp(14pt, 3vw, 16pt);
            color: #666666;
            font-family: 'Open Sans', sans-serif;
            margin: 0;
            font-weight: 300;
            font-style: italic;
        }
        
        .cover-footer {
            position: relative;
            z-index: 2;
            text-align: center;
            color: #888888;
            font-size: 11pt;
            font-family: 'Open Sans', sans-serif;
            font-weight: 300;
            margin-top: auto;
        }
        
        /* Responsive adjustments */
        @media screen and (max-width: 768px) {
            .cover-page {
                height: 100vh;
                min-height: 100vh;
                padding: 20px;
            }
            
            .cover-header {
                padding: 20px 15px;
            }
            
            .document-title {
                font-size: 28pt;
                margin-bottom: 40px;
            }
            
            .patient-name {
                font-size: 18pt;
                margin-bottom: 25px;
                padding: 12px 20px;
            }
            
            .creation-date {
                font-size: 12pt;
            }
        }
        
        @media screen and (max-width: 480px) {
            .cover-page {
                padding: 15px;
            }
            
            .document-title {
                font-size: 24pt;
                margin-bottom: 30px;
            }
            
            .patient-name {
                font-size: 16pt;
                margin-bottom: 20px;
                padding: 10px 15px;
            }
            
            .creation-date {
                font-size: 11pt;
            }
        }
        
        /* Print optimizations */
        @media print {
            .cover-page {
                height: 297mm;
                min-height: 297mm;
                background: #FFFFFF !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .cover-page::before {
                display: none;
            }
            
            .document-title {
                font-size: 42pt;
                color: #333333 !important;
                text-shadow: none;
            }
            
            .patient-name {
                font-size: 28pt;
                color: #2c5f61 !important;
                background: rgba(168, 218, 220, 0.1) !important;
                border: 1px solid #A8DADC !important;
            }
            
            .creation-date {
                font-size: 16pt;
                color: #666666 !important;
            }
            
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
        
        .cover-logo {
            max-width: 250px !important;
            width: 250px !important;
            height: auto !important;
            max-height: 150px !important;
            object-fit: contain;
            margin-top: auto;
        }
        
        /* Headers and footers */
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #A8DADC;
        }
        
        .header-logo {
            max-width: 60px !important;
            height: auto !important;
        }
        
        .page-title {
            font-size: 22pt;
            font-weight: 700;
            color: #333333;
        }
        
        /* Page footer removed per user request
        .page-footer {
            position: absolute;
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 10pt;
            color: #333333;
            border-top: 1px solid #E0E0E0;
            padding-top: 10px;
        }
        */
        
        /* Modified Greene Scale Table - Optimized to fit on one page */
        .greene-scale-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            background: #FFFFFF;
            page-break-inside: avoid;
        }

        .greene-scale-table th {
            background: #A8DADC;
            color: #333333;
            font-weight: 600;
            padding: 4px 3px;
            text-align: center;
            border: 1px solid #333333;
            font-size: 8pt;
            line-height: 1.1;
        }

        .greene-scale-table td {
            padding: 3px 2px;
            border: 1px solid #A0A0A0;
            font-size: 8pt;
            vertical-align: middle;
            line-height: 1.2;
        }
        
        .greene-scale-table tr:nth-child(even) {
            background: #F5F5F5;
        }
        
        .total-row {
            background: #E0D8C8 !important;
            font-weight: 600;
        }
        
        .total-row td {
            font-weight: 600;
            color: #333333;
        }
        
        /* Question blocks */
        .question-block {
            margin-bottom: 35px;
            page-break-inside: avoid;
        }
        
        /* Add spacing when a question is pushed to a new page */
        .question-block:first-child {
            margin-top: 60px; /* 4 lines of extra spacing when question starts a new page */
        }
        
        .question-title {
            font-size: 12pt;
            font-weight: 600;
            color: #333333;
            margin-bottom: 12px;
            line-height: 1.4;
        }

        .answer-content {
            background: #F5F5F5;
            padding: 15px;
            border-radius: 8px;
            border-left: 5px solid #A8DADC;
            font-size: 12pt;
            line-height: 1.5;
            color: #333333;
            margin-bottom: 15px;
            max-width: none;
            width: 100%;
        }
        
        .section-divider {
            height: 2px;
            background: linear-gradient(to right, #A8DADC, #B2D8B2);
            margin: 30px 0;
            border-radius: 1px;
        }
        
        /* Mobile Optimizations */
        @media screen and (max-width: 768px) {
            .page {
                width: 100%;
                min-width: 320px;
                padding: 20px;
                margin: 0;
            }
            
            body {
                font-size: 16pt;
            }
            
            .page-header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .header-logo {
                width: 60px;
            }
            
            .page-title {
                font-size: 20pt;
            }
            
            .greene-scale-table {
                font-size: 12pt;
                margin: 15px 0;
            }
            
            .greene-scale-table th,
            .greene-scale-table td {
                padding: 8px 6px;
                font-size: 12pt;
                line-height: 1.3;
            }
            
            .question-title {
                font-size: 18pt;
                margin-bottom: 15px;
            }
            
            .answer-content {
                font-size: 16pt;
                padding: 18px;
                line-height: 1.8;
            }
        }
        
        @media screen and (max-width: 480px) {
            .page {
                padding: 15px;
            }
            
            body {
                font-size: 15pt;
            }
            
            .greene-scale-table {
                font-size: 11pt;
            }
            
            .greene-scale-table th,
            .greene-scale-table td {
                padding: 6px 4px;
                font-size: 11pt;
            }
            
            .page-title {
                font-size: 18pt;
            }
            
            .question-title {
                font-size: 16pt;
            }
            
            .answer-content {
                font-size: 15pt;
                padding: 15px;
            }
        }
        
        /* Print optimizations */
        @media print {
            body { margin: 0; padding: 0; }
            .page { 
                margin: 0; 
                box-shadow: none; 
                padding-top: 25mm;
            }
            @page { 
                size: A4 portrait; 
                margin: 15mm 20mm 20mm 20mm;
            }
            
            .page-header {
                margin-top: 0;
                padding-top: 0;
            }
            
            .header-logo {
                max-width: 40px !important;
                height: auto !important;
            }
            
            .cover-logo {
                width: 150px !important;
                max-width: 150px !important;
                height: auto !important;
                max-height: 90px !important;
            }
            
            .question-block {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .question-title {
                page-break-after: avoid;
                break-after: avoid;
            }
            
            .answer-content {
                page-break-before: avoid;
                break-before: avoid;
            }
            
            .greene-scale-table {
                font-size: 7pt !important;
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .greene-scale-table th,
            .greene-scale-table td {
                padding: 4px 3px !important;
                font-size: 7pt !important;
                line-height: 1.2 !important;
            }
        }
    </style>
</head>
<body>
    <!-- Page 1: Welcome Message and Helpful Hints -->
    <div class="page">
        <div class="page-header">
            <div style="text-align: center;">
                <img src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos/website_logo_transparent.png" alt="Menopause UK" class="header-logo" style="max-width: 80px !important; height: auto !important; display: inline-block; border: 0; outline: none; text-decoration: none;">
            </div>
        </div>

        <div style="margin-bottom: 30px;">
            <h3 style="font-size: 16pt; font-weight: 600; color: #333333; margin-bottom: 15px;">Hello ${userName},</h3>
            <p style="font-size: 14pt; line-height: 1.5; margin-bottom: 20px;">
                Thank you for completing your menopause assessment. This comprehensive document contains all of your responses and will help facilitate a productive discussion with your healthcare provider.
            </p>

            <h3 style="font-size: 14pt; font-weight: 600; color: #333333; margin: 25px 0 15px 0;">What to do next</h3>
            <p style="font-size: 14pt; line-height: 1.5; margin-bottom: 20px;">
                Please review your responses in this document and bring it with you to your menopause consultation appointment. Your healthcare provider will use this information to better understand your symptoms and health history.
            </p>
        </div>

        <div style="margin-top: 30px;">
            <h3 style="font-size: 14pt; font-weight: 600; color: #333333; margin-bottom: 20px; border-bottom: 2px solid #A8DADC; padding-bottom: 10px;">Helpful Hints</h3>
            
            <div style="margin-bottom: 25px; padding: 20px; background: #F5F5F5; border-radius: 8px; border-left: 4px solid #A8DADC;">
                <p style="font-size: 14pt; line-height: 1.5; margin-bottom: 12px;"><strong>Helpful hint 1:</strong> As well as collecting all this information it is likely that your GP or nurse will also want to measure your height and weight, blood pressure and pulse rate. So wear shoes that are easy to slip off and wear a loose shirt to make this process easier.</p>

                <p style="font-size: 14pt; line-height: 1.5; margin-bottom: 12px;"><strong>Helpful hint 2:</strong> When booking your appointment please ensure that the medical receptionist knows that this appointment is for a Menopause Health Assessment.</p>

                <p style="font-size: 14pt; line-height: 1.5; margin-bottom: 12px;"><strong>Helpful hint 3:</strong> Please note that if you have not had a cervical screening (what we used to call a pap smear) in the past 5 years then ensure you tell the medical receptionist this at the time of booking the appointment so that they can allow time and resources for this to be done on the day. This will again save you coming back another day!</p>

                <p style="font-size: 14pt; line-height: 1.5; margin-bottom: 12px;"><strong>Helpful hint 4:</strong> ${marketCode === 'US'
                  ? 'Please assess whether you think that your doctor will determine that you are due for a mammogram and if it is obvious that you are going to need one, book it in. Please speak with your insurer to determine how much this will cost you.'
                  : 'If you are aged over 40 in Australia then you eligible for a free mammogram. If you are over 50 your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms.'
                }</p>

                <p style="font-size: 14pt; line-height: 1.5;"><strong>Helpful hint 5:</strong> Print out and bring this document with you to your consultation!</p>
            </div>
        </div>
    </div>

    <!-- Page 2: Top Symptoms and Modified Greene Scale -->
    <div class="page">
        <div class="page-header">
            <div style="text-align: center;">
                <img src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos/website_logo_transparent.png" alt="Menopause UK" class="header-logo" style="max-width: 80px !important; height: auto !important; display: inline-block; border: 0; outline: none; text-decoration: none;">
            </div>
            <h2 class="page-title">Your Top Symptoms & Assessment</h2>
        </div>
        
        <!-- Top Three Symptoms Section -->
        <div style="margin-bottom: 25px;">
            <h3 style="font-size: 12pt; font-weight: 600; color: #333333; margin-bottom: 15px; border-bottom: 2px solid #A8DADC; padding-bottom: 10px;">Your Top Three Symptoms</h3>
            <div class="question-block" style="background: #F8FFFE; border: 1px solid #A8DADC; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="font-size: 12pt; font-weight: 600; color: #333333; margin-bottom: 10px;">What are your top three symptoms that you desperately need help with?</h4>
                <div style="font-size: 12pt; line-height: 1.5; color: #333333;">${responses['top_three_symptoms'] || 'No answer provided yet'}</div>
            </div>
        </div>

        <!-- Modified Greene Scale Section -->
        <div style="margin-top: 15px;">
            <h3 style="font-size: 12pt; font-weight: 600; color: #333333; margin-bottom: 10px; border-bottom: 2px solid #A8DADC; padding-bottom: 8px;">The Modified Greene Scale</h3>

            <table class="greene-scale-table" style="font-size: 8pt; margin-top: 10px;">
                <thead>
                    <tr>
                        <th style="width: 40%; padding: 3px 2px; font-size: 8pt; line-height: 1.1;">Question</th>
                        <th style="width: 20%; padding: 3px 2px; font-size: 8pt; line-height: 1.1;">Score before MHT</th>
                        <th style="width: 20%; padding: 3px 2px; font-size: 8pt; line-height: 1.1;">3 months after starting MHT</th>
                        <th style="width: 20%; padding: 3px 2px; font-size: 8pt; line-height: 1.1;">6 months after starting MHT</th>
                    </tr>
                </thead>
                <tbody>
                    ${greeneScaleRows}
                    <tr class="total-row">
                        <td style="padding: 3px 2px; font-size: 8pt;"><strong>Total Score</strong></td>
                        <td style="text-align: center; padding: 3px 2px; font-size: 8pt;"><strong>${totalScore}</strong></td>
                        <td style="text-align: center; padding: 3px 2px; font-size: 8pt;"></td>
                        <td style="text-align: center; padding: 3px 2px; font-size: 8pt;"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Page 3+: Long Answer Questions -->
    <div class="page">
        <div class="page-header">
            <div style="text-align: center;">
                <img src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos/website_logo_transparent.png" alt="Menopause UK" class="header-logo" style="max-width: 80px !important; height: auto !important; display: inline-block; border: 0; outline: none; text-decoration: none;">
            </div>
            <h2 class="page-title">Detailed Responses</h2>
        </div>
        
        ${questionSections}
    </div>
</body>
</html>`;
}