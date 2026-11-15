
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Language = "en" | "hi" | "kn" | "ta" | "te" | "ml";

type Crop = {
  id: number;
  name: string;
  season: string;
  area: string;
};

type Income = {
  id: number;
  source: string;
  amount: string;
  frequency: string;
};

type ExistingLoan = {
  id: number;
  lender: string;
  outstanding: string;
  repayment: string;
  frequency: string;
  overdue: string;
};

const english = {
  title: "Apply for Agricultural Loan",
  subtitle: "Complete four simple steps",
  farming: "Farming Details",
  financial: "Financial Details",
  loan: "Loan Request",
  review: "Review & Submit",
  back: "Back",
  next: "Continue",
  submit: "Submit Application",
  home: "Dashboard",
  landType: "How do you cultivate your land?",
  owned: "I own the land",
  leased: "I lease the land",
  share: "I cultivate someone else's land",
  crop: "Which crop are you growing?",
  season: "Growing season",
  area: "Area cultivated (acres)",
  addCrop: "Add another crop",
  remove: "Remove",
  kharif: "Kharif",
  rabi: "Rabi",
  otherSeason: "Other",
  cropIncome: "Annual income from crop farming (₹)",
  additional: "Do you earn income from other sources?",
  yes: "Yes",
  no: "No",
  incomeSource: "Additional income source",
  incomeAmount: "Income amount (₹)",
  frequency: "How often do you earn this?",
  monthly: "Monthly",
  yearly: "Yearly",
  addIncome: "Add another income source",
  existing: "Do you have any existing loans?",
  lender: "Name of bank or lender",
  outstanding: "Amount still unpaid (₹)",
  repayment: "Regular repayment amount (₹)",
  overdue: "Is any payment currently overdue?",
  addLoan: "Add another existing loan",
  loanAmount: "How much loan do you need? (₹)",
  purpose: "Purpose of loan",
  purposeValue: "Crop cultivation / Kisan Credit Card",
  bank: "Preferred bank",
  branch: "Preferred branch",
  select: "Select an option",
  reviewTitle: "Please check your information",
  confirm:
    "I confirm that the information I have entered is correct.",
  consent:
    "I understand that this prototype saves my application in this browser and does not send it to a bank.",
  success: "Application Saved Successfully!",
  successMessage:
    "Your application has been saved in this browser. You can find it under My Applications.",
  applicationId: "Application ID",
  done: "Return to Dashboard",
  error: "Please complete all required fields correctly.",
  totalIncome: "Estimated total annual income",
  land: "Land relationship",
  crops: "Crops",
  farmIncome: "Crop farming income",
  otherIncome: "Additional income",
  existingLoans: "Existing loans",
  requestedAmount: "Requested amount",
  selectedBank: "Preferred bank",
  demo: "DEMO MODE — Use fictional information only.",
};

type Translation = typeof english;

const translations: Record<Language, Partial<Translation>> = {
  en: english,
  hi: {
    title: "कृषि ऋण के लिए आवेदन करें",
    subtitle: "चार आसान चरण पूरे करें",
    farming: "खेती का विवरण",
    financial: "आय और ऋण की जानकारी",
    loan: "ऋण अनुरोध",
    review: "जाँच करें और जमा करें",
    back: "पीछे",
    next: "आगे बढ़ें",
    submit: "आवेदन जमा करें",
    home: "डैशबोर्ड",
    landType: "आप जमीन पर खेती कैसे करते हैं?",
    owned: "जमीन मेरी है",
    leased: "मैं जमीन पट्टे पर लेता हूँ",
    share: "मैं दूसरे की जमीन पर खेती करता हूँ",
    crop: "आप कौन सी फसल उगा रहे हैं?",
    season: "फसल का मौसम",
    area: "खेती का क्षेत्रफल (एकड़)",
    addCrop: "एक और फसल जोड़ें",
    remove: "हटाएँ",
    kharif: "खरीफ",
    rabi: "रबी",
    otherSeason: "अन्य",
    cropIncome: "खेती से सालाना आय (₹)",
    additional: "क्या आपको किसी अन्य स्रोत से आय होती है?",
    yes: "हाँ",
    no: "नहीं",
    incomeSource: "अतिरिक्त आय का स्रोत",
    incomeAmount: "आय की राशि (₹)",
    frequency: "यह आय कितनी बार होती है?",
    monthly: "मासिक",
    yearly: "सालाना",
    addIncome: "एक और आय का स्रोत जोड़ें",
    existing: "क्या आपका कोई मौजूदा ऋण है?",
    lender: "बैंक या ऋणदाता का नाम",
    outstanding: "बाकी ऋण राशि (₹)",
    repayment: "नियमित किस्त (₹)",
    overdue: "क्या कोई किस्त बकाया है?",
    addLoan: "एक और ऋण जोड़ें",
    loanAmount: "आपको कितना ऋण चाहिए? (₹)",
    purpose: "ऋण का उद्देश्य",
    bank: "पसंदीदा बैंक",
    branch: "पसंदीदा शाखा",
    select: "विकल्प चुनें",
    reviewTitle: "अपनी जानकारी जाँचें",
    confirm: "मैं पुष्टि करता हूँ कि डेमो के लिए दी गई जानकारी सही है।",
    consent: "मैं समझता हूँ कि यह केवल डेमो है और कोई वास्तविक ऋण आवेदन नहीं भेजा जाएगा।",
    success: "आवेदन सहेज दिया गया!",
    done: "डैशबोर्ड पर जाएँ",
    error: "कृपया सभी जरूरी जानकारी सही भरें।",
    totalIncome: "अनुमानित कुल सालाना आय",
    demo: "डेमो मोड — केवल काल्पनिक जानकारी भरें।",
  },
  kn: {
    title: "ಕೃಷಿ ಸಾಲಕ್ಕಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    subtitle: "ನಾಲ್ಕು ಸರಳ ಹಂತಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ",
    farming: "ಕೃಷಿ ವಿವರಗಳು",
    financial: "ಆರ್ಥಿಕ ವಿವರಗಳು",
    loan: "ಸಾಲದ ಅರ್ಜಿ",
    review: "ಪರಿಶೀಲಿಸಿ ಸಲ್ಲಿಸಿ",
    back: "ಹಿಂದೆ",
    next: "ಮುಂದುವರಿಸಿ",
    submit: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    home: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    landType: "ನೀವು ಭೂಮಿಯಲ್ಲಿ ಹೇಗೆ ಕೃಷಿ ಮಾಡುತ್ತೀರಿ?",
    owned: "ಸ್ವಂತ ಭೂಮಿ",
    leased: "ಗುತ್ತಿಗೆ ಭೂಮಿ",
    share: "ಇತರರ ಭೂಮಿಯಲ್ಲಿ ಕೃಷಿ",
    crop: "ನೀವು ಯಾವ ಬೆಳೆ ಬೆಳೆಯುತ್ತೀರಿ?",
    season: "ಬೆಳೆ ಋತು",
    area: "ಕೃಷಿ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)",
    addCrop: "ಮತ್ತೊಂದು ಬೆಳೆ ಸೇರಿಸಿ",
    remove: "ತೆಗೆದುಹಾಕಿ",
    kharif: "ಖಾರಿಫ್",
    rabi: "ರಬಿ",
    otherSeason: "ಇತರೆ",
    cropIncome: "ಕೃಷಿಯಿಂದ ವಾರ್ಷಿಕ ಆದಾಯ (₹)",
    additional: "ನಿಮಗೆ ಬೇರೆ ಆದಾಯವಿದೆಯೇ?",
    yes: "ಹೌದು",
    no: "ಇಲ್ಲ",
    incomeSource: "ಹೆಚ್ಚುವರಿ ಆದಾಯದ ಮೂಲ",
    incomeAmount: "ಆದಾಯದ ಮೊತ್ತ (₹)",
    frequency: "ಈ ಆದಾಯ ಎಷ್ಟು ಬಾರಿ ಬರುತ್ತದೆ?",
    monthly: "ಮಾಸಿಕ",
    yearly: "ವಾರ್ಷಿಕ",
    addIncome: "ಮತ್ತೊಂದು ಆದಾಯದ ಮೂಲ ಸೇರಿಸಿ",
    existing: "ನಿಮಗೆ ಈಗಾಗಲೇ ಸಾಲವಿದೆಯೇ?",
    lender: "ಬ್ಯಾಂಕ್ ಅಥವಾ ಸಾಲದಾತರ ಹೆಸರು",
    outstanding: "ಬಾಕಿ ಸಾಲ (₹)",
    repayment: "ನಿಯಮಿತ ಮರುಪಾವತಿ (₹)",
    overdue: "ಯಾವುದಾದರೂ ಪಾವತಿ ಬಾಕಿಯಿದೆಯೇ?",
    addLoan: "ಮತ್ತೊಂದು ಸಾಲ ಸೇರಿಸಿ",
    loanAmount: "ನಿಮಗೆ ಎಷ್ಟು ಸಾಲ ಬೇಕು? (₹)",
    purpose: "ಸಾಲದ ಉದ್ದೇಶ",
    bank: "ಆಯ್ಕೆಯ ಬ್ಯಾಂಕ್",
    branch: "ಆಯ್ಕೆಯ ಶಾಖೆ",
    select: "ಆಯ್ಕೆಮಾಡಿ",
    reviewTitle: "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
    confirm: "ಡೆಮೊಗೆ ನೀಡಿದ ಮಾಹಿತಿ ಸರಿಯಾಗಿದೆ ಎಂದು ದೃಢಪಡಿಸುತ್ತೇನೆ.",
    consent: "ಇದು ಡೆಮೊ ಮಾತ್ರ ಎಂದು ನನಗೆ ತಿಳಿದಿದೆ.",
    success: "ಅರ್ಜಿ ಉಳಿಸಲಾಗಿದೆ!",
    done: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    error: "ಅಗತ್ಯ ವಿವರಗಳನ್ನು ಸರಿಯಾಗಿ ನಮೂದಿಸಿ.",
    totalIncome: "ಅಂದಾಜು ಒಟ್ಟು ವಾರ್ಷಿಕ ಆದಾಯ",
    demo: "ಡೆಮೊ — ಕಾಲ್ಪನಿಕ ಮಾಹಿತಿ ಮಾತ್ರ ಬಳಸಿ.",
  },
  ta: {
    title: "விவசாயக் கடனுக்கு விண்ணப்பிக்கவும்",
    subtitle: "நான்கு எளிய படிகளை முடிக்கவும்",
    farming: "விவசாய விவரங்கள்",
    financial: "நிதி விவரங்கள்",
    loan: "கடன் விண்ணப்பம்",
    review: "சரிபார்த்து சமர்ப்பிக்கவும்",
    back: "பின்செல்",
    next: "தொடரவும்",
    submit: "விண்ணப்பத்தைச் சமர்ப்பிக்கவும்",
    home: "முகப்புப் பலகை",
    landType: "நீங்கள் நிலத்தில் எவ்வாறு விவசாயம் செய்கிறீர்கள்?",
    owned: "சொந்த நிலம்",
    leased: "குத்தகை நிலம்",
    share: "மற்றவரின் நிலத்தில் விவசாயம்",
    crop: "நீங்கள் என்ன பயிர் செய்கிறீர்கள்?",
    season: "பயிர் பருவம்",
    area: "பயிரிடும் பரப்பு (ஏக்கர்)",
    addCrop: "மற்றொரு பயிரைச் சேர்க்கவும்",
    remove: "நீக்கு",
    kharif: "காரிஃப்",
    rabi: "ரபி",
    otherSeason: "மற்றவை",
    cropIncome: "விவசாய ஆண்டு வருமானம் (₹)",
    additional: "வேறு வருமானம் ஏதேனும் உள்ளதா?",
    yes: "ஆம்",
    no: "இல்லை",
    incomeSource: "கூடுதல் வருமானத்தின் மூலம்",
    incomeAmount: "வருமானத் தொகை (₹)",
    frequency: "இந்த வருமானம் எவ்வளவு அடிக்கடி வருகிறது?",
    monthly: "மாதந்தோறும்",
    yearly: "ஆண்டுதோறும்",
    addIncome: "மற்றொரு வருமானத்தைச் சேர்க்கவும்",
    existing: "ஏற்கனவே கடன் உள்ளதா?",
    lender: "வங்கி அல்லது கடனளிப்பவர்",
    outstanding: "நிலுவைக் கடன் (₹)",
    repayment: "வழக்கமான தவணை (₹)",
    overdue: "ஏதேனும் தவணை நிலுவையில் உள்ளதா?",
    addLoan: "மற்றொரு கடனைச் சேர்க்கவும்",
    loanAmount: "எவ்வளவு கடன் தேவை? (₹)",
    purpose: "கடனின் நோக்கம்",
    bank: "விருப்பமான வங்கி",
    branch: "விருப்பமான கிளை",
    select: "தேர்வு செய்யவும்",
    reviewTitle: "உங்கள் விவரங்களைச் சரிபார்க்கவும்",
    confirm: "மாதிரிக்கு அளித்த தகவல்கள் சரியானவை.",
    consent: "இது ஒரு மாதிரி மட்டுமே என்பதை புரிந்துகொள்கிறேன்.",
    success: "விண்ணப்பம் சேமிக்கப்பட்டது!",
    done: "முகப்புப் பலகைக்குத் திரும்பவும்",
    error: "தேவையான விவரங்களை சரியாக நிரப்பவும்.",
    totalIncome: "மதிப்பிடப்பட்ட மொத்த ஆண்டு வருமானம்",
    demo: "மாதிரி முறை — கற்பனை விவரங்களை மட்டும் பயன்படுத்தவும்.",
  },
  te: {
    title: "వ్యవసాయ రుణానికి దరఖాస్తు చేయండి",
    subtitle: "నాలుగు సులభమైన దశలను పూర్తి చేయండి",
    farming: "వ్యవసాయ వివరాలు",
    financial: "ఆర్థిక వివరాలు",
    loan: "రుణ అభ్యర్థన",
    review: "పరిశీలించి సమర్పించండి",
    back: "వెనుకకు",
    next: "కొనసాగించండి",
    submit: "దరఖాస్తు సమర్పించండి",
    home: "డ్యాష్‌బోర్డ్",
    landType: "మీరు భూమిని ఎలా సాగు చేస్తున్నారు?",
    owned: "సొంత భూమి",
    leased: "కౌలు భూమి",
    share: "ఇతరుల భూమిని సాగు చేస్తాను",
    crop: "ఏ పంట పండిస్తున్నారు?",
    season: "పంట కాలం",
    area: "సాగు విస్తీర్ణం (ఎకరాలు)",
    addCrop: "మరో పంట జోడించండి",
    remove: "తొలగించండి",
    kharif: "ఖరీఫ్",
    rabi: "రబీ",
    otherSeason: "ఇతర",
    cropIncome: "వ్యవసాయ వార్షిక ఆదాయం (₹)",
    additional: "ఇతర ఆదాయం ఉందా?",
    yes: "అవును",
    no: "లేదు",
    incomeSource: "అదనపు ఆదాయ వనరు",
    incomeAmount: "ఆదాయ మొత్తం (₹)",
    frequency: "ఎంత తరచుగా ఆదాయం వస్తుంది?",
    monthly: "నెలవారీ",
    yearly: "సంవత్సరానికి",
    addIncome: "మరో ఆదాయ వనరు జోడించండి",
    existing: "మీకు ఇప్పటికే రుణాలు ఉన్నాయా?",
    lender: "బ్యాంకు లేదా రుణదాత పేరు",
    outstanding: "బాకీ ఉన్న మొత్తం (₹)",
    repayment: "సాధారణ వాయిదా (₹)",
    overdue: "ఏదైనా వాయిదా బాకీ ఉందా?",
    addLoan: "మరో రుణం జోడించండి",
    loanAmount: "ఎంత రుణం కావాలి? (₹)",
    purpose: "రుణ ప్రయోజనం",
    bank: "ఇష్టమైన బ్యాంకు",
    branch: "ఇష్టమైన శాఖ",
    select: "ఎంచుకోండి",
    reviewTitle: "మీ వివరాలను పరిశీలించండి",
    confirm: "డెమో కోసం ఇచ్చిన సమాచారం సరైనదే.",
    consent: "ఇది డెమో మాత్రమే అని అర్థం చేసుకున్నాను.",
    success: "దరఖాస్తు సేవ్ చేయబడింది!",
    done: "డ్యాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి",
    error: "అవసరమైన వివరాలను సరిగ్గా పూరించండి.",
    totalIncome: "అంచనా మొత్తం వార్షిక ఆదాయం",
    demo: "డెమో — కల్పిత వివరాలు మాత్రమే ఉపయోగించండి.",
  },
  ml: {
    title: "കാർഷിക വായ്പയ്ക്ക് അപേക്ഷിക്കുക",
    subtitle: "നാല് ലളിതമായ ഘട്ടങ്ങൾ പൂർത്തിയാക്കുക",
    farming: "കൃഷി വിവരങ്ങൾ",
    financial: "സാമ്പത്തിക വിവരങ്ങൾ",
    loan: "വായ്പ അപേക്ഷ",
    review: "പരിശോധിച്ച് സമർപ്പിക്കുക",
    back: "പിന്നിലേക്ക്",
    next: "തുടരുക",
    submit: "അപേക്ഷ സമർപ്പിക്കുക",
    home: "ഡാഷ്‌ബോർഡ്",
    landType: "നിങ്ങൾ എങ്ങനെ കൃഷി ചെയ്യുന്നു?",
    owned: "സ്വന്തം ഭൂമി",
    leased: "പാട്ടഭൂമി",
    share: "മറ്റൊരാളുടെ ഭൂമിയിൽ കൃഷി",
    crop: "ഏത് വിളയാണ് കൃഷി ചെയ്യുന്നത്?",
    season: "വിള സീസൺ",
    area: "കൃഷി വിസ്തീർണം (ഏക്കർ)",
    addCrop: "മറ്റൊരു വിള ചേർക്കുക",
    remove: "നീക്കം ചെയ്യുക",
    kharif: "ഖാരിഫ്",
    rabi: "റാബി",
    otherSeason: "മറ്റുള്ളവ",
    cropIncome: "കൃഷിയിൽ നിന്നുള്ള വാർഷിക വരുമാനം (₹)",
    additional: "മറ്റ് വരുമാനമുണ്ടോ?",
    yes: "ഉണ്ട്",
    no: "ഇല്ല",
    incomeSource: "അധിക വരുമാനത്തിന്റെ ഉറവിടം",
    incomeAmount: "വരുമാന തുക (₹)",
    frequency: "എത്ര ഇടവേളയിൽ വരുമാനം ലഭിക്കുന്നു?",
    monthly: "പ്രതിമാസം",
    yearly: "വർഷംതോറും",
    addIncome: "മറ്റൊരു വരുമാനം ചേർക്കുക",
    existing: "നിലവിൽ വായ്പകളുണ്ടോ?",
    lender: "ബാങ്ക് അല്ലെങ്കിൽ വായ്പാദാതാവ്",
    outstanding: "തിരിച്ചടയ്ക്കാനുള്ള തുക (₹)",
    repayment: "പതിവ് തിരിച്ചടവ് (₹)",
    overdue: "ഏതെങ്കിലും തുക കുടിശ്ശികയുണ്ടോ?",
    addLoan: "മറ്റൊരു വായ്പ ചേർക്കുക",
    loanAmount: "എത്ര വായ്പ വേണം? (₹)",
    purpose: "വായ്പയുടെ ഉദ്ദേശ്യം",
    bank: "തിരഞ്ഞെടുക്കുന്ന ബാങ്ക്",
    branch: "തിരഞ്ഞെടുക്കുന്ന ശാഖ",
    select: "തിരഞ്ഞെടുക്കുക",
    reviewTitle: "വിവരങ്ങൾ പരിശോധിക്കുക",
    confirm: "ഡെമോയ്ക്കായി നൽകിയ വിവരങ്ങൾ ശരിയാണ്.",
    consent: "ഇത് ഒരു ഡെമോ മാത്രമാണെന്ന് മനസ്സിലാക്കുന്നു.",
    success: "അപേക്ഷ സേവ് ചെയ്തു!",
    done: "ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക",
    error: "ആവശ്യമായ വിവരങ്ങൾ ശരിയായി നൽകുക.",
    totalIncome: "കണക്കാക്കിയ മൊത്തം വാർഷിക വരുമാനം",
    demo: "ഡെമോ — സാങ്കൽപ്പിക വിവരങ്ങൾ മാത്രം നൽകുക.",
  },
};

const cropOptions = [
  "Rice",
  "Wheat",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Groundnut",
  "Pulses",
  "Vegetables",
  "Other",
];

const incomeOptions = [
  "Dairy farming",
  "Livestock / Poultry",
  "Salary / Wages",
  "Small business",
  "Rental income",
  "Other",
];

// Fictional participating banks for demo purposes only.
const demoBanks = [
  "Demo Rural Bank A",
  "Demo Cooperative Bank B",
  "Demo Agricultural Bank C",
];

const money = (value: number) =>
  "₹" + value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const validAmount = (value: string, allowZero = false) => {
  if (value.trim() === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
};

function ApplicationContent() {
  const router = useRouter();
  const params = useSearchParams();

  const initialLanguage = params.get("lang") || "en";

  const [language, setLanguage] = useState<Language>(
    initialLanguage in translations
      ? (initialLanguage as Language)
      : "en"
  );

  const t: Translation = {
    ...english,
    ...translations[language],
  };

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  // Step 1: Farming
  const [landType, setLandType] = useState("Owned");

  const [crops, setCrops] = useState<Crop[]>([
    { id: 1, name: "", season: "", area: "" },
  ]);

  // Step 2: Financial
  const [cropIncome, setCropIncome] = useState("");
  const [hasOtherIncome, setHasOtherIncome] = useState("No");

  const [incomes, setIncomes] = useState<Income[]>([
    {
      id: 1,
      source: "",
      amount: "",
      frequency: "Monthly",
    },
  ]);

  const [hasExistingLoan, setHasExistingLoan] = useState("No");

  const [existingLoans, setExistingLoans] = useState<
    ExistingLoan[]
  >([
    {
      id: 1,
      lender: "",
      outstanding: "",
      repayment: "",
      frequency: "Monthly",
      overdue: "No",
    },
  ]);

  // Step 3: Loan request
  const [loanAmount, setLoanAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [branch, setBranch] = useState("");

  // Step 4: Review
  const [confirmed, setConfirmed] = useState(false);
  const [consented, setConsented] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white " +
    "px-4 py-3 text-gray-900 outline-none " +
    "focus:border-green-600";

  const labelClass =
    "mb-2 block text-sm font-semibold text-gray-700";

  function updateCrop(
    id: number,
    field: keyof Omit<Crop, "id">,
    value: string
  ) {
    setCrops((old) =>
      old.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  }

  function addCrop() {
    setCrops((old) => [
      ...old,
      {
        id: Math.max(...old.map((x) => x.id)) + 1,
        name: "",
        season: "",
        area: "",
      },
    ]);
  }

  function updateIncome(
    id: number,
    field: keyof Omit<Income, "id">,
    value: string
  ) {
    setIncomes((old) =>
      old.map((x) =>
        x.id === id ? { ...x, [field]: value } : x
      )
    );
  }

  function addIncome() {
    setIncomes((old) => [
      ...old,
      {
        id: Math.max(...old.map((x) => x.id)) + 1,
        source: "",
        amount: "",
        frequency: "Monthly",
      },
    ]);
  }

  function updateExistingLoan(
    id: number,
    field: keyof Omit<ExistingLoan, "id">,
    value: string
  ) {
    setExistingLoans((old) =>
      old.map((x) =>
        x.id === id ? { ...x, [field]: value } : x
      )
    );
  }

  function addExistingLoan() {
    setExistingLoans((old) => [
      ...old,
      {
        id: Math.max(...old.map((x) => x.id)) + 1,
        lender: "",
        outstanding: "",
        repayment: "",
        frequency: "Monthly",
        overdue: "No",
      },
    ]);
  }

  function annualIncome(item: Income) {
    const amount = Number(item.amount) || 0;
    return item.frequency === "Monthly"
      ? amount * 12
      : amount;
  }

  const extraAnnualIncome =
    hasOtherIncome === "Yes"
      ? incomes.reduce(
          (sum, item) => sum + annualIncome(item),
          0
        )
      : 0;

  const totalAnnualIncome =
    (Number(cropIncome) || 0) + extraAnnualIncome;

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateStep(currentStep: number) {
    if (currentStep === 0) {
      if (
        crops.length === 0 ||
        crops.some(
          (c) =>
            !c.name ||
            !c.season ||
            !validAmount(c.area)
        )
      ) {
        return false;
      }
    }

    if (currentStep === 1) {
      if (!validAmount(cropIncome, true)) {
        return false;
      }

      if (
        hasOtherIncome === "Yes" &&
        incomes.some(
          (x) =>
            !x.source ||
            !validAmount(x.amount, true) ||
            !x.frequency
        )
      ) {
        return false;
      }

      if (
        hasExistingLoan === "Yes" &&
        existingLoans.some(
          (x) =>
            !x.lender.trim() ||
            !validAmount(x.outstanding) ||
            !validAmount(x.repayment, true) ||
            !x.frequency
        )
      ) {
        return false;
      }
    }

    if (currentStep === 2) {
      if (
        !validAmount(loanAmount) ||
        !selectedBank ||
        !branch.trim()
      ) {
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    if (!validateStep(step)) {
      setError(t.error);
      scrollTop();
      return;
    }

    setError("");
    setStep((s) => Math.min(s + 1, 3));
    scrollTop();
  }

  function previousStep() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  }

  
function submitApplication() {
  if (
    ![0, 1, 2].every(validateStep) ||
    !confirmed ||
    !consented
  ) {
    setError(t.error);
    return;
  }

  const id =
    "KLP-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 6).toUpperCase();

  const now = new Date().toISOString();

  const application = {
    id,
    farmerId: "DEMO-FARMER-001",

    createdAt: now,
    updatedAt: now,
    status: "Submitted",

    landType,
    crops,

    cropIncome: Number(cropIncome),

    hasOtherIncome,
    incomes: hasOtherIncome === "Yes" ? incomes : [],

    totalAnnualIncome,

    hasExistingLoan,
    existingLoans:
      hasExistingLoan === "Yes" ? existingLoans : [],

    loanAmount: Number(loanAmount),
    loanPurpose: "Crop cultivation / KCC",

    bank: selectedBank,
    branch,

    sanctionedAmount: null,
    decisionReason: null,

    timeline: [
      {
        id: "EVENT-" + Date.now(),
        status: "Submitted",
        action: "Application submitted",
        actor: "Farmer",
        date: now,
        remarks: "Loan application received",
      },
    ],
  };

  try {
    const saved = localStorage.getItem("kisanApplications");

    const applications = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(applications)) {
      throw new Error("Invalid stored application data");
    }

    applications.push(application);

    localStorage.setItem(
      "kisanApplications",
      JSON.stringify(applications)
    );

    setError("");
    setSubmittedId(id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Could not save application:", error);
    setError(
      "Unable to save your application. Please try again."
    );
  }
}

  // Titles for the four stages of the application.
  const stepTitles = [t.farming, t.financial, t.loan, t.review];

  if (submittedId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-green-50 p-4 text-gray-900">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mb-5 text-6xl">✅</div>

          <h1 className="mb-4 text-2xl font-bold text-green-800">
            {t.success}
          </h1>

          <p className="mb-5 text-gray-600">
            {t.successMessage}
          </p>

          <div className="mb-6 rounded-xl bg-green-50 p-5">
            <p className="text-sm text-gray-600">
              {t.applicationId}
            </p>
            <p className="mt-2 text-xl font-bold">
              {submittedId}
            </p>
          </div>

          <p className="mb-6 text-sm text-gray-600">
            Saved in this browser. This is not a bank receipt.
          </p>

          <button
            onClick={() =>
              router.push(
                `/farmer/dashboard?lang=${language}`
              )
            }
            className="w-full rounded-xl bg-green-700 py-4 font-semibold text-white"
          >
            {t.done}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() =>
              router.push(
                `/farmer/dashboard?lang=${language}`
              )
            }
            className="font-medium text-green-800 hover:underline"
          >
            ← {t.home}
          </button>

          <select
            aria-label="Language"
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value as Language)
            }
            className="rounded-xl border border-gray-300 bg-white px-3 py-2"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="ml">മലയാളം</option>
          </select>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">
            🌾 {t.title}
          </h1>
          <p className="mt-2 text-gray-600">
            {t.subtitle}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          {stepTitles.map((title, index) => (
            <div key={index}>
              <div
                className={`mb-2 h-2 rounded-full ${
                  index <= step
                    ? "bg-green-700"
                    : "bg-gray-200"
                }`}
              />
              <p
                className={`text-center text-xs ${
                  index === step
                    ? "font-bold text-green-800"
                    : "text-gray-500"
                }`}
              >
                {index + 1}. {title}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-lg sm:p-8">

          <h2 className="mb-7 text-xl font-bold">
            {stepTitles[step]}
          </h2>

          {/* STEP 1: FARMING */}
          {step === 0 && (
            <div className="space-y-6">

              <div>
                <label className={labelClass}>
                  {t.landType} *
                </label>

                <div className="space-y-3">
                  {[
                    ["Owned", t.owned],
                    ["Leased", t.leased],
                    ["Sharecropper", t.share],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-4"
                    >
                      <input
                        type="radio"
                        name="landType"
                        checked={landType === value}
                        onChange={() => setLandType(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {crops.map((crop, index) => (
                <div
                  key={crop.id}
                  className="space-y-4 rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">
                      {t.crop} {index + 1}
                    </h3>

                    {crops.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCrops((old) =>
                            old.filter((x) => x.id !== crop.id)
                          )
                        }
                        className="text-sm text-red-600"
                      >
                        {t.remove}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      {t.crop} *
                    </label>

                    <select
                      className={inputClass}
                      value={crop.name}
                      onChange={(e) =>
                        updateCrop(
                          crop.id,
                          "name",
                          e.target.value
                        )
                      }
                    >
                      <option value="">{t.select}</option>

                      {cropOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {t.season} *
                    </label>

                    <select
                      className={inputClass}
                      value={crop.season}
                      onChange={(e) =>
                        updateCrop(
                          crop.id,
                          "season",
                          e.target.value
                        )
                      }
                    >
                      <option value="">{t.select}</option>
                      <option value="Kharif">
                        {t.kharif}
                      </option>
                      <option value="Rabi">
                        {t.rabi}
                      </option>
                      <option value="Other">
                        {t.otherSeason}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {t.area} *
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClass}
                      placeholder="Example: 1.5"
                      value={crop.area}
                      onChange={(e) =>
                        updateCrop(
                          crop.id,
                          "area",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCrop}
                className="w-full rounded-xl border-2 border-dashed border-green-400 py-3 font-medium text-green-700"
              >
                + {t.addCrop}
              </button>

              <p className="text-sm text-gray-500">
                Farmers who lease or sharecrop land may
                provide appropriate cultivation evidence
                during bank verification.
              </p>
            </div>
          )}

          {/* STEP 2: FINANCIAL */}
          {step === 1 && (
            <div className="space-y-7">

              <div>
                <label className={labelClass}>
                  {t.cropIncome} *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  className={inputClass}
                  value={cropIncome}
                  placeholder="Example: 120000"
                  onChange={(e) =>
                    setCropIncome(e.target.value)
                  }
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter approximate annual crop income.
                  The bank may verify income and expenses later.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  {t.additional} *
                </label>

                <div className="flex gap-6">
                  {["Yes", "No"].map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="extraIncome"
                        checked={hasOtherIncome === value}
                        onChange={() =>
                          setHasOtherIncome(value)
                        }
                      />
                      {value === "Yes" ? t.yes : t.no}
                    </label>
                  ))}
                </div>
              </div>

              {hasOtherIncome === "Yes" && (
                <div className="space-y-4">
                  {incomes.map((income, index) => (
                    <div
                      key={income.id}
                      className="space-y-4 rounded-xl border p-4"
                    >
                      <div className="flex justify-between">
                        <h3 className="font-semibold">
                          {t.otherIncome} {index + 1}
                        </h3>

                        {incomes.length > 1 && (
                          <button
                            type="button"
                            className="text-sm text-red-600"
                            onClick={() =>
                              setIncomes((old) =>
                                old.filter(
                                  (x) => x.id !== income.id
                                )
                              )
                            }
                          >
                            {t.remove}
                          </button>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.incomeSource} *
                        </label>

                        <select
                          value={income.source}
                          className={inputClass}
                          onChange={(e) =>
                            updateIncome(
                              income.id,
                              "source",
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            {t.select}
                          </option>
                          {incomeOptions.map((source) => (
                            <option
                              key={source}
                              value={source}
                            >
                              {source}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.incomeAmount} *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={income.amount}
                          className={inputClass}
                          onChange={(e) =>
                            updateIncome(
                              income.id,
                              "amount",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.frequency}
                        </label>
                        <select
                          className={inputClass}
                          value={income.frequency}
                          onChange={(e) =>
                            updateIncome(
                              income.id,
                              "frequency",
                              e.target.value
                            )
                          }
                        >
                          <option value="Monthly">
                            {t.monthly}
                          </option>
                          <option value="Yearly">
                            {t.yearly}
                          </option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addIncome}
                    className="w-full rounded-xl border-2 border-dashed border-green-400 py-3 text-green-700"
                  >
                    + {t.addIncome}
                  </button>
                </div>
              )}

              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-gray-600">
                  {t.totalIncome}
                </p>
                <p className="mt-1 text-2xl font-bold text-green-800">
                  {money(totalAnnualIncome)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Based on self-reported income, before
                  full bank verification.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  {t.existing} *
                </label>

                <div className="flex gap-6">
                  {["Yes", "No"].map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="existingLoans"
                        checked={hasExistingLoan === value}
                        onChange={() =>
                          setHasExistingLoan(value)
                        }
                      />
                      {value === "Yes" ? t.yes : t.no}
                    </label>
                  ))}
                </div>
              </div>

              {hasExistingLoan === "Yes" && (
                <div className="space-y-4">
                  {existingLoans.map((loan, index) => (
                    <div
                      key={loan.id}
                      className="space-y-4 rounded-xl border p-4"
                    >
                      <div className="flex justify-between">
                        <h3 className="font-semibold">
                          {t.existingLoans} {index + 1}
                        </h3>
                        {existingLoans.length > 1 && (
                          <button
                            type="button"
                            className="text-sm text-red-600"
                            onClick={() =>
                              setExistingLoans((old) =>
                                old.filter(
                                  (x) => x.id !== loan.id
                                )
                              )
                            }
                          >
                            {t.remove}
                          </button>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.lender} *
                        </label>
                        <input
                          className={inputClass}
                          value={loan.lender}
                          placeholder="Bank / lender"
                          onChange={(e) =>
                            updateExistingLoan(
                              loan.id,
                              "lender",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.outstanding} *
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={loan.outstanding}
                          onChange={(e) =>
                            updateExistingLoan(
                              loan.id,
                              "outstanding",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.repayment} *
                        </label>
                        <input
                          type="number"
                          min="0"
                          className={inputClass}
                          value={loan.repayment}
                          onChange={(e) =>
                            updateExistingLoan(
                              loan.id,
                              "repayment",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.frequency}
                        </label>
                        <select
                          className={inputClass}
                          value={loan.frequency}
                          onChange={(e) =>
                            updateExistingLoan(
                              loan.id,
                              "frequency",
                              e.target.value
                            )
                          }
                        >
                          <option value="Monthly">
                            {t.monthly}
                          </option>
                          <option value="Yearly">
                            {t.yearly}
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t.overdue}
                        </label>
                        <select
                          className={inputClass}
                          value={loan.overdue}
                          onChange={(e) =>
                            updateExistingLoan(
                              loan.id,
                              "overdue",
                              e.target.value
                            )
                          }
                        >
                          <option value="No">{t.no}</option>
                          <option value="Yes">{t.yes}</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addExistingLoan}
                    className="w-full rounded-xl border-2 border-dashed border-green-400 py-3 text-green-700"
                  >
                    + {t.addLoan}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: LOAN REQUEST */}
          {step === 2 && (
            <div className="space-y-6">

              <div>
                <label className={labelClass}>
                  {t.loanAmount} *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={loanAmount}
                  className={inputClass}
                  placeholder="Example: 50000"
                  onChange={(e) =>
                    setLoanAmount(e.target.value)
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  {t.purpose}
                </label>
                <div className="rounded-xl border border-green-300 bg-green-50 p-4">
                  🌾 {t.purposeValue}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Crop loans / KCC are the supported
                  product in this first prototype.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  {t.bank} *
                </label>
                <select
                  className={inputClass}
                  value={selectedBank}
                  onChange={(e) => {
                    setSelectedBank(e.target.value);
                    setBranch("");
                  }}
                >
                  <option value="">{t.select}</option>

                  {demoBanks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Banks listed here are sample choices.
                </p>
              </div>

              {selectedBank && (
                <div>
                  <label className={labelClass}>
                    {t.branch} *
                  </label>

                  <select
                    className={inputClass}
                    value={branch}
                    onChange={(e) =>
                      setBranch(e.target.value)
                    }
                  >
                    <option value="">{t.select}</option>
                    <option value="Demo Branch 1">
                      Demo Branch 1
                    </option>
                    <option value="Demo Branch 2">
                      Demo Branch 2
                    </option>
                    <option value="Demo Branch 3">
                      Demo Branch 3
                    </option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 3 && (
            <div className="space-y-6">

              <h3 className="font-semibold">
                {t.reviewTitle}
              </h3>

              <div className="rounded-xl bg-gray-50 p-4">
                <h4 className="mb-3 font-bold">
                  {t.farming}
                </h4>

                <p>
                  {t.land}: {landType}
                </p>

                {crops.map((crop, index) => (
                  <p key={crop.id} className="mt-2 text-sm">
                    {t.crop} {index + 1}: {crop.name}
                    {" — "}
                    {crop.season}
                    {" — "}
                    {crop.area} acres
                  </p>
                ))}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <h4 className="mb-3 font-bold">
                  {t.financial}
                </h4>

                <p>
                  {t.farmIncome}: {money(Number(cropIncome))}
                </p>

                <p className="mt-2">
                  {t.otherIncome}:{" "}
                  {hasOtherIncome === "Yes" ? t.yes : t.no}
                </p>

                {hasOtherIncome === "Yes" &&
                  incomes.map((income) => (
                    <p key={income.id} className="mt-1 text-sm">
                      {income.source}:{" "}
                      {money(Number(income.amount))}
                      {" / "}
                      {income.frequency}
                    </p>
                  ))}

                <p className="mt-3 font-semibold">
                  {t.totalIncome}:{" "}
                  {money(totalAnnualIncome)}
                </p>

                <p className="mt-3">
                  {t.existingLoans}:{" "}
                  {hasExistingLoan === "Yes" ? t.yes : t.no}
                </p>

                {hasExistingLoan === "Yes" &&
                  existingLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="mt-2 text-sm"
                    >
                      <p>{loan.lender}</p>
                      <p>
                        {t.outstanding}:{" "}
                        {money(Number(loan.outstanding))}
                      </p>
                      <p>
                        {t.repayment}:{" "}
                        {money(Number(loan.repayment))}
                        {" / "}
                        {loan.frequency}
                      </p>
                      <p>
                        {t.overdue}: {loan.overdue}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <h4 className="mb-3 font-bold">
                  {t.loan}
                </h4>

                <p>
                  {t.requestedAmount}:{" "}
                  {money(Number(loanAmount))}
                </p>

                <p className="mt-2">
                  {t.purpose}: {t.purposeValue}
                </p>

                <p className="mt-2">
                  {t.selectedBank}: {selectedBank}
                </p>

                <p className="mt-2">
                  {t.branch}: {branch}
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={confirmed}
                    onChange={(e) =>
                      setConfirmed(e.target.checked)
                    }
                  />
                  <span className="text-sm">
                    {t.confirm}
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={consented}
                    onChange={(e) =>
                      setConsented(e.target.checked)
                    }
                  />
                  <span className="text-sm">
                    {t.consent}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          {/* NAVIGATION BUTTONS */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
            <button
              type="button"
              onClick={
                step === 0
                  ? () =>
                      router.push(
                        `/farmer/dashboard?lang=${language}`
                      )
                  : previousStep
              }
              className="rounded-xl border border-gray-300 px-5 py-3 font-medium"
            >
              ← {t.back}
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
              >
                {t.next} →
              </button>
            ) : (
              <button
                type="button"
                disabled={!confirmed || !consented}
                onClick={submitApplication}
                className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.submit}
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function FarmerLoanApplication() {
  return (
    <Suspense fallback={<p>Loading application...</p>}>
      <ApplicationContent />
    </Suspense>
  );
}
