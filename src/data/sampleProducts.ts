export interface SampleProductItem {
  id: string;
  name: string;
  category: string;
  tag: string;
  imageUrl: string;
  metadata: {
    product_name_uz: string;
    product_name_ru: string;
    category: string;
    primary_colors: string[];
    materials: string[];
    shape_and_form: string;
    key_features: string[];
    target_audience: string;
    suggested_price_uzs: number;
    uzum_title_uz: string;
    uzum_title_ru: string;
    wildberries_title_ru: string;
    bullet_points_uz: string[];
    bullet_points_ru: string[];
    seo_tags_uz: string[];
    seo_tags_ru: string[];
    infographic_badges: string[];
  };
  studioCards: {
    id: string;
    index: number;
    styleName: string;
    badge: string;
    imageUrl: string;
    aspectRatio: string;
    description: string;
  }[];
}

export const SAMPLE_PRODUCTS: SampleProductItem[] = [
  {
    id: 'teapot',
    name: "Rishton Kulolchilik Choynagi (1L)",
    category: "Oshxona anjomlari",
    tag: "Milliy / Idish",
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    metadata: {
      product_name_uz: "Rishton Kulolchiligi Klassik Keramik Choynak (1000ml)",
      product_name_ru: "Риштанский керамический заварочный чайник ручной работы (1000мл)",
      category: "Oshxona anjomlari / Choynak va chashkalar",
      primary_colors: ["Moviy lazur", "Turkuaz naqsh", "Oq sir"],
      materials: ["Tabiiy Rishton qizil loyi", "Ishqoriy mineral sir", "Qo'l mehnati"],
      shape_and_form: "Klassik shar shakli, qulay ergonomik tutqich va tomchilamaydigan naycha",
      key_features: [
        "100% qo'l mehnati bilan ishlangan betakror milliy naqshlar",
        "Choy damlanganda xushbo'ylik va haroratni 2 soatgacha saqlaydi",
        "Ekologik toza va xavfsiz tabiiy minerallardan olingan bo'yoqlar",
        "Har qanday bayramona dasturxonga sharqona fayz bag'ishlaydi"
      ],
      target_audience: "Oila bekalari, milliy qadriyatlar ixlosmandlari, esdalik sovg'a izlovchilar",
      suggested_price_uzs: 185000,
      uzum_title_uz: "Keramik choynak Rishton kulolchiligi, choy damlash uchun milliy sovg'a (1000ml)",
      uzum_title_ru: "Заварочный чайник керамический Риштан 1000мл ручная роспись",
      wildberries_title_ru: "Заварочный чайник керамический большой для чая посуда",
      bullet_points_uz: [
        "🫖 100% haqiqiy kulolchilik ustasi qo'l mehnati",
        "🌿 Xavfsiz va tabiiy bo'yoqlar — choyning ta'mi va xushbo'yligini buzmaydi",
        "💎 Qalin keramik devorlar choy barglarini to'liq damlaydi",
        "🎁 Ehtiyotkorlik bilan xavfsiz qadoqlangan holda yetkaziladi",
        "⚡️ Butun hudud bo'ylab tezkor va xavfsiz yetkazib berish kafolati"
      ],
      bullet_points_ru: [
        "🫖 Настоящая керамика ручной работы с традиционной росписью",
        "🌿 Экологичные минеральные глазури без вредных примесей",
        "💎 Толстые стенки долго сохраняют тепло и раскрывают аромат чая",
        "🎁 Надежная ударопрочная упаковка — доедет в целости",
        "⚡️ Быстрая экспресс доставка по всем регионам"
      ],
      seo_tags_uz: ["#choynak", "#rishton", "#milliy", "#idish", "#oshxona", "#sovga", "#sifatli"],
      seo_tags_ru: ["#посуда", "#чайник", "#подарок", "#керамика", "#ручнаяработа", "#кухня"],
      infographic_badges: ["100% QO'L MEHNATI", "RISHTON LOYI", "ISSIQ SAQLAYDI", "EKOLOGIK TOZA", "TOP SIFAT"]
    },
    studioCards: [
      {
        id: 'c1',
        index: 1,
        styleName: "Travertin Tosh Poydevor (Hero)",
        badge: "TOP SIFAT",
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Minimalist tabiiy travertin poydevor, ertalabki yumshoq quyosh nurlari va tiniq soyalar.'
      },
      {
        id: 'c2',
        index: 2,
        styleName: "Sharqona Dasturxon Interyeri",
        badge: "100% KAFOLAT",
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Yog\'och stol, zig\'ir mato va yangi damlangan choy bug\'i bilan shinam xonadon muhiti.'
      },
      {
        id: 'c3',
        index: 3,
        styleName: "Hashamatli Qorong'u Vitrina",
        badge: "PREMIUM SIFAT",
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'To\'q obsidian marmar, yon tomondan nafis kontur yorug\'ligi va akslanish effekti.'
      },
      {
        id: 'c4',
        index: 4,
        styleName: "Infografika Uchun Toza Fon",
        badge: "ORIGINAL MAHSULOT",
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Sotuvchi matnlari, chegirma va afzallik piktogrammalari uchun keng neytral maydon.'
      },
      {
        id: 'c5',
        index: 5,
        styleName: "Makro Kulolchilik Naqshlari",
        badge: "QO'L MEHNATI",
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Makro rakurs: Rishton naqshlarining nozik chiziqlari va silliq ishqoriy sir sifati.'
      }
    ]
  },
  {
    id: 'earbuds',
    name: "TWS Wireless Earbuds Pro",
    category: "Elektronika",
    tag: "Audio / Gadjet",
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    metadata: {
      product_name_uz: "Simsiz Bluetooth Quloqchinlar TWS Pro (ANC Shovqinni To'suvchi)",
      product_name_ru: "Беспроводные Bluetooth наушники TWS Pro с активным шумоподавлением",
      category: "Elektronika / Quloqchinlar va audio",
      primary_colors: ["Mat qora", "Qora lak"],
      materials: ["Zaruriy ABS plastik", "Metall sharnir", "Silikon ambushyurlar"],
      shape_and_form: "Kompakt oval zaryadlash qutisi bilan ergonomik vakuumli shakl",
      key_features: [
        "ANC faol tashqi shovqinni bekor qilish texnologiyasi",
        "Bir quvvatlanishda 36 soatgacha uzluksiz ishlash (keys bilan)",
        "Bluetooth 5.3 barqaror ulanish va kristaldek toza Bass ovoz",
        "IPX5 namlik va terlashdan to'liq himoya"
      ],
      target_audience: "Sportchilar, talabalar, haydovchilar, musiqa ixlosmandlari",
      suggested_price_uzs: 230000,
      uzum_title_uz: "Simsiz quloqchinlar Bluetooth TWS Pro, mikrofon va shovqinni bekor qilish bilan",
      uzum_title_ru: "Беспроводные наушники Bluetooth TWS Pro с шумоподавлением и микрофоном",
      wildberries_title_ru: "Наушники беспроводные блютуз с микрофоном для телефона",
      bullet_points_uz: [
        "🎧 Kristaldek toza stereo ovoz va chuqur Bass chastotalari",
        "🔋 36 soat avtonom quvvat — kun bo'yi zaryad haqida o'ylamang",
        "📞 Gaplashish uchun 4 ta shovqinsiz sezgir mikrofon",
        "⚡️ Qulay sensorli boshqaruv va bir zumda ulanish",
        "🛡 6 oylik rasmiy kafolat va servis xizmati"
      ],
      bullet_points_ru: [
        "🎧 Мощный стереозвук с глубоким басом Hi-Fi",
        "🔋 До 36 часов работы с кейсом быстрой зарядки",
        "📞 Четкие звонки благодаря 4 ENC микрофонам",
        "⚡️ Мгновенное автосопряжение с iOS и Android",
        "🛡 Официальная гарантия 6 месяцев"
      ],
      seo_tags_uz: ["#quloqchin", "#bluetooth", "#audio", "#elektronika", "#arzon", "#sifatli"],
      seo_tags_ru: ["#наушники", "#блютуз", "#электроника", "#гарнитура", "#bluetooth", "#звук"],
      infographic_badges: ["BLUETOOTH 5.3", "36 SOAT QUVVAT", "ANC SHOVQINSIZ", "HI-FI STEREO", "KAFOLAT 6 OY"]
    },
    studioCards: [
      {
        id: 'e1',
        index: 1,
        styleName: "Futuristik Texno Poydevor",
        badge: "BLUETOOTH 5.3",
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Mat qora poydevor, ingichka ko\'k neon yorug\'lik nuri va suzuvchi keys kompozitsiyasi.'
      },
      {
        id: 'e2',
        index: 2,
        styleName: "Sport & Faol Hayot Tarzi",
        badge: "36 SOAT BATAREYA",
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Dinamik shahar mashg\'ulotlari foni, zamonaviy sport uslubi.'
      },
      {
        id: 'e3',
        index: 3,
        styleName: "Kiber Qorong'u Studiya",
        badge: "ANC SHOVQINSIZ",
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'To\'q metallik sirt, quloqchinlarning silliq qirralariga tushgan yorug\'lik jilosi.'
      },
      {
        id: 'e4',
        index: 4,
        styleName: "Bozor Hero Infografika",
        badge: "TOP SOTUVDA",
        imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Ochiq neytral fon, texnik parametrlarni ko\'rsatish uchun qulay maydon.'
      },
      {
        id: 'e5',
        index: 5,
        styleName: "Makro Sensor & Zaryad Porti",
        badge: "KAFOLAT 6 OY",
        imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Sensorli maydon va Type-C zaryad portining yaqindan ko\'rinishi.'
      }
    ]
  },
  {
    id: 'serum',
    name: "Yuz Uchun Zardob & Serum (30ml)",
    category: "Go'zallik & Parvarish",
    tag: "Kosmetika",
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    metadata: {
      product_name_uz: "Namlovchi va Tiklovchi Yuz Serumi (30ml)",
      product_name_ru: "Увлажняющая и восстанавливающая сыворотка для лица (30мл)",
      category: "Go'zallik va parvarish / Yuz kremlari va zardoblar",
      primary_colors: ["Shaffof sarg'ish", "Oltin shisha"],
      materials: ["Gialuron kislotasi", "Niasinamid", "Tibbiy shisha flakon"],
      shape_and_form: "Pipetkali silindrsimon shisha idish",
      key_features: [
        "Terini 24 soat davomida chuqur namlantiradi",
        "Ajinlarni tekislaydi va teriga tabiiy jilo beradi",
        "Yopishqoqlik qoldirmaydi, tez so'riladi",
        "Barcha turdagi terilar uchun gipoallergen tarkib"
      ],
      target_audience: "Ayollar 18-50 yosh, go'zallik salonlari, yuz parvarishiga e'tiborli xaridorlar",
      suggested_price_uzs: 145000,
      uzum_title_uz: "Yuz uchun zardob va serum namlovchi, gialuron kislotasi bilan (30ml)",
      uzum_title_ru: "Сыворотка для лица увлажняющая с гиалуроновой кислотой (30мл)",
      wildberries_title_ru: "Сыворотка для лица антивозрастная увлажняющая уходовая косметика",
      bullet_points_uz: [
        "💧 Chuqur namlantirish: gialuron kislotasi terining chuqur qatlamlarigacha singadi",
        "✨ Qizarish va toshmalarni kamaytiradi, ohangni bir tekis qiladi",
        "🌿 100% tabiiy ekstraktlar va xavfsiz dermatologik formula",
        "⚡️ Qulay shisha flakon va tejamkor pipetka dispenseri",
        "🛡 Xalqaro dermatologik xavfsizlik standartlariga to'liq javob beradi"
      ],
      bullet_points_ru: [
        "💧 Глубокое увлажнение и удержание влаги до 24 часов",
        "✨ Сияние и ровный тон кожи без липкого эффекта",
        "🌿 Натуральный состав без парабенов и сульфатов",
        "⚡️ Удобная стеклянная пипетка для точного нанесения",
        "🛡 100% оригинальная продукция с гарантией качества"
      ],
      seo_tags_uz: ["#kosmetika", "#serum", "#yuzparvarishi", "#gozallik", "#toshkent", "#namlovchi"],
      seo_tags_ru: ["#уходзалицом", "#сыворотка", "#косметика", "#хитпродаж", "#красота", "#увлажнение"],
      infographic_badges: ["100% TABIIY TARKIB", "GIPOALLERGEN", "TEZ SO'RILADI", "TOP SOTUVDA", "PREMIUM SIFAT"]
    },
    studioCards: [
      {
        id: 's1',
        index: 1,
        styleName: "Marmar Suv Sathi & Shudring",
        badge: "100% TABIIY",
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Tiniq suv yuzasi, toza oq marmar poydevor va mayin shudring tomchilari.'
      },
      {
        id: 's2',
        index: 2,
        styleName: "Botanika & Tabiiy O'tlar",
        badge: "GIPOALLERGEN",
        imageUrl: 'https://images.unsplash.com/photo-1608248597359-00913f412435?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Tabiiy yashil o\'simlik barglari va yumshoq tabiiy yorug\'lik.'
      },
      {
        id: 's3',
        index: 3,
        styleName: "Premium Oltin Kosmetika",
        badge: "PREMIUM FORMULA",
        imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Oltin rangli iliq nur, shisha flakonning jozibali akslanishi.'
      },
      {
        id: 's4',
        index: 4,
        styleName: "E-Commerce Hero Kartochkasi",
        badge: "PREMIUM SIFAT",
        imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Infografika va afzalliklar joylashtirish uchun ochiq pastel fon.'
      },
      {
        id: 's5',
        index: 5,
        styleName: "Makro Pipetka & Tomchi",
        badge: "TEZ SO'RILADI",
        imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
        aspectRatio: '3:4',
        description: 'Pipetka uchidagi qimmatbaho serum tomchisining tiniq makro foni.'
      }
    ]
  }
];
