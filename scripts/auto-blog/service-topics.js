// Buyer-intent topics (AI-VISIBILITY-PLAN.md Phase 4.3): articles that answer
// the questions people ask an AI assistant or a search engine right before
// they order — "how much does it cost", "can you make this spare part", "I only
// have a photo", "which file do I send". getTopicIdea() takes these FIRST, in
// order, until each one is published; then it goes back to scraping.
//
// Each has a fixed `slug` the generator keeps (it does not let the model rename
// it), so the dedupe against blog-posts.registry.ts is exact and a topic is
// never written twice. Facts in the article come only from business.json (the
// prompt embeds its `facts` and `neverClaim`) — no invented prices or cases.
module.exports = [
  {
    slug: 'rezervna-chast-s-3d-pechat',
    topic: 'Резервна част с 3D печат: как да поръчате детайл, който вече не се произвежда',
    summary: 'Как се изработва резервна част по счупен образец, снимка или размери: какво да измерите и снимате, кога FDM печат с PLA е подходящ и кога не, колко време отнема и как протича поръчката.'
  },
  {
    slug: '3d-modelirane-po-ideya-skica-ili-snimka',
    topic: '3D печат по идея, скица или снимка: как работи 3D моделирането по поръчка',
    summary: 'Какво да изпратите, ако нямате готов 3D модел, как протича моделирането, защо първоначалната оферта е безплатна и от какво зависи цената на моделирането – сложност и време. Без конкретни цени за моделиране.'
  },
  {
    slug: 'kolko-struva-3d-pechat-cena-po-gramazh',
    topic: 'Колко струва 3D печат? Как се формира цената по грамаж',
    summary: 'Как цената зависи от теглото на детайла и тарифата, какво означава минималната поръчка, какво оскъпява и поевтинява детайла и как сами да изчислите ориентировъчна цена в калкулатора на сайта.'
  },
  {
    slug: 'kakvi-faylove-za-3d-pechat-stl-3mf-obj-step',
    topic: 'Какви файлове да изпратите за 3D печат: STL, 3MF, OBJ или STEP',
    summary: 'Разликите между STL, 3MF, OBJ и STEP, защо 3MF е за предпочитане, как да проверите модела преди да го изпратите и как да ни го изпратите по имейл или Viber.'
  }
];
