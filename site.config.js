// Central site settings. Change SITE_URL once your domain is connected.
module.exports = {
  name: "AI Prompt Hindi",
  nameHi: "एआई प्रॉम्प्ट हिंदी",
  tagline: "AI प्रॉम्प्ट्स और AI टूल्स की हिंदी गाइड",
  url: process.env.SITE_URL || "https://aiprompthindi.netlify.app",
  lang: "hi-IN",
  locale: "hi_IN",
  author: "AI Prompt Hindi टीम",
  email: "",
  // Paste your GA4 measurement ID and Search Console token when you have them.
  ga4: process.env.GA4_ID || "",
  gscVerification: process.env.GSC_TOKEN || "",
  categories: [
    { slug: "ai-photo-prompts", name: "AI फोटो प्रॉम्प्ट्स", short: "फोटो प्रॉम्प्ट्स", desc: "Gemini, ChatGPT और Meta AI के लिए कॉपी-पेस्ट फोटो एडिटिंग प्रॉम्प्ट्स — कपल, साड़ी, फेस्टिवल और ट्रेंडिंग स्टाइल।" },
    { slug: "ai-video", name: "AI वीडियो", short: "AI वीडियो", desc: "मोबाइल से फ्री में AI वीडियो कैसे बनाएं — Gemini Veo, स्टोरी वीडियो, कार्टून और YouTube के लिए स्टेप-बाय-स्टेप गाइड।" },
    { slug: "chatgpt-gemini", name: "ChatGPT और Gemini", short: "ChatGPT/Gemini", desc: "ChatGPT, Gemini और दूसरे AI चैटबॉट्स को हिंदी में इस्तेमाल करना सीखें।" },
    { slug: "ai-se-kamai", name: "AI से कमाई", short: "AI से कमाई", desc: "AI टूल्स से ऑनलाइन पैसे कमाने के असली और भरोसेमंद तरीके।" },
    { slug: "ai-tools", name: "AI टूल्स", short: "AI टूल्स", desc: "स्टूडेंट्स, क्रिएटर्स और बिज़नेस के लिए बेस्ट फ्री AI टूल्स की हिंदी लिस्ट।" }
  ]
};
