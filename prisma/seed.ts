import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ZAKAH_RULES } from "../src/modules/zakah/rules";
import { INHERITANCE_RULES } from "../src/modules/inheritance/rules";
import { EVIDENCE } from "../src/modules/fiqh/evidences/catalog";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---- Madhhabs ---------------------------------------------------------
  const madhhabs = [
    { key: "HANAFI" as const, nameEn: "Hanafi", nameAr: "الحنفي", nameBn: "হানাফি", enabled: true, sortOrder: 1 },
    { key: "SHAFI" as const, nameEn: "Shafi'i", nameAr: "الشافعي", nameBn: "শাফিঈ", enabled: false, sortOrder: 2 },
    { key: "MALIKI" as const, nameEn: "Maliki", nameAr: "المالكي", nameBn: "মালিকি", enabled: false, sortOrder: 3 },
    { key: "HANBALI" as const, nameEn: "Hanbali", nameAr: "الحنبلي", nameBn: "হানবালি", enabled: false, sortOrder: 4 },
  ];
  const madhhabRecords = new Map<string, { id: string }>();
  for (const m of madhhabs) {
    const record = await prisma.madhhab.upsert({
      where: { key: m.key },
      update: { nameEn: m.nameEn, nameAr: m.nameAr, nameBn: m.nameBn, enabled: m.enabled, sortOrder: m.sortOrder },
      create: m,
      select: { id: true },
    });
    madhhabRecords.set(m.key, record);
  }
  const hanafi = madhhabRecords.get("HANAFI")!;

  // ---- Methodology version ---------------------------------------------
  const version = await prisma.methodologyVersion.upsert({
    where: { madhhabId_version: { madhhabId: hanafi.id, version: "hanafi-v1.0.0" } },
    update: { isActive: true },
    create: {
      madhhabId: hanafi.id,
      version: "hanafi-v1.0.0",
      label: "Hanafi Zakah & Fara'id — v1.0.0",
      description:
        "Initial academic methodology. Rules carry explicit verification statuses and must be reviewed by a qualified scholar.",
      isActive: true,
    },
  });

  // ---- Fiqh rules -------------------------------------------------------
  const allRules = [
    ...Object.values(ZAKAH_RULES).map((r) => ({ ...r, domain: "ZAKAH" as const })),
    ...Object.values(INHERITANCE_RULES).map((r) => ({ ...r, domain: "INHERITANCE" as const })),
  ];
  for (const rule of allRules) {
    await prisma.fiqhRule.upsert({
      where: { ruleId: rule.ruleId },
      update: {
        title: rule.title,
        description: rule.principle,
        verificationStatus: rule.verificationStatus,
        implementationStatus: "IMPLEMENTED",
        versionId: version.id,
        madhhabId: hanafi.id,
      },
      create: {
        ruleId: rule.ruleId,
        madhhabId: hanafi.id,
        versionId: version.id,
        domain: rule.domain,
        title: rule.title,
        description: rule.principle,
        verificationStatus: rule.verificationStatus,
        implementationStatus: "IMPLEMENTED",
        testCases: [],
        notes: rule.note ?? null,
      },
    });
  }

  // ---- Nisab configuration ---------------------------------------------
  const existingNisab = await prisma.nisabConfiguration.findFirst({ where: { versionId: version.id } });
  if (!existingNisab) {
    await prisma.nisabConfiguration.create({
      data: {
        versionId: version.id,
        method: "SILVER",
        goldWeightGrams: 85,
        silverWeightGrams: 595,
        rationale:
          "Classical weights are 20 mithqal of gold and 200 dirhams of silver. Gram conversions and the default valuation method are configurable and must be confirmed against cited sources.",
        verificationStatus: "REFERENCE_REQUIRED",
      },
    });
  }

  // ---- References -------------------------------------------------------
  for (const evidence of Object.values(EVIDENCE)) {
    if (evidence.type === "CLASSICAL" || evidence.type === "CONTEMPORARY" || evidence.type === "INSTITUTIONAL") {
      const exists = await prisma.reference.findFirst({ where: { title: evidence.label } });
      if (!exists) {
        await prisma.reference.create({
          data: {
            type: evidence.type,
            title: evidence.label,
            arabicTitle: evidence.labelAr ?? null,
            author: evidence.author ?? null,
            externalUrl: evidence.sourceUrl ?? null,
            explanationEn: evidence.note ?? null,
            verificationStatus: evidence.verificationStatus,
          },
        });
      }
    }
  }

  // ---- Qur'anic evidence (deduplicated) ---------------------------------
  const quran = [
    {
      surah: "Al-Baqarah", ayahNumber: 43,
      arabicText: "وَأَقِيمُوا۟ ٱلصَّلَوٰةَ وَءَاتُوا۟ ٱلزَّكَوٰةَ وَٱرْكَعُوا۟ مَعَ ٱلرَّٰكِعِينَ",
      translation: "And establish prayer and give zakah and bow with those who bow.",
      principle: "Obligation of zakah alongside prayer.",
      externalUrl: "https://quran.com/2/43",
    },
    {
      surah: "At-Tawbah", ayahNumber: 60,
      arabicText: "إِنَّمَا ٱلصَّدَقَٰتُ لِلْفُقَرَآءِ وَٱلْمَسَٰكِينِ وَٱلْعَٰمِلِينَ عَلَيْهَا وَٱلْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِى ٱلرِّقَابِ وَٱلْغَٰرِمِينَ وَفِى سَبِيلِ ٱللَّهِ وَٱبْنِ ٱلسَّبِيلِ",
      translation: "Zakah expenditures are for the poor, the needy, those employed to collect it, those whose hearts are reconciled, for freeing slaves, for debtors, in the cause of Allah, and for the traveller.",
      principle: "The eight categories of zakah recipients.",
      externalUrl: "https://quran.com/9/60",
    },
    {
      surah: "An-Nisa", ayahNumber: 11,
      arabicText: "يُوصِيكُمُ ٱللَّهُ فِىٓ أَوْلَٰدِكُمْ لِلذَّكَرِ مِثْلُ حَظِّ ٱلْأُنثَيَيْنِ",
      translation: "Allah instructs you concerning your children: for the male, what is equal to the share of two females.",
      principle: "Qur'anic foundation of children's inheritance shares.",
      externalUrl: "https://quran.com/4/11",
    },
    {
      surah: "An-Nisa", ayahNumber: 12,
      arabicText: "وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَٰجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ",
      translation: "And for you is half of what your wives leave if they have no child; but if they have a child, for you is one fourth.",
      principle: "Spousal fixed shares.",
      externalUrl: "https://quran.com/4/12",
    },
  ];
  for (const verse of quran) {
    await prisma.quranicEvidence.upsert({
      where: { surah_ayahNumber: { surah: verse.surah, ayahNumber: verse.ayahNumber } },
      update: { translation: verse.translation, principle: verse.principle, externalUrl: verse.externalUrl },
      create: { ...verse, verificationStatus: "REFERENCE_REQUIRED", translationSource: "To be credited" },
    });
  }

  // ---- Hadith evidence --------------------------------------------------
  const hadiths = [
    {
      collection: "Reported in multiple collections",
      translation: "There is no bequest to an heir.",
      authenticity: "DISPUTED" as const,
      ruling: "Bequests to heirs require the consent of the other heirs.",
      externalUrl: "https://www.dorar.net/",
    },
    {
      collection: "To be verified",
      translation: "The Prophet ﷺ prescribed one fortieth (2.5%) on zakahable wealth.",
      authenticity: "UNVERIFIED" as const,
      ruling: "The standard zakah rate on monetary wealth.",
      externalUrl: "https://sunnah.com/",
    },
  ];
  for (const h of hadiths) {
    const exists = await prisma.hadithEvidence.findFirst({ where: { translation: h.translation } });
    if (!exists) {
      await prisma.hadithEvidence.create({
        data: { ...h, verificationStatus: "REFERENCE_REQUIRED", hadithNumber: null },
      });
    }
  }

  // ---- Fiqh topics (learning center) -----------------------------------
  const topics = buildTopics();
  for (const topic of topics) {
    await prisma.fiqhTopic.upsert({
      where: { slug: topic.slug },
      update: { ...topic, published: true },
      create: { ...topic, published: true },
    });
  }

  console.log(`Seed complete: ${allRules.length} rules, ${topics.length} topics.`);
}

interface TopicSeed {
  slug: string;
  category: string;
  titleAr: string;
  titleEn: string;
  titleBn: string;
  body_en: string;
  body_ar?: string;
  body_bn?: string;
  definition?: string;
  hanafiRuling?: string;
  practicalExample?: string;
  relatedScenario?: string;
  sortOrder: number;
}

function buildTopics(): TopicSeed[] {
  let order = 0;
  const t = (topic: Omit<TopicSeed, "sortOrder">): TopicSeed => ({ ...topic, sortOrder: order++ });
  return [
    t({
      slug: "zakah-definition", category: "ZAKAH",
      titleAr: "تعريف الزكاة", titleEn: "Definition of Zakah", titleBn: "যাকাতের সংজ্ঞা",
      definition:
        "Linguistically, zakah (الزكاة) denotes purification and growth. Technically it is the obligatory annual payment of a specified portion of qualifying wealth to the eligible recipients.",
      body_en:
        "Zakah is the third pillar of Islam and an obligatory act of worship connected to wealth. It purifies the wealth of the payer and supports the needy. It differs from sadaqah, which is voluntary, and from ushr, which is a tithe on agricultural produce. The obligation depends on ownership, reaching Nisab, the passage of Hawl, and the presence of growth or growth potential.",
      hanafiRuling:
        "Zakah is obligatory on a free, Muslim, adult owner of qualifying wealth once Nisab and Hawl are satisfied. The Hanafi school treats gold and silver, including most jewelry, as zakahable.",
      practicalExample: "A person owning cash above the silver Nisab for a full lunar year pays 2.5% of the net amount.",
      relatedScenario: "Use the Zakah Calculator after confirming ownership and Hawl.",
    }),
    t({
      slug: "zakah-conditions", category: "ZAKAH",
      titleAr: "شروط وجوب الزكاة", titleEn: "Conditions for the Obligation of Zakah", titleBn: "যাকাত ওয়াজিব হওয়ার শর্ত",
      definition: "The conditions that must be met before zakah becomes due.",
      body_en:
        "The core conditions are: Islam; freedom; full ownership (ملك); reaching the Nisab; the passage of a lunar year (Hawl) for most assets; and growth or growth potential (النمو). Debts recognised by the methodology may reduce the net wealth before the Nisab comparison.",
      hanafiRuling:
        "The Hanafi school requires Nisab at the beginning and end of the Hawl for monetary assets, and treats growth potential as a condition. Exact applications to modern assets require scholar review.",
    }),
    t({
      slug: "zakah-nisab", category: "ZAKAH",
      titleAr: "النصاب", titleEn: "Nisab (The Threshold)", titleBn: "নিসাব",
      definition: "Nisab is the minimum amount of wealth that makes zakah obligatory.",
      body_en:
        "The classical thresholds are 20 mithqal of gold and 200 dirhams of silver. Their gram equivalents and monetary values differ by source and by market price. The application keeps the classical weight and the contemporary price separate, records the price source and timestamp, and lets the user choose the gold or silver method without claiming universal agreement.",
      hanafiRuling:
        "Classical Hanafi works state the gold and silver weights; contemporary valuation is a separate, configurable step.",
      relatedScenario: "See the Nisab Information page for live/manual valuations.",
    }),
    t({
      slug: "zakah-hawl", category: "ZAKAH",
      titleAr: "الحول", titleEn: "Hawl (The Lunar Year)", titleBn: "হাওল",
      definition: "Hawl is the passage of one Islamic lunar year over qualifying wealth.",
      body_en:
        "The lunar year is approximately 354 days. The application converts dates with a documented tabular calendar and warns that sighting-based calendars may differ by a day. A single collective Hawl is applied to the zakahable wealth; independent cycles per asset are not assumed.",
      hanafiRuling:
        "Wealth must remain above Nisab through the year in the applied methodology. Cases of mid-year fluctuation are refused until a verified rule is added.",
    }),
    t({
      slug: "zakah-gold-silver", category: "ZAKAH",
      titleAr: "الذهب والفضة", titleEn: "Gold and Silver", titleBn: "স্বর্ণ ও রূপা",
      definition: "Gold and silver are the two foundational zakahable metals.",
      body_en:
        "Gold and silver are zakahable at 2.5% of their value or weight-equivalent. The application supports jewelry, investment metal, bars and coins as separate categories, each with its own documented policy and verification status.",
      hanafiRuling:
        "The Hanafi treatment of personal jewelry differs from some other schools and must be confirmed with a cited source before being presented as settled.",
    }),
    t({
      slug: "zakah-cash", category: "ZAKAH",
      titleAr: "النقود والأموال", titleEn: "Cash and Monetary Wealth", titleBn: "নগদ অর্থ",
      definition: "Cash, bank balances and eligible digital money are treated as monetary wealth.",
      body_en:
        "Cash at home, current and savings accounts, foreign currency and eligible digital balances are included at full value after conversion. The conversion-rate source is recorded, and no price is fabricated.",
      hanafiRuling: "Money is zakahable because it is created for growth. Bank and digital balances require contemporary scholar review.",
    }),
    t({
      slug: "zakah-business", category: "ZAKAH",
      titleAr: "عروض التجارة", titleEn: "Business Merchandise", titleBn: "ব্যবসায়িক পণ্য",
      definition: "Goods held for resale are zakahable at their market value.",
      body_en:
        "Merchandise, inventory and business cash are included. Receivables are included only when considered collectible under the documented policy. Doubtful receivables require a separate ruling.",
      hanafiRuling: "Trade goods are valued at market price at the end of the Hawl. Receivable treatment depends on collectibility.",
    }),
    t({
      slug: "zakah-jewelry", category: "ZAKAH",
      titleAr: "زكاة الحلي", titleEn: "Zakah on Jewelry", titleBn: "অলংকারের যাকাত",
      definition: "The ruling on gold and silver jewelry used for adornment.",
      body_en:
        "This is a madhhab-sensitive question. The application records the Hanafi position as requiring verification and does not silently adopt another school's view. Users see the policy and its status before relying on the result.",
      hanafiRuling: "Recorded as NEEDS_REVIEW pending a cited Hanafi source.",
    }),
    t({
      slug: "zakah-debts", category: "ZAKAH",
      titleAr: "الديون", titleEn: "Debts and Deductions", titleBn: "ঋণ",
      definition: "Which liabilities reduce zakahable wealth.",
      body_en:
        "Immediate, due debts and due business liabilities are deductible under the applied methodology. Long-term loans are not deducted in full automatically. Each liability carries a rule ID, a reason and a verification status.",
      hanafiRuling: "Only recognised, currently due obligations are deducted; the treatment of long-term debt requires scholar confirmation.",
    }),
    t({
      slug: "zakah-calculation", category: "ZAKAH",
      titleAr: "حساب الزكاة", titleEn: "How Zakah Is Calculated", titleBn: "যাকাত গণনা",
      definition: "The step-by-step calculation method used by the engine.",
      body_en:
        "The engine classifies assets, deducts eligible liabilities, compares the net wealth to the selected Nisab, evaluates Hawl, and applies 2.5% only when every condition is satisfied. Each step exposes its calculation, principle, reason, evidence and references.",
      relatedScenario: "Every result includes a full eight-step explanation.",
    }),
    t({
      slug: "zakah-recipients", category: "ZAKAH",
      titleAr: "مصارف الزكاة", titleEn: "Categories of Zakah Recipients", titleBn: "যাকাতের প্রাপক",
      definition: "The eight categories named in Surah At-Tawbah 9:60.",
      body_en:
        "The eight categories are the poor, the needy, those employed to collect zakah, those whose hearts are to be reconciled, slaves, debtors, the cause of Allah, and the traveller. Distribution details are a scholarly matter and are not computed by this application.",
      hanafiRuling: "The categories are established by the Qur'an; practical distribution requires qualified guidance.",
    }),
    t({
      slug: "zakah-contemporary", category: "ZAKAH",
      titleAr: "مسائل معاصرة", titleEn: "Contemporary Zakah Questions", titleBn: "সমকালীন যাকাত প্রশ্ন",
      definition: "Modern assets whose treatment is still debated.",
      body_en:
        "Shares, investment funds, crypto-assets, insurance and pension products are not treated identically. The engine refuses categories without a verified rule and returns the mandated scholarly-verification message. This is a correctness feature, not an omission.",
    }),

    t({
      slug: "inheritance-introduction", category: "INHERITANCE",
      titleAr: "الميراث والفرائض", titleEn: "Introduction to Inheritance (Fara'id)", titleBn: "উত্তরাধিকার পরিচিতি",
      definition:
        "Inheritance (الميراث) is the transfer of a deceased person's estate to eligible heirs. Fara'id (الفرائض) is the science of the prescribed shares.",
      body_en:
        "The Qur'an establishes inheritance in Surah An-Nisa. The estate is settled in sequence: funeral expenses, debts, valid bequests, then distribution. The science of Fara'id identifies fixed-share heirs, residuary heirs and distant kindred, and applies exclusion rules.",
      hanafiRuling: "The Hanafi school has distinctive rules for grandfather with siblings, distant kindred and Radd.",
    }),
    t({
      slug: "inheritance-causes", category: "INHERITANCE",
      titleAr: "أسباب الإرث", titleEn: "Causes of Inheritance", titleBn: "উত্তরাধিকারের কারণ",
      definition: "The reasons that create a right to inherit.",
      body_en: "The primary causes are marriage and blood relationship (nasab). The application models spouse, parents, descendants, siblings and grandparents.",
    }),
    t({
      slug: "inheritance-conditions", category: "INHERITANCE",
      titleAr: "شروط الإرث", titleEn: "Conditions of Inheritance", titleBn: "উত্তরাধিকারের শর্ত",
      definition: "Conditions that must hold for inheritance to apply.",
      body_en: "The heir must survive the deceased, the relationship must be established, and no impediment may apply.",
    }),
    t({
      slug: "inheritance-impediments", category: "INHERITANCE",
      titleAr: "موانع الإرث", titleEn: "Impediments to Inheritance", titleBn: "উত্তরাধিকারে বাধা",
      definition: "Factors that prevent inheritance.",
      body_en: "Classical impediments include intentional killing, difference of religion, and slavery. The current engine does not model impediments and treats the supplied heirs as eligible unless excluded by relationship rules.",
    }),
    t({
      slug: "inheritance-fixed-share-heirs", category: "INHERITANCE",
      titleAr: "أصحاب الفروض", titleEn: "Fixed-Share Heirs", titleBn: "নির্ধারিত অংশের ওয়ারিস",
      definition: "Heirs entitled to Qur'anically prescribed fractions.",
      body_en:
        "The fixed fractions are 1/2, 1/4, 1/8, 2/3, 1/3 and 1/6. The engine determines each heir's applicable fraction from the complete family structure, never from a blanket percentage.",
    }),
    t({
      slug: "inheritance-residuary", category: "INHERITANCE",
      titleAr: "العصبات", titleEn: "Residuary Heirs", titleBn: "অবশিষ্টাংশের ওয়ারিস",
      definition: "Heirs who take the remainder after fixed shares.",
      body_en:
        "Residuary heirs include sons, fathers (in some cases), brothers and uncles. The 2:1 male-to-female ratio applies only inside the agnatic residuary group after fixed shares are allocated.",
    }),
    t({
      slug: "inheritance-exclusion", category: "INHERITANCE",
      titleAr: "الحجب", titleEn: "Exclusion (Hajb)", titleBn: "বঞ্চনা (হজব)",
      definition: "Complete or partial removal of an heir.",
      body_en:
        "Complete exclusion (حجب حرمان) removes an heir entirely; partial exclusion (حجب نقصان) reduces a share. The engine emits every exclusion with the causing heir, principle and reference.",
      practicalExample: "A son completely excludes a full brother; two daughters reduce the mother's share to 1/6.",
    }),
    t({
      slug: "inheritance-awl", category: "INHERITANCE",
      titleAr: "العول", titleEn: "Awl (Proportional Reduction)", titleBn: "আওল",
      definition: "Increasing the common denominator when fixed shares exceed the estate.",
      body_en:
        "When fixed shares sum to more than one, the denominator is increased proportionally. Example: husband (1/4) + two daughters (2/3) + mother (1/6) = 13/12, so the base becomes 13.",
      practicalExample: "The engine reports the adjustment and shows each adjusted fraction.",
    }),
    t({
      slug: "inheritance-radd", category: "INHERITANCE",
      titleAr: "الرد", titleEn: "Radd (Return of Surplus)", titleBn: "রাদ্দ",
      definition: "Returning surplus estate to fixed-share heirs when no residuary exists.",
      body_en:
        "When fixed shares sum to less than one and there is no residuary heir, the surplus is returned proportionally. The Hanafi treatment of spouses in Radd is flagged for scholar confirmation.",
    }),
    t({
      slug: "inheritance-grandfather-siblings", category: "INHERITANCE",
      titleAr: "الجد مع الإخوة", titleEn: "Grandfather with Siblings", titleBn: "ভাইদের সাথে দাদা",
      definition: "A distinctive and debated Hanafi scenario.",
      body_en:
        "The Hanafi rule for a grandfather inheriting alongside siblings is nuanced. The current engine refuses this combination and returns the scholarly-verification message rather than guessing.",
    }),
    t({
      slug: "inheritance-distant-kindred", category: "INHERITANCE",
      titleAr: "ذوو الأرحام", titleEn: "Distant Kindred", titleBn: "দূরবর্তী আত্মীয়",
      definition: "Relatives who inherit only when no fixed-share or residuary heir exists.",
      body_en:
        "Distant kindred have detailed Hanafi rules. This category is not yet implemented and is explicitly refused by the engine.",
    }),
    t({
      slug: "inheritance-wasiyyah", category: "INHERITANCE",
      titleAr: "الوصية", titleEn: "Wasiyyah (Bequest)", titleBn: "ওয়াসিয়্যাত",
      definition: "A testamentary bequest from the estate.",
      body_en:
        "A bequest is valid up to one third of the net estate. A bequest to an heir requires the consent of the other heirs. The engine enforces the one-third limit unless consent is confirmed, and flags the remaining details for scholarly review.",
    }),
    t({
      slug: "inheritance-examples", category: "INHERITANCE",
      titleAr: "أمثلة تطبيقية", titleEn: "Distribution Examples", titleBn: "বণ্টনের উদাহরণ",
      definition: "Worked examples illustrating the engine.",
      body_en:
        "Example 1: wife and son — wife 1/8, son 7/8. Example 2: father and mother — mother 1/3, father 2/3. Example 3: husband, two daughters and mother — Awl to a base of 13.",
    }),

    t({
      slug: "principles-usul", category: "PRINCIPLES",
      titleAr: "أصول الفقه", titleEn: "Principles of Islamic Jurisprudence", titleBn: "উসুলুল ফিকহ",
      definition: "The methodology by which rulings are derived from evidence.",
      body_en:
        "Usul al-fiqh studies the sources and methods of deriving rulings. This application does not derive new rulings; it encodes rules already documented in the Hanafi tradition and marks their verification status.",
    }),
    t({
      slug: "principles-evidence", category: "PRINCIPLES",
      titleAr: "الأدلة الشرعية", titleEn: "Evidence Hierarchy", titleBn: "প্রমাণের স্তর",
      definition: "The ordering of Islamic evidence.",
      body_en:
        "Evidence is ordered as Qur'an, authentic Sunnah, consensus, and analogy. The application never presents an unverified hadith as authentic and marks unverified references explicitly.",
    }),
    t({
      slug: "principles-madhhab", category: "PRINCIPLES",
      titleAr: "المذاهب الأربعة", titleEn: "The Four Schools of Law", titleBn: "চার মাযহাব",
      definition: "The recognised Sunni schools of jurisprudence.",
      body_en:
        "The Hanafi, Shafi'i, Maliki and Hanbali schools share core sources but differ in details. Mīzān implements Hanafi only in v1 and never silently applies Hanafi rules while claiming another school. The provider architecture allows future expansion.",
    }),
  ];
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
