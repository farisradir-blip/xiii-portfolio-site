// Client-side ports of the three rule-based conversation engines from
// lumora-salon-chatbot / wanderly-travel-chatbot / brightpath-academy-chatbot.
// Same logic as the Node.js originals, adapted to run with no server so the
// demos work directly on this static page.
(function () {
 const ARABIC_RE = /[؀-ۿ]/;
 const LATIN_LETTER_RE = /[a-zA-Z]/;
 function detectLang(text) { return ARABIC_RE.test(text) ? 'ar' : 'en'; }
 function hasLetters(text) { return ARABIC_RE.test(text) || LATIN_LETTER_RE.test(text); }
 function norm(text) { return (text || '').trim().toLowerCase(); }
 function matches(text, list) {
 const n = norm(text);
 return list.some((k) => n === norm(k) || n.includes(norm(k)));
 }
 function T(lang, en, ar) { return lang === 'ar' ? ar : en; }
 const YES = ['yes', 'y', 'confirm', 'نعم', 'ايوه', 'أكد', 'تأكيد'];
 const RESTART = ['menu', 'main menu', 'restart', 'قائمة', 'القائمة الرئيسية', 'رجوع'];
 const CANCEL = ['cancel', 'stop', 'الغاء', 'إلغاء', 'وقف'];
 const GREETING = ['hi', 'hello', 'hey', 'start', 'مرحبا', 'مرحبًا', 'السلام عليكم', 'سلام', 'أهلا', 'اهلا'];

 function newSession() {
 return { lang: null, step: 'idle', draft: {}, history: [] };
 }

 // ---------------- Lumora (salon booking) ----------------
 const lumora = (() => {
 const biz = {
 name: 'Lumora Beauty Studio', nameAr: 'صالون لومورا للتجميل',
 tagline: { en: 'Where beauty meets care', ar: 'حيث يلتقي الجمال بالعناية' },
 hours: { en: 'Saturday - Thursday: 10:00 AM - 9:00 PM. Friday: Closed.', ar: 'السبت - الخميس: 10:00 صباحاً - 9:00 مساءً. الجمعة: مغلق.' },
 location: { en: '14 Jasmine Street, Al Zahra District, Casablanca', ar: '14 شارع الياسمين، حي الزهراء، الدار البيضاء' },
 phone: '+212 6 00 11 22 33',
 paymentMethods: { en: 'Cash, credit/debit card, and mobile pay (in-salon only).', ar: 'الدفع نقداً، بالبطاقة البنكية، أو الدفع عبر الجوال (داخل الصالون فقط).' },
 cancellationPolicy: { en: 'Free cancellation up to 4 hours before your appointment. Late cancellations may incur a 20% fee.', ar: 'إلغاء مجاني حتى 4 ساعات قبل الموعد. الإلغاء المتأخر قد يترتب عنه رسوم 20%.' },
 services: [
 { id: 'hair-cut', name: { en: 'Haircut & Styling', ar: 'قص وتصفيف الشعر' }, price: 180, duration: '45 min' },
 { id: 'hair-color', name: { en: 'Hair Coloring', ar: 'صبغ الشعر' }, price: 450, duration: '2 hr' },
 { id: 'keratin', name: { en: 'Keratin Treatment', ar: 'علاج الكيراتين' }, price: 700, duration: '2.5 hr' },
 { id: 'manicure', name: { en: 'Manicure', ar: 'مانيكير' }, price: 120, duration: '40 min' },
 { id: 'pedicure', name: { en: 'Pedicure', ar: 'بديكير' }, price: 150, duration: '50 min' },
 { id: 'facial', name: { en: 'Deep Cleansing Facial', ar: 'تنظيف بشرة عميق' }, price: 300, duration: '1 hr' },
 { id: 'makeup', name: { en: 'Bridal / Event Makeup', ar: 'مكياج مناسبات / عروس' }, price: 600, duration: '1.5 hr' },
 { id: 'brows', name: { en: 'Eyebrow Threading & Tint', ar: 'تنظيف ورسم وصبغ الحواجب' }, price: 90, duration: '25 min' },
 ],
 currency: 'MAD',
 };
 const K = {
 services: ['services', 'price', 'prices', 'menu', 'خدمات', 'أسعار', 'اسعار', 'السعر', 'قائمة الخدمات'],
 book: ['book', 'booking', 'appointment', 'reserve', 'حجز', 'احجز', 'موعد', 'حجز موعد'],
 hours: ['hours', 'location', 'address', 'where', 'دوام', 'مواعيد العمل', 'عنوان', 'موقع', 'وين'],
 human: ['human', 'agent', 'talk to someone', 'representative', 'موظف', 'انسان', 'تحدث مع', 'تكلم مع احد'],
 faq: ['faq', 'cancel policy', 'payment', 'سياسة الإلغاء', 'الدفع', 'طرق الدفع'],
 };
 function genRef() { return 'LUM-' + Math.floor(100000 + Math.random() * 900000); }
 function mainMenu(lang) {
 const name = lang === 'ar' ? biz.nameAr : biz.name;
 return T(lang,
 `Hi! Welcome to *${name}* \n${biz.tagline.en}\n\nHow can I help you today?\n1. View services & prices\n2. Book an appointment\n3. Hours & location\n4. Talk to a human\n5. Payment & cancellation policy\n\nJust reply with a number, or type what you need.`,
 `أهلاً بك في *${name}* \n${biz.tagline.ar}\n\nكيف يمكنني مساعدتك اليوم؟\n1. الخدمات والأسعار\n2. حجز موعد\n3. مواعيد العمل والموقع\n4. التحدث مع موظف\n5. سياسة الدفع والإلغاء\n\nأرسل رقم الخيار أو اكتب طلبك مباشرة.`);
 }
 function servicesList(lang) {
 const lines = biz.services.map((s, i) => `${i + 1}. ${s.name[lang]} — ${s.price} ${biz.currency} (${s.duration})`).join('\n');
 return T(lang, `*Our Services*\n${lines}\n\nReply "book" to reserve one of these, or "menu" to go back.`,
 `*خدماتنا*\n${lines}\n\nاكتب "حجز" لحجز إحدى هذه الخدمات، أو "قائمة" للرجوع للقائمة الرئيسية.`);
 }
 function askService(lang) {
 const lines = biz.services.map((s, i) => `${i + 1}. ${s.name[lang]}`).join('\n');
 return T(lang, `Great! Which service would you like to book?\n${lines}\n\nReply with the number.`,
 `رائع! ما هي الخدمة التي تريد حجزها؟\n${lines}\n\nأرسل رقم الخدمة.`);
 }
 function confirmText(lang, d) {
 const svc = biz.services.find((s) => s.id === d.serviceId);
 return T(lang,
 `Please confirm:\n• Service: ${svc.name.en}\n• Price: ${svc.price} ${biz.currency}\n• Date: ${d.date}\n• Time: ${d.time}\n• Name: ${d.name}\n• Phone: ${d.phone}\n\nReply "yes" to confirm or "cancel" to start over.`,
 `يرجى تأكيد الحجز:\n• الخدمة: ${svc.name.ar}\n• السعر: ${svc.price} ${biz.currency}\n• التاريخ: ${d.date}\n• الوقت: ${d.time}\n• الاسم: ${d.name}\n• الهاتف: ${d.phone}\n\nأرسل "نعم" للتأكيد أو "الغاء" للبدء من جديد.`);
 }
 function handleMessage(session, rawText) {
 const text = (rawText || '').trim();
 if (!session.lang) session.lang = detectLang(text);
 if (hasLetters(text)) session.lang = detectLang(text);
 const lang = session.lang;
 const replies = [];
 if (matches(text, RESTART)) { session.step = 'idle'; session.draft = {}; replies.push(mainMenu(lang)); return { replies }; }
 if (session.step.startsWith('booking_') && matches(text, CANCEL)) {
 session.step = 'idle'; session.draft = {};
 replies.push(T(lang, 'Booking cancelled.', 'تم إلغاء الحجز.')); replies.push(mainMenu(lang));
 return { replies };
 }
 switch (session.step) {
 case 'idle':
 if (!text || matches(text, GREETING)) replies.push(mainMenu(lang));
 else if (text === '1' || matches(text, K.services)) replies.push(servicesList(lang));
 else if (text === '2' || matches(text, K.book)) { session.step = 'booking_service'; replies.push(askService(lang)); }
 else if (text === '3' || matches(text, K.hours)) replies.push(T(lang, `*Hours*: ${biz.hours.en}\n*Location*: ${biz.location.en}\n*Phone*: ${biz.phone}`, `*أوقات العمل*: ${biz.hours.ar}\n*الموقع*: ${biz.location.ar}\n*الهاتف*: ${biz.phone}`));
 else if (text === '4' || matches(text, K.human)) replies.push(T(lang, `Got it — one of our team members will reach out to you shortly on this same chat. In the meantime, you can also call us at ${biz.phone}.`, `تم — سيتواصل معك أحد أفراد فريقنا قريباً على نفس المحادثة. يمكنك أيضاً الاتصال بنا على ${biz.phone}.`));
 else if (text === '5' || matches(text, K.faq)) replies.push(T(lang, `*Payment*: ${biz.paymentMethods.en}\n\n*Cancellation policy*: ${biz.cancellationPolicy.en}`, `*الدفع*: ${biz.paymentMethods.ar}\n\n*سياسة الإلغاء*: ${biz.cancellationPolicy.ar}`));
 else { replies.push(T(lang, `Sorry, I didn't quite get that. Type "menu" to see what I can help with.`, `عذراً، لم أفهم ذلك تماماً. اكتب "قائمة" لرؤية ما يمكنني مساعدتك به.`)); replies.push(mainMenu(lang)); }
 break;
 case 'booking_service': {
 const svc = biz.services[parseInt(text, 10) - 1];
 if (!svc) { replies.push(T(lang, 'Please reply with a valid number from the list.', 'يرجى إرسال رقم صحيح من القائمة.')); replies.push(askService(lang)); break; }
 session.draft.serviceId = svc.id; session.step = 'booking_date';
 replies.push(T(lang, `Booking: *${svc.name[lang]}*. What date would you like? (e.g. "Friday" or "2026-09-25")`, `الحجز: *${svc.name[lang]}*. ما التاريخ الذي تفضله؟ (مثال: "الجمعة" أو "2026-09-25")`));
 break;
 }
 case 'booking_date':
 if (!text) { replies.push(T(lang, 'What date would you like?', 'ما التاريخ الذي تفضله؟')); break; }
 session.draft.date = text; session.step = 'booking_time';
 replies.push(T(lang, 'What time works best for you? (e.g. "5 PM")', 'ما الوقت المناسب لك؟ (مثال: "5 مساءً")'));
 break;
 case 'booking_time':
 if (!text) { replies.push(T(lang, 'What time works best for you?', 'ما الوقت المناسب لك؟')); break; }
 session.draft.time = text; session.step = 'booking_name';
 replies.push(T(lang, 'Can I have your full name for the reservation?', 'ما اسمك الكامل لتثبيت الحجز؟'));
 break;
 case 'booking_name':
 if (!text) { replies.push(T(lang, 'Can I have your full name?', 'ما اسمك الكامل؟')); break; }
 session.draft.name = text; session.step = 'booking_phone';
 replies.push(T(lang, 'And a phone number to confirm the appointment?', 'وما رقم هاتفك لتأكيد الموعد؟'));
 break;
 case 'booking_phone':
 if (!text) { replies.push(T(lang, 'And a phone number?', 'وما رقم هاتفك؟')); break; }
 session.draft.phone = text; session.step = 'booking_confirm';
 replies.push(confirmText(lang, session.draft));
 break;
 case 'booking_confirm':
 if (matches(text, YES)) {
 replies.push(T(lang, `Booked! Your reference number is *${genRef()}*. We'll send a reminder before your appointment. See you soon at Lumora!\n\nType "menu" anytime for more options.`, `تم الحجز! رقم الحجز الخاص بك هو *${genRef()}*. سنرسل لك تذكيراً قبل الموعد. نراك قريباً في لومورا!\n\nاكتب "قائمة" في أي وقت لمزيد من الخيارات.`));
 session.step = 'idle'; session.draft = {};
 } else replies.push(confirmText(lang, session.draft));
 break;
 default: session.step = 'idle'; replies.push(mainMenu(lang));
 }
 return { replies };
 }
 return { handleMessage, greeting: () => mainMenu('en') };
 })();

 // ---------------- Wanderly (travel quotes) ----------------
 const wanderly = (() => {
 const biz = {
 name: 'Wanderly Travel & Tours', nameAr: 'واندرلي للسفر والسياحة',
 tagline: { en: 'Your next adventure, planned for you', ar: 'مغامرتك القادمة، مخطط لها من أجلك' },
 hours: { en: 'Sunday - Thursday: 9:00 AM - 7:00 PM. Friday - Saturday: 10:00 AM - 4:00 PM.', ar: 'الأحد - الخميس: 9:00 صباحاً - 7:00 مساءً. الجمعة - السبت: 10:00 صباحاً - 4:00 مساءً.' },
 location: { en: '22 Marina Boulevard, Downtown Office Tower, Suite 501, Dubai', ar: '22 شارع المارينا، برج المكاتب وسط المدينة، مكتب 501، دبي' },
 phone: '+971 4 555 0199',
 paymentMethods: { en: 'Bank transfer, credit card, or installments via our partner (up to 6 months, 0% interest).', ar: 'تحويل بنكي، بطاقة ائتمان، أو تقسيط عبر شريكنا (حتى 6 أشهر بدون فوائد).' },
 cancellationPolicy: { en: 'Free cancellation up to 14 days before departure. 50% refund 7-13 days before. No refund within 7 days.', ar: 'إلغاء مجاني حتى 14 يوماً قبل السفر. استرداد 50% بين 7-13 يوماً. لا استرداد خلال 7 أيام.' },
 packages: [
 { id: 'turkey-7', name: { en: 'Istanbul & Cappadocia — 7 Days', ar: 'إسطنبول والكبادوكيا — 7 أيام' }, price: 780, includes: { en: 'Flights, 4hotels, daily breakfast, hot air balloon ride, city tours', ar: 'طيران، فنادق 4 نجوم، إفطار يومي، رحلة منطاد، جولات سياحية' } },
 { id: 'egypt-6', name: { en: 'Cairo & Luxor — 6 Days', ar: 'القاهرة والأقصر — 6 أيام' }, price: 690, includes: { en: 'Flights, Nile cruise, Pyramids & Sphinx tour, Egyptologist guide', ar: 'طيران، رحلة نيلية، جولة الأهرامات وأبو الهول، مرشد أثري' } },
 { id: 'dubai-4', name: { en: 'Dubai City Break — 4 Days', ar: 'رحلة دبي القصيرة — 4 أيام' }, price: 520, includes: { en: 'Flights, 5hotel, desert safari, Burj Khalifa tickets', ar: 'طيران، فندق 5 نجوم، سفاري صحراوي، تذاكر برج خليفة' } },
 { id: 'morocco-8', name: { en: 'Marrakech, Fes & Sahara — 8 Days', ar: 'مراكش وفاس والصحراء — 8 أيام' }, price: 850, includes: { en: 'Flights, riads, camel trek & desert camp, Atlas Mountains day trip', ar: 'طيران، إقامة في رياض، رحلة جمال ومخيم صحراوي، رحلة جبال الأطلس' } },
 { id: 'malaysia-9', name: { en: 'Kuala Lumpur & Langkawi — 9 Days', ar: 'كوالالمبور ولنكاوي — 9 أيام' }, price: 990, includes: { en: 'Flights, island resort stay, cable car, city + island tours', ar: 'طيران، إقامة منتجع جزيرة، تلفريك، جولات مدينة وجزيرة' } },
 { id: 'georgia-5', name: { en: 'Tbilisi & Batumi — 5 Days', ar: 'تبليسي وباتومي — 5 أيام' }, price: 460, includes: { en: 'Flights, boutique hotels, wine region day trip, old town tour', ar: 'طيران، فنادق بوتيك، رحلة منطقة النبيذ، جولة البلدة القديمة' } },
 ],
 currency: 'USD',
 };
 const K = {
 packages: ['packages', 'destinations', 'trips', 'price', 'prices', 'باقات', 'وجهات', 'رحلات', 'أسعار', 'اسعار'],
 book: ['book', 'booking', 'quote', 'reserve', 'inquire', 'حجز', 'احجز', 'استفسار', 'اطلب عرض سعر'],
 hours: ['hours', 'location', 'address', 'where', 'office', 'دوام', 'مواعيد العمل', 'عنوان', 'موقع', 'مكتب'],
 human: ['human', 'agent', 'talk to someone', 'representative', 'موظف', 'انسان', 'تحدث مع', 'تكلم مع احد'],
 faq: ['faq', 'cancel policy', 'payment', 'installment', 'سياسة الإلغاء', 'الدفع', 'طرق الدفع', 'تقسيط'],
 };
 function genRef() { return 'WND-' + Math.floor(100000 + Math.random() * 900000); }
 function mainMenu(lang) {
 const name = lang === 'ar' ? biz.nameAr : biz.name;
 return T(lang,
 `Hi! Welcome to *${name}* \n${biz.tagline.en}\n\nHow can I help you today?\n1. Browse trip packages\n2. Request a quote / book a trip\n3. Office hours & location\n4. Talk to a travel agent\n5. Payment & cancellation policy\n\nJust reply with a number, or type what you need.`,
 `أهلاً بك في *${name}* \n${biz.tagline.ar}\n\nكيف يمكنني مساعدتك اليوم؟\n1. تصفح باقات الرحلات\n2. طلب عرض سعر / حجز رحلة\n3. مواعيد العمل والموقع\n4. التحدث مع مستشار سفر\n5. سياسة الدفع والإلغاء\n\nأرسل رقم الخيار أو اكتب طلبك مباشرة.`);
 }
 function packagesList(lang) {
 const lines = biz.packages.map((p, i) => `${i + 1}. ${p.name[lang]} — from ${p.price} ${biz.currency}/person\n ${p.includes[lang]}`).join('\n\n');
 return T(lang, `*Our Packages*\n\n${lines}\n\nReply "book" to request a quote for one of these, or "menu" to go back.`,
 `*باقاتنا*\n\n${lines}\n\nاكتب "حجز" لطلب عرض سعر لإحدى هذه الرحلات، أو "قائمة" للرجوع للقائمة الرئيسية.`);
 }
 function askPackage(lang) {
 const lines = biz.packages.map((p, i) => `${i + 1}. ${p.name[lang]}`).join('\n');
 return T(lang, `Great! Which package are you interested in?\n${lines}\n\nReply with the number.`,
 `رائع! ما هي الباقة التي تهمك؟\n${lines}\n\nأرسل رقم الباقة.`);
 }
 function confirmText(lang, d) {
 const pkg = biz.packages.find((p) => p.id === d.packageId);
 return T(lang,
 `Please confirm your request:\n• Package: ${pkg.name.en}\n• From: ${pkg.price} ${biz.currency}/person\n• Travelers: ${d.travelers}\n• Preferred month: ${d.month}\n• Name: ${d.name}\n• Contact: ${d.phone}\n\nReply "yes" to submit or "cancel" to start over.`,
 `يرجى تأكيد طلبك:\n• الباقة: ${pkg.name.ar}\n• ابتداءً من: ${pkg.price} ${biz.currency}/للشخص\n• عدد المسافرين: ${d.travelers}\n• الشهر المفضل: ${d.month}\n• الاسم: ${d.name}\n• وسيلة التواصل: ${d.phone}\n\nأرسل "نعم" لإرسال الطلب أو "الغاء" للبدء من جديد.`);
 }
 function handleMessage(session, rawText) {
 const text = (rawText || '').trim();
 if (!session.lang) session.lang = detectLang(text);
 if (hasLetters(text)) session.lang = detectLang(text);
 const lang = session.lang;
 const replies = [];
 if (matches(text, RESTART)) { session.step = 'idle'; session.draft = {}; replies.push(mainMenu(lang)); return { replies }; }
 if (session.step.startsWith('booking_') && matches(text, CANCEL)) {
 session.step = 'idle'; session.draft = {};
 replies.push(T(lang, 'Request cancelled.', 'تم إلغاء الطلب.')); replies.push(mainMenu(lang));
 return { replies };
 }
 switch (session.step) {
 case 'idle':
 if (!text || matches(text, GREETING)) replies.push(mainMenu(lang));
 else if (text === '1' || matches(text, K.packages)) replies.push(packagesList(lang));
 else if (text === '2' || matches(text, K.book)) { session.step = 'booking_package'; replies.push(askPackage(lang)); }
 else if (text === '3' || matches(text, K.hours)) replies.push(T(lang, `*Hours*: ${biz.hours.en}\n*Office*: ${biz.location.en}\n*Phone*: ${biz.phone}`, `*أوقات العمل*: ${biz.hours.ar}\n*المكتب*: ${biz.location.ar}\n*الهاتف*: ${biz.phone}`));
 else if (text === '4' || matches(text, K.human)) replies.push(T(lang, `Got it — one of our travel agents will reach out to you shortly. Or call ${biz.phone}.`, `تم — سيتواصل معك أحد مستشاري السفر قريباً. أو اتصل بنا على ${biz.phone}.`));
 else if (text === '5' || matches(text, K.faq)) replies.push(T(lang, `*Payment*: ${biz.paymentMethods.en}\n\n*Cancellation policy*: ${biz.cancellationPolicy.en}`, `*الدفع*: ${biz.paymentMethods.ar}\n\n*سياسة الإلغاء*: ${biz.cancellationPolicy.ar}`));
 else { replies.push(T(lang, `Sorry, I didn't quite get that. Type "menu" to see what I can help with.`, `عذراً، لم أفهم ذلك تماماً. اكتب "قائمة" لرؤية ما يمكنني مساعدتك به.`)); replies.push(mainMenu(lang)); }
 break;
 case 'booking_package': {
 const pkg = biz.packages[parseInt(text, 10) - 1];
 if (!pkg) { replies.push(T(lang, 'Please reply with a valid number from the list.', 'يرجى إرسال رقم صحيح من القائمة.')); replies.push(askPackage(lang)); break; }
 session.draft.packageId = pkg.id; session.step = 'booking_travelers';
 replies.push(T(lang, `Package: *${pkg.name[lang]}*. How many travelers?`, `الباقة: *${pkg.name[lang]}*. كم عدد المسافرين؟`));
 break;
 }
 case 'booking_travelers':
 if (!text) { replies.push(T(lang, 'How many travelers?', 'كم عدد المسافرين؟')); break; }
 session.draft.travelers = text; session.step = 'booking_month';
 replies.push(T(lang, 'Which month would you like to travel?', 'في أي شهر تود السفر؟'));
 break;
 case 'booking_month':
 if (!text) { replies.push(T(lang, 'Which month?', 'أي شهر؟')); break; }
 session.draft.month = text; session.step = 'booking_name';
 replies.push(T(lang, 'Can I have your full name for the booking request?', 'ما اسمك الكامل لطلب الحجز؟'));
 break;
 case 'booking_name':
 if (!text) { replies.push(T(lang, 'Can I have your full name?', 'ما اسمك الكامل؟')); break; }
 session.draft.name = text; session.step = 'booking_phone';
 replies.push(T(lang, 'And a phone number or email so our agent can reach you?', 'وما رقم هاتفك أو بريدك الإلكتروني ليتواصل معك مستشارنا؟'));
 break;
 case 'booking_phone':
 if (!text) { replies.push(T(lang, 'A phone number or email?', 'رقم هاتف أو بريد إلكتروني؟')); break; }
 session.draft.phone = text; session.step = 'booking_confirm';
 replies.push(confirmText(lang, session.draft));
 break;
 case 'booking_confirm':
 if (matches(text, YES)) {
 replies.push(T(lang, `Request received! Your reference number is *${genRef()}*. A travel agent will contact you within 24 hours.\n\nType "menu" anytime for more options.`, `تم استلام طلبك! رقم الطلب الخاص بك هو *${genRef()}*. سيتواصل معك أحد مستشاري السفر خلال 24 ساعة.\n\nاكتب "قائمة" في أي وقت لمزيد من الخيارات.`));
 session.step = 'idle'; session.draft = {};
 } else replies.push(confirmText(lang, session.draft));
 break;
 default: session.step = 'idle'; replies.push(mainMenu(lang));
 }
 return { replies };
 }
 return { handleMessage, greeting: () => mainMenu('en') };
 })();

 // ---------------- BrightPath (academy enrollment) ----------------
 const brightpath = (() => {
 const biz = {
 name: 'BrightPath Learning Academy', nameAr: 'أكاديمية برايت باث للتدريب',
 tagline: { en: 'Skills that open doors', ar: 'مهارات تفتح لك الأبواب' },
 hours: { en: 'Sunday - Thursday: 9:00 AM - 8:00 PM. Friday - Saturday: 10:00 AM - 2:00 PM.', ar: 'الأحد - الخميس: 9:00 صباحاً - 8:00 مساءً. الجمعة - السبت: 10:00 صباحاً - 2:00 ظهراً.' },
 location: { en: '7 Innovation Street, Knowledge Village, Amman', ar: '7 شارع الابتكار، قرية المعرفة، عمّان' },
 phone: '+962 6 500 8822',
 paymentMethods: { en: 'Cash, credit/debit card, or installments (up to 3 months, 0% interest). A 20% deposit reserves your seat.', ar: 'الدفع نقداً، بالبطاقة البنكية، أو تقسيط (حتى 3 أشهر بدون فوائد). عربون 20% يحجز مقعدك.' },
 cancellationPolicy: { en: 'Full refund if you withdraw before the course starts. 50% refund within the first week. No refund after week 2.', ar: 'استرداد كامل عند الانسحاب قبل بدء الدورة. استرداد 50% خلال الأسبوع الأول. لا استرداد بعد الأسبوع الثاني.' },
 courses: [
 { id: 'web-dev', name: { en: 'Full-Stack Web Development', ar: 'تطوير الويب المتكامل' }, price: 950, duration: { en: '12 weeks, 3 sessions/week', ar: '12 أسبوعاً، 3 جلسات/أسبوع' } },
 { id: 'digital-marketing', name: { en: 'Digital Marketing & Social Media', ar: 'التسويق الرقمي ووسائل التواصل' }, price: 480, duration: { en: '6 weeks, 2 sessions/week', ar: '6 أسابيع، جلستان/أسبوع' } },
 { id: 'graphic-design', name: { en: 'Graphic Design (Adobe Suite)', ar: 'التصميم الجرافيكي (حزمة أدوبي)' }, price: 550, duration: { en: '8 weeks, 2 sessions/week', ar: '8 أسابيع، جلستان/أسبوع' } },
 { id: 'english', name: { en: 'Business English (B1-C1)', ar: 'اللغة الإنجليزية للأعمال' }, price: 320, duration: { en: '10 weeks, 2 sessions/week', ar: '10 أسابيع، جلستان/أسبوع' } },
 { id: 'data-analysis', name: { en: 'Data Analysis with Excel & Power BI', ar: 'تحليل البيانات باستخدام Excel و Power BI' }, price: 600, duration: { en: '7 weeks, 2 sessions/week', ar: '7 أسابيع، جلستان/أسبوع' } },
 { id: 'ux-ui', name: { en: 'UX/UI Design Fundamentals', ar: 'أساسيات تصميم تجربة وواجهة المستخدم' }, price: 620, duration: { en: '8 weeks, 2 sessions/week', ar: '8 أسابيع، جلستان/أسبوع' } },
 ],
 schedules: {
 en: ['Morning (9 AM - 12 PM)', 'Evening (6 PM - 9 PM)', 'Weekend (Fri-Sat)'],
 ar: ['صباحي (9 ص - 12 ظ)', 'مسائي (6 م - 9 م)', 'نهاية الأسبوع (جمعة-سبت)'],
 },
 currency: 'JOD',
 };
 const K = {
 courses: ['courses', 'programs', 'price', 'prices', 'دورات', 'برامج', 'أسعار', 'اسعار'],
 enroll: ['enroll', 'enrol', 'register', 'sign up', 'join', 'تسجيل', 'التحاق', 'انضمام', 'سجلني'],
 hours: ['hours', 'location', 'address', 'where', 'دوام', 'مواعيد العمل', 'عنوان', 'موقع'],
 human: ['human', 'agent', 'counselor', 'advisor', 'talk to someone', 'موظف', 'انسان', 'مستشار', 'تحدث مع'],
 faq: ['faq', 'cancel policy', 'payment', 'installment', 'سياسة الإلغاء', 'الدفع', 'طرق الدفع', 'تقسيط'],
 };
 function genRef() { return 'BPA-' + Math.floor(100000 + Math.random() * 900000); }
 function mainMenu(lang) {
 const name = lang === 'ar' ? biz.nameAr : biz.name;
 return T(lang,
 `Hi! Welcome to *${name}* \n${biz.tagline.en}\n\nHow can I help you today?\n1. Browse courses & prices\n2. Enroll in a course\n3. Hours & location\n4. Talk to an academic advisor\n5. Payment & cancellation policy\n\nJust reply with a number, or type what you need.`,
 `أهلاً بك في *${name}* \n${biz.tagline.ar}\n\nكيف يمكنني مساعدتك اليوم؟\n1. تصفح الدورات والأسعار\n2. التسجيل في دورة\n3. مواعيد العمل والموقع\n4. التحدث مع مستشار أكاديمي\n5. سياسة الدفع والإلغاء\n\nأرسل رقم الخيار أو اكتب طلبك مباشرة.`);
 }
 function coursesList(lang) {
 const lines = biz.courses.map((c, i) => `${i + 1}. ${c.name[lang]} — ${c.price} ${biz.currency}\n ${c.duration[lang]}`).join('\n\n');
 return T(lang, `*Our Courses*\n\n${lines}\n\nReply "enroll" to sign up for one of these, or "menu" to go back.`,
 `*دوراتنا*\n\n${lines}\n\nاكتب "تسجيل" للالتحاق بإحدى هذه الدورات، أو "قائمة" للرجوع للقائمة الرئيسية.`);
 }
 function askCourse(lang) {
 const lines = biz.courses.map((c, i) => `${i + 1}. ${c.name[lang]}`).join('\n');
 return T(lang, `Great! Which course would you like to enroll in?\n${lines}\n\nReply with the number.`,
 `رائع! ما هي الدورة التي تريد التسجيل فيها؟\n${lines}\n\nأرسل رقم الدورة.`);
 }
 function askSchedule(lang, courseName) {
 const lines = biz.schedules[lang].map((s, i) => `${i + 1}. ${s}`).join('\n');
 return T(lang, `Course: *${courseName}*. Which schedule works for you?\n${lines}\n\nReply with the number.`,
 `الدورة: *${courseName}*. ما الجدول المناسب لك؟\n${lines}\n\nأرسل الرقم.`);
 }
 function confirmText(lang, d) {
 const course = biz.courses.find((c) => c.id === d.courseId);
 const scheduleLabel = biz.schedules[lang][parseInt(d.scheduleIdx, 10) - 1];
 return T(lang,
 `Please confirm your enrollment:\n• Course: ${course.name.en}\n• Price: ${course.price} ${biz.currency}\n• Schedule: ${scheduleLabel}\n• Name: ${d.name}\n• Contact: ${d.phone}\n\nReply "yes" to submit or "cancel" to start over.`,
 `يرجى تأكيد تسجيلك:\n• الدورة: ${course.name.ar}\n• السعر: ${course.price} ${biz.currency}\n• الجدول: ${scheduleLabel}\n• الاسم: ${d.name}\n• وسيلة التواصل: ${d.phone}\n\nأرسل "نعم" لإرسال الطلب أو "الغاء" للبدء من جديد.`);
 }
 function handleMessage(session, rawText) {
 const text = (rawText || '').trim();
 if (!session.lang) session.lang = detectLang(text);
 if (hasLetters(text)) session.lang = detectLang(text);
 const lang = session.lang;
 const replies = [];
 if (matches(text, RESTART)) { session.step = 'idle'; session.draft = {}; replies.push(mainMenu(lang)); return { replies }; }
 if (session.step.startsWith('enroll_') && matches(text, CANCEL)) {
 session.step = 'idle'; session.draft = {};
 replies.push(T(lang, 'Enrollment cancelled.', 'تم إلغاء التسجيل.')); replies.push(mainMenu(lang));
 return { replies };
 }
 switch (session.step) {
 case 'idle':
 if (!text || matches(text, GREETING)) replies.push(mainMenu(lang));
 else if (text === '1' || matches(text, K.courses)) replies.push(coursesList(lang));
 else if (text === '2' || matches(text, K.enroll)) { session.step = 'enroll_course'; replies.push(askCourse(lang)); }
 else if (text === '3' || matches(text, K.hours)) replies.push(T(lang, `*Hours*: ${biz.hours.en}\n*Location*: ${biz.location.en}\n*Phone*: ${biz.phone}`, `*أوقات العمل*: ${biz.hours.ar}\n*الموقع*: ${biz.location.ar}\n*الهاتف*: ${biz.phone}`));
 else if (text === '4' || matches(text, K.human)) replies.push(T(lang, `Got it — one of our academic advisors will reach out to you shortly. Or call ${biz.phone}.`, `تم — سيتواصل معك أحد مستشارينا الأكاديميين قريباً. أو اتصل بنا على ${biz.phone}.`));
 else if (text === '5' || matches(text, K.faq)) replies.push(T(lang, `*Payment*: ${biz.paymentMethods.en}\n\n*Cancellation policy*: ${biz.cancellationPolicy.en}`, `*الدفع*: ${biz.paymentMethods.ar}\n\n*سياسة الإلغاء*: ${biz.cancellationPolicy.ar}`));
 else { replies.push(T(lang, `Sorry, I didn't quite get that. Type "menu" to see what I can help with.`, `عذراً، لم أفهم ذلك تماماً. اكتب "قائمة" لرؤية ما يمكنني مساعدتك به.`)); replies.push(mainMenu(lang)); }
 break;
 case 'enroll_course': {
 const course = biz.courses[parseInt(text, 10) - 1];
 if (!course) { replies.push(T(lang, 'Please reply with a valid number from the list.', 'يرجى إرسال رقم صحيح من القائمة.')); replies.push(askCourse(lang)); break; }
 session.draft.courseId = course.id; session.step = 'enroll_schedule';
 replies.push(askSchedule(lang, course.name[lang]));
 break;
 }
 case 'enroll_schedule': {
 const idx = parseInt(text, 10) - 1;
 if (!biz.schedules[lang][idx]) { replies.push(T(lang, 'Please reply with a valid number from the list.', 'يرجى إرسال رقم صحيح من القائمة.')); replies.push(askSchedule(lang, biz.courses.find((c) => c.id === session.draft.courseId).name[lang])); break; }
 session.draft.scheduleIdx = text; session.step = 'enroll_name';
 replies.push(T(lang, 'Can I have your full name for the enrollment?', 'ما اسمك الكامل للتسجيل؟'));
 break;
 }
 case 'enroll_name':
 if (!text) { replies.push(T(lang, 'Can I have your full name?', 'ما اسمك الكامل؟')); break; }
 session.draft.name = text; session.step = 'enroll_phone';
 replies.push(T(lang, 'And a phone number or email so we can confirm your seat?', 'وما رقم هاتفك أو بريدك الإلكتروني لتأكيد مقعدك؟'));
 break;
 case 'enroll_phone':
 if (!text) { replies.push(T(lang, 'A phone number or email?', 'رقم هاتف أو بريد إلكتروني؟')); break; }
 session.draft.phone = text; session.step = 'enroll_confirm';
 replies.push(confirmText(lang, session.draft));
 break;
 case 'enroll_confirm':
 if (matches(text, YES)) {
 replies.push(T(lang, `Enrollment request received! Your reference number is *${genRef()}*. An academic advisor will contact you within 24 hours.\n\nType "menu" anytime for more options.`, `تم استلام طلب التسجيل! رقم الطلب الخاص بك هو *${genRef()}*. سيتواصل معك مستشار أكاديمي خلال 24 ساعة.\n\nاكتب "قائمة" في أي وقت لمزيد من الخيارات.`));
 session.step = 'idle'; session.draft = {};
 } else replies.push(confirmText(lang, session.draft));
 break;
 default: session.step = 'idle'; replies.push(mainMenu(lang));
 }
 return { replies };
 }
 return { handleMessage, greeting: () => mainMenu('en') };
 })();

 // ---------------- XIII FAQ bot (about the developer) ----------------
 const xiii = (() => {
  function normFlex(text) {
    let t = (text || '').toLowerCase().trim();
    t = t.replace(/[ً-ْـ]/g, '');
    t = t.replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[ؤئ]/g, 'ء');
    t = t.replace(/[؟!،؛.,?!;:'"()[\]{}\-_/\\]/g, ' ');
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  }
  function flexMatches(text, list) {
    const n = ' ' + normFlex(text) + ' ';
    if (n.trim() === '') return false;
    return list.some((k) => {
      const nk = normFlex(k);
      return nk && n.includes(' ' + nk + ' ');
    });
  }

  const FAQ = [
    { k: ['who', 'about you', 'about xiii', 'what are you', 'introduce yourself', 'tell me about you', 'qui es-tu', "c'est quoi xiii", 'من هو', 'من انت', 'من أنت', 'عن نفسك', 'مين انت', 'شكون نتا', 'شنو نتا', 'عرفني بيك', 'قدم نفسك'],
      en: "I'm XIII, a chatbot developer — personal bots, business bots, website bots, or store bots. I can also take it further and turn it into a full AI agent that controls your website through chat with the user.",
      ar: 'أنا XIII، مطوّر بوتات دردشة — سواء بوتات شخصية، أو لشركات، أو لمواقع إلكترونية، أو لمتاجر. وأقدر أطوّر البوت ليصبح وكيل ذكاء اصطناعي يتحكم بموقعك بالكامل من خلال الدردشة مع المستخدم.' },
    { k: ['portfolio', 'example', 'examples', 'projects', 'demo', 'demos', 'past work', 'show me your work', 'see your work', 'projets', 'أعمال', 'مشاريع', 'أمثلة', 'شغل', 'شو سويت', 'ورينا شغلك', 'وريني اعمالك'],
      en: 'Scroll down to the "Work" section — you can actually chat with three live bot demos I built: a salon booking bot, a travel quote bot, and a course enrollment bot.',
      ar: 'انزل لقسم "أعمالي" — فيه ثلاثة بوتات حية تقدر تجربها فعلياً: بوت حجز صالون، بوت عروض أسعار سفر، وبوت تسجيل بدورات.' },
    { k: ['technology', 'technologies', 'stack', 'skills', 'programming language', 'built with', 'made with', 'coded in', 'technologie', 'تقنيات', 'مهارات', 'لغة برمجة', 'مبني', 'بشنو مبني', 'أشنو كتستخدم'],
      en: 'Node.js and Express on the backend, official Meta Graph APIs (WhatsApp Cloud API, Messenger Platform, Instagram Messaging) for the channels, and bilingual Arabic/English conversation engines.',
      ar: 'Node.js و Express في الباك إند، وواجهات ميتا الرسمية (WhatsApp Cloud API وماسنجر وانستغرام) للقنوات، ومحرك محادثة ثنائي اللغة عربي/إنجليزي.' },
    { k: ['price', 'prices', 'cost', 'how much', 'pricing', 'quote', 'rate', 'rates', 'budget', 'combien', 'prix', 'ça coute', 'chhal', 'bchhal', 'taman', 'bghit ta3rf taman', 'سعر', 'الاسعار', 'تكلفة', 'كم السعر', 'كم كيكلف', 'شحال', 'بشحال', 'فلوس', 'تمن', 'الثمن'],
      en: "Starting from $100, but the final price depends on the bot's complexity — how it works, what inputs it needs, and the overall scope. No deposit needed unless it's a large project.",
      ar: 'يبدأ السعر من 100 دولار، لكن السعر النهائي يعتمد على تعقيد البوت — كيف يعمل، وما المدخلات التي يحتاجها، وحجم العمل. لا يُطلب عربون إلا إذا كان المشروع كبيرًا.' },
    { k: ['deposit', 'upfront', 'advance payment', 'down payment', 'pay first', 'acompte', 'عربون', 'مقدم', 'دفعة مقدمة', 'تسبيق'],
      en: "No deposit for most projects — only for larger jobs with a lot of work involved. The rest is due on completion.",
      ar: 'ما في عربون للمشاريع العادية — فقط للأعمال الكبيرة اللي فيها شغل كثير. الباقي يُدفع عند التسليم.' },
    { k: ['discount', 'multiple bots', 'several bots', 'more than one bot', 'bulk price', 'reduction', 'خصم', 'أكثر من بوت', 'عدة بوتات', 'بوتات متعددة', 'تخفيض', 'واحد تخفيض'],
      en: "Order more than 3 bots and you get a generous discount starting from the 4th one onward.",
      ar: 'إذا طلبت أكثر من 3 بوتات، تحصل على خصم سخي ابتداءً من البوت الرابع وما بعده.' },
    { k: ['industry', 'industries', 'business type', 'any business', 'what kind of business', 'restaurant', 'clinic', 'shop', 'e-commerce', 'secteur', 'نشاط', 'مجال', 'مطعم', 'عيادة', 'متجر', 'شركة', 'أي نوع نشاط', 'تجارة الكترونية'],
      en: "Any business, any industry. That said, what I enjoy building most is informational bots for websites — regular sites or e-commerce — and even an in-site agent that controls your website's interface and takes visitors exactly where they want to go, all through chat.",
      ar: 'أي نشاط تجاري وأي مجال. لكن اللي أفضّل بناءه أكثر هو بوتات تعريفية للمواقع الإلكترونية — عادية أو متاجر إلكترونية — وحتى "إيجنت" داخل الموقع يتحكم بواجهة المستخدم ويأخذ الزائر بالضبط للمكان اللي يريده، كل ذلك عبر الدردشة.' },
    { k: ['platform', 'platforms', 'whatsapp', 'messenger', 'instagram', 'website bot', 'site web', 'منصة', 'منصات', 'واتساب', 'ماسنجر', 'انستغرام', 'انستقرام', 'بوت للموقع'],
      en: "I can build for WhatsApp, Messenger, and Instagram — see the live demos above. But my main focus these days is website bots: chat widgets and in-site agents that guide visitors through your website itself.",
      ar: 'أقدر أبني بوتات لواتساب وماسنجر وانستغرام — شاهد الأمثلة الحية أعلاه. لكن تركيزي الأساسي حاليًا هو بوتات المواقع الإلكترونية: ويدجت دردشة وإيجنتات داخل الموقع توجّه الزائر بنفسها.' },
    { k: ['how long', 'time', 'timeline', 'duration', 'delivery time', 'combien de temps', 'delai', 'مدة', 'وقت', 'كم يوم', 'كم اسبوع', 'شحال ديال الوقت', 'قداش وقت'],
      en: "Depends on the specific bot — simpler ones are faster, more complex ones take longer. We work out the details directly during our conversation.",
      ar: 'المدة تعتمد على طبيعة البوت المطلوب — البسيط أسرع، والمعقد يأخذ وقتًا أطول. نحدد التفاصيل مباشرة أثناء التواصل.' },
    { k: ['info needed', 'information needed', 'what do you need', 'what do you need from me', 'get started', 'to start', 'معلومات', 'تحتاج مني', 'كيف أبدأ', 'اشنو خاصك مني', 'باش نبداو'],
      en: "There's no fixed checklist — I gather everything I need directly from you during our conversation, based on what your bot needs.",
      ar: 'لا توجد قائمة ثابتة — أجمع كل ما أحتاجه منك مباشرة أثناء التواصل، حسب ما يحتاجه بوتك بالتحديد.' },
    { k: ['bug', 'bugs', 'break', 'breaks', 'broke', 'broken', 'fix', 'not working', 'stopped working', 'support', 'maintenance', 'problem with the bot', 'مشكلة', 'خطأ', 'دعم', 'صيانة', 'عطل', 'خربان', 'خرب', 'ماخدامش', 'ماشي خدام'],
      en: "If something breaks because of how I built the bot, I fix it for free — that's on me. Want a new feature added later? That's priced separately based on what it involves.",
      ar: 'لو صار أي خطأ بسبب طريقة بنائي للبوت، أصلحه مجانًا — تلك مسؤوليتي. أما إضافة ميزة جديدة لاحقًا فلها سعر منفصل حسب طبيعتها.' },
    { k: ['guarantee', 'guaranteed', 'refund', 'warranty', 'money back', 'garantie', 'ضمان', 'استرجاع', 'كفالة', 'ضامن'],
      en: "If an issue comes from the bot I built, I fix it for free — guaranteed. New feature requests later aren't free, but they won't be overpriced either.",
      ar: 'لو كانت المشكلة من البوت اللي بنيته أنا، أصلحها مجانًا — هذا مضمون. طلب ميزات جديدة لاحقًا ليس مجانيًا، لكنه لن يكون بسعر مبالغ فيه.' },
    { k: ['team', 'who works', 'work alone', 'by yourself', 'just you', 'solo', 'equipe', 'فريق', 'لوحدك', 'من يعمل معك', 'وحدك كتخدم', 'شكون كيخدم معاك'],
      en: "I work with a small team of 3, but I personally manage and oversee every project from start to finish.",
      ar: 'أعمل مع فريق صغير مكوّن من 3 أشخاص، لكنني أنا شخصيًا من يدير ويشرف على كل مشروع من البداية للنهاية.' },
    { k: ['hours', 'working hours', 'available', 'availability', 'when can i reach you', 'response time', 'reply time', 'ساعات العمل', 'متى ترد', 'أوقات الرد', 'أوقات التوفر', 'فاش كتكون متوفر'],
      en: "I'm usually available to reply between 6 PM and 10 PM (GMT).",
      ar: 'أكون متاحًا للرد عادةً من الساعة 6 مساءً إلى 10 مساءً بتوقيت غرينيتش (GMT).' },
    { k: ['contact', 'email', 'hire', 'hire you', 'reach you', 'get in touch', 'reach out', 'contacter', 'تواصل', 'ايميل', 'وظف', 'راسل', 'كيف اتواصل', 'كيفاش نتواصل معاك', 'رقم التواصل'],
      en: 'Instagram is my preferred channel, but WhatsApp and Telegram both work too — those two are better if you need to send large files. Email also works via the "Contact" section below.',
      ar: 'أفضّل التواصل عبر انستغرام، لكن واتساب وتيليغرام متاحان أيضًا — وهما أفضل لإرسال ملفات كبيرة. الإيميل يشتغل كمان عبر قسم "تواصل" بالأسفل.' },
    { k: ['language', 'languages', 'arabic', 'english', 'bilingual', 'multilingual', 'darija', 'langue', 'لغة', 'لغات', 'عربي', 'انجليزي', 'ثنائي', 'دارجة'],
      en: 'Every bot I build is bilingual — it auto-detects whether the customer is writing in Arabic or English and replies in the same language.',
      ar: 'كل بوت أبنيه ثنائي اللغة — يكتشف تلقائياً إذا العميل يكتب بالعربي أو الإنجليزي ويرد بنفس اللغة.' },
    { k: ['contract', 'agreement', 'sign a contract', 'paperwork', 'contrat', 'عقد', 'اتفاقية', 'توقيع', 'كنعقدو عقد'],
      en: "A work contract can be arranged if you'd like one — it's not standard by default, but I'm open to it.",
      ar: 'يمكن عمل عقد عمل إذا رغبت بذلك — ليس أمرًا معتادًا بشكل افتراضي، لكنني منفتح على الفكرة.' },
    { k: ['payment method', 'payment methods', 'how to pay', 'how do i pay', 'pay you', 'moyen de paiement', 'وسيلة الدفع', 'طرق الدفع', 'كيف أدفع', 'كيفاش نخلص', 'شنو وسيلة الخلاص'],
      en: "Payoneer is easiest for international clients — built for freelancers, withdraws to Morocco easily. PayPal works too. For clients inside Morocco, direct bank transfer is simplest.",
      ar: 'Payoneer هي الأسهل للعملاء الدوليين — مصممة أصلاً للفريلانسرز وتسحب بسهولة داخل المغرب. PayPal تشتغل كمان. للعملاء داخل المغرب، التحويل البنكي المباشر هو الأسهل.' },
    { k: ['api key', 'api keys', 'source code', 'download the bot', 'do it myself', 'run it myself', 'template', 'مفاتيح', 'كود المصدر', 'تحميل', 'اسويها بنفسي', 'نديرها بنفسي'],
      en: "This isn't a template you run yourself — I build, host, and connect the whole bot for your business personally, from setup to launch.",
      ar: 'هذه ليست قوالب تشغّلها بنفسك — أنا اللي أبني وأشغّل وأربط البوت كامل لنشاطك بنفسي، من الإعداد لحد الإطلاق.' },
    { k: ['why you', 'why should i choose you', 'pick you over', 'choose you over', 'vs agency', 'why not an agency', 'why not a company', 'ليش أختارك', 'ليه أختارك', 'ليش انت', 'بدل شركة', 'عوض شركة'],
      en: "Agencies are slower and pricier because of overhead. With me, you talk directly to the person building your bot — faster turnaround, no middlemen, and I personally stand behind the result.",
      ar: 'الشركات أبطأ وأغلى بسبب المصاريف الإدارية. معي، تتكلم مباشرة مع الشخص اللي بيبني بوتك — أسرع، بدون وسطاء، وأنا شخصيًا أضمن النتيجة.' },
    { k: ['startup', 'individual', 'personal project', 'just for myself', 'just for me', 'not a business', 'not a company', 'ستارت أب', 'مشروع شخصي', 'لست شركة', 'فرد'],
      en: "Absolutely — I build for startups, solo entrepreneurs, and even personal projects, not just established businesses.",
      ar: 'أكيد — أبني للستارت أب، لأصحاب المشاريع الفردية، وحتى للمشاريع الشخصية، مو بس الشركات الكبيرة.' },
    { k: ['free trial', 'free sample', 'try before', 'demo first', 'sample first', 'test it for free', 'test for free', 'tajriba majania', 'kayn tajriba', 'تجربة مجانية', 'عينة مجانية', 'جرب قبل', 'نموذج أول'],
      en: "The three live demos above (Lumora, Wanderly, BrightPath) are exactly that — a real sample of the quality you'd get. I don't build a separate free trial per client, but those demos speak for themselves.",
      ar: 'البوتات الثلاثة الحية بالأعلى (لومورا، واندرلي، برايت باث) هي بالضبط عينة حقيقية عن جودة الشغل. ما أبني تجربة مجانية منفصلة لكل عميل، لكن هذي الأمثلة كافية.' },
    { k: ['confidential', 'privacy', 'keep it private', 'nda', 'private info', 'سرية', 'خصوصية', 'معلومات سرية', 'اتفاقية عدم افصاح'],
      en: "Your business details stay between us — I don't share or reuse your specific content for other clients.",
      ar: 'تفاصيل نشاطك تبقى بيننا فقط — ما أشارك أو أعيد استخدام محتواك الخاص لعملاء ثانيين.' },
    { k: ['meta verification', 'whatsapp business verification', 'facebook business', 'verify my account', 'توثيق واتساب', 'توثيق ميتا', 'تفعيل حساب الأعمال'],
      en: "Yes — I walk you through (or handle directly with you) the Meta Business verification and WhatsApp Cloud API setup needed to connect your account.",
      ar: 'نعم — أساعدك خطوة بخطوة (أو أتعامل معك مباشرة) في توثيق حساب ميتا للأعمال وإعداد WhatsApp Cloud API اللازم لربط حسابك.' },
    { k: ['not tech savvy', 'i dont know coding', 'no technical knowledge', 'zero technical background', 'no technical background', 'im not techy', 'ما أعرف تقنية', 'مش فاهم بالتقنية', 'ماعندي خبرة تقنية', 'ماعنديش خبرة'],
      en: "You don't need any technical knowledge at all — you just tell me about your business in plain language, and I handle every technical step myself.",
      ar: 'ما تحتاج أي معرفة تقنية إطلاقًا — بس تحكيلي عن نشاطك بكلام عادي، وأنا أتكفل بكل الخطوات التقنية بنفسي.' },
    { k: ['redesign my bot', 'improve existing bot', 'i already have a bot', 'i already built a bot', 'make it better', 'upgrade my bot', 'fix someone elses bot', 'تحسين بوت موجود', 'عندي بوت جاهز', 'تطوير بوتي الحالي'],
      en: "Yes, I can take an existing bot and improve, redesign, or extend it — it doesn't have to be built by me originally.",
      ar: 'نعم، أقدر آخذ بوت موجود عندك وأحسّنه أو أطوّره أو أزيد عليه — مو شرط يكون أنا اللي بنيته من البداية.' },
    { k: ['mobile app', 'phone app', 'phone apps', 'ios app', 'android app', 'build an app', 'تطبيق موبايل', 'تطبيق آيفون', 'تطبيق أندرويد'],
      en: "I focus on chatbots and website agents, not standalone mobile apps — but a website bot works great on mobile browsers too.",
      ar: 'تركيزي على البوتات وإيجنتات المواقع، مو تطبيقات موبايل مستقلة — لكن بوت الموقع يشتغل ممتاز حتى من متصفح الجوال.' },
    { k: ['voice message', 'voice notes', 'understand voice', 'audio message', 'رسالة صوتية', 'رسائل صوتية', 'يفهم صوت'],
      en: "Right now the bots work with text — voice message support can be added as a custom feature if you need it.",
      ar: 'حاليًا البوتات تشتغل بالنص — دعم الرسائل الصوتية ممكن أضيفه كميزة مخصصة إذا احتجتها.' },
    { k: ['french bot', 'speak french', 'in french', 'support french', 'more languages', 'other languages', 'بوت بالفرنسية', 'دعم لغات أخرى', 'لغات ثانية'],
      en: "The demos here are Arabic/English, but I can build your bot to support French or other languages too — just tell me what your customers speak.",
      ar: 'الأمثلة هنا عربي/إنجليزي، لكن أقدر أبني بوتك يدعم الفرنسية أو لغات ثانية — بس قولي عملاؤك يحكوا بشنو.' },
    { k: ['are you legit', 'is this real', 'trust you', 'is this a scam', 'scam', 'scamming me', 'reviews', 'testimonials', 'هل انت موثوق', 'نصاب', 'تقييمات', 'آراء عملاء'],
      en: "Fair question — the three demos above are real, working code you can test yourself right now, not just claims. That's the best proof I can give upfront.",
      ar: 'سؤال منطقي — البوتات الثلاثة بالأعلى كود حقيقي شغّال تقدر تجربه بنفسك الآن، مو مجرد كلام. هذا أفضل إثبات أقدر أعطيك إياه من البداية.' },
    { k: ['change during', 'revisions during build', 'modify while building', 'ask for changes while', 'changes while building', 'تعديل أثناء البناء', 'تغيير خلال العمل'],
      en: "Of course — we stay in touch throughout, so you can adjust things as we go, not just at the end.",
      ar: 'أكيد — نبقى بتواصل طول فترة العمل، فتقدر تعدل أشياء أثناء ما نمشي، مو بس في النهاية.' },
    { k: ['do i own it', 'ownership', 'is it mine', 'who owns the bot', 'belong to me', 'will it belong to me', 'يولي ديالي', 'يصير ديالي', 'أملك البوت', 'ملكية البوت', 'هل البوت يصير ملكي'],
      en: "Yes, once delivered the bot is fully yours to use for your business.",
      ar: 'نعم، بعد التسليم البوت يصير ملكك بالكامل لاستخدامه في نشاطك.' },
    { k: ['give you my password', 'account access', 'admin access', 'is it safe to share', 'أعطيك كلمة السر', 'صلاحيات الحساب', 'آمن أشارك'],
      en: "I'll only ask for what's strictly needed to connect the bot (like API access tokens through Meta's official flow) — never your personal passwords.",
      ar: 'أطلب فقط اللي أحتاجه فعليًا لربط البوت (مثل رموز وصول API عبر مسار ميتا الرسمي) — أبدًا ما أطلب كلمات سر شخصية.' },
    { k: ['connect to database', 'spreadsheet', 'google sheets', 'google sheet', 'crm integration', 'ربط قاعدة بيانات', 'ربط اكسل', 'جوجل شيت'],
      en: "Yes, a bot can be connected to a spreadsheet, database, or existing system to pull or save real data.",
      ar: 'نعم، أقدر أربط البوت بجدول بيانات أو قاعدة بيانات أو نظام موجود عندك لسحب أو حفظ بيانات حقيقية.' },
    { k: ['dont have a website', 'no website yet', 'not online yet', 'just starting out', 'ماعندي موقع', 'مافيش موقع', 'بدون موقع الكتروني'],
      en: "No problem — a WhatsApp, Messenger, or Instagram bot doesn't need a website at all. We can start there instead.",
      ar: 'ولا يهمك — بوت واتساب أو ماسنجر أو انستغرام ما يحتاج موقع إلكتروني إطلاقًا. نقدر نبدأ من هناك بدل الموقع.' },
    { k: ['where are you based', 'where are you located', 'which country are you', 'which country do you live', 'where do you live', 'fin sakin', 'fin kayn', 'international clients', 'وين ساكن', 'من أي بلد', 'عملاء دوليين'],
      en: "I'm based in Morocco, but I work with clients anywhere in the world — everything happens remotely online.",
      ar: 'أنا مقيم بالمغرب، لكن أشتغل مع عملاء من أي بلد بالعالم — كل شيء يتم عن بعد أونلاين.' },
    { k: ['cancel the project', 'pause the project', 'stop midway', 'stop halfway', 'stop the project halfway', 'change my mind', 'إلغاء المشروع', 'إيقاف العمل', 'تغيير رأيي'],
      en: "You can pause or cancel — you'll only pay for the work already done up to that point.",
      ar: 'تقدر توقف أو تلغي — بس تدفع مقابل الشغل اللي تم إنجازه لحد تلك اللحظة.' },
    { k: ['hosting included', 'do you host it', 'where does it run', 'server included', 'استضافة مشمولة', 'وين يشتغل البوت', 'سيرفر مشمول'],
      en: "Yes — I set up and manage the hosting for you as part of the build, so you don't need to touch any servers.",
      ar: 'نعم — أعد وأدير الاستضافة بنفسي كجزء من العمل، فما تحتاج تلمس أي سيرفرات.' },
  ];

  const SMALLTALK = [
    { k: ['how are you', 'how are things', 'how is it going', 'hows it going', 'ca va', 'sava', 'kolshi mzyan', 'labas', 'chhalek', 'كيفاش', 'كيف حالك', 'كيف الحال', 'لاباس', 'شحالك', 'اش حالك', 'واش لاباس', 'كلشي مزيان'],
      en: "I'm doing great, thanks for asking! Want to know something about XIII? Ask away.",
      ar: 'بخير الحمد لله، شكرًا لسؤالك! تحب تعرف شي عن XIII؟ اسأل.' },
    { k: ['thank you', 'thanks', 'thx', 'appreciate it', 'merci', 'شكرا', 'شكراً', 'يعطيك الصحة', 'الله يخليك', 'مشكور'],
      en: "You're welcome! Anything else you want to know about XIII?",
      ar: 'العفو! في شي ثاني تحب تعرفه عن XIII؟' },
    { k: ['bye', 'goodbye', 'see you', 'see ya', 'later', 'au revoir', 'salut', 'مع السلامة', 'باي', 'إلى اللقاء', 'تحياتي', 'بسلامة'],
      en: "Take care! Reach out anytime you're ready to get a bot built.",
      ar: 'تحياتي! تواصل معي أي وقت تكون جاهز تسوي بوت.' },
  ];

  const OFF_TOPIC = [
    'weather', 'temperature outside', 'forecast', 'is it raining', 'meteo', 'météo', 'tell me a joke', 'favorite color', 'sing me a song',
    'football match', 'world cup', 'match score', 'basketball', 'sports news',
    'news today', 'breaking news', 'president', 'election results',
    'capital of', 'math problem', 'homework', 'solve this equation',
    'movie recommendation', 'best song', 'netflix', 'recipe', 'how to cook',
    'طقس', 'الجو اليوم', 'حرارة اليوم', 'مطر', 'الطقس', 'نكتة', 'لونك المفضل', 'غني لي',
    'كرة القدم', 'نتيجة المباراة', 'كأس العالم', 'أخبار اليوم', 'رئيس الدولة', 'انتخابات',
    'عاصمة', 'مسألة رياضيات', 'واجب مدرسي', 'فيلم كويس', 'أغنية زوينة', 'وصفة طبخ', 'كيفية الطبخ',
  ];

  const GREET_EN = "Hi! Ask me anything about XIII — skills, past work, pricing, or how to get a bot built for your business.";
  const GREET_AR = 'أهلاً! اسألني أي شيء عن XIII — المهارات، الأعمال السابقة، الأسعار، أو كيف تحصل على بوت لنشاطك.';
  const FALLBACK_EN = "That's a specific one I don't have a canned answer for — best to ask me directly. Scroll down to \"Contact\" and email me, or reach out on Instagram/WhatsApp/Telegram and I'll answer personally.";
  const FALLBACK_AR = 'هذا سؤال محدد ما عندي جواب جاهز عليه — الأفضل تسألني مباشرة. انزل لقسم "تواصل" وراسلني بالإيميل، أو تواصل معي عبر انستغرام/واتساب/تيليغرام وبجاوبك بنفسي.';
  const OFFTOPIC_EN = "I probably know that, but it's not really what I'm here for — ask me about my bots, pricing, or how to get one built for you.";
  const OFFTOPIC_AR = 'أعرف جوابها غالبًا، بس هذا مو تخصصي هنا — اسألني عن بوتاتي، أسعاري، أو كيف تحصل على بوت لنشاطك.';

  function handleMessage(session, rawText) {
    const text = (rawText || '').trim();
    if (!session.lang) session.lang = detectLang(text);
    if (hasLetters(text)) session.lang = detectLang(text);
    const lang = session.lang;
    if (!text || flexMatches(text, GREETING)) return { replies: [T(lang, GREET_EN, GREET_AR)] };
    const small = SMALLTALK.find((s) => flexMatches(text, s.k));
    if (small) return { replies: [T(lang, small.en, small.ar)] };
    const hit = FAQ.find((f) => flexMatches(text, f.k));
    if (hit) return { replies: [T(lang, hit.en, hit.ar)] };
    if (flexMatches(text, OFF_TOPIC)) return { replies: [T(lang, OFFTOPIC_EN, OFFTOPIC_AR)] };
    return { replies: [T(lang, FALLBACK_EN, FALLBACK_AR)] };
  }
  return { handleMessage, greeting: (lang) => T(lang || 'en', GREET_EN, GREET_AR) };
})();

 window.DemoBots = { lumora, wanderly, brightpath, xiii, newSession, detectLang };
})();
