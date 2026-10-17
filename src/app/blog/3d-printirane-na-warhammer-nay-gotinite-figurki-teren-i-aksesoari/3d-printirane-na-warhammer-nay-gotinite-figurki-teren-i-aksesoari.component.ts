import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari.component.html',
  styleUrls: ['./3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari.component.scss'],
})
export class ThreeDPrintiraneNaWarhammerNayGotiniteFigurkiTerenIAksesoariComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari');
  }

  ngOnInit() {
    this.blogService.getPost('3d-printirane-na-warhammer-nay-gotinite-figurki-teren-i-aksesoari').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
