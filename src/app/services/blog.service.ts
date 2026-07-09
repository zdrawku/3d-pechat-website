// blog.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BlogPost } from '../models/blog-post.model';
import { BLOG_CONTENT } from './blog-content.generated';

@Injectable({ providedIn: 'root' })
export class BlogService {
  // Central registry of all blog posts
  private blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Как да печелите пари с 3D принтер - Пълен гайд 2026',
      description: 'Научете как да печелите пари с вашия 3D принтер, как да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2025.',
      slug: 'how-to-make-money',
      route: '/blog/how-to-make-money-3d-printing',
      date: new Date('2026-01-15'),
      imageUrl: 'assets/blogs/images/hero-image-how-to-make-money.png',
      tags: ['3D принтиране', 'бизнес', 'печалба', 'легалност'],
      author: '3D Печат България'
    },
    {
      id: '2',
      title: 'Какво представлява 3D принтирането? - Пълно ръководство 2026',
      description: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.',
      slug: 'what-is-3d-printing',
      route: '/blog/what-is-3d-printing',
      date: new Date('2026-02-08'),
      imageUrl: 'assets/blogs/images/additive-printing.png',
      tags: ['3D принтиране', '3D принтер', 'технология', 'адитивно производство'],
      author: '3D Печат България'
    },
    {
      id: '3',
      title: '3D принтиране в София: Защо да изберете локални услуги за вашия проект?',
      description: '3D принтиране в София с бърза доставка и професионално изпълнение. Открийте предимствата на локалните услуги спрямо онлайн платформите.',
      slug: '3d-printing-in-sofia-for-your-project',
      route: '/blog/3d-printing-in-sofia-for-your-project',
      date: new Date('2026-02-02'),
      imageUrl: 'assets/blogs/images/design-is-from-question.png',
      tags: ['3D принтиране София', '3D печат', 'локални услуги', 'експресна доставка', 'архитектурен макет'],
      author: '3D Печат България'
    },
    {
      id: '4',
      title: 'Технологии за 3D принтиране: FDM vs SLA vs SLS — Кое за какво?',
      description: 'Разберете разликите между FDM, SLA, SLS и другите 3D принтиране технологии. Кога коя е по-подходяща, какви материали се използват и как да изберете правилно.',
      slug: '3d-printing-technologies',
      route: '/blog/3d-printing-technologies',
      date: new Date('2026-03-05'),
      imageUrl: 'assets/blogs/images/SLA.png',
      tags: ['3d принтиране', '3d принтиране технологии', 'FDM', 'SLA', 'SLS', 'DLP', 'материали', 'адитивно производство'],
      author: '3D Печат България'
    },
    {
      id: '5',
      title: '3D Принтирани Обувки – Бъдещето на Обувната Индустрия',
      description: 'Открийте как 3D принтирането революционизира производството на обувки. Технологии, предимства, приложения и възможности за персонализация в България.',
      slug: '3d-printirani-obuvki',
      route: '/blog/3d-printirani-obuvki',
      date: new Date('2026-06-02'),
      imageUrl: 'assets/blogs/images/3d-printirani-obuvki-cover-3.png',
      author: '3D Печат България',
      tags: ['3D принтирани обувки', '3D печат обувки', 'персонализирани обувки', 'TPU', 'SLS', 'обувна индустрия']
    },
    {
      id: '6',
      title: 'Изглаждане на PLA при 3D принтиране: 7 работещи метода',
      description: 'Научете как да постигнете перфектно гладък финиш на PLA отпечатъци. Практично ръководство с работещи методи за изглаждане при 3D принтиране в домашни условия.',
      slug: 'izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
      route: '/blog/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
      date: new Date('2026-06-02'),
      imageUrl: 'assets/blogs/images/izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish-cover.jpg',
      tags: ['PLA филамент', 'постобработка', 'изглаждане', '3D принтиране', 'финиш', 'туториал', 'съвети', 'техники'],
      author: '3D Печат България'
    },
    {
      id: '7',
      title: '3D принтиране на Warhammer фигурки',
      description: 'Открийте как да принтирате Warhammer фигурки, терен и аксесоари с 3D принтер. Практичен гид с препоръки за модели, материали и настройки за печат.',
      slug: '3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
      route: '/blog/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
      date: new Date('2026-06-03'),
      imageUrl: 'assets/blogs/images/3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari-cover.jpg',
      tags: ['Warhammer', '3D принтиране', 'Миниатюри', 'Настолни игри', 'Resin печат', 'Фигурки', 'Терен', 'Аксесоари'],
      author: '3D Печат България'
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
      author: '3D Печат България'
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
      author: '3D Печат България'
    },
    {
      id: '10',
      title: 'Литофан с 3D принтиране: превърни снимка в светещ модел',
      description: 'Научи как да създадеш уникален литофан с 3D принтер. Пълно ръководство за превръщане на любима снимка в светещ 3D модел – стъпка по стъпка инструкции.',
      slug: 'litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
      route: '/blog/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
      date: new Date('2026-06-02'),
      imageUrl: 'assets/blogs/images/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model-cover.jpg',
      tags: ['литофан', '3D принтиране', 'подаръци', 'DIY проекти', 'персонализирани модели', '3D модели', 'уроци', 'начинаещи'],
      author: '3D Печат България'
    },
        {
      id: '10',
      title: '3D принтер Bambu Lab X2D: Ревю, функции и избор',
      description: 'Подробно ревю на 3D принтера Bambu Lab X2D. Характеристики, предимства, недостатъци и съвети за избор. Всичко за високоскоростното 3D принтиране.',
      slug: '3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
      route: '/blog/3d-printer-bambu-lab-x2d-podrobno-revyu-funktsii-i-izbor',
      date: new Date('2026-06-15'),
      imageUrl: 'assets/blogs/images/Bambu-Lab-X2D.jpg',
      tags: ['Bambu Lab', '3D принтери', 'Ревюта', 'CoreXY', 'Високоскоростен печат', '3D печат', 'Технологии'],
      author: '3D Печат България'
    },
        {
      id: '11',
      title: '3D принтер за начинаещи: детско хоби → семеен бизнес',
      description: 'Вдъхновяваща история как 12-годишно дете превърна 3D принтирането в семеен проект. Практични съвети за избор на първи 3D принтер и стартиране.',
      slug: '3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt',
      route: '/blog/3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt',
      date: new Date('2026-06-22'),
      imageUrl: 'assets/blogs/images/3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt-cover.jpg',
      tags: ['3D принтер', 'начинаещи', 'семеен проект', 'деца и 3D печат', 'хоби', 'практични съвети', 'история на успеха', 'избор на принтер'],
      author: '3D Печат България'
    },
        {
      id: '12',
      title: 'Infill при 3D печат: плътност, здравина и филамент',
      description: 'Научете как infill плътността влияе върху здравината, теглото и разхода на филамент при 3D принтиране. Практически съвети за избор на правилните настройки.',
      slug: 'infill-pri-3d-pechat-platnost-zdravina-i-filament',
      route: '/blog/infill-pri-3d-pechat-platnost-zdravina-i-filament',
      date: new Date('2026-07-06'),
      imageUrl: 'assets/blogs/images/infill-pri-3d-pechat-platnost-zdravina-i-filament-cover.jpg',
      tags: ['Infill', '3D печат', 'Настройки', 'Филамент', 'Здравина', 'Оптимизация', 'Практически съвети', 'Качество'],
      author: '3D Печат България'
    }
    // Add more blog posts here as you create them
  ];


  getPost(slug: string): Observable<string> {
    // Content is bundled at build time so it's available during prerendering.
    // A missing slug throws so the error fails the prerender build instead of
    // shipping a silently empty article page.
    const content = BLOG_CONTENT[slug];
    if (content === undefined) {
      throw new Error(`No blog content for slug "${slug}". Check the filename in src/assets/blogs and rerun "npm run generate-blog-content".`);
    }
    return of(content);
  }

  getAllPosts(): Observable<BlogPost[]> {
    return of(this.blogPosts);
  }

  getPostById(id: string): BlogPost | undefined {
    return this.blogPosts.find(post => post.id === id);
  }

  getPostByRoute(route: string): BlogPost | undefined {
    return this.blogPosts.find(post => post.route === route);
  }
}