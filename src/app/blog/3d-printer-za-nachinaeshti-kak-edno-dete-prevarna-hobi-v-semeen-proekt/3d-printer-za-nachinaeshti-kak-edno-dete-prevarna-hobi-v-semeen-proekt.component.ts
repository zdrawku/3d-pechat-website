import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';


import { RelatedContentComponent } from '../../shared/related-content/related-content.component';
@Component({
  selector: 'app-3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt.component.html',
  styleUrls: ['./3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt.component.scss'],
})
export class ThreeDPrinterZaNachinaeshtiKakEdnoDetePrevarnaHobiVSemeenProektComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt');
  }

  ngOnInit() {
    this.blogService.getPost('3d-printer-za-nachinaeshti-kak-edno-dete-prevarna-hobi-v-semeen-proekt').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
