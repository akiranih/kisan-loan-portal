
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "farmer" | "bank" | "government";
type Language = "en" | "hi" | "kn" | "ta" | "te" | "ml";

const translations = {
  en: {
    welcome: "Welcome to Kisan Loan Portal",
    subtitle: "Select how you would like to continue",
    farmer: "Farmer",
    farmerDesc: "Apply for loans and track applications",
    bank: "Bank Officer",
    bankDesc: "Review and process loan applications",
    government: "Government Officer",
    governmentDesc: "Monitor agricultural loan distribution",
    continue: "Continue",
  },
  hi: {
    welcome: "किसान ऋण पोर्टल में आपका स्वागत है",
    subtitle: "आगे बढ़ने के लिए अपना विकल्प चुनें",
    farmer: "किसान",
    farmerDesc: "ऋण के लिए आवेदन करें और स्थिति देखें",
    bank: "बैंक अधिकारी",
    bankDesc: "ऋण आवेदनों की समीक्षा करें",
    government: "सरकारी अधिकारी",
    governmentDesc: "कृषि ऋण वितरण की निगरानी करें",
    continue: "आगे बढ़ें",
  },
  kn: {
    welcome: "ಕಿಸಾನ್ ಸಾಲ ಪೋರ್ಟಲ್‌ಗೆ ಸ್ವಾಗತ",
    subtitle: "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ",
    farmer: "ರೈತ",
    farmerDesc: "ಸಾಲಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಮತ್ತು ಸ್ಥಿತಿ ನೋಡಿ",
    bank: "ಬ್ಯಾಂಕ್ ಅಧಿಕಾರಿ",
    bankDesc: "ಸಾಲದ ಅರ್ಜಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
    government: "ಸರ್ಕಾರಿ ಅಧಿಕಾರಿ",
    governmentDesc: "ಕೃಷಿ ಸಾಲ ವಿತರಣೆಯನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ",
    continue: "ಮುಂದುವರಿಸಿ",
  },
  ta: {
    welcome: "விவசாயக் கடன் தளத்திற்கு வரவேற்கிறோம்",
    subtitle: "தொடர உங்கள் விருப்பத்தைத் தேர்ந்தெடுக்கவும்",
    farmer: "விவசாயி",
    farmerDesc: "கடனுக்கு விண்ணப்பித்து நிலையை அறியவும்",
    bank: "வங்கி அலுவலர்",
    bankDesc: "கடன் விண்ணப்பங்களைச் சரிபார்க்கவும்",
    government: "அரசு அலுவலர்",
    governmentDesc: "விவசாயக் கடன் விநியோகத்தைக் கண்காணிக்கவும்",
    continue: "தொடரவும்",
  },
  te: {
    welcome: "రైతు రుణ పోర్టల్‌కు స్వాగతం",
    subtitle: "కొనసాగడానికి మీ ఎంపికను ఎంచుకోండి",
    farmer: "రైతు",
    farmerDesc: "రుణానికి దరఖాస్తు చేసి స్థితిని చూడండి",
    bank: "బ్యాంకు అధికారి",
    bankDesc: "రుణ దరఖాస్తులను పరిశీలించండి",
    government: "ప్రభుత్వ అధికారి",
    governmentDesc: "వ్యవసాయ రుణ పంపిణీని పర్యవేక్షించండి",
    continue: "కొనసాగించండి",
  },
  ml: {
    welcome: "കർഷക വായ്പാ പോർട്ടലിലേക്ക് സ്വാഗതം",
    subtitle: "തുടരാൻ നിങ്ങളുടെ വിഭാഗം തിരഞ്ഞെടുക്കുക",
    farmer: "കർഷകൻ",
    farmerDesc: "വായ്പയ്ക്ക് അപേക്ഷിച്ച് നില പരിശോധിക്കുക",
    bank: "ബാങ്ക് ഉദ്യോഗസ്ഥൻ",
    bankDesc: "വായ്പാ അപേക്ഷകൾ പരിശോധിക്കുക",
    government: "സർക്കാർ ഉദ്യോഗസ്ഥൻ",
    governmentDesc: "കാർഷിക വായ്പാ വിതരണം നിരീക്ഷിക്കുക",
    continue: "തുടരുക",
  },
};

export default function Home() {
  const router = useRouter();

  const [language, setLanguage] = useState<Language>("en");
  const [role, setRole] = useState<Role>("farmer");

  const t = translations[language];

  const roles: {
    id: Role;
    icon: string;
    title: string;
    description: string;
  }[] = [
    {
      id: "farmer",
      icon: "🌾",
      title: t.farmer,
      description: t.farmerDesc,
    },
    {
      id: "bank",
      icon: "🏦",
      title: t.bank,
      description: t.bankDesc,
    },
    {
      id: "government",
      icon: "🏛️",
      title: t.government,
      description: t.governmentDesc,
    },
  ];

  return (
    <main className="min-h-screen bg-green-50 text-gray-900 flex items-center justify-center p-5">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg p-6 sm:p-10">

        <div className="flex items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span className="font-bold text-green-800">
              Kisan Loan Portal
            </span>
          </div>

          <select
            aria-label="Select language"
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value as Language)
            }
            className="border rounded-lg p-2 text-sm bg-white"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="ml">മലയാളം</option>
          </select>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          {t.welcome}
        </h1>

        <p className="text-gray-600 text-center mb-8">
          {t.subtitle}
        </p>

        <div className="space-y-4">
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              aria-pressed={role === item.id}
              className={`w-full text-left border-2 rounded-2xl p-5 flex items-center gap-4 transition ${
                role === item.id
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <span className="text-3xl">{item.icon}</span>

              <div className="flex-1">
                <h2 className="font-semibold text-lg">
                  {item.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {item.description}
                </p>
              </div>

              <span className="text-green-700 text-xl">
                {role === item.id ? "✓" : ""}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/${role}/login?lang=${language}`
            )
          }
          className="w-full mt-8 bg-green-700 text-white rounded-xl py-4 font-semibold hover:bg-green-800 transition"
        >
          {t.continue} →
        </button>

      </div>
    </main>
  );
}
