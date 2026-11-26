import type { Language } from "./language"

const arabicCopy: Record<string, string> = {
  "Core Maqam Concepts": "مفاهيم المقام الأساسية",
  "A maqam is not just a scale; it is an interconnected melodic framework built from chained ajnas (jins).":
    "المقام ليس مجرد سلّم؛ بل هو إطار لحني مترابط يتكوّن من أجناس متتابعة.",
  "The root jins defines the family, while the melodic course or sayr is shaped by the movement between ajnas and their pivots.":
    "يحدّد جنس الأصل عائلة المقام، بينما يتشكّل السير اللحني من الحركة بين الأجناس ونغمات الارتكاز.",
  "The root jins is the first jins in the scale and it anchors the maqam's character.":
    "جنس الأصل هو الجنس الأول في السلم، وهو الذي يرسّخ طابع المقام.",
  "The ghammaz is the most important secondary emphasis, usually the note most often used as a pivot or modulation point.":
    "الغماز هو أهم مركز لحني ثانوي، وغالباً ما يكون نغمة ارتكاز أو نقطة للتحويل.",
  "Maqamat are easier to memorize when you recognize which scale degrees are altered and whether they are raised or lowered. For example, starting from Kurd on D4, raising the second degree by a quarter tone gives Bayati; lowering the fourth degree by a semitone to F♯ gives Saba.":
    "يسهل حفظ المقامات عند تمييز الدرجات المتغيرة ومعرفة ما إذا كانت مرفوعة أم مخفوضة. فمثلاً، انطلاقاً من كرد على ري 4، يؤدي رفع الدرجة الثانية ربع تون إلى بياتي، وخفض الدرجة الرابعة نصف تون إلى فا دييز إلى الصبا.",
  "MaqamWorld groups maqamat into eight families by shared root jins: ‘Ajam, Bayati, Hijaz, Kurd, Nahawand, Nikriz, Rast, and Sikah. Saba is listed among maqamat outside a family.":
    "يصنّف موقع مقام وورلد المقامات في ثماني عائلات بحسب جنس الأصل المشترك: عجم، بياتي، حجاز، كرد، نهاوند، نكريز، راست، وسيكاه. ويُدرج الصبا ضمن المقامات المستقلة.",
  "Jins Baggage (زخرفة الجنس)": "زخرفة الجنس",
  "Jins baggage represents notes outside a jins's core pitches using signed quarter-tone offsets.":
    "تُظهر زخارف الجنس النغمات الواقعة خارج نغماته الأساسية باستخدام إزاحات ربع صوت موجبة أو سالبة.",
  "Negative offsets are anchored below the root; positive offsets are anchored above the top pitch.":
    "تُقاس الإزاحات السالبة نزولاً من الأصل، والموجبة صعوداً من أعلى نغمة.",
  "The model displays these notes alongside the core jins so their pitch and register can be compared.":
    "يعرض النموذج هذه النغمات بجوار الجنس الأساسي لتسهيل مقارنة طبقتها وموقعها.",
  "Baggage notes can inform melodic approaches and cadential motion.":
    "تساعد نغمات الزخرفة على فهم الاقترابات اللحنية والحركة نحو القفلة.",
  "Network View of Maqam & Small-World Graphs": "شبكة المقامات والرسوم البيانية",
  "Maqamat are graphs/networks of ajnas with directed edges representing permissible pathways.":
    "يمكن تمثيل المقامات بشبكات من الأجناس، حيث تشير الروابط الموجّهة إلى مسارات الانتقال الممكنة.",
  "Hubs cluster around the tonic (Qarar) and dominant (Ghammaz) with high clustering coefficients and short path lengths.":
    "تتركز نقاط الارتكاز حول القرار والغماز، مع ترابط قوي ومسارات قصيرة بينها.",
  "Instead of smooth continuous modulation, classical maqam performance navigates discrete, structurally grounded nodes.":
    "بدلاً من التحويل المتصل بلا حدود، ينتقل أداء المقام التقليدي بين مراكز محددة ذات أساس بنيوي.",
  "Understanding the network reveals why certain modulations sound effortless and inevitable while others create stark surprise.":
    "يساعد فهم الشبكة على تفسير سلاسة بعض التحويلات، ومباغتة تحويلات أخرى.",
  "The 8 Maqam Families": "عائلات المقامات الثماني",
  "Families are based on sharing the same first (root) jins, which has the largest role in defining a maqam's character.":
    "تقوم العائلات على اشتراك المقامات في جنس الأصل، وهو العنصر الأبرز في تحديد طابع المقام.",
  "Branch maqamat in a family use different upper ajnas while sharing the family root jins.":
    "تستخدم المقامات المتفرعة ضمن العائلة أجناساً عليا مختلفة، مع اشتراكها في جنس الأصل.",
  "Maqamat that do not share their root jins with others, including Saba, are not part of a family.":
    "لا تنتمي المقامات التي لا تشترك في جنس الأصل مع غيرها، ومنها الصبا، إلى عائلة.",
  "Three Categories of Modulation": "فئات التحويل المقامي الثلاث",
  "Category 1 (Ornamental): Brief passing accidentals within a single jins that do not establish a new tonic center.":
    "الفئة الأولى (زخرفية): نغمات عارضة عابرة داخل جنس واحد، من دون تأسيس قرار جديد.",
  "Category 2 (Internal): Typical jins-to-jins modulations within the established network of the maqam (not a true maqam change).":
    "الفئة الثانية (داخلية): انتقالات مألوفة بين الأجناس ضمن شبكة المقام، من دون تغيير المقام كلياً.",
  "Category 3 (Full Maqam): Structural modulation that destabilizes the root jins and firmly shifts the tonal foundation to a new maqam.":
    "الفئة الثالثة (مقام كامل): تحويل بنيوي يبتعد عن جنس الأصل وينقل مركز الاستقرار بوضوح إلى مقام جديد.",
  "Melodic Movement (Sayr)": "السير والحركة اللحنية",
  "Sayr refers to the melodic course or path that characterizes each maqam.":
    "يشير السير إلى المسار اللحني الذي يميّز كل مقام.",
  "Different maqamat have characteristic sayr patterns: ascending, descending, or undulating.":
    "للمقامات مسارات مميزة؛ فقد تكون صاعدة أو هابطة أو متعرّجة.",
  "The sayr determines which notes are emphasized, which pitches are used as pivots, and how modulations occur.":
    "يحدّد السير النغمات المؤكدة ونغمات الارتكاز وكيفية حدوث التحويلات.",
  "Maqam Facts": "حقائق المقامات",
  "Classical Arabic modal system fundamentals & Abu Shumays Primer insights":
    "أساسيات النظام المقامي العربي وإضاءات من كتاب سامي أبو شمايس التمهيدي",
  "Intonation, microtonal finger placement, and scalar fluidity.":
    "دقة الضبط، ومواضع الأصابع للأبعاد الميكروتونية، وسلاسة الحركة السلمية.",
  "Finger independence, neighbor-tone clarity, and steady tempo.":
    "استقلالية الأصابع، ووضوح النغمات المجاورة، وثبات السرعة.",
  "Jins awareness, pivot stabilization, and four-finger dexterity.":
    "تمييز الجنس، وتثبيت نغمة الارتكاز، ومرونة الأصابع الأربعة.",
  "Position shifts, guide fingers, vocal portamento (Zahlaka), and upper register resonance.":
    "الانتقال بين المواقع، والإصبع الدليل، والزحلقة التعبيرية، ورنين الطبقة العليا.",
  "Real-time notation reading, phrase interpretation, and cadential resolution.":
    "قراءة النوتة مباشرة، وفهم الجملة، وحسن الوصول إلى القفلة.",
  Essential: "أساسي",
  "Practical note:": "ملاحظة عملية:",
  "The family and mood are carried by the ajnas and their baggage notes, not by an isolated scale formula. Navigating the network graph reveals authentic pathways between modal regions.":
    "تحمل الأجناس وزخارفها طابع المقام ومزاجه، لا صيغة السلم المنفردة وحدها. وتكشف خريطة الشبكة المسارات الأصيلة بين المناطق المقامية.",
  "Identify the Jins": "تعرّف على الجنس",
  "Listen to a short phrase and choose the Jins you hear.":
    "استمع إلى جملة قصيرة واختر الجنس الذي تسمعه.",
  "Listen to the complete phrase.": "استمع إلى الجملة كاملة.",
  "Replay it as often as needed.": "أعد الاستماع إليها حسب الحاجة.",
  "Choose the Jins whose characteristic intervals match the phrase, then check your answer.":
    "اختر الجنس الذي تطابق أبعاده المميزة الجملة، ثم تحقّق من إجابتك.",
  "Identify the Maqam": "تعرّف على المقام",
  "Listen to a short phrase and identify its Maqam.":
    "استمع إلى جملة قصيرة وحدّد مقامها.",
  "Listen for the tonic, characteristic intervals, and melodic contour.":
    "أنصت إلى القرار والأبعاد المميزة ومسار اللحن.",
  "Replay the phrase if needed.": "أعد الجملة إذا احتجت إلى ذلك.",
  "Select the Maqam you hear and check your answer.":
    "اختر المقام الذي تسمعه ثم تحقّق من إجابتك.",
  "Identify the degree": "تعرّف على الدرجة",
  "Hear the tonic followed by a scale note, then name its degree.":
    "استمع إلى القرار ثم إلى نغمة من السلم، وبعدها حدّد درجتها.",
  "The first note is the tonic; compare the second note against it.":
    "النغمة الأولى هي القرار؛ قارن بها النغمة الثانية.",
  "Replay the two notes and sing or hum the interval.":
    "أعد النغمتين وغنِّ المسافة بينهما أو دندنها.",
  "Select the scale degree of the second note and check your answer.":
    "اختر درجة النغمة الثانية من السلم ثم تحقّق من إجابتك.",
  "Play the Maqam or Jins": "اعزف المقام أو الجنس",
  "Prepare your instrument, then record a short performance.":
    "جهّز آلتك ثم سجّل عزفاً قصيراً.",
  "Replay the reference pitches and review the target scale.":
    "أعد النغمات المرجعية وراجع السلم المستهدف.",
  "Start the microphone check and wait for the countdown.":
    "ابدأ فحص الميكروفون وانتظر انتهاء العدّ التنازلي.",
  "Play sustained target notes, then select Check to review intonation and in-scale accuracy.":
    "اعزف نغمات مستدامة من المقام، ثم اختر «تحقّق» لمراجعة الضبط ومدى الالتزام بالسلم.",
  "All Ajnas": "جميع الأجناس",
  "All Maqamat": "جميع المقامات",
  "3-note": "٣ نغمات",
  "4-note": "٤ نغمات",
  "5-note": "٥ نغمات",
  "(undefined size)": "(حجم غير محدد)",
  "A maqam is not merely a static scale; it is an organic melodic framework built from chained ajnas (tetrachords, trichords, and pentachords).":
    "المقام ليس سلّماً ثابتاً فحسب، بل إطار لحني حيّ يتكوّن من أجناس متتابعة ثلاثية أو رباعية أو خماسية.",
  "The root jins (جنس الأصل) defines the maqam family, anchoring its emotional ethos and tonal foundation.":
    "يحدّد جنس الأصل عائلة المقام ويرسّخ هويته التعبيرية وأساسه النغمي.",
  "The ghammaz (الغمّاز) is the secondary focal note, serving as a melodic pivot and modulation gateway, typically on the 4th, 5th, or 3rd degree.":
    "الغماز هو مركز لحني ثانوي ونقطة ارتكاز للتحويل، ويقع عادةً على الدرجة الرابعة أو الخامسة أو الثالثة.",
  "The sayr (السير) governs the temporal melodic trajectory dictating whether melodies ascend from the tonic, undulate around the ghammaz, or descend from the octave.":
    "يحدّد السير مسار اللحن عبر الزمن: هل يصعد من القرار، أم يتماوج حول الغماز، أم يهبط من الجواب.",
  "MaqamWorld groups maqamat into eight families by shared root jins: ‘Ajam, Bayati, Hijaz, Kurd, Nahawand, Nikriz, Rast, and Sikah. Saba is listed outside a family.":
    "يصنّف موقع مقام وورلد المقامات في ثماني عائلات تتشارك جنس الأصل: عجم، بياتي، حجاز، كرد، نهاوند، نكريز، راست، وسيكاه. ويُدرج الصبا خارج العائلات.",
  "The model displays baggage notes with the core jins so their pitch and register can be compared.":
    "يعرض النموذج نغمات الزخرفة بجوار الجنس الأساسي لمقارنة طبقتها وموقعها.",
  "Maqamat should be understood as graphs of ajnas where nodes are scale degrees and edges are acceptable pathways.":
    "يُستحسن فهم المقامات بوصفها شبكات من الأجناس؛ تمثّل العقد درجات السلم والروابط مسارات الحركة المقبولة.",
  "Small-World network topology: High clustering coefficient around key hubs (degrees 1, 4, 5) with short path lengths.":
    "تتميّز شبكة العالم الصغير بترابط عالٍ حول مراكز أساسية (الدرجات ١ و٤ و٥) وبمسارات قصيرة بينها.",
  "Acceptable pathways indicate how composers move from node to node without destabilizing the modal narrative.":
    "توضح المسارات المقبولة كيفية انتقال الملحن من مركز إلى آخر دون الإخلال بالسياق المقامي.",
  "Three modulation categories govern transitions: Category 1 (Ornamental), Category 2 (Internal within network), Category 3 (Full Maqam shift).":
    "تحكم الانتقالاتَ ثلاث فئات للتحويل: زخرفي، وداخلي ضمن الشبكة، وتحويل بنيوي إلى مقام كامل.",
  "Families share the same first (root) jins, while branch maqamat use different upper ajnas.":
    "تتشارك العائلات جنس الأصل، بينما تستخدم المقامات المتفرعة أجناساً عليا مختلفة.",
  "The eight families are ‘Ajam, Bayati, Hijaz, Kurd, Nahawand, Nikriz, Rast, and Sikah.":
    "العائلات الثماني هي عجم، بياتي، حجاز، كرد، نهاوند، نكريز، راست، وسيكاه.",
  "MaqamWorld lists Saba among maqamat that do not share their first jins with another maqam and are therefore outside a family.":
    "يُدرج موقع مقام وورلد الصبا ضمن المقامات التي لا تشترك في جنس الأصل مع مقام آخر، ولذلك فهو خارج العائلات.",
  "Ittisal (اتصال / Conjunct): The upper jins begins directly on the highest note of the lower jins (sharing the pivot note). Example: Bayati on D + Nahawand on G.":
    "الاتصال: يبدأ الجنس الأعلى مباشرةً من أعلى نغمة في الجنس الأسفل، مع اشتراكهما في نغمة الارتكاز. مثال: بياتي على ري مع نهاوند على صول.",
  "Infisal (انفصال / Disjunct): The lower and upper ajnas are separated by a whole-tone interval (فاصلة طنينية / Fasila of 4 quarter-tones = 200¢). Example: Rast on C + Rast on G.":
    "الانفصال: يفصل بين الجنسين الأسفل والأعلى بُعد كامل (٤ أرباع صوت = ٢٠٠ سنت). مثال: راست على دو مع راست على صول.",
  "Tadakhul (تداخل / Overlapping): The upper jins root overlaps inside the span of the lower jins. Characteristic of Maqam Saba and Sikah variants.":
    "التداخل: يقع أصل الجنس الأعلى داخل المجال النغمي للجنس الأسفل، ويظهر في مقام الصبا وبعض صيغ السيكاه.",
  "Upper Alternate Ajnas: During performance, masters modulate to alternate upper ajnas (e.g. Bayati shifting from upper Nahawand to upper Rast or Hijaz).":
    "الأجناس العليا البديلة: ينتقل المؤدون أحياناً بين أجناس عليا مختلفة، مثل انتقال البياتي من نهاوند إلى راست أو حجاز.",
  "Ascending Sayr (سير صاعد): Begins near the tonic (qarar), develops through the root jins, climbs through the ghammaz into the upper register, and returns home.":
    "السير الصاعد: يبدأ قرب القرار، ويتطور عبر جنس الأصل، ثم يصعد من خلال الغماز إلى الطبقة العليا ويعود إلى القرار.",
  "Descending / Octave Sayr (سير هابط): Opens directly at the octave (jawab) or upper jins, exploring high tensions before resolving down to the tonic.":
    "السير الهابط أو الأوكتافي: يبدأ من الجواب أو الجنس الأعلى، ويستكشف توتر الطبقة المرتفعة قبل أن يستقر على القرار.",
  "Undulating Sayr (سير متموج): Centers around the ghammaz pivot note from the start, oscillating between lower and upper modal layers.":
    "السير المتموّج: يتمحور منذ البداية حول الغماز، ويتردد بين الطبقتين المقاميتين السفلى والعليا.",
  "The Qafla (القفلة): The definitive cadential formula that stamps the maqam's identity before resolving onto the tonic.":
    "القفلة: صيغة ختامية مميزة تؤكد هوية المقام قبل الاستقرار على القرار.",
  "Arabic Violin Tuning (دوزان عربي): G3 (Yakah) - D4 (Dukah) - G4 (Nawa) - D5 (Muhayyar). The 1st and 2nd strings are tuned down a whole step compared to Western violin (A4→G4, E5→D5), creating rich sympathetic resonance on the open strings.":
    "الضبط العربي للكمان: صول ٣ (يكاه) - ري ٤ (دوكاه) - صول ٤ (نوى) - ري ٥ (محيّر). يُخفض الوتران الأول والثاني درجة كاملة مقارنةً بالضبط الغربي (A4→G4 وE5→D5)، ما يوفّر رنيناً غنياً للأوتار المطلقة.",
  "Western Violin Tuning (دوزان غربي): G3 - D4 - A4 - E5. Standard perfect-5ths tuning used in Western classical tradition and adaptable to Arabic music.":
    "الضبط الغربي للكمان: G3 - D4 - A4 - E5. ضبط شائع بأخماس تامة في الموسيقى الكلاسيكية الغربية، ويمكن تكييفه للموسيقى العربية.",
  "Neutral 2nd & 3rd Finger Placement: On the fretless fingerboard, quarter-tone notes (such as Sikah E𝄳4 or Awj B𝄳4) require placing the finger equidistant between minor and major finger stops.":
    "مواضع الإصبعين الثاني والثالث للنغمات المحايدة: على لوحة الأصابع غير المقسمة، توضع نغمات ربع الصوت مثل سيكاه E𝄳4 أو أوج B𝄳4 في المنتصف بين موضعي الدرجة الصغرى والكبرى.",
  "Position Shifting: In 2nd and 3rd positions, shifts are executed smoothly on the Ghammaz pivot note with subtle expressive vocal slide (zahlaka).":
    "الانتقال بين المواقع: يُنفّذ الانتقال إلى الموقعين الثاني والثالث بسلاسة عند الغماز، مع زحلقة صوتية تعبيرية خفيفة.",
  "Maqam Theory & 8 Families": "نظرية المقامات وعائلاتها الثماني",
  "Reference for classical Arabic modal music theory, jins baggage, network pathways, and root-jins family classification":
    "مرجع للنظرية المقامية العربية، وزخارف الأجناس، ومسارات الشبكات، وتصنيف العائلات بحسب جنس الأصل.",
  Close: "إغلاق",
  "The 8 Fundamental Families": "العائلات الثماني الأساسية",
  "Maqam Family Taxonomy": "تصنيف عائلات المقامات",
  "The family system": "يقوم نظام العائلات",
  "groups maqamat by shared root jins": "على جمع المقامات التي تتشارك جنس الأصل",
  "in MaqamWorld. Click a card to select a representative maqam:":
    "وفق موقع مقام وورلد. اختر بطاقة لتحديد مقام ممثل للعائلة:",
  Active: "نشط",
  "Listen to": "استمع إلى",
  Playing: "قيد التشغيل",
  Hear: "استمع",
  "Maqamat outside a family:": "مقامات خارج العائلات:",
  Example: "مثال",
  "Listen": "استمع",
  "Playing...": "جارٍ التشغيل...",
  "Explore in Studio": "استكشف في الاستوديو",
  "Tone.js 24-EDO Microtonal Tuning Standard":
    "معيار Tone.js للضبط الميكروتوني بنظام ٢٤ درجة متساوية",
  "Close Reference": "إغلاق المرجع",
  "Listen to the phrase and identify the Jins.": "استمع إلى الجملة وحدّد الجنس.",
  "Listen to the phrase and identify the Maqam.": "استمع إلى الجملة وحدّد المقام.",
  "Strong": "متمكّن",
  "Developing": "في طور التقدّم",
  "Keep practicing": "واصل التدريب",
  "Choose ascending, descending, or both directions.":
    "اختر الصعود أو الهبوط أو الاتجاهين معاً.",
  "Follow the notes from the tonic through the scale; in both mode, turn at the upper tonic.":
    "اتبع النغمات من القرار عبر السلم؛ وعند التدريب في الاتجاهين، انعطف عند جواب القرار.",
  "Replay the reference and practice even rhythm, relaxed fingering, and accurate quarter tones.":
    "أعد المرجع وتدرّب على إيقاع منتظم ووضع أصابع مريح ودقيق في أرباع الصوت.",
  "Play each three-note group in order as the pattern moves through the scale.":
    "اعزف كل مجموعة من ثلاث نغمات بالترتيب مع انتقال النمط عبر السلم.",
  "Keep a steady beat as each group shifts to the next starting degree.":
    "حافظ على نبض ثابت بينما تبدأ كل مجموعة من درجة جديدة.",
  "Listen for clean transitions and even articulation.":
    "أنصت إلى الانتقالات الواضحة وتساوي النطق.",
  "Play each four-note group in order and notice how it outlines the jins.":
    "اعزف كل مجموعة من أربع نغمات بالترتيب ولاحظ كيف ترسم الجنس.",
  "Keep the fourth note clear as the pattern moves through the scale.":
    "أبرز النغمة الرابعة بوضوح مع انتقال النمط عبر السلم.",
  "Focus on the ghammaz pivot and consistent tone.":
    "ركّز على ارتكاز الغماز وثبات النغمة.",
  "Review the generated shift instruction and guide-finger note.":
    "راجع تعليمات الانتقال وملاحظة الإصبع الدليل التي وُلّدت للتمرين.",
  "Play the phrase slowly, keeping the guide finger light during the shift.":
    "اعزف الجملة ببطء، مع تخفيف ضغط الإصبع الدليل أثناء الانتقال.",
  "Repeat until the destination pitch is centered and relaxed.":
    "كرّر حتى تستقر النغمة المستهدفة ويصبح العزف مريحاً.",
  "Read the generated phrase before playing; notice its meter and cadence.":
    "اقرأ الجملة المولّدة قبل عزفها، وانتبه إلى ميزانها وقفلتها.",
  "Play once without stopping, keeping the pulse and written durations.":
    "اعزفها مرة دون توقف، مع الحفاظ على النبض والمدد المكتوبة.",
  "Replay the reference phrase and compare your note choices and cadence.":
    "أعد الجملة المرجعية وقارن اختياراتك للنغمات والقفلة.",
  "Skill Drills": "تمارين المهارات",
  "Generate focused maqam exercises, follow each How To guide, and build your practice record.":
    "أنشئ تمارين مقامية مركّزة، واتبع الإرشادات، وطوّر سجل تدريبك.",
  "Training progress": "تقدّم التدريب",
  "Practice generator": "منشئ التمارين",
  "Practice type": "نوع التمرين",
  Direction: "الاتجاه",
  "Ascending and descending": "صعوداً وهبوطاً",
  Ascending: "صعوداً",
  Descending: "هبوطاً",
  "Shift variation": "نوع الانتقال",
  "Ghammaz pivot": "ارتكاز الغماز",
  "Octave leap": "قفزة أوكتاف",
  "Expressive slide": "زحلقة تعبيرية",
  "Sight-reading · 8 measures · Level 1": "قراءة فورية · ٨ موازير · المستوى الأول",
  "How To:": "طريقة التمرين:",
  "Generate exercise": "إنشاء تمرين",
  Stop: "إيقاف",
  "Play reference": "عزف المرجع",
  "Select a note on the staff to hear it.": "اختر نغمة على المدرّج للاستماع إليها.",
  Shift: "انتقال",
  "Generated exercise staff": "مدرّج التمرين المولّد",
  "Exercise notes": "نغمات التمرين",
  "Could not generate this exercise.": "تعذّر إنشاء هذا التمرين.",
  "Audio could not start.": "تعذّر بدء الصوت.",
  "Audio could not start. Check your audio settings and try again.":
    "تعذّر بدء الصوت. تحقّق من إعدادات الصوت ثم حاول مجدداً.",
  "No clear pitches were detected. Try again in a quieter space and play sustained notes.":
    "لم يتم رصد نغمات واضحة. حاول مجدداً في مكان أكثر هدوءاً واعزف نغمات مستدامة.",
  "The recording could not start. Please try again.":
    "تعذّر بدء التسجيل. حاول مجدداً.",
  "Could not start recording.": "تعذّر بدء التسجيل.",
  "Give this practice boundary a name to continue.":
    "أدخل اسماً لمجموعة التدريب للمتابعة.",
  "Select at least one Jins or Maqam.": "اختر جنساً أو مقاماً واحداً على الأقل.",
  'Delete "': "حذف «",
  "This practice has no available targets for that method.":
    "لا توجد أهداف متاحة لهذا الأسلوب في مجموعة التدريب.",
  "This practice has no available performance targets.":
    "لا توجد أهداف عزف متاحة لمجموعة التدريب هذه.",
  "Microphone access requires a supported browser on HTTPS or localhost.":
    "يتطلب الوصول إلى الميكروفون متصفحاً مدعوماً واتصالاً آمناً (HTTPS) أو localhost.",
  "Audio recording is not supported by this browser.":
    "هذا المتصفح لا يدعم تسجيل الصوت.",
  "Microphone access could not start.": "تعذّر تشغيل الميكروفون.",
  "This practice has no available questions.":
    "لا توجد أسئلة متاحة لمجموعة التدريب هذه.",
  "Listening Practice": "تدريب الاستماع",
  "Build a practice boundary from the ajnas and maqamat you want to master, then listen, identify, and play.":
    "أنشئ مجموعة تدريب من الأجناس والمقامات التي تريد إتقانها، ثم استمع وتعرّف واعزف.",
  "New practice boundary": "مجموعة تدريب جديدة",
  "Saved practices could not be read because the stored data is invalid.":
    "تعذّرت قراءة مجموعات التدريب المحفوظة لأن البيانات المخزنة غير صالحة.",
  "Some saved practices were invalid and were not loaded.":
    "بعض مجموعات التدريب المحفوظة غير صالحة ولم يتم تحميلها.",
  "Could not load saved practices.": "تعذّر تحميل مجموعات التدريب المحفوظة.",
  "Could not save practices.": "تعذّر حفظ مجموعات التدريب.",
  "Create a practice boundary": "إنشاء مجموعة تدريب",
  "Edit practice boundary": "تعديل مجموعة التدريب",
  "Step ": "الخطوة ",
  "Name it, choose your material, and select practice methods.":
    "سمّها، واختر مواد التدريب، ثم حدّد أساليب التمرين.",
  "Name this practice": "تسمية مجموعة التدريب",
  "Choose what to practice": "اختيار مواد التدريب",
  "Choose practice methods": "اختيار أساليب التدريب",
  "Give your boundary a name you will recognize in your practice list.":
    "اختر اسماً يسهل تمييزه في قائمة التدريب.",
  "Select one or more ajnas and maqamat to include.":
    "اختر جنساً أو مقاماً واحداً أو أكثر لإضافته.",
  "Only methods compatible with your selected material can be enabled.":
    "يمكن تفعيل الأساليب المتوافقة مع المواد التي اخترتها فقط.",
  "Boundary name": "اسم المجموعة",
  "e.g. Bayati and Rast review": "مثال: مراجعة البياتي والراست",
  "Ajnas (": "الأجناس (",
  " selected)": " محدد)",
  "Maqamat (": "المقامات (",
  "Practice methods": "أساليب التدريب",
  "Selected: ": "المحدد: ",
  " ajnas, ": " من الأجناس، ",
  " maqamat, ": " من المقامات، ",
  " methods.": " من الأساليب.",
  "Select at least one practice method compatible with your targets.":
    "اختر أسلوب تدريب واحداً على الأقل يتوافق مع الأهداف.",
  Back: "رجوع",
  Continue: "متابعة",
  "Save boundary": "حفظ المجموعة",
  "Prepare your instrument": "جهّز آلتك",
  "Play the prompted Maqam or Jins. You will have four seconds to get ready, followed by up to 12 seconds to perform.":
    "اعزف المقام أو الجنس المطلوب. لديك أربع ثوانٍ للاستعداد، ثم حتى ١٢ ثانية للعزف.",
  "Listen, then choose an answer.": "استمع ثم اختر إجابة.",
  "Tonic first; the second pitch is a higher scale degree.":
    "تأتي درجة القرار أولاً، ثم نغمة أعلى منها في السلم.",
  Replay: "إعادة الاستماع",
  "Correct.": "إجابة صحيحة.",
  "Not quite. The answer is ": "ليست الإجابة الصحيحة. الإجابة هي ",
  "Review the How To steps, replay the example, and try the next question.":
    "راجع خطوات التمرين، وأعد المثال، ثم جرّب السؤال التالي.",
  "Next question": "السؤال التالي",
  "Check answer": "تحقّق من الإجابة",
  "degree ": "الدرجة ",
  "Prepare your instrument.": "جهّز آلتك.",
  "Use your instrument to explore the target. Select Replay for a reference, then start when ready.":
    "استكشف الهدف باستخدام آلتك. اختر «إعادة الاستماع» لسماع المرجع، ثم ابدأ عندما تكون مستعداً.",
  "Recording starts in": "يبدأ التسجيل خلال",
  Recording: "جارٍ التسجيل",
  Live: "مباشر",
  "Recording time": "مدة التسجيل",
  "Performance analysis report": "تقرير تحليل الأداء",
  "Performance report": "تقرير الأداء",
  "Analyzed ": "تم تحليل ",
  " seconds of your recording.": " ثانية من تسجيلك.",
  Intonation: "دقة الضبط",
  "Boundary notes": "نغمات المجموعة",
  "Average deviation": "متوسط الانحراف",
  " in tune": " ضمن الضبط",
  " in target": " ضمن الهدف",
  "from the nearest 24-EDO pitch": "عن أقرب نغمة في نظام ٢٤ درجة متساوية",
  "Practice advice": "إرشادات التدريب",
  "Sustain each note and listen for a steady center before moving on.":
    "أطل كل نغمة وأنصت إلى استقرارها قبل الانتقال إلى التالية.",
  "Review the target scale and focus on its characteristic quarter-tone steps.":
    "راجع السلم المستهدف وركّز على أبعاده المميزة من أرباع الصوت.",
  "Good control. Try a more varied phrase while keeping the Maqam's characteristic notes clear.":
    "أداء متقن. جرّب جملة أكثر تنوعاً مع إبراز نغمات المقام المميزة.",
  "Play a few sustained notes and record again to receive skill levels and advice.":
    "اعزف بضع نغمات مستدامة وسجّل مجدداً للحصول على تقييم وإرشادات.",
  "Preparing microphone...": "جارٍ إعداد الميكروفون...",
  "Record again": "إعادة التسجيل",
  Start: "ابدأ",
  "Cancel countdown": "إلغاء العدّ التنازلي",
  Check: "تحقّق",
  Level: "المستوى",
  "Current streak": "التتابع الحالي",
  "answers checked": "إجابة تم التحقق منها",
  "Built-in": "مدمج",
  " ajnas · ": " من الأجناس · ",
  " maqamat": " من المقامات",
  "A preconfigured collection that cannot be changed or deleted.":
    "مجموعة مُعدّة مسبقاً ولا يمكن تعديلها أو حذفها.",
  "Your saved practice boundary.": "مجموعة التدريب المحفوظة.",
  "Edit boundary": "تعديل المجموعة",
  "Delete boundary": "حذف المجموعة",
  "Export JSON": "تصدير JSON",
  " as JSON": " بصيغة JSON",
  "Select compatible methods to begin practicing.":
    "اختر أساليب متوافقة لبدء التدريب.",
  "Play {kind} {name}": "اعزف {kind} {name}",
  "Jins": "جنس",
  Maqam: "مقام",
  "No questions available.": "لا توجد أسئلة متاحة.",
  "Exit Practice": "إنهاء التدريب",
  "Close boundary builder": "إغلاق منشئ مجموعة التدريب",
  "Level ": "المستوى ",
}

export function learningText(language: Language, text: string): string {
  if (language === "en") return text
  const generatedGrade = text.match(/^درجة (.+) - (.+)$/)
  if (generatedGrade) {
    return `الدرجة ${generatedGrade[1]} - ${learningText(language, generatedGrade[2])}`
  }
  const gradeNote = text.match(/^Grade (.+) - Open ([A-G]) string \(0\)$/)
  if (gradeNote) return `الدرجة ${gradeNote[1]} - وتر ${gradeNote[2]} المفتوح (0)`
  const fingerNote = text.match(
    /^([A-G]) string, Finger (\d+) \((.+)\) in (\d+)(?:st|nd|rd|th) Pos$/
  )
  if (fingerNote) {
    return `وتر ${fingerNote[1]}، الإصبع ${fingerNote[2]} (${fingerNote[3]}) في الموقع ${fingerNote[4]}`
  }
  const openString = text.match(/^Open ([A-G]) string \(0\)$/)
  if (openString) return `وتر ${openString[1]} المفتوح (0)`
  const vibratoOption = text.match(
    /^([A-G]) string, 4th Finger in 1st Pos \(Arabic vibrato option\)$/
  )
  if (vibratoOption) {
    return `وتر ${vibratoOption[1]}، الإصبع الرابع في الموقع الأول (خيار الاهتزاز العربي)`
  }
  if (text.startsWith("Degree ")) return `الدرجة ${text.slice(7)}`
  if (text.startsWith("Play ")) return `اعزف ${text.slice(5)}`
  if (text.startsWith("Delete ")) return `حذف ${text.slice(7)}`
  if (text.startsWith("Edit ")) return `تعديل ${text.slice(5)}`
  if (text.startsWith("Export ")) return `تصدير ${text.slice(7)}`
  if (text.startsWith("Could not load saved practices: ")) {
    return `تعذّر تحميل مجموعات التدريب المحفوظة: ${text.slice(32)}`
  }
  if (text.startsWith("Could not save practices: ")) {
    return `تعذّر حفظ مجموعات التدريب: ${text.slice(26)}`
  }
  if (text.startsWith("Could not record: ")) {
    return `تعذّر التسجيل: ${text.slice(18)}`
  }
  if (text.startsWith("Audio could not start: ")) {
    return `تعذّر بدء الصوت: ${text.slice(23)}`
  }
  if (text.startsWith("Recording · ")) {
    return `جارٍ التسجيل · ${text.slice(12)}`
  }
  return arabicCopy[text] ?? text
}
