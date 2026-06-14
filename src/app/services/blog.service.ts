// blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BlogPost } from '../models/blog-post.model';

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
      author: '3D Печат България'    },
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
      author: '3D Печат България'    },
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
      title: 'PLA, PLA+, PLA Pro и PLN: разлики и избор за 3D печат',
      description: 'Научете всичко за различните типове PLA филамент – PLA, PLA+, PLA Pro и PLN. Практично ръководство за избор на правилния материал за вашия 3D принтер.',
      slug: 'pla-pla-pla-pro-i-pln-razliki-i-izbor',
      route: '/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor',
      date: new Date('2026-06-04'),
      imageUrl: 'assets/real-images/main-images/3dprinting-hero.jpg',
      tags: ['PLA', 'филамент', '3D печат', 'материали', 'ръководство', 'PLA+', 'PLA Pro', 'PLN'],
      author: '3D Печат България'
    },
    {
      id: '9',
      title: 'Литофан с 3D принтиране: превърни снимка в светещ модел',
      description: 'Научи как да създадеш уникален литофан с 3D принтер. Пълно ръководство за превръщане на любима снимка в светещ 3D модел – стъпка по стъпка инструкции.',
      slug: 'litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
      route: '/blog/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
      date: new Date('2026-06-02'),
      imageUrl: 'assets/blogs/images/litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model-cover.jpg',
      tags: ['литофан', '3D принтиране', 'подаръци', 'DIY проекти', 'персонализирани модели', '3D модели', 'уроци', 'начинаещи'],
      author: '3D Печат България'
    }
    // Add more blog posts here as you create them
  ];

  constructor(private http: HttpClient) {}

  getPost(slug: string): Observable<string> {
    // Fetches the text file from your assets folder
    return this.http.get(`/assets/blogs/${slug}.md`, { responseType: 'text' });
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