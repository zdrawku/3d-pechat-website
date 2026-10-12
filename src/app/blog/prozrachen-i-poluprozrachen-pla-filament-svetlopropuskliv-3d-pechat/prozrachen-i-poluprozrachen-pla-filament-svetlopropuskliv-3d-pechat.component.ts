import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat.component.html',
  styleUrls: ['./prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat.component.scss'],
})
export class ProzrachenIPoluprozrachenPlaFilamentSvetlopropuskliv3dPechatComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat');
  }

  ngOnInit() {
    this.blogService.getPost('prozrachen-i-poluprozrachen-pla-filament-svetlopropuskliv-3d-pechat').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
