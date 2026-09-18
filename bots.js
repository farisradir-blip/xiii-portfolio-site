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
        `Hi! Welcome to *${name}* ✨\n${biz.tagline.en}\n\nHow can I help you today?\n1️⃣ View services & prices\n2️⃣ Book an appointment\n3️⃣ Hours & location\n4️⃣ Talk to a human\n5️⃣ Payment & cancellation policy\n\nJust reply with a number, or type what you need.`,
        `أهلاً بك في *${name}* ✨\n${biz.tagline.ar}\n\nكيف يمكنني مساعدتك اليوم؟\n1️⃣ الخدمات والأسعار\n2️⃣ حجز موعد\n3️⃣ مواعيد العمل والموقع\n4️⃣ التحدث مع موظف\n5️⃣ سياسة الدفع والإلغاء\n\nأرسل رقم الخيار أو اكتب طلبك مباشرة.`);
    }
    function servicesList(lang) {
      const lines = biz.services.map((s, i) => `${i + 1}. ${s.name[lang]} — ${s.price} ${biz.currency} (${s.duration})`).join('\n');
      return T(lang, `💇 *Our Services*\n${lines}\n\nReply "book" to reserve one of these, or "menu" to go back.`,
        `💇 *خدماتنا*\n${lines}\n\nاكتب "حجز" لحجز إحدى هذه الخدمات، أو "قائمة" للرجوع للقائمة الرئيسية.`);
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
          else if (text === '3' || matches(text, K.hours)) replies.push(T(lang, `🕒 *Hours*: ${biz.hours.en}\n📍 *Location*: ${biz.location.en}\n📞 *Phone*: ${biz.phone}`, `🕒 *أوقات العمل*: ${biz.hours.ar}\n📍 *الموقع*: ${biz.location.ar}\n📞 *الهاتف*: ${biz.phone}`));
          else if (text === '4' || matches(text, K.human)) replies.push(T(lang, `Got it — one of our team members will reach out to you shortly on this same chat. In the meantime, you can also call us at ${biz.phone}.`, `تم — سيتواصل معك أحد أفراد فريقنا قريباً على نفس المحادثة. يمكنك أيضاً الاتصال بنا على ${biz.phone}.`));
          else if (text === '5' || matches(text, K.faq)) replies.push(T(lang, `💳 *Payment*: ${biz.paymentMethods.en}\n\n📅 *Cancellation policy*: ${biz.cancellationPolicy.en}`, `💳 *الدفع*: ${biz.paymentMethods.ar}\n\n📅 *سياسة الإلغاء*: ${biz.cancellationPolicy.ar}`));
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
            replies.push(T(lang, `🎉 Booked! Your reference number is *${genRef()}*. We'll send a reminder before your appointment. See you soon at Lumora!\n\nType "menu" anytime for more options.`, `🎉 تم الحجز! رقم الحجز الخاص بك هو *${genRef()}*. سنرسل لك تذكيراً قبل الموعد. نراك قريباً في لومورا!\n\nاكتب "قائمة" في أي وقت لمزيد من الخيارات.`));
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
        { id: 'turkey-7', name: { en: 'Istanbul & Cappadocia — 7 Days', ar: 'إسطنبول والكبادوكيا — 7 أيام' }, price: 780, includes: { en: 'Flights, 4★ hotels, daily breakfast, hot air balloon ride, city tours', ar: 'طيران، فنادق 4 نجوم، إفطار يومي، رحلة منطاد، جولات سياحية' } },
        { id: 'egypt-6', name: { en: 'Cairo & Luxor — 6 Days', ar: 'القاهرة والأقصر — 6 أيام' }, price: 690, includes: { en: 'Flights, Nile cruise, Pyramids & Sphinx tour, Egyptologist guide', ar: 'طيران، رحلة نيلية، جولة الأهرامات وأبو الهول، مرشد أثري' } },
        { id: 'dubai-4', name: { en: 'Dubai City Break — 4 Days', ar: 'رحلة دبي القصيرة — 4 أيام' }, price: 520, includes: { en: 'Flights, 5★ hotel, desert safari, Burj Khalifa tickets', ar: 'طيران، فندق 5 نجوم، سفاري صحراوي، تذاكر برج خليفة' } },
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
        `Hi! Welcome to *${name}* ✈️\n${biz.tagline.en}\n\nHow can I help you today?\n1️⃣ Browse trip packages\n2️⃣ Request a quote / book a trip\n3️⃣ Office hours & location\n4️⃣ Talk to a travel agent\n5️⃣ Payment & cancellation policy\n\nJust reply with a number, or type what you need.`,
        `أهلاً بك في *${name}* ✈️\n${biz.tagline.ar}\n\nكيف يمكنني مساعدتك اليوم؟\n1️⃣ تصفح باقات الرحلات\n2️⃣ طلب عرض سعر / حجز رحلة\n3️⃣ مواعيد العمل والموقع\n4️⃣ التحدث مع مستشار سفر\n5️⃣ سياسة الدفع والإلغاء\n\nأرسل رقم الخيار أو اكتب طلبك مباشرة.`);
    }
    function packagesList(lang) {
      const lines = biz.packages.map((p, i) => `${i + 1}. ${p.name[lang]} — from ${p.price} ${biz.currency}/person\n   ${p.includes[lang]}`).join('\n\n');
      return T(lang, `🌍 *Our Packages*\n\n${lines}\n\nReply "book" to request a quote for one of these, or "menu" to go back.`,
        `🌍 *باقاتنا*\n\n${lines}\n\nاكتب "حجز" لطلب عرض سعر لإحدى هذه الرحلات، أو "قائمة" للرجوع للقائمة الرئيسية.`);
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
          else if (text === '3' || matches(text, K.hours)) replies.push(T(lang, `🕒 *Hours*: ${biz.hours.en}\n📍 *Office*: ${biz.location.en}\n📞 *Phone*: ${biz.phone}`, `🕒 *أوقات العمل*: ${biz.hours.ar}\n📍 *المكتب*: ${biz.location.ar}\n📞 *الهاتف*: ${biz.phone}`));
          else if (text === '4' || matches(text, K.human)) replies.push(T(lang, `Got it — one of our travel agents will reach out to you shortly. Or call ${biz.phone}.`, `تم — سيتواصل معك أحد مستشاري السفر قريباً. أو اتصل بنا على ${biz.phone}.`));
          else if (text === '5' || matches(text, K.faq)) replies.push(T(lang, `💳 *Payment*: ${biz.paymentMethods.en}\n\n📅 *Cancellation policy*: ${biz.cancellationPolicy.en}`, `💳 *الدفع*: ${biz.paymentMethods.ar}\n\n📅 *سياسة الإلغاء*: ${biz.cancellationPolicy.ar}`));
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
            replies.push(T(lang, `🎉 Request received! Your reference number is *${genRef()}*. A travel agent will contact you within 24 hours.\n\nType "menu" anytime for more options.`, `🎉 تم استلام طلبك! رقم الطلب الخاص بك هو *${genRef()}*. سيتواصل معك أحد مستشاري السفر خلال 24 ساعة.\n\nاكتب "قائمة" في أي وقت لمزيد من الخيارات.`));
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
        `Hi! Welcome to *${name}* 🎓\n${biz.tagline.en}\n\nHow can I help you today?\n1️⃣ Browse courses & prices\n2️⃣ Enroll in a course\n3️⃣ Hours & location\n4️⃣ Talk to an academic advisor\n5️⃣ Payment & cancellation policy\n\nJust reply with a number, or type what you need.`,
        `أهلاً بك في *${name}* 🎓\n${biz.tagline.ar}\n\nكيف يمكنني مساعدتك اليوم؟\n1️⃣ تصفح الدورات والأسعار\n2️⃣ التسجيل في دورة\n3️⃣ مواعيد العمل والموقع\n4️⃣ التحدث مع مستشار أكاديمي\n5️⃣ سياسة الدفع والإلغاء\n\nأرسل رقم الخيار أو اكتب طلبك مباشرة.`);
    }
    function coursesList(lang) {
      const lines = biz.courses.map((c, i) => `${i + 1}. ${c.name[lang]} — ${c.price} ${biz.currency}\n   ${c.duration[lang]}`).join('\n\n');
      return T(lang, `📚 *Our Courses*\n\n${lines}\n\nReply "enroll" to sign up for one of these, or "menu" to go back.`,
        `📚 *دوراتنا*\n\n${lines}\n\nاكتب "تسجيل" للالتحاق بإحدى هذه الدورات، أو "قائمة" للرجوع للقائمة الرئيسية.`);
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
          else if (text === '3' || matches(text, K.hours)) replies.push(T(lang, `🕒 *Hours*: ${biz.hours.en}\n📍 *Location*: ${biz.location.en}\n📞 *Phone*: ${biz.phone}`, `🕒 *أوقات العمل*: ${biz.hours.ar}\n📍 *الموقع*: ${biz.location.ar}\n📞 *الهاتف*: ${biz.phone}`));
          else if (text === '4' || matches(text, K.human)) replies.push(T(lang, `Got it — one of our academic advisors will reach out to you shortly. Or call ${biz.phone}.`, `تم — سيتواصل معك أحد مستشارينا الأكاديميين قريباً. أو اتصل بنا على ${biz.phone}.`));
          else if (text === '5' || matches(text, K.faq)) replies.push(T(lang, `💳 *Payment*: ${biz.paymentMethods.en}\n\n📅 *Cancellation policy*: ${biz.cancellationPolicy.en}`, `💳 *الدفع*: ${biz.paymentMethods.ar}\n\n📅 *سياسة الإلغاء*: ${biz.cancellationPolicy.ar}`));
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
            replies.push(T(lang, `🎉 Enrollment request received! Your reference number is *${genRef()}*. An academic advisor will contact you within 24 hours.\n\nType "menu" anytime for more options.`, `🎉 تم استلام طلب التسجيل! رقم الطلب الخاص بك هو *${genRef()}*. سيتواصل معك مستشار أكاديمي خلال 24 ساعة.\n\nاكتب "قائمة" في أي وقت لمزيد من الخيارات.`));
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
    const FAQ = [
      { k: ['who', 'about you', 'about xiii', 'من هو', 'من انت', 'من أنت', 'عن نفسك', 'مين انت'],
        en: "I'm XIII, a chatbot developer. I build custom WhatsApp, Messenger, and Instagram bots for businesses — you tell me about your business, I design, build, and connect the bot for you, end to end.",
        ar: 'أنا XIII، مطوّر بوتات محادثة. أبني بوتات واتساب وماسنجر وانستغرام مخصصة للشركات — تحكيلي عن نشاطك، وأنا أصمم وأبني وأربط لك البوت بالكامل.' },
      { k: ['work', 'portfolio', 'example', 'projects', 'demo', 'أعمال', 'مشاريع', 'أمثلة', 'شغل', 'شو سويت'],
        en: 'Scroll down to the "Work" section — you can actually chat with three live bot demos I built: a salon booking bot, a travel quote bot, and a course enrollment bot.',
        ar: 'انزل لقسم "أعمالي" — فيه ثلاثة بوتات حية تقدر تجربها فعلياً: بوت حجز صالون، بوت عروض أسعار سفر، وبوت تسجيل بدورات.' },
      { k: ['tech', 'technology', 'stack', 'skills', 'language', 'built with', 'تقنيات', 'مهارات', 'لغة برمجة', 'مبني'],
        en: 'Node.js and Express on the backend, official Meta Graph APIs (WhatsApp Cloud API, Messenger Platform, Instagram Messaging) for the channels, and bilingual Arabic/English conversation engines.',
        ar: 'Node.js و Express في الباك إند، وواجهات ميتا الرسمية (WhatsApp Cloud API وماسنجر وانستغرام) للقنوات، ومحرك محادثة ثنائي اللغة عربي/إنجليزي.' },
      { k: ['price', 'cost', 'how much', 'pricing', 'quote', 'سعر', 'تكلفة', 'كم', 'اسعار'],
        en: "It depends on how complex your bot needs to be — number of flows, languages, and which platforms. Email me your business details and I'll send you a clear quote.",
        ar: 'يعتمد على تعقيد البوت اللي تحتاجه — عدد المسارات، اللغات، والمنصات. راسلني بتفاصيل نشاطك وبرد عليك بعرض سعر واضح.' },
      { k: ['industry', 'business type', 'any business', 'restaurant', 'clinic', 'shop', 'نشاط', 'مجال', 'مطعم', 'عيادة', 'متجر', 'شركة'],
        en: "Any business, any industry — salons, clinics, restaurants, real estate, retail, education, travel, whatever you run. If customers message you, I can build the bot for it.",
        ar: 'أي نشاط تجاري وأي مجال — صالونات، عيادات، مطاعم، عقارات، متاجر، تعليم، سياحة، أي شي عندك. إذا عملاؤك يراسلونك، أقدر أبني لهم بوت.' },
      { k: ['how long', 'time', 'timeline', 'مدة', 'وقت', 'كم يوم', 'كم اسبوع'],
        en: 'A single-flow bot usually takes about a week from getting your business details to a working, connected bot.',
        ar: 'بوت بمسار واحد عادة ياخذ حوالي أسبوع من استلام تفاصيل نشاطك لحد ما يصير جاهز ومربوط.' },
      { k: ['contact', 'email', 'hire', 'reach', 'get in touch', 'تواصل', 'ايميل', 'وظف', 'راسل', 'كيف اتواصل'],
        en: 'Easiest way is email — scroll down to "Contact" and click "Email me", or reach me directly.',
        ar: 'أسهل طريقة هي الإيميل — انزل لقسم "تواصل" واضغط "راسلني".' },
      { k: ['language', 'arabic', 'english', 'bilingual', 'لغة', 'عربي', 'انجليزي', 'ثنائي'],
        en: 'Every bot I build is bilingual — it auto-detects whether the customer is writing in Arabic or English and replies in the same language.',
        ar: 'كل بوت أبنيه ثنائي اللغة — يكتشف تلقائياً إذا العميل يكتب بالعربي أو الإنجليزي ويرد بنفس اللغة.' },
      { k: ['platform', 'whatsapp', 'messenger', 'instagram', 'منصة', 'واتساب', 'ماسنجر', 'انستغرام', 'انستقرام'],
        en: 'WhatsApp Cloud API, Facebook Messenger, and Instagram Direct — all via the official Meta Graph API, connected to your own business accounts.',
        ar: 'واتساب، ماسنجر، وانستغرام — كلها عبر واجهات ميتا الرسمية، ومربوطة بحسابات نشاطك التجاري الخاصة.' },
      { k: ['api key', 'api keys', 'source code', 'download', 'do it myself', 'مفاتيح', 'كود المصدر', 'تحميل', 'اسويها بنفسي'],
        en: "This isn't a template you run yourself — I build, host, and connect the whole bot for your business personally, from setup to launch.",
        ar: 'هذه ليست قوالب تشغّلها بنفسك — أنا اللي أبني وأشغّل وأربط البوت كامل لنشاطك بنفسي، من الإعداد لحد الإطلاق.' },
    ];
    const GREET_EN = "Hi! Ask me anything about XIII — skills, past work, pricing, or how to get a bot built for your business.";
    const GREET_AR = 'أهلاً! اسألني أي شيء عن XIII — المهارات، الأعمال السابقة، الأسعار، أو كيف تحصل على بوت لنشاطك.';
    const FALLBACK_EN = "I'm not sure about that one — try asking about my work, tech stack, pricing, or how to get in touch, or email me directly.";
    const FALLBACK_AR = 'ما أعرف جواب هذا بالضبط — جرب تسأل عن أعمالي، التقنيات، الأسعار، أو كيف تتواصل معي، أو راسلني مباشرة.';
    function handleMessage(session, rawText) {
      const text = (rawText || '').trim();
      if (!session.lang) session.lang = detectLang(text);
      if (hasLetters(text)) session.lang = detectLang(text);
      const lang = session.lang;
      if (!text || matches(text, GREETING)) return { replies: [T(lang, GREET_EN, GREET_AR)] };
      const hit = FAQ.find((f) => matches(text, f.k));
      if (hit) return { replies: [T(lang, hit.en, hit.ar)] };
      return { replies: [T(lang, FALLBACK_EN, FALLBACK_AR)] };
    }
    return { handleMessage, greeting: (lang) => T(lang || 'en', GREET_EN, GREET_AR) };
  })();

  window.DemoBots = { lumora, wanderly, brightpath, xiii, newSession, detectLang };
})();
