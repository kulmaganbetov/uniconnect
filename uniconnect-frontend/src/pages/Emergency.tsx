import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface EmergencyNumber {
  service: string;
  number: string;
  description: string;
  icon: string;
  color: string;
}

interface Embassy {
  country: string;
  flag: string;
  phone: string;
  email?: string;
  address: string;
  hours?: string;
}

interface LegalHelp {
  name: string;
  type: string;
  phone: string;
  email?: string;
  website?: string;
  description: string;
  languages: string[];
  example: string;
}

const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    service: "Ambulance",
    number: "103",
    description:
      "Medical emergency — free of charge nationwide. Call immediately for serious illness, accidents, or injuries.",
    icon: "🚑",
    color: "from-red-500 to-red-700",
  },
  {
    service: "Police",
    number: "102",
    description:
      "Crime, theft, assault, or any public safety emergency. English-speaking operators may be limited.",
    icon: "👮",
    color: "from-blue-500 to-blue-700",
  },
  {
    service: "Fire Service",
    number: "101",
    description:
      "Fire, gas leak, or chemical hazard. Also handles rescue operations.",
    icon: "🚒",
    color: "from-orange-500 to-red-600",
  },
  {
    service: "Unified Emergency",
    number: "112",
    description:
      "Single number for all emergencies — works from any phone, including without SIM card or credit.",
    icon: "🆘",
    color: "from-primary to-red-700",
  },
  {
    service: "Gas Emergency",
    number: "104",
    description:
      "Gas leaks, gas smell, or any gas-related problem in your apartment or dormitory.",
    icon: "⛽",
    color: "from-yellow-500 to-orange-600",
  },
  {
    service: "Anti-Corruption Hotline",
    number: "1424",
    description:
      "Report bribery, extortion, or corruption by officials — free and anonymous.",
    icon: "⚖️",
    color: "from-purple-500 to-purple-700",
  },
];

const EMBASSIES: Embassy[] = [
  {
    country: "India",
    flag: "🇮🇳",
    phone: "+7 (7172) 925-717",
    email: "amb.astana@mea.gov.in",
    address: "Embassy of India, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–17:30",
  },
  {
    country: "China",
    flag: "🇨🇳",
    phone: "+7 (7172) 793-863",
    email: "chinaemb_kz@mfa.gov.cn",
    address: "Embassy of the PRC, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–18:00",
  },
  {
    country: "Pakistan",
    flag: "🇵🇰",
    phone: "+7 (7172) 249-343",
    email: "parepastana@mofa.gov.pk",
    address: "Embassy of Pakistan, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–17:00",
  },
  {
    country: "Turkey",
    flag: "🇹🇷",
    phone: "+7 (7172) 702-090",
    email: "embassy.astana@mfa.gov.tr",
    address: "Embassy of Türkiye, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–18:00",
  },
  {
    country: "Egypt",
    flag: "🇪🇬",
    phone: "+7 (7172) 240-494",
    email: "egyembassy.astana@mfa.gov.eg",
    address: "Embassy of Egypt, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–16:00",
  },
  {
    country: "Uzbekistan",
    flag: "🇺🇿",
    phone: "+7 (727) 291-0235",
    email: "almaty@mfa.uz",
    address: "Consulate General of Uzbekistan, Almaty",
    hours: "Mon–Fri 09:00–18:00",
  },
  {
    country: "Russia",
    flag: "🇷🇺",
    phone: "+7 (727) 274-5864",
    email: "almaty@mid.ru",
    address: "Consulate General of Russia, Almaty",
    hours: "Mon–Fri 09:00–18:00",
  },
  {
    country: "Afghanistan",
    flag: "🇦🇫",
    phone: "+7 (7172) 247-843",
    email: "astana@mfa.af",
    address: "Embassy of Afghanistan, Astana",
    hours: "Mon–Fri 09:00–17:00",
  },
  {
    country: "USA",
    flag: "🇺🇸",
    phone: "+7 (7172) 702-100",
    email: "USAAstana@state.gov",
    address: "U.S. Embassy, Astana, Kazakhstan",
    hours: "Mon–Fri 08:30–17:30",
  },
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    phone: "+7 (7172) 556-200",
    email: "BritishEmbassy.Astana@fco.gov.uk",
    address: "British Embassy, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–17:30",
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    phone: "+7 (7172) 791-200",
    email: "info@astana.diplo.de",
    address: "German Embassy, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–17:00",
  },
  {
    country: "Republic of Korea",
    flag: "🇰🇷",
    phone: "+7 (7172) 925-500",
    email: "kzemb@mofa.go.kr",
    address: "Embassy of Korea, Astana, Kazakhstan",
    hours: "Mon–Fri 09:00–18:00",
  },
];

const LEGAL_HELP: LegalHelp[] = [
  {
    name: "Migration Service of Kazakhstan",
    type: "Government",
    phone: "+7 (727) 254-4444",
    website: "gov.kz/memleket/entities/migration",
    description:
      "Official migration service handling student visas, registration, residence permits, and work authorization for foreigners.",
    languages: ["Kazakh", "Russian", "English (limited)"],
    example:
      "Example: If your student visa is about to expire, contact them at least 14 days in advance to start the extension process. Bring your passport, admission letter from Narxoz, and proof of payment for state duty.",
  },
  {
    name: "Kazakhstan International Bureau for Human Rights",
    type: "NGO",
    phone: "+7 (727) 378-3474",
    email: "kibhr@bureau.kz",
    website: "bureau.kz",
    description:
      "Independent NGO providing free legal consultations to foreigners on human rights, discrimination, and refugee issues.",
    languages: ["Kazakh", "Russian", "English"],
    example:
      "Example: If you believe you were denied housing or a job due to your nationality, they can help you file a discrimination complaint and represent you in court free of charge.",
  },
  {
    name: "UNHCR Kazakhstan",
    type: "UN Agency",
    phone: "+7 (727) 258-2643",
    email: "kazal@unhcr.org",
    website: "unhcr.org/kz",
    description:
      "UN Refugee Agency — provides legal assistance to refugees, asylum seekers, and stateless persons.",
    languages: ["Russian", "English", "French"],
    example:
      "Example: If you're a student from a conflict zone and fear returning home after graduation, UNHCR can help you understand your asylum options and connect you with a legal partner.",
  },
  {
    name: "Narxoz University Legal Clinic",
    type: "University",
    phone: "+7 (727) 377-1111",
    email: "legal@narxoz.kz",
    description:
      "On-campus free legal aid for Narxoz students — assistance with rental disputes, visa problems, consumer rights, and employment contracts.",
    languages: ["Kazakh", "Russian", "English"],
    example:
      "Example: Your landlord refuses to return your deposit after you move out of a rented apartment. The legal clinic can draft a formal claim letter and guide you through small-claims court if needed.",
  },
  {
    name: "Free Legal Aid Hotline (1414)",
    type: "Government",
    phone: "1414",
    description:
      "State-funded legal aid hotline for all residents of Kazakhstan, including foreign students. Free initial consultation.",
    languages: ["Kazakh", "Russian"],
    example:
      "Example: You received a traffic ticket you believe is unfair. Call 1414 to get free advice on how to appeal it and what documents you need.",
  },
  {
    name: "ADAMDAR / AdilSoz Foundation",
    type: "NGO",
    phone: "+7 (727) 292-9077",
    email: "info@adilsoz.kz",
    website: "adilsoz.kz",
    description:
      "Civil liberties foundation assisting students and foreigners with freedom of expression, media, and academic freedom issues.",
    languages: ["Kazakh", "Russian", "English"],
    example:
      "Example: You were detained for participating in a peaceful campus discussion. Adil Soz can connect you with a lawyer and help document any rights violations.",
  },
];

export default function Emergency() {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const copyNumber = (num: string) => {
    navigator.clipboard?.writeText(num).then(() => {
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 1500);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-900 via-primary to-red-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-20 w-48 h-48 rounded-full bg-yellow-300 blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
            <div className="flex items-start gap-5">
              <div className="hidden sm:flex flex-shrink-0 w-20 h-20 rounded-2xl bg-white/15 backdrop-blur items-center justify-center shadow-xl ring-4 ring-white/20">
                <span className="text-5xl">🆘</span>
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest mb-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                  Emergency · 24/7
                </span>
                <h1 className="text-white text-4xl md:text-5xl font-extrabold leading-tight">
                  SOS — Emergency Help
                </h1>
                <p className="text-white/90 mt-3 max-w-3xl text-lg">
                  If you or someone around you is in immediate danger, don't
                  wait. Use the numbers below. All emergency services in
                  Kazakhstan are free and answer 24 hours a day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Big SOS call buttons */}
        <section className="py-10 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <h2 className="text-2xl md:text-3xl font-bold text-navy">
                Call immediately
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {EMERGENCY_NUMBERS.map((e) => (
                <div
                  key={e.service}
                  className={`rounded-xl bg-gradient-to-br ${e.color} text-white p-6 shadow-lg hover:shadow-2xl transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{e.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur rounded-full px-2.5 py-1">
                      24/7
                    </span>
                  </div>
                  <div className="text-white/90 text-xs uppercase tracking-widest font-bold mb-1">
                    {e.service}
                  </div>
                  <a
                    href={`tel:${e.number}`}
                    className="text-5xl md:text-6xl font-extrabold block leading-none mb-3 hover:underline"
                  >
                    {e.number}
                  </a>
                  <p className="text-sm text-white/90 leading-relaxed mb-4">
                    {e.description}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${e.number}`}
                      className="flex-1 bg-white text-text-dark font-bold text-sm text-center py-2.5 rounded hover:bg-gray-100 transition-colors"
                    >
                      Call now
                    </a>
                    <button
                      onClick={() => copyNumber(e.number)}
                      className="bg-white/20 backdrop-blur hover:bg-white/30 text-white font-semibold text-sm px-4 py-2.5 rounded transition-colors"
                      aria-label="Copy number"
                    >
                      {copiedNumber === e.number ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Embassies */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl md:text-3xl font-bold text-navy">
                Embassies & consulates
              </h2>
            </div>
            <p className="text-muted mb-6 max-w-3xl">
              Your embassy is your most trusted contact if you lose your
              passport, need legal support from your home country, or face a
              serious personal emergency abroad.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {EMBASSIES.map((emb) => (
                <div
                  key={emb.country}
                  className="card p-5 hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{emb.flag}</span>
                    <div>
                      <h3 className="font-bold text-navy text-lg leading-tight">
                        {emb.country}
                      </h3>
                      {emb.hours && (
                        <div className="text-xs text-muted mt-0.5">
                          {emb.hours}
                        </div>
                      )}
                    </div>
                  </div>
                  <dl className="text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <dt className="text-muted text-xs uppercase font-semibold w-14 flex-shrink-0 mt-0.5">
                        Phone
                      </dt>
                      <dd>
                        <a
                          href={`tel:${emb.phone.replace(/\s/g, "")}`}
                          className="text-primary hover:underline font-semibold"
                        >
                          {emb.phone}
                        </a>
                      </dd>
                    </div>
                    {emb.email && (
                      <div className="flex items-start gap-2">
                        <dt className="text-muted text-xs uppercase font-semibold w-14 flex-shrink-0 mt-0.5">
                          Email
                        </dt>
                        <dd>
                          <a
                            href={`mailto:${emb.email}`}
                            className="text-primary hover:underline break-all text-xs"
                          >
                            {emb.email}
                          </a>
                        </dd>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <dt className="text-muted text-xs uppercase font-semibold w-14 flex-shrink-0 mt-0.5">
                        Address
                      </dt>
                      <dd className="text-text-dark text-xs leading-snug">
                        {emb.address}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 rounded p-4 text-sm text-yellow-900">
              <strong className="font-bold">Don't see your country?</strong>{" "}
              Check the full list at{" "}
              <span className="font-mono">gov.kz/memleket/entities/mfa</span>{" "}
              or call 112 and ask the operator to connect you with the nearest
              consulate.
            </div>
          </div>
        </section>

        {/* Legal Help */}
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
              <h2 className="text-2xl md:text-3xl font-bold text-navy">
                Legal help for foreign students
              </h2>
            </div>
            <p className="text-muted mb-6 max-w-3xl">
              You have rights in Kazakhstan — regardless of your citizenship.
              These organizations offer free or low-cost legal assistance in
              multiple languages.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {LEGAL_HELP.map((item) => (
                <div key={item.name} className="card p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-navy text-lg leading-tight">
                        {item.name}
                      </h3>
                      <span className="badge-red text-[10px] mt-1.5 inline-block">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-text-dark mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="bg-bg-light rounded-md p-4 mb-4 border-l-4 border-primary">
                    <div className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
                      Real-world example
                    </div>
                    <p className="text-xs text-text-dark leading-relaxed">
                      {item.example}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.languages.map((lang) => (
                      <span
                        key={lang}
                        className="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-700 rounded-full px-2.5 py-1 font-semibold"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted text-xs uppercase font-semibold w-16">
                        Phone
                      </span>
                      <a
                        href={`tel:${item.phone.replace(/\s/g, "")}`}
                        className="text-primary hover:underline font-semibold"
                      >
                        {item.phone}
                      </a>
                    </div>
                    {item.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted text-xs uppercase font-semibold w-16">
                          Email
                        </span>
                        <a
                          href={`mailto:${item.email}`}
                          className="text-primary hover:underline text-xs break-all"
                        >
                          {item.email}
                        </a>
                      </div>
                    )}
                    {item.website && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted text-xs uppercase font-semibold w-16">
                          Website
                        </span>
                        <span className="text-text-dark text-xs">
                          {item.website}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety tips */}
        <section className="py-12 bg-bg-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Stay safe — quick tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: "📱",
                  title: "Save numbers offline",
                  body: "Store 102, 103, and your embassy contact in your phone before you need them.",
                },
                {
                  icon: "📍",
                  title: "Share your location",
                  body: "Send your live location to a trusted friend when going to new places at night.",
                },
                {
                  icon: "🪪",
                  title: "Carry ID copies",
                  body: "Keep a photocopy or digital scan of your passport and visa separately from the originals.",
                },
                {
                  icon: "🗣️",
                  title: "Learn key phrases",
                  body: "Know how to say 'Help', 'Police', and 'I need a doctor' in Russian or Kazakh.",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="bg-white rounded-md p-5 border-l-4 border-primary shadow-sm"
                >
                  <div className="text-3xl mb-2">{tip.icon}</div>
                  <h3 className="font-bold text-navy mb-1">{tip.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {tip.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs text-muted">
              Contact information is provided for convenience and may change.
              In a life-threatening emergency always dial{" "}
              <a
                href="tel:112"
                className="text-primary font-bold hover:underline"
              >
                112
              </a>{" "}
              first. UniConnect is not a substitute for professional emergency
              services.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
