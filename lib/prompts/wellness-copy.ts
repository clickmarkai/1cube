export const wellnessCopyPrompts = {
  transformation: {
    id: `Create wellness product copy focusing on transformation stories.
    Product: {productName}
    Category: {category}
    Key Benefits: {benefits}
    
    Guidelines:
    - Start with relatable problem
    - Show transformation journey
    - Include timeline (14 days, 30 days, etc.)
    - Add social proof
    - End with clear CTA
    - Avoid miracle claims
    - Include emoji strategically`,
    
    en: `Create wellness product copy focusing on transformation stories.
    Product: {productName}
    Category: {category}
    Key Benefits: {benefits}
    
    Guidelines:
    - Start with relatable problem
    - Show transformation journey
    - Include timeline (14 days, 30 days, etc.)
    - Add social proof
    - End with clear CTA
    - Avoid miracle claims
    - Include emoji strategically`
  },

  community: {
    id: `Buat copy produk wellness yang fokus pada community building.
    Produk: {productName}
    Kategori: {category}
    Manfaat Utama: {benefits}
    
    Panduan:
    - Gunakan kata "kita", "bersama", "komunitas"
    - Highlight pengalaman bersama
    - Ajak join movement
    - Pakai testimoni lokal
    - Tambah hashtag community
    - Hindari klaim medis
    - Gunakan bahasa yang inclusive`,
    
    en: `Create wellness product copy focusing on community building.
    Product: {productName}
    Category: {category}
    Key Benefits: {benefits}
    
    Guidelines:
    - Use "we", "together", "community"
    - Highlight shared experiences
    - Invite to join movement
    - Include local testimonials
    - Add community hashtags
    - Avoid medical claims
    - Use inclusive language`
  },

  routine: {
    id: `Buat copy produk wellness yang fokus pada daily routine.
    Produk: {productName}
    Kategori: {category}
    Manfaat Utama: {benefits}
    
    Panduan:
    - Jelaskan kapan & bagaimana pakai
    - Buat routine yang mudah diikuti
    - Gunakan "pagi", "siang", "malam"
    - Kaitkan dengan aktivitas sehari-hari
    - Beri tips konsistensi
    - Tambah reminder gentle
    - Pakai emoji waktu ⏰🌅🌙`,
    
    en: `Create wellness product copy focusing on daily routines.
    Product: {productName}
    Category: {category}
    Key Benefits: {benefits}
    
    Guidelines:
    - Explain when & how to use
    - Create easy-to-follow routine
    - Use morning/afternoon/evening
    - Link to daily activities
    - Give consistency tips
    - Add gentle reminders
    - Use time emojis ⏰🌅🌙`
  },

  bundle: {
    id: `Buat copy untuk bundle produk wellness.
    Bundle: {bundleName}
    Produk: {products}
    Harga Normal: {originalPrice}
    Harga Bundle: {bundlePrice}
    
    Panduan:
    - Jelaskan sinergi produk
    - Highlight value/hemat
    - Buat FOMO yang natural
    - Gunakan "paket lengkap"
    - Tambah bonus/gift
    - Batas waktu promo
    - CTA yang urgent tapi friendly`,
    
    en: `Create copy for wellness product bundle.
    Bundle: {bundleName}
    Products: {products}
    Original Price: {originalPrice}
    Bundle Price: {bundlePrice}
    
    Guidelines:
    - Explain product synergy
    - Highlight value/savings
    - Create natural FOMO
    - Use "complete package"
    - Add bonus/gift
    - Limited time offer
    - Urgent but friendly CTA`
  }
};

export const complianceChecks = [
  // Indonesian
  { pattern: /sembuh|cure|menyembuhkan/gi, risk: 'high', suggestion: 'Ganti dengan "membantu pemulihan" atau "mendukung kesehatan"' },
  { pattern: /obat|medicine|drug/gi, risk: 'high', suggestion: 'Gunakan "suplemen" atau "nutrisi"' },
  { pattern: /dokter bilang|doctor approved/gi, risk: 'medium', suggestion: 'Gunakan "berdasarkan penelitian" atau "teruji klinis"' },
  { pattern: /100%|pasti|guaranteed/gi, risk: 'medium', suggestion: 'Gunakan "dapat membantu" atau "berpotensi"' },
  { pattern: /tanpa efek samping|no side effects/gi, risk: 'high', suggestion: 'Hapus atau ganti dengan "aman untuk penggunaan rutin"' },
  
  // English
  { pattern: /heal|healing|heals/gi, risk: 'high', suggestion: 'Replace with "supports recovery" or "promotes wellness"' },
  { pattern: /treat|treatment|treats/gi, risk: 'high', suggestion: 'Use "supports" or "helps maintain"' },
  { pattern: /prevent|prevents|prevention/gi, risk: 'medium', suggestion: 'Use "may help reduce risk" or "supports"' },
  { pattern: /clinical|clinically/gi, risk: 'low', suggestion: 'Ensure you have evidence to support claims' },
];

export function checkCompliance(text: string): Array<{text: string, risk: string, suggestion: string}> {
  const issues: Array<{text: string, risk: string, suggestion: string}> = [];
  
  complianceChecks.forEach(check => {
    const matches = text.match(check.pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          text: match,
          risk: check.risk,
          suggestion: check.suggestion
        });
      });
    }
  });
  
  return issues;
}

export const trendingAngles = [
  {
    name: "Morning Routine",
    score: 92,
    description: "Focus on morning wellness rituals",
    keywords: ["morning", "routine", "ritual", "start your day", "pagi hari"]
  },
  {
    name: "Glow From Within",
    score: 88,
    description: "Inner health reflects outer beauty",
    keywords: ["glow", "radiant", "from within", "inner beauty", "cantik alami"]
  },
  {
    name: "30-Day Challenge",
    score: 85,
    description: "Transformation with timeline commitment",
    keywords: ["30 days", "challenge", "transformation", "before after", "tantangan"]
  },
  {
    name: "Self-Care Sunday",
    score: 82,
    description: "Weekly self-care ritual positioning",
    keywords: ["self-care", "me time", "sunday", "weekend", "rawat diri"]
  },
  {
    name: "Busy Mom Solution",
    score: 80,
    description: "Quick wellness for busy mothers",
    keywords: ["busy mom", "ibu sibuk", "praktis", "quick", "simple"]
  }
];