import type { LocalizedText } from "@/lib/i18n";

export interface TopicTranslations {
  definition?: LocalizedText;
  body?: LocalizedText;
  ruling?: LocalizedText;
  example?: LocalizedText;
  scenario?: LocalizedText;
}

/**
 * Slug-keyed localized learning content for the Fiqh learning center.
 * English values come from the seeded database rows; Arabic values are the
 * classical Arabic rendering and Bangla values are the Bengali translation.
 * Items that are unverified or refused are marked as such inside the text.
 */
export const TOPIC_TRANSLATIONS: Record<string, TopicTranslations> = {
  "zakah-definition": {
    definition: {
      en: "Linguistically, zakah (الزكاة) denotes purification and growth. Technically it is the obligatory annual payment of a specified portion of qualifying wealth to the eligible recipients.",
      ar: "الزكاة لغةً تعني التطهير والنماء. وتعني شرعًا الزكاة الواجبة سنويًّا على جزء محدد من المال المستحق من أهل الملک.",
      bn: "যাকাতের শাব্দিক অর্থ হলো পরিচ্ছন্নতা ও বৃদ্ধি; বিধিগত অর্থে এটি নির্দিষ্ট পরিমাণ যাকাতযোগ্য সম্পদ বণ্টনের আবশ্যক বছরিক কর্তব্য।",
    },
    body: {
      en: "Zakah is the third pillar of Islam and an obligatory act of worship connected to wealth. It purifies the wealth of the payer and supports the needy. It differs from sadaqah, which is voluntary, and from ushr, which is a tithe on agricultural produce. The obligation depends on ownership, reaching Nisab, the passage of Hawl, and the presence of growth or growth potential.",
      ar: "الزكاة ركن من أركان الإسلام وهي فعل عبادي واجب مرتبط بالمال. وهي تطهير للثروة ودعم للمحتاجين. وتبتعد عن الصدقة الطوعية عن العُشر، الذي هو زكاة زرع. وترتبط الوجوب بالملکية والوصول إلى النصاب ومرور الحول والنماء.",
      bn: "যাকাত ইসলামের তৃতীয় স্তম্ভ এবং সম্পদের সাথে যুক্ত একটি আবশ্যক ইবাদত। এটি যাকাতদাতার সম্পদ পবিত্র করে এবং অভাবীদের সহায়তা করে। এটি স্বেচ্ছামূলক সাদাকাহ থেকে ভিন্ন এবং কৃষি উৎপাদনের উশর থেকেও ভিন্ন।",
    },
    ruling: {
      en: "Zakah is obligatory on a free, Muslim, adult owner of qualifying wealth once Nisab and Hawl are satisfied. The Hanafi school treats gold and silver, including most jewelry, as zakahable.",
      ar: "الزكاة واجبة على المالك الحر المسلم البالغ التام من الأموال المستحقة إذا تحقق النصاب والحول. والمذهب الحنفي يعد الذهب والفضة ومنها أغلب الحلي زكاة.",
      bn: "যাকাত স্বাধীন, মুসলিম, প্রাপ্তবয়স্ক এবং যাকাতযোগ্য সম্পদের পূর্ণ মালিকের উপর আবশ্যক; হানাফি মাজহাব স্বর্ণ ও রূপাসহ বেশিরভাগ অলংকারকে যাকাতযোগ্য গণ্য করে।",
    },
    example: {
      en: "A person owning cash above the silver Nisab for a full lunar year pays 2.5% of the net amount.",
      ar: "من يملك نقدًا فوق النصاب الفضلي لسنة قمرية كاملة يزكي 2.5% من المبلغ الصافي.",
      bn: "যে ব্যক্তি সম্পূর্ণ চান্দ্র বছর ধরে রূপাভিত্তিক নিসাবের উপর নগদের মালিক তিনি ২.৫% নিট অঙ্ক যাকাত করেন।",
    },
    scenario: {
      en: "Use the Zakah Calculator after confirming ownership and Hawl.",
      ar: "استخدم حاسبة الزكاة بعد التأكد من الملكية والحول.",
      bn: "মালিকানা ও হাওল নিশ্চিত করার পর যাকাত ক্যালকুলেটর ব্যবহার করুন।",
    },
  },
  "zakah-conditions": {
    definition: {
      en: "The conditions that must be met before zakah becomes due.",
      ar: "الشروط التي يجب توافرها قبل وجوب الزكاة.",
      bn: "যাকাত কর্তব্য হওয়ার আগে যে শর্তগুলো পূরণ হওয়া দরকার।",
    },
    body: {
      en: "The core conditions are: Islam; freedom; full ownership (ملك); reaching the Nisab; the passage of a lunar year (Hawl) for most assets; and growth or growth potential (النمو). Debts recognised by the methodology may reduce the net wealth before the Nisab comparison.",
      ar: "الشروط الأساسية: الإسلام والحرية والملكية التامة والوصول إلى النصاب ومرور الحول على معظم الأموال والنماء. وقد تُقلل الديون المعترف بها من الثروة الصافية قبل مقارنة النصاب.",
      bn: "মূল শর্তগুলো হলো: ইসলাম, স্বাধীনতা, পূর্ণ মালিকানা, নিসাব অর্জন, বেশিরভাগ সম্পদের জন্য চান্দ্র বছর পূর্ণ হওয়া এবং বৃদ্ধি বা বৃদ্ধির সম্ভাবনা।",
    },
    ruling: {
      en: "The Hanafi school requires Nisab at the beginning and end of the Hawl for monetary assets, and treats growth potential as a condition. Exact applications to modern assets require scholar review.",
      ar: "المذهب الحنفي يشترط النصاب في بداية وآخر الحول للأموال النقدية، ويعتبر النماء شرطًا. وتطبيقاته على الأصول الحديثة تحتاج مراجعة عالمية.",
      bn: "হানাফি মাজহাব নগদ সম্পদের জন্য হাওলের সূচনা ও শেষে নিসাব নির্ধারণ করে এবং বৃদ্ধির সম্ভাবনাকে শর্ত হিসেবে নেয়। আধুনিক সম্পদের বিষয়ে বাস্তবায়ন প্রয়োজন।",
    },
  },
  "zakah-nisab": {
    definition: {
      en: "Nisab is the minimum amount of wealth that makes zakah obligatory.",
      ar: "النصاب هو الحد الأدنى من المال يجعل وجوب الزكاة.",
      bn: "নিসাব হলো যে স্বল্পতম সম্পদ যাকাতের জন্য আবশ্যক করে।",
    },
    body: {
      en: "The classical thresholds are 20 mithqal of gold and 200 dirhams of silver. Their gram equivalents and monetary values differ by source and by market price. The application keeps the classical weight and the contemporary price separate, records the price source and timestamp, and lets the user choose the gold or silver method without claiming universal agreement.",
      ar: "الحدود الكلاسيكية هي 20 مثقالًا من الذهب و200 درهمًا من الفضة. وتختلف قيم غراماتها وأسعارها حسب المصدر والسوق. ويُحافظ في التطبيق على الفرد القديم وعلى السعر المعاصر منفصلين.",
      bn: "চিরায়ত সীমা হলো ২০ মিথকাল স্বর্ণ এবং ২০০ দিরহাম রূপা। এদের গ্রাম-সমতুল্য ও আর্থিক মূল্য উৎস ও বাজারদর অনুসারে ভিন্ন হয়।",
    },
    ruling: {
      en: "Classical Hanafi works state the gold and silver weights; contemporary valuation is a separate, configurable step.",
      ar: "تبين الكتب الحنفية الكلاسيكية أوزان الذهب والفضة؛ والتقييم المعاصر خطوة مستقلة قابلة للتعديل.",
      bn: "চিরায়ত হানাফি গ্রন্থে স্বর্ণ ও রূপার ওজন উল্লেখ আছে; বর্তমান মূল্যায়ন একটি আলাদা, কনফিগারযোগ্য ধাপ।",
    },
    scenario: {
      en: "See the Nisab Information page for live/manual valuations.",
      ar: "اطلع على صفحة معلومات النصاب للحصول على التقييمات الحية أو اليدوية.",
      bn: "সরাসরি বা হাতে দেওয়া মূল্যায়ন দেখতে নিসাব তথ্য পৃষ্ঠাটি ব্যবহার করুন।",
    },
  },
  "zakah-hawl": {
    definition: {
      en: "Hawl is the passage of one Islamic lunar year over qualifying wealth.",
      ar: "الحول هو مرور سنة قمرية على المال المستحق.",
      bn: "হাওল হলো একটি চান্দ্র বছর সম্পূর্ণ যাকাতযোগ্য সম্পদের উপর প্রবেশ।",
    },
    body: {
      en: "The lunar year is approximately 354 days. The application converts dates with a documented tabular calendar and warns that sighting-based calendars may differ by a day. A single collective Hawl is applied to the zakahable wealth; independent cycles per asset are not assumed.",
      ar: "السنة القمرية نحو 354 يومًا. ويحوّل التطبيق التواريخ بجدول مفصل وينبه إلى اختلاف التقاويم الموقعة عن اليوم. ويُطبَّق الحول الجماعي على المال المستحق دون افتراض دورات مستقلة لكل أصل.",
      bn: "চান্দ্র বছর প্রায় ৩৫৪ দিন। অ্যাপ্লিকেশনটি তারিখ রূপান্তর করে এবং সূর্য-দেখা-ভিত্তিক ক্যালেন্ডারের পার্থক্য সম্পর্কে সতর্ক করে।",
    },
    ruling: {
      en: "Wealth must remain above Nisab through the year in the applied methodology. Cases of mid-year fluctuation are refused until a verified rule is added.",
      ar: "يجب أن يبقى المال فوق النصاب طوال الحول في المنهج المطبق. وتُرفض حالات التقلب خلال السنة حتى يُضاف قانون موثوق.",
      bn: "প্রয়োগ করা পদ্ধতিতে বছরজুড়ে সম্পদ নিসাবের উপর থাকতে হবে। বছরের মধ্যভাগে পরিবর্তন হলে ক্ষেত্রটি প্রত্যাখ্যান করা হয়।",
    },
  },
  "zakah-gold-silver": {
    definition: {
      en: "Gold and silver are the two foundational zakahable metals.",
      ar: "الذهب والفضة هما المعدنان الأساسيان للزكاة.",
      bn: "স্বর্ণ ও রূপা যাকাতের দুটি প্রধান ধাতু।",
    },
    body: {
      en: "Gold and silver are zakahable at 2.5% of their value or weight-equivalent. The application supports jewelry, investment metal, bars and coins as separate categories, each with its own documented policy and verification status.",
      ar: "والذهب والفضة زكاة نصابها 2.5% من قيمتها أو مقدارها. ويدعم التطبيق الحلي والمعادن الاستثمارية والسبائك وعملاتها كفئات مستقلة لكل منها سياسة موثقة وحالة تحقق.",
      bn: "স্বর্ণ ও রূপা তাদের মূল্য বা ওজন-সমতুল্যের ২.৫% হারে যাকাতযোগ্য। অ্যাপ্লিকেশনটি অলংকার, বিনিয়োগের স্বর্ণ, বার ও মুদ্রাকে আলাদা শ্রেণিতে সমর্থন করে।",
    },
    ruling: {
      en: "The Hanafi treatment of personal jewelry differs from some other schools and must be confirmed with a cited source before being presented as settled.",
      ar: "يختلف موقف المذهب الحنفي من الحلي الشخصية عن بعض المدارس ويجب التحقق من مصدر قبل اعتباره قائمًا.",
      bn: "ব্যক্তিগত অলংকার সম্পর্কে হানাফি অবস্থান কিছু অন্য মাজহাব থেকে ভিন্ন; তাই এটি চূড়ান্ত হিসেবে উপস্থাপনের আগে উদ্ধৃত উৎস দিয়ে যাচাই করা আবশ্যক।",
    },
  },
  "zakah-cash": {
    definition: {
      en: "Cash, bank balances and eligible digital money are treated as monetary wealth.",
      ar: "النقد والبنوك والمال الرقمي المستحق تعتبر ثروات نقدية.",
      bn: "নগদ, ব্যাংক ব্যালেন্স এবং যাকাতযোগ্য ডিজিটাল অর্থ আর্থিক সম্পদ হিসেবে গণ্য হয়।",
    },
    body: {
      en: "Cash at home, current and savings accounts, foreign currency and eligible digital balances are included at full value after conversion. The conversion-rate source is recorded, and no price is fabricated.",
      ar: "يشمل النقد في المنزل والحسابات الجارية والتوفير والعملات الأجنبية والمال الرقمي المستحق قيمتها كاملة بعد التحويل. ويُسجَّل مصدر التحويل ولا يُختلق سعر.",
      bn: "ঘরে রাখা নগদ, চলতি ও সঞ্চয়ী হিসাব, বিদেশি মুদ্রা এবং যাকাতযোগ্য ডিজিটাল ব্যালেন্স রূপান্তরের পর পূর্ণ মূল্যে অন্তর্ভুক্ত হয়। রূপান্তর হারের উৎস লিপিবদ্ধ থাকে এবং কোনো মূল্য বানানো হয় না।",
    },
    ruling: {
      en: "Money is zakahable because it is created for growth. Bank and digital balances require contemporary scholar review.",
      ar: "والمال زكاة لأنه مفتوح للنماء. وتحتاج الحسابات البنكية والرقمية إلى مراجعة عالمية معاصرة.",
      bn: "অর্থ যাকাতযোগ্য, কারণ এটি বৃদ্ধির জন্য সৃষ্ট হয়েছে। ব্যাংক ও ডিজিটাল ব্যালেন্স বিষয়ে বর্তমান সময়ের যাচাই প্রয়োজন।",
    },
  },
  "zakah-business": {
    definition: {
      en: "Goods held for resale are zakahable at their market value.",
      ar: "السلع المحتفظة للبيع زكاة قيمتها السوقية.",
      bn: "বিক্রয়ের জন্য রাখা পণ্য বাজারমূল্যে যাকাতযোগ্য।",
    },
    body: {
      en: "Merchandise, inventory and business cash are included. Receivables are included only when considered collectible under the documented policy. Doubtful receivables require a separate ruling.",
      ar: "يشمل البضاعة والمخزون والنقد التجاري. ويُدرج المستحقات فقط إذا كانت قابلة للتحصيل حسب السياسة الموثقة. وتحتاج المستحقات المشكوك فيها إلى حكم منفصل.",
      bn: "ব্যবসায়িক পণ্য, মজুদ এবং ব্যবসার নগদ অর্থ অন্তর্ভুক্ত। প্রাপ্য কেবল নথিভুক্ত নীতির অধীনে আদায়যোগ্য বিবেচিত হলে অন্তর্ভুক্ত হয়। সন্দেহজনক প্রাপ্যের জন্য আলাদা বিধান প্রয়োজন।",
    },
    ruling: {
      en: "Trade goods are valued at market price at the end of the Hawl. Receivable treatment depends on collectibility.",
      ar: "وتقاس بضائع التجارة بسعر السوق في نهاية الحول. وتعتمد معالجة المستحقات على قابلية التحصيل.",
      bn: "বাণিজ্যিক পণ্য বছরের শেষে বাজারমূল্যে মূল্যায়ন করা হয়। আদায়ের ব্যবস্থা আদায়যোগ্যতার উপর নির্ভর করে।",
    },
  },
  "zakah-jewelry": {
    definition: {
      en: "The ruling on gold and silver jewelry used for adornment.",
      ar: "موقف زكاة الحلي المستخدم للزينة.",
      bn: "অলংকার হিসেবে ব্যবহৃত স্বর্ণ ও রূপার যাকাত সম্পর্কিত বিধান।",
    },
    body: {
      en: "This is a madhhab-sensitive question. The application records the Hanafi position as requiring verification and does not silently adopt another school's view. Users see the policy and its status before relying on the result.",
      ar: "وهي مسألة حساسة عند المذاهب. ويحفظ التطبيق موقف الحنفية بخصوص يتطلب تحققًا ولا يتبنى صوتيًا رأي مدرسة أخرى.",
      bn: "এটি একটি মাজহাব-সংবেদনশীল বিষয়। অ্যাপ্লিকেশন হানাফি অবস্থানটি যাচাই প্রয়োজন হিসেবে লিপিবদ্ধ করে এবং নীরবে অন্য মাজহাবের মত গ্রহণ করে না। ব্যবহারকারী ফলাফলের উপর নির্ভর করার আগে নীতি ও তার অবস্থা দেখতে পান।",
    },
    ruling: {
      en: "Recorded as NEEDS_REVIEW pending a cited Hanafi source.",
      ar: "سُجِّل كـ NEEDS_REVIEW بانتظار مصدر حنفي موثق.",
      bn: "যাচাইকৃত হানাফি উৎস পাওয়া পর্যন্ত NEEDS_REVIEW হিসেবে লিপিবদ্ধ।",
    },
  },
  "zakah-debts": {
    definition: {
      en: "Which liabilities reduce zakahable wealth.",
      ar: "الالتزامات التي تُقلل المال المستحق للزكاة.",
      bn: "কোন দায় সম্পদ যাকাতযোগ্য করে তা নির্ধারণ করে।",
    },
    body: {
      en: "Immediate, due debts and due business liabilities are deductible under the applied methodology. Long-term loans are not deducted in full automatically. Each liability carries a rule ID, a reason and a verification status.",
      ar: "والديون المستحقون والتزامات الأعمال المستحقة تُخصم وفق المنهج المطبق. ولا تُخصم القروض طويلة الأجل كاملة تلقائيًا. وكل التزام يحمل رقم قاعدة وسببًا وحالة تحقق.",
      bn: "তাৎক্ষণিক ও বর্তমানে পরিশোধযোগ্য ঋণ এবং ব্যবসায়িক দায় প্রয়োগকৃত পদ্ধতিতে কর্তনযোগ্য। দীর্ঘমেয়াদি ঋণ স্বয়ংক্রিয়ভাবে সম্পূর্ণ কর্তন করা হয় না; প্রতিটি দায়ের সাথে নিয়ম আইডি, কারণ ও যাচাই অবস্থা থাকে।",
    },
    ruling: {
      en: "Only recognised, currently due obligations are deducted; the treatment of long-term debt requires scholar confirmation.",
      ar: "فقط الالتزامات المعترف بها والمستحقة حاليًا تُخصم؛ وتحتاج معالجة الدين طويل الأجل إلى تأكيد عالم.",
      bn: "কেবল স্বীকৃত ও বর্তমান পরিশোধযোগ্য দায় কর্তন করা হয়; দীর্ঘমেয়াদি ঋণ বিষয়ে আলেমের নিশ্চয়ন প্রয়োজন।",
    },
  },
  "zakah-calculation": {
    definition: {
      en: "The step-by-step calculation method used by the engine.",
      ar: "الطريقة الخطوة بخطوة المستخدمة في الحساب.",
      bn: "ইঞ্জিন ব্যবহার করে ধাপে ধাপে গণনার পদ্ধতি।",
    },
    body: {
      en: "The engine classifies assets, deducts eligible liabilities, compares the net wealth to the selected Nisab, evaluates Hawl, and applies 2.5% only when every condition is satisfied. Each step exposes its calculation, principle, reason, evidence and references.",
      ar: "يقوم المحرك بتصنيف الأصول وخصم المستحقين والمقارنة مع النصاب وتقييم الحول وتطبيق 2.5% عند استيفاء الشروط. ويُظهر كل خطوة حسابها ومبدأها وسببها والأدلة والمراجع.",
      bn: "ইঞ্জিনটি সম্পদ শ্রেণীকরণ করে, যোগ্য কর্তনযোগ্য দায় কেটে, নিট সম্পদ নিসাবের সাথে তুলনা করে, হাওল মূল্যায়ন করে এবং সব শর্ত পূরণ হলে ২.৫% প্রয়োগ করে।",
    },
    scenario: {
      en: "Every result includes a full eight-step explanation.",
      ar: "كل نتيجة تتضمن شرحًا مفصلاً من ثماني خطوات.",
      bn: "প্রতিটি ফলাফলের সম্পূর্ণ আট-ধাপ ব্যাখ্যা থাকে।",
    },
  },
  "zakah-recipients": {
    definition: {
      en: "The eight categories named in Surah At-Tawbah 9:60.",
      ar: "ثمانية فئات ذُكرت في سورة التوبة الآية 60.",
      bn: "আল-তওফাত সূরায় নির্দিষ্ট আটটি বিভাগ।",
    },
    body: {
      en: "The eight categories are the poor, the needy, those employed to collect zakah, those whose hearts are to be reconciled, slaves, debtors, the cause of Allah, and the traveller. Distribution details are a scholarly matter and are not computed by this application.",
      ar: "والفئات الثماني هي الفقراء والمحتاجون وعمال جمع الزكاة والمؤمنون المقصودون للتحسين وأولي الأمر والديون وسبيل الله والمسافر.",
      bn: "আটটি শ্রেণি হলো: দরিদ্র, অভাবী, যাকাত সংগ্রহকারী কর্মী, যাদের হৃদয়কে আকৃষ্ট করা হয়, দাস, ঋণগ্রস্ত, আল্লাহর পথে এবং মুসাফির।",
    },
    ruling: {
      en: "The categories are established by the Qur'an; practical distribution requires qualified guidance.",
      ar: "وتثبت الفئات الثماني بالقرآن؛ والتوزيع العملي يتطلب إرشادات من عالم مؤهل.",
      bn: "আটটি বিভাগ কুরআন দ্বারা প্রতিষ্ঠিত; বাস্তব বণ্টনে আলেমি পরামর্শ প্রয়োজন।",
    },
  },
  "zakah-contemporary": {
    definition: {
      en: "Modern assets whose treatment is still debated.",
      ar: "الأصول الحديثة التي ما زالت مسألة.",
      bn: "আধুনিক সম্পদ যাদের ব্যবস্থা আজও বিতর্কিত।",
    },
    body: {
      en: "Shares, investment funds, crypto-assets, insurance and pension products are not treated identically. The engine refuses categories without a verified rule and returns the mandated scholarly-verification message. This is a correctness feature, not an omission.",
      ar: "والأسهم وصناديق الاستثمار والعملات المشفرة ووثائق التأمين ومشتقات المعاشات لا تُعالج بالطريقة نفسها. ويُرفض الفئات بلا قانون موثوق ويعيد الرسالة المطلوبة.",
      bn: "শেয়ার, বিনিয়োগ-ফান্ড, ক্রিপ্টো-সম্পদ, বীমা ও পেনশন পণ্য একই নয় দেখানো হয়। যাকাত-নিয়ম যাচাইযোগ্য না থাকলে ইঞ্জিন অসমর্থ করে এবং আলেমিক যাচাই বার্তা দেয়।",
    },
  },

  "inheritance-introduction": {
    definition: {
      en: "Inheritance (الميراث) is the transfer of a deceased person's estate to eligible heirs. Fara'id (الفرائض) is the science of the prescribed shares.",
      ar: "والميراث هو انتقال التركة من الميت إلى الورثة المستحقين. والفرائض هو علم الأنصبة المحددة.",
      bn: "উত্তরাধিকার (ইনহেরিটেন্স) হলো মৃত ব্যক্তির সম্পত্তি যাত্রাপ্রাপ্ত উত্তরাধিকারীদের থেকে স্থানান্তর।",
    },
    body: {
      en: "The Qur'an establishes inheritance in Surah An-Nisa. The estate is settled in sequence: funeral expenses, debts, valid bequests, then distribution. The science of Fara'id identifies fixed-share heirs, residuary heirs and distant kindred, and applies exclusion rules.",
      ar: "والميراث مستند إلى سورة النساء. ويُسوَّى التركة بالترتيب: نفقات الجنازة والديون والوصايا الصحيحة ثم التوزيع. وتعرف الفرائض بأصحاب الفروض والعصبات وذوي الأرحام وتطبق قواعد الحجب.",
      bn: "কুরআনের সূরা আন-নিসারে উত্তরাধিকার নির্ধারিত হয়েছে; সম্পত্তি ধাপে ধাপে সমাধান করা হয় — দাফন-খরচ, ঋণ, বৈধ অসিয়ত, তারপর বণ্টন।",
    },
    ruling: {
      en: "The Hanafi school has distinctive rules for grandfather with siblings, distant kindred and Radd.",
      ar: "وللمذهب الحنفي قواعد مميزة لجمع الجد مع الإخوة وذوي الأرحام والرد.",
      bn: "হানাফি মাজহাবের নিজস্ব নিয়ম আছে — বিশেষত দাদা-সহ-ভাই, দূরবর্তী আত্মীয় এবং রাদ্দ বিষয়ে।",
    },
  },
  "inheritance-causes": {
    definition: {
      en: "The reasons that create a right to inherit.",
      ar: "الأسباب التي تخلق حقًا في الميراث.",
      bn: "উত্তরাধিকারের অধিকার সৃষ্টি করে এমন কারণ।",
    },
    body: {
      en: "The primary causes are marriage and blood relationship (nasab). The application models spouse, parents, descendants, siblings and grandparents.",
      ar: "وأساس الأسباب الزواج والقرابة (نسب). ويطبق التطبيق الزوجة والأبوين والأبناء والأخوة والأجداد.",
      bn: "প্রধান কারণ হলো বিবাহ ও রক্ত-সম্পর্ক (নসব)। অ্যাপ্লিকেশনে স্ত্রী, পিতা-মাতা, সন্তান, ভাই-বোন ও দাদা-দাদি মডেল করা হয়।",
    },
  },
  "inheritance-conditions": {
    definition: {
      en: "Conditions that must hold for inheritance to apply.",
      ar: "الشروط التي يجب أن تتحقق لاستحقاق الميراث.",
      bn: "উত্তরাধিকার প্রযোজ্য হওয়ার আগে পূরণ হওয়া শর্ত।",
    },
    body: {
      en: "The heir must survive the deceased, the relationship must be established, and no impediment may apply.",
      ar: "يجب أن يكون الوارث حيًّا وقت وفاة الميت، وأن تكون القرابة مستقرة، ولا مانع يمنع الميراث.",
      bn: "উত্তরাধিকারী মৃত ব্যক্তির মৃত্যুর পর বিদ্যমান থাকতে হবে, সম্পর্ক দায়ী হতে হবে এবং কোনো বাধা থাকা যাবে না।",
    },
  },
  "inheritance-impediments": {
    definition: {
      en: "Factors that prevent inheritance.",
      ar: "العوامل التي تمنع الميراث.",
      bn: "উত্তরাধিকার নাটকে বাধা দেয় এমন কারণ।",
    },
    body: {
      en: "Classical impediments include intentional killing, difference of religion, and slavery. The current engine does not model impediments and treats the supplied heirs as eligible unless excluded by relationship rules.",
      ar: "ومن الموانع الكلاسيكية قتل العمد والاختلاف الديني والتعبيد. ولا يطبق المحرك الموانع حاليًّا بل يتعامل مع الورثة المعطين كمستحقين.",
      bn: "চিরায়ত বাধাবৈশিষ্ট্যগুলোর মধ্যে উদ্দেশ্যপ্রণোদিত হত্যা, ধর্ম-পার্থক্য এবং দাসত্ব রয়েছে; ইঞ্জিন বর্তমানে বাধা মডেল করে না।",
    },
  },
  "inheritance-fixed-share-heirs": {
    definition: {
      en: "Heirs entitled to Qur'anically prescribed fractions.",
      ar: "الأئمة الحاصلون على أجزاء محددة من القرآن.",
      bn: "কুরআনিক অংশ নির্ধারণকারী উত্তরাধিকারীরা।",
    },
    body: {
      en: "The fixed fractions are 1/2, 1/4, 1/8, 2/3, 1/3 and 1/6. The engine determines each heir's applicable fraction from the complete family structure, never from a blanket percentage.",
      ar: "وتكون الفروض 1/2 و1/4 و1/8 و2/3 و1/3 و1/6. ويحدد المحرك الفريضة المناسبة لكل وارث من بنية الأسرة الكاملة.",
      bn: "নির্ধারিত অংশগুলো হলো: ১/২, ১/৪, ১/৮, ২/৩, ১/৩ এবং ১/৬; ইঞ্জিন পুরো পরিবার কাঠামো থেকে প্রতিটি উত্তরাধিকারীর অংশ নির্ধারণ করে।",
    },
  },
  "inheritance-residuary": {
    definition: {
      en: "Heirs who take the remainder after fixed shares.",
      ar: "الأئمة الذين يأخذون الباقي بعد الفروض.",
      bn: "নির্ধারিত অংশ বণ্টনের পর অবশিষ্টাংশ প্রাপ্ত উত্তরাধিকারী।",
    },
    body: {
      en: "Residuary heirs include sons, fathers (in some cases), brothers and uncles. The 2:1 male-to-female ratio applies only inside the agnatic residuary group after fixed shares are allocated.",
      ar: "وتشمل العصبات الأبناء والأب (في حالات) والأخوة والعم. ويُطبَّق النسبة 2:1 من الذكر إلى الأنثى داخل المجموعة العصبية بعد توزيع الفروض.",
      bn: "অবশিষ্টাংশ উত্তরাধিকারীদের অন্তর্ভুক্ত করা হয়: সন্তান, পিতা (কিছু ক্ষেত্রে), ভাই বা চাচা; ২:১ পুরুষ-মহিলা অনুপাত কেবল সংঘাতিক অবশিষ্টাংশ গোষ্ঠীর মধ্যে প্রযোজ্য।",
    },
  },
  "inheritance-exclusion": {
    definition: {
      en: "Complete or partial removal of an heir.",
      ar: "الإزالة الكاملة أو الجزئية للوارث.",
      bn: "উত্তরাধিকারীকে সম্পূর্ণ বা আংশিকভাবে বাদ দেওয়া।",
    },
    body: {
      en: "Complete exclusion (حجب حرمان) removes an heir entirely; partial exclusion (حجب نقصان) reduces a share. The engine emits every exclusion with the causing heir, principle and reference.",
      ar: "وحجب الحرمان يزيل الوارث كليًّا، وحجب النقصان يقلل الحصة. ويُصدر المحرك كل حجب مع سبب الحجب والمبدأ والمرجع.",
      bn: "সম্পূর্ণ বঞ্চনা (হজব হিরমান) উত্তরাধিকারীকে পুরোপুরি বাদ দেয়; আংশিক বঞ্চনা (হজব নুকসান) তার অংশ কমিয়ে দেয়। ইঞ্জিন প্রতিটি বঞ্চনা তার কারণ, নীতি ও উদ্ধৃতিসহ প্রকাশ করে।",
    },
    example: {
      en: "A son completely excludes a full brother; two daughters reduce the mother's share to 1/6.",
      ar: "يجعل الابن الأخ الشقيق كليًّا مستبعدًا؛ وتقل حصة الأم إلى 1/6 مع اثنتين من البنات.",
      bn: "একজন পুত্র সহোদর ভাইকে সম্পূর্ণভাবে বাদ দেয়; দুই কন্যা মাতার অংশ ১/৬-এ হ্রাস করে।",
    },
  },
  "inheritance-awl": {
    definition: {
      en: "Increasing the common denominator when fixed shares exceed the estate.",
      ar: "رفع المقهى المشترك عندما تتجاوز الفروض التركة.",
      bn: "নির্ধারিত অংশসমূহের যোগফল একের বেশি হলে সাধারণ হর আনুপাতিকভাবে বাড়ানো হয়।",
    },
    body: {
      en: "When fixed shares sum to more than one, the denominator is increased proportionally. Example: husband (1/4) + two daughters (2/3) + mother (1/6) = 13/12, so the base becomes 13.",
      ar: "وإذا كانت مجموع الفروض أكثر من الواحد، يُرفع المقهى نسبيًّا. ومثال: الزوج 1/4 والبنتان 2/3 والأم 1/6 = 13/12.",
      bn: "নির্ধারিত অংশের সমষ্টি একের বেশি হলে সাধারণ হর বাড়ানো হয়; যেমন: স্বামী (১/৪) + দুই কন্যা (২/৩) + মাতা (১/৬) = ১৩/১২।",
    },
    example: {
      en: "The engine reports the adjustment and shows each adjusted fraction.",
      ar: "ويُظهر المحرك التعديل ويُظهر كل الفروض المعدلة.",
      bn: "ইঞ্জিন সমন্বয় রিপোর্ট করে এবং প্রতিটি সমন্বিত অংশ দেখায়।",
    },
  },
  "inheritance-radd": {
    definition: {
      en: "Returning surplus estate to fixed-share heirs when no residuary exists.",
      ar: "إعادة الفائض إلى الفئات ذات الفروض عند عدم وجود عصبة.",
      bn: "কোনো আসাবা (অবশিষ্টাংশী উত্তরাধিকারী) না থাকলে এবং নির্ধারিত অংশ একের কম হলে উদ্বৃত্ত অংশ আনুপাতিকভাবে ফেরত দেওয়া হয়।",
    },
    body: {
      en: "When fixed shares sum to less than one and there is no residuary heir, the surplus is returned proportionally. The Hanafi treatment of spouses in Radd is flagged for scholar confirmation.",
      ar: "وإذا كانت مجموع الفروض أقل من الواحد ولم يكن هناك عصب، تُعاد الفائضة نسبيًّا. وتُحدد موقف الزوجين في الرد للمراجعة العلمية.",
      bn: "নির্ধারিত অংশ একের কম এবং কোনো অবশিষ্টাংশী উত্তরাধিকারী না থাকলে উদ্বৃত্ত অংশ আনুপাতিকভাবে ফেরত দেওয়া হয়। রাদ্দে স্বামী-স্ত্রীর হানাফি অবস্থান আলেমিক নিশ্চয়নের জন্য চিহ্নিত।",
    },
  },
  "inheritance-grandfather-siblings": {
    definition: {
      en: "A distinctive and debated Hanafi scenario.",
      ar: "مشهد حنفي مميز ومناقش.",
      bn: "একটি বিশেষ ও বিতর্কিত হানাফি ক্ষেত্র।",
    },
    body: {
      en: "The Hanafi rule for a grandfather inheriting alongside siblings is nuanced. The current engine refuses this combination and returns the scholarly-verification message rather than guessing.",
      ar: "وقد تكن قاعدة الحنفية المميزة لاستحقاق الجد مع الإخوة. ولا يدعم المحرك هذه المجموعة ويعيد الرسالة المطلوبة.",
      bn: "ভাইদের সঙ্গে দাদার উত্তরাধিকার সংক্রান্ত হানাফি নিয়ম সূক্ষ্ম। বর্তমান ইঞ্জিন এই সমন্বয় সমর্থন করে না এবং অনুমান না করে আলেমিক যাচাইয়ের বার্তা দেয়।",
    },
  },
  "inheritance-distant-kindred": {
    definition: {
      en: "Relatives who inherit only when no fixed-share or residuary heir exists.",
      ar: "الأقارب الذين يرثون فقط عندما لا يوجد فرد ذو فرض أو عصب.",
      bn: "দূরবর্তী আত্মীয় যারা নির্ধারিত অংশ বা অবশিষ্টাংশ না থাকলে উত্তরাধিকারী হয়।",
    },
    body: {
      en: "Distant kindred have detailed Hanafi rules. This category is not yet implemented and is explicitly refused by the engine.",
      ar: "وذوي الأرحام لديهم قواعد حنفية مفصلة. وهذه الفئة غير منفذة حاليًّا وتُرفض.",
      bn: "দূরবর্তী আত্মীয়দের জন্য হানাফি নিয়ম রয়েছে; এই বিভাগটি এখনও বাস্তবায়ন করা হয়নি এবং ইঞ্জিন বাদ দেয়।",
    },
  },
  "inheritance-wasiyyah": {
    definition: {
      en: "A testamentary bequest from the estate.",
      ar: "وصية من التركة.",
      bn: "মৃতের সম্পত্তি থেকে একটি অসিয়ত (উইল)।",
    },
    body: {
      en: "A bequest is valid up to one third of the net estate. A bequest to an heir requires the consent of the other heirs. The engine enforces the one-third limit unless consent is confirmed, and flags the remaining details for scholarly review.",
      ar: "والتوصية صحيحة حتى ثلث التركة الصافية. ويجب موافقة الباقين على الوصية. ويحد المحرك الثلث إلا بموافقة الأئمة.",
      bn: "নিট সম্পত্তির এক-তৃতীয়াংশ পর্যন্ত অসিয়ত বৈধ। উত্তরাধিকারের অনুকূলে অসিয়ত করতে অন্য উত্তরাধিকারীদের সম্মতি প্রয়োজন। ইঞ্জিন সম্মতি নিশ্চিত না হলে এক-তৃতীয়াংশ সীমা প্রয়োগ করে এবং বাকি বিবরণ আলেমিক পর্যালোচনার জন্য চিহ্নিত করে।",
    },
  },
  "inheritance-examples": {
    definition: {
      en: "Worked examples illustrating the engine.",
      ar: "أمثلة عملية توضح المحرك.",
      bn: "ইঞ্জিনের কাজের উদাহরণ।",
    },
    body: {
      en: "Example 1: wife and son — wife 1/8, son 7/8. Example 2: father and mother — mother 1/3, father 2/3. Example 3: husband, two daughters and mother — Awl to a base of 13.",
      ar: "المثال الأول: الزوجة والابن — 1/8 للزوجة و7/8 للابن. والمثال الثاني: الأب والأم — 1/3 للأم و2/3 للأب.",
      bn: "উদাহরণ ১: স্ত্রী ও পুত্র — স্ত্রীর অংশ ১/৮, পুত্রের অংশ ৭/৮। উদাহরণ ২: পিতা ও মাতা — মাতার অংশ ১/৩, পিতার অংশ ২/৩।",
    },
  },

  "principles-usul": {
    definition: {
      en: "The methodology by which rulings are derived from evidence.",
      ar: "المنهجية التي تُشتق منها الأحكام من الأدلة.",
      bn: "এমন পদ্ধতি যার মাধ্যমে প্রমাণ থেকে আহকাম (বিধান) উদ্ভাবন করা হয়।",
    },
    body: {
      en: "Usul al-fiqh studies the sources and methods of deriving rulings. This application does not derive new rulings; it encodes rules already documented in the Hanafi tradition and marks their verification status.",
      ar: "والأصول الفقهية تدرس مصادر وطرق استنتاج الأحكام. والتطبيق لا يستنتج أحكامًا جديدة بل يحفظ أحكامًا سابقًا موثقة في المذهب الحنفي مع حالتها.",
      bn: "উসুল আল-ফিকহ উৎস ও বিধান উদ্ভাবনের পদ্ধতি আলোচনা করে। এই অ্যাপ্লিকেশন নতুন বিধান উদ্ভাবন করে না; বরং হানাফি ঐতিহ্যে নথিভুক্ত বিধান সংকেতবদ্ধ করে এবং তাদের যাচাই অবস্থা চিহ্নিত করে।",
    },
  },
  "principles-evidence": {
    definition: {
      en: "The ordering of Islamic evidence.",
      ar: "ترتيب الأدلة الإسلامية.",
      bn: "ইসলামি প্রমাণের ক্রম।",
    },
    body: {
      en: "Evidence is ordered as Qur'an, authentic Sunnah, consensus, and analogy. The application never presents an unverified hadith as authentic and marks unverified references explicitly.",
      ar: "وتُرتب الأدلة كالقرآن والسنة الصحيحة والإجماع والقياس. ولا يعرض التطبيق حديثًا غير موثوق كصحيح.",
      bn: "প্রমাণসমূহ কুরআন, নির্ভরযোগ্য সুন্নাহ, ইজমা ও কিয়াস অনুসারে সাজানো হয়। অ্যাপ্লিকেশন কখনো যাচাইহীন হাদিসকে সহীহ হিসেবে উপস্থাপন করে না এবং যাচাইহীন উদ্ধৃতি স্পষ্টভাবে চিহ্নিত করে।",
    },
  },
  "principles-madhhab": {
    definition: {
      en: "The recognised Sunni schools of jurisprudence.",
      ar: "المذاهب السنيّة المعترف بها.",
      bn: "স্বীকৃত সুন্নি ফিকহি মাজহাবসমূহ।",
    },
    body: {
      en: "The Hanafi, Shafi'i, Maliki and Hanbali schools share core sources but differ in details. Mīzān implements Hanafi only in v1 and never silently applies Hanafi rules while claiming another school. The provider architecture allows future expansion.",
      ar: "وتشترك المذاهب الأربعة في المصادر الأساسية لكنها تختلف في التفاصيل. ويطبق التطبيق المنهج الحنفي فقط في النسخة الأولى.",
      bn: "হানাফি, শাফিঈ, মালিকি ও হাম্বলি — এই চারটি সুন্নি মাজহাব মূল উৎসে একমত হলেও বিস্তারিত বিধানে ভিন্ন। মীজান সংস্করণ ১-এ কেবল হানাফি মাজহাব প্রয়োগ করে এবং অন্য মাজহাবের দাবি করে নীরবে হানাফি নিয়ম প্রয়োগ করে না।",
    },
  },
};

export function getTopicTranslation(
  slug: string,
  field: keyof TopicTranslations,
): LocalizedText | undefined {
  const entry = TOPIC_TRANSLATIONS[slug];
  const value = entry?.[field];
  if (!value) return undefined;
  return {
    en: value.en ?? "",
    ar: value.ar ?? value.en ?? "",
    bn: value.bn ?? value.en ?? "",
  };
}
