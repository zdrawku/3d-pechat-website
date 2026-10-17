import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-kak-da-pechelim-ot-3d-printiraneto',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './kak-da-pechelim-ot-3d-printiraneto.component.html',
  styleUrls: ['./kak-da-pechelim-ot-3d-printiraneto.component.scss'],
})
export class KakDaPechelimOt3dPrintiranetoComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('kak-da-pechelim-ot-3d-printiraneto');
  }

  ngOnInit() {
    this.blogService.getPost('kak-da-pechelim-ot-3d-printiraneto').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
