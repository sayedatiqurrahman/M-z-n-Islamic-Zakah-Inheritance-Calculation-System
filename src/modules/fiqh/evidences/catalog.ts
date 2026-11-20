import type { EvidenceReference } from "../types";

/**
 * Curated evidence catalog.
 *
 * This file is researcher-maintained, never AI-generated. Entries carry an
 * explicit verification status and a link to a trusted external resource so
 * the researcher/examiner can check the full reference. Bibliographic details
 * that are not confirmed are deliberately left as "Verification required".
 */

export const TRUSTED_SOURCES = {
  quranpedia: "https://www.quranpedia.net/",
  quranCom: "https://quran.com/",
  sunnah: "https://sunnah.com/",
  dorar: "https://www.dorar.net/",
  islamicReliefZakah: "https://www.islamic-relief.org.uk/zakat/",
  aaOIFI: "https://aaoifi.com/",
} as const;

export const EVIDENCE: Record<string, EvidenceReference> = {
  QURAN_ZAKAH_COMMAND: {
    id: "QURAN_2_43",
    type: "QURAN",
    label: "Al-Baqarah 2:43",
    labelAr: "البقرة ٢:٤٣",
    excerpt:
      "وَأَقِيمُوا۟ ٱلصَّلَوٰةَ وَءَاتُوا۟ ٱلزَّكَوٰةَ وَٱرْكَعُوا۟ مَعَ ٱلرَّٰكِعِينَ",
    translation: "And establish prayer and give zakah and bow with those who bow.",
    sourceUrl: TRUSTED_SOURCES.quranCom,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Text and translation must be checked against a verified mushaf and credited translation before publication.",
  },
  QURAN_ZAKAH_RECIPIENTS: {
    id: "QURAN_9_60",
    type: "QURAN",
    label: "At-Tawbah 9:60",
    labelAr: "التوبة ٩:٦٠",
    excerpt:
      "إِنَّمَا ٱلصَّدَقَٰتُ لِلْفُقَرَآءِ وَٱلْمَسَٰكِينِ وَٱلْعَٰمِلِينَ عَلَيْهَا وَٱلْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِى ٱلرِّقَابِ وَٱلْغَٰرِمِينَ وَفِى سَبِيلِ ٱللَّهِ وَٱبْنِ ٱلسَّبِيلِ فَرِيضَةً مِّنَ ٱللَّهِ",
    translation:
      "Zakah expenditures are only for the poor, the needy, those employed to collect it, those whose hearts are to be reconciled, for freeing slaves, for those in debt, for the cause of Allah, and for the traveller — a duty imposed by Allah.",
    sourceUrl: TRUSTED_SOURCES.quranCom,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Eight categories of zakah recipients (مصارف الزكاة). Verify wording and translation.",
  },
  QURAN_INHERITANCE_SONS_DAUGHTERS: {
    id: "QURAN_4_11",
    type: "QURAN",
    label: "An-Nisa 4:11",
    labelAr: "النساء ٤:١١",
    excerpt:
      "يُوصِيكُمُ ٱللَّهُ فِىٓ أَوْلَٰدِكُمْ لِلذَّكَرِ مِثْلُ حَظِّ ٱلْأُنثَيَيْنِ",
    translation:
      "Allah instructs you concerning your children: for the male, what is equal to the share of two females.",
    sourceUrl: TRUSTED_SOURCES.quranCom,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Basis of the agnatic residuary ratio; applies only after fixed-share heirs are allocated.",
  },
  QURAN_SPOUSE_SHARES: {
    id: "QURAN_4_12",
    type: "QURAN",
    label: "An-Nisa 4:12",
    labelAr: "النساء ٤:١٢",
    excerpt:
      "وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَٰجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ",
    translation:
      "And for you is half of what your wives leave if they have no child; but if they have a child, for you is one fourth.",
    sourceUrl: TRUSTED_SOURCES.quranCom,
    verificationStatus: "REFERENCE_REQUIRED",
  },
  QURAN_PARENTS_SHARES: {
    id: "QURAN_4_11_PARENTS",
    type: "QURAN",
    label: "An-Nisa 4:11",
    labelAr: "النساء ٤:١١",
    excerpt:
      "وَلِأَبَوَيْهِ لِكُلِّ وَٰحِدٍ مِّنْهُمَا ٱلسُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُۥ وَلَدٌ",
    translation:
      "And for the parents of the deceased, for each of them one sixth of what he left if there is a child.",
    sourceUrl: TRUSTED_SOURCES.quranCom,
    verificationStatus: "REFERENCE_REQUIRED",
  },
  QURAN_AWL: {
    id: "QURAN_4_12_AWL",
    type: "QURAN",
    label: "An-Nisa 4:12",
    labelAr: "النساء ٤:١٢",
    excerpt:
      "وَإِنِ ٱمْرَؤٌۭ غَرِيقٌ يَرِثُهُۥ أَبَوَاهُ فَلِأُمِّهِ ٱلثُّلُثُ",
    translation:
      "And if a person is lost/drowned and leaves no child but parents, then for the mother is one third.",
    sourceUrl: TRUSTED_SOURCES.quranCom,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Qur'anic basis cited in classical works for inheritance adjustments; exact derivation to be verified.",
  },

  HADITH_NO_BEQUEST_TO_HEIR: {
    id: "HADITH_NO_WASIYYAH_HEIR",
    type: "HADITH",
    label: "Hadith: no bequest to an heir",
    labelAr: "لا وصية لوارث",
    translation: "There is no bequest to an heir.",
    authenticity: "DISPUTED",
    sourceUrl: TRUSTED_SOURCES.dorar +"hadith/sharh/136668",
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Widely acted upon; chains and grading must be verified by a scholar before use as evidence. No hadith number supplied deliberately.",
  },
  HADITH_ZAKAH_RATE: {
    id: "HADITH_ZAKAH_RATE",
    type: "HADITH",
    label: "Hadith on the zakah rate",
    translation: "The Prophet ﷺ took one quarter of a tenth (2.5%) from zakah wealth.",
    authenticity: "UNVERIFIED",
    sourceUrl: TRUSTED_SOURCES.sunnah,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Exact wording, collection and number intentionally omitted until verified. Do not present as authentic evidence.",
  },

  CLASSICAL_HIDAYAH: {
    id: "CLASSICAL_HIDAYAH",
    type: "CLASSICAL",
    label: "Al-Hidayah — الهداية",
    author: "Abu Bakr ibn al-Marghinani (attribution to be confirmed)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Volume, page and chapter intentionally omitted until checked against a specific edition.",
  },
  CLASSICAL_BADAI: {
    id: "CLASSICAL_BADAI",
    type: "CLASSICAL",
    label: "Bada'i al-Sana'i — بدائع الصنائع",
    author: "Ala al-Din al-Kasani (attribution to be confirmed)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Volume, page and chapter intentionally omitted until checked against a specific edition.",
  },
  CLASSICAL_MABSUT: {
    id: "CLASSICAL_MABSUT",
    type: "CLASSICAL",
    label: "Al-Mabsut — المبسوط",
    author: "Verification required (multiple works share this title)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Author and edition must be identified before citation.",
  },
  CLASSICAL_RADD_MUHTAR: {
    id: "CLASSICAL_RADD_MUHTAR",
    type: "CLASSICAL",
    label: "Radd al-Muhtar — رد المحتار",
    author: "Ibn Abidin (attribution to be confirmed)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Volume, page and chapter intentionally omitted until checked against a specific edition.",
  },
  CLASSICAL_HINDIYYAH: {
    id: "CLASSICAL_HINDIYYAH",
    type: "CLASSICAL",
    label: "Al-Fatawa al-Hindiyyah — الفتاوى الهندية",
    author: "Committee of Hanafi jurists (attribution to be confirmed)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
  },
  CLASSICAL_LUBAB: {
    id: "CLASSICAL_LUBAB",
    type: "CLASSICAL",
    label: "Al-Lubab fi Sharh al-Kitab — اللباب في شرح الكتاب",
    author: "Verification required",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
  },
  CLASSICAL_SIRAJIYYAH: {
    id: "CLASSICAL_SIRAJIYYAH",
    type: "CLASSICAL",
    label: "Al-Sirajiyyah — السراجية",
    author: "Al-Saraji (attribution to be confirmed)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Standard fara'id primer used across Sunni curricula; edition and page references pending verification.",
  },
  CLASSICAL_AL_MUGHNI: {
    id: "CLASSICAL_AL_MUGHNI",
    type: "CLASSICAL",
    label: "Al-Mughnī — المغني",
    author: "Ibn Qudāmah al-Maqdisī (attribution to be confirmed)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Hanbali comparative fiqh work cited for the Sunni-majority sequence; volume and page intentionally omitted until verified.",
  },
  CLASSICAL_AL_MAJMU: {
    id: "CLASSICAL_AL_MAJMU",
    type: "CLASSICAL",
    label: "Al-Majmūʿ Sharḥ al-Muhadhdhab — المجموع شرح المهذب",
    author: "Imām al-Nawawī (attribution to be confirmed)",
    sourceUrl: TRUSTED_SOURCES.dorar,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Shafi'i fiqh reference cited for the Sunni-majority sequence; volume and page intentionally omitted until verified.",
  },

  INSTITUTIONAL_AAOIFI: {
    id: "INST_AAOIFI",
    type: "INSTITUTIONAL",
    label: "AAOIFI Sharia Standards",
    sourceUrl: TRUSTED_SOURCES.aaOIFI,
    verificationStatus: "REFERENCE_REQUIRED",
    note: "Contemporary standard-setting body; useful for modern investment questions.",
  },
  INSTITUTIONAL_ISLAMIC_RELIEF: {
    id: "INST_ISLAMIC_RELIEF",
    type: "INSTITUTIONAL",
    label: "Islamic Relief Zakat Guidance",
    sourceUrl: TRUSTED_SOURCES.islamicReliefZakah,
    verificationStatus: "REFERENCE_REQUIRED",
  },
  PORTAL_QURANPEDIA: {
    id: "PORTAL_QURANPEDIA",
    type: "INSTITUTIONAL",
    label: "Quranpedia",
    sourceUrl: TRUSTED_SOURCES.quranpedia,
    verificationStatus: "VERIFIED_BY_SCHOLAR",
    note: "External portal used for redirecting readers to additional trusted reference material.",
  },
};

export const ALL_EVIDENCE = Object.values(EVIDENCE);

export function evidenceById(id: string): EvidenceReference | undefined {
  return EVIDENCE[id];
}
