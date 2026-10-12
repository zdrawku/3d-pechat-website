import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-pla-pla-pla-pro-i-pln-razliki-i-izbor',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './pla-pla-pla-pro-i-pln-razliki-i-izbor.component.html',
  styleUrls: ['./pla-pla-pla-pro-i-pln-razliki-i-izbor.component.scss'],
})
export class PlaPlaPlaProIPlnRazlikiIIzborComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('pla-pla-pla-pro-i-pln-razliki-i-izbor');
  }

  ngOnInit() {
    this.blogService.getPost('pla-pla-pla-pro-i-pln-razliki-i-izbor').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
