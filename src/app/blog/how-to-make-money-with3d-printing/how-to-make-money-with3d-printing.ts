import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-how-to-make-money-with3d-printing',
  standalone: true,
  imports: [MarkdownModule],
  templateUrl: './how-to-make-money-with3d-printing.html',
  styleUrls: ['./how-to-make-money-with3d-printing.scss'],
})
export class HowToMakeMoneyWith3dPrinting implements OnInit{
  postContent = '';
  constructor(private meta: Meta, private title: Title, private blogService: BlogService, private route: ActivatedRoute) {
    this.title.setTitle('Как да печелите пари с 3D принтер - Пълен гайд 2025');
    this.meta.addTags([
      { name: 'description', content: 'Научете как да печелите пари с вашия 3D принтер, как да продавате 3D принтирани продукти легално и безопасно. Пълен гайд за 2025.' },
      { name: 'keywords', content: '3D принтиране, печелене на пари, 3D принтер, продажба на 3D принтирани продукти, лицензиране, CE маркировка' }
    ]);
  }

  ngOnInit() {
    // Get the article name from the URL (e.g., 3dpechat.bg/blog/pla-vs-abs)
    this.blogService.getPost("how-to-make-money").subscribe(data => {
      this.postContent = data;
    });
  }
}