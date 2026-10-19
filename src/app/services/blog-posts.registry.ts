import { BlogPost } from '../models/blog-post.model';

/**
 * Central registry of all blog posts — the single source of truth for post
 * metadata. It is deliberately a plain data module with NO markdown import:
 * SeoService reads it on every page, and importing BlogService (which bundles
 * all article bodies) there would drag every post into the shared chunk.
 *
 * Scripts that parse this file by regex (sitemap, llms.txt, auto-blog
 * scaffolder + preflight) rely on the `BLOG_POSTS` array shape and the
 * trailing marker comment below — keep both.
 *
 * `date` is the publish date, `dateModified` the last substantive edit (feeds
 * the sitemap <lastmod> and the BlogPosting schema). Bump `dateModified` by
 * hand when a post's content changes; don't derive it from git (the deploy
 * checkout is shallow, so every file would get the deploy date).
 * `keywords` are the SEO meta keywords; `tags` are the card labels.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    id: '2',
    title: 'Какво представлява 3D принтирането? - Пълно ръководство 2026',
    description: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.',
    seoTitle: 'Какво представлява 3D принтирането? - Пълно ръководство 2026',
    slug: 'what-is-3d-printing',
    route: '/blog/what-is-3d-printing',
    date: new Date('2026-02-08'),
    imageUrl: 'assets/blogs/images/additive-printing.webp',
    tags: ['3D принтиране', '3D принтер', 'технология', 'адитивно производство'],
    author: '3D Печат България',
    keywords: ['3D принтиране', '3D принтер', 'адитивно производство', 'FDM', 'SLA', 'технология', 'производство'],
    dateModified: new Date('2026-10-12')
  },
  {
    id: '3',
    title: '3D принтиране в София: Защо да изберете локални услуги за вашия проект?',
    description: '3D принтиране в София с бърза доставка и професионално изпълнение. Открийте предимствата на локалните услуги спрямо онлайн платформите.',
    seoTitle: '3D принтиране в София: Защо да изберете локални услуги - 3D Печат България',
    slug: '3d-printing-in-sofia-for-your-project',
    route: '/blog/3d-printing-in-sofia-for-your-project',
    date: new Date('2026-02-02'),
    imageUrl: 'assets/blogs/images/design-is-from-question.webp',
    tags: ['3D принтиране София', '3D печат', 'локални услуги', 'експресна доставка', 'архитектурен макет'],
    author: '3D Печат България',
    keywords: ['3D принтиране София', '3D печат София', '3D принтиране услуги', 'локални 3D принтиране услуги', 'архитектурен макет', 'прототип', 'експресно 3D принтиране'],
    dateModified: new Date('2026-10-17')
  },
  {
    id: '4',
    title: 'Технологии за 3D принтиране: FDM vs SLA vs SLS — Кое за какво?',
    description: 'Разберете разликите между FDM, SLA, SLS и другите 3D принтиране технологии. Кога коя е по-подходяща, какви материали се използват и как да изберете правилно.',
    slug: '3d-printing-technologies',
    route: '/blog/3d-printing-technologies',
    date: new Date('2026-03-05'),
    imageUrl: 'assets/blogs/images/SLA.webp',
    tags: ['3d принтиране', '3d принтиране технологии', 'FDM', 'SLA', 'SLS', 'DLP', 'материали', 'адитивно производство'],
    author: '3D Печат България',
    keywords: ['3d принтиране', '3d принтиране технологии', 'FDM', 'SLA', 'SLS', 'DLP', 'MSLA', 'MJF', '3D принтер', 'адитивно производство'],
    dateModified: new Date('2026-10-19')
  },
  {
    id: '5',
    title: '3D Принтирани Обувки – Бъдещето на Обувната Индустрия',
    description: 'Открийте как 3D принтирането революционизира производството на обувки. Технологии, предимства, приложения и възможности за персонализация в България.',
    slug: '3d-printirani-obuvki',
    route: '/blog/3d-printirani-obuvki',
    date: new Date('2026-06-02'),
    imageUrl: 'assets/blogs/images/3d-printirani-obuvki-cover-3.webp',
    author: '3D Печат България',
    tags: ['3D принтирани обувки', '3D печат обувки', 'персонализирани обувки', 'TPU', 'SLS', 'обувна индустрия'],
    keywords: ['3D принтирани обувки', '3D печат обувки', '3D принтер за обувки', '3D принтиране България', 'персонализирани обувки', 'adidas 3D обувки', 'nike 3D печат'],
    dateModified: new Date('2026-10-19')
  },
  {
    id: '6',
    title: 'Изглаждане на PLA при 3D принтиране: 7 работещи метода',
    description: 'Научете как да постигнете перфектно гладък финиш на PLA отпечатъци. Практично ръководство с работещи методи за изглаждане при 3D принтиране в домашни условия.',
    slug: 'izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
    route: '/blog/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
    date: new Date('2026-06-02'),
    imageUrl: 'assets/blogs/images/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish-cover.webp',
    tags: ['PLA филамент', 'постобработка', 'изглаждане', '3D принтиране', 'финиш', 'туториал', 'съвети', 'техники'],
    author: '3D Печат България',
    keywords: ['изглаждане на PLA', '3D принтиране', '3D печат', 'постобработка 3D принт', 'гладък финиш PLA', 'PLA filament', '3D принтер', 'шлайфане PLA'],
    dateModified: new Date('2026-06-02')
  },
  {
    id: '7',
    title: '3D принтиране на Warhammer фигурки',
    description: 'Открийте как да принтирате Warhammer фигурки, терен и аксесоари с 3D принтер. Практичен гид с препоръки за модели, материали и настройки за печат.',
    slug: '3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
    route: '/blog/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
    date: new Date('2026-06-03'),
    imageUrl: 'assets/blogs/images/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari-cover.webp',
    tags: ['Warhammer', '3D принтиране', 'Миниатюри', 'Настолни игри', 'Resin печат', 'Фигурки', 'Терен', 'Аксесоари'],
    author: '3D Печат България',
    keywords: ['3D принтиране', 'Warhammer', '3D принтер', 'фигурки Warhammer', '3D печат', 'resin принтер', 'терен за Warhammer', 'миниатюри', 'tabletop gaming', '3dpechat'],
    dateModified: new Date('2026-10-19')
  },
  {
    id: '8',
    title: 'Как да печелим от 3D принтирането – Пълен наръчник',
    description: 'Открийте 7-те най-печеливши начина да превърнете 3D принтера си в източник на доход. Практични съвети, реални примери и стратегии за успех в България.',
    slug: 'kak-da-pechelim-ot-3d-printiraneto',
    route: '/blog/kak-da-pechelim-ot-3d-printiraneto',
    date: new Date('2026-06-08'),
    imageUrl: 'assets/real-images/general-images/1.webp',
    tags: ['3D принтиране', 'бизнес', 'печалба', '3D принтер', 'услуги', 'предприемачество', 'технологии', 'пари'],
    author: '3D Печат България',
    keywords: ['3D принтиране', 'как да печелим от 3D принтер', '3D печат бизнес', '3D принтер доход', 'печалба от 3D принтиране', '3D печат услуги', '3D принтиране България'],
    dateModified: new Date('2026-10-19')
  },
  {
    id: '9',
    title: 'PLA, PLA+, PLA Pro и PLN: разлики и избор за 3D печат',
    description: 'Научете всичко за различните типове PLA филамент – PLA, PLA+, PLA Pro и PLN. Практично ръководство за избор на правилния материал за вашия 3D принтер.',
    slug: 'pla-pla-pla-pro-i-pln-razliki-i-izbor',
    route: '/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor',
    date: new Date('2026-06-04'),
    imageUrl: 'assets/real-images/general-images/20250201_145113.webp',
    tags: ['PLA', 'филамент', '3D печат', 'материали', 'ръководство', 'PLA+', 'PLA Pro', 'PLN'],
    author: '3D Печат България',
    keywords: ['PLA филамент', 'PLA+', 'PLA Pro', 'PLN', '3D принтиране', '3D печат', '3D принтер', 'филамент за 3D принтер', 'материали за 3D печат'],
    dateModified: new Date('2026-10-19')
  },
  {
    id: '10',
    title: 'Литофан с 3D принтиране: превърни снимка в светещ модел',
    description: 'Научи как да създадеш уникален литофан с 3D принтер. Пълно ръководство за превръщане на любима снимка в светещ 3D модел – стъпка по стъпка инструкции.',
    slug: 'litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
    route: '/blog/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
    date: new Date('2026-06-02'),
    imageUrl: 'assets/blogs/images/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model-cover.webp',
    tags: ['литофан', '3D принтиране', 'подаръци', 'DIY проекти', 'персонализирани модели', '3D модели', 'уроци', 'начинаещи'],
    author: '3D Печат България',
    keywords: ['литофан', '3D принтиране', '3D принтер', 'литофан 3D печат', '3D модел от снимка', 'светещ 3D модел', 'lithophane', '3D печат България'],
    dateModified: new Date('2026-06-02')
  },
  {
    id: '11',
    title: '3D принтер Bambu Lab X2D: Ревю, функции и избор',
    description: 'Подробно ревю на 3D принтера Bambu Lab X2D. Характеристики, предимства, недостатъци и съвети за избор. Всичко за високоскоростното 3D принтиране.',
    slug: '3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
    route: '/blog/3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
    date: new Date('2026-06-15'),
    imageUrl: 'assets/blogs/images/Bambu-Lab-X2D.webp',
    tags: ['Bambu Lab', '3D принтери', 'Ревюта', 'CoreXY', 'Високоскоростен печат', '3D печат', 'Технологии'],
    author: '3D Печат България',
    keywords: ['Bambu Lab X2D', '3D принтер', '3D принтиране', '3D печат', 'CoreXY принтер', 'високоскоростно 3D принтиране', 'Bambu Lab България', '3D принтер ревю'],
    dateModified: new Date('2026-06-15')
  },
  {
    id: '13',
    title: 'Infill при 3D печат: плътност, здравина и филамент',
    description: 'Научете как infill плътността влияе върху здравината, теглото и разхода на филамент при 3D принтиране. Практически съвети за избор на правилните настройки.',
    slug: 'infill-pri-3d-pechat-platnost-zdravina-i-filament',
    route: '/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament',
    date: new Date('2026-07-06'),
    imageUrl: 'assets/blogs/images/infill-pri-3d-pechat-platnost-zdravina-i-filament-cover.webp',
    tags: ['Infill', '3D печат', 'Настройки', 'Филамент', 'Здравина', 'Оптимизация', 'Практически съвети', 'Качество'],
    author: '3D Печат България',
    keywords: ['infill 3D печат', 'плътност 3D принтиране', 'здравина 3D печат', 'филамент разход', '3D принтер настройки', 'infill patterns', '3D печат България'],
    dateModified: new Date('2026-07-06')
  },
  {
    id: '14',
    title: 'Прозрачен PLA филамент: как да постигнете светлопропусклив 3D печат',
    description: 'Практическо ръководство за 3D принтиране с прозрачен и полупрозрачен PLA филамент. Настройки, техники и сравнение с PETG и ABS за оптимални резултати.',
    slug: 'prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat',
    route: '/blog/prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat',
    date: new Date('2026-08-03'),
    imageUrl: 'assets/blogs/images/prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat-cover.webp',
    tags: ['PLA филамент', 'прозрачни материали', 'настройки за печат', 'материали за 3D печат', 'техники за принтиране', 'PETG', 'постобработка', 'сравнение материали'],
    author: '3D Печат България',
    keywords: ['прозрачен PLA', 'полупрозрачен филамент', '3D принтиране', 'светлопропусклив 3D печат', 'transparent PLA', 'PETG филамент', 'настройки за прозрачен PLA', '3D принтер'],
    dateModified: new Date('2026-08-03')
  },
  {
    id: '15',
    title: 'По-бързи и по-умни 3D принтери: опитът ни с Bambu Lab A1 Combo',
    description: 'Как 3D принтерите станаха бързи, тихи и умни – тенденциите и реалният ни опит с Bambu Lab A1 Combo у дома. Предимства, ограничения и съвети.',
    slug: 'barzi-i-umni-3d-printeri',
    route: '/blog/barzi-i-umni-3d-printeri',
    date: new Date('2026-10-11'),
    imageUrl: 'assets/blogs/images/barzi-i-umni-3d-printeri-cover.webp',
    tags: ['3D принтери', 'Bambu Lab', 'A1 Combo', 'многоцветен печат', 'технологии', 'иновации', 'опит', 'производство'],
    author: '3D Печат България',
    keywords: ['Bambu Lab A1 Combo', 'A1 Combo ревю', 'бързи 3D принтери', 'умни 3D принтери', 'AMS lite', 'многоцветен 3D печат', '3D принтер за дома', '3D принтиране', '3D печат'],
    dateModified: new Date('2026-10-17')
  },
  {
    id: '16',
    title: 'StandStrap: как направих 3D принтиран стопер за сноуборд',
    description: 'Как проектирах и отпечатах StandStrap — щипка за ръба на сноуборда, която държи дъската на място, докато закопчаваш автоматите прав. Дизайн, настройки за печат и видео.',
    slug: 'standstrap-3d-printiran-stoper-za-snoubord',
    route: '/blog/standstrap-3d-printiran-stoper-za-snoubord',
    date: new Date('2026-10-12'),
    imageUrl: 'assets/blogs/images/standstrap-3d-printiran-stoper-za-snoubord-cover.webp',
    tags: ['Сноуборд', '3D печат', 'Собствен дизайн', 'Bambu Studio', 'PLA', 'Зимни спортове', 'Аксесоари', 'MakerWorld'],
    author: '3D Печат България',
    keywords: ['стопер за сноуборд', 'сноуборд аксесоар', '3D принтиран сноуборд аксесоар', 'StandStrap', 'закопчаване на автомати', 'Bambu Studio', 'PLA', '3D печат България'],
    dateModified: new Date('2026-10-12'),
    videoCaption: 'StandStrap в действие — закопчаване на автоматите прав, без бедстване в снега.'
  },
  {
    id: '17',
    title: 'Монетна карта за българските евромонети – пълен комплект от 1 цент до 2 евро',
    description: 'Монетна карта за пълен комплект български евромонети – от 1 цент до 2 евро. 5 варианта от PLA, идеални за подарък и колекция.',
    seoTitle: 'Монетна карта за български евромонети | 3D Печат България',
    slug: 'monetna-karta-bulgarski-evro-moneti',
    route: '/blog/monetna-karta-bulgarski-evro-moneti',
    date: new Date('2026-10-12'),
    imageUrl: 'assets/blogs/images/monetna-karta-bulgarski-evro-moneti-cover.webp',
    tags: ['монетна карта', 'евромонети', 'България', 'евро', 'колекция', 'подарък', 'PLA', 'MakerWorld'],
    author: '3D Печат България',
    keywords: ['монетна карта', 'български евромонети', 'комплект евромонети', 'карта за монети', 'подарък за колекционер', '3D принтирана монетна карта', '3D печат България'],
    dateModified: new Date('2026-10-14')
  },
  {
    id: '18',
    title: 'Вижте как работим: 3D печат по поръчка в София (видео)',
    description: 'Вижте в 60 секунди наши 3D отпечатани проекти: разделители за книги, монетник „България“ и функционални части. И как протича поръчката от идея до детайл.',
    seoTitle: 'Видео: 3D печат по поръчка в София | 3D Печат България',
    slug: '3d-pechat-po-porachka-sofia-video',
    route: '/blog/3d-pechat-po-porachka-sofia-video',
    date: new Date('2026-10-14'),
    imageUrl: 'assets/blogs/images/3d-pechat-po-porachka-sofia-video-cover.webp',
    tags: ['Видео', 'YouTube', '3D печат', 'София', 'По поръчка', 'Прототипи', 'Подаръци', 'Монетна карта', 'Разделители за книги'],
    author: '3D Печат България',
    keywords: ['3D печат по поръчка', '3D печат София', '3D принтиране видео', '3D отпечатани проекти', 'разделители за книги', 'монетник България', 'прототипи', '3D Печат България'],
    dateModified: new Date('2026-10-14')
  },
  // Add more blog posts here as you create them
];
