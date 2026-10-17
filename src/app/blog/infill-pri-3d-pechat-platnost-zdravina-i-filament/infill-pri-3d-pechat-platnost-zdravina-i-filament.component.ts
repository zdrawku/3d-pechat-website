import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-infill-pri-3d-pechat-platnost-zdravina-i-filament',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './infill-pri-3d-pechat-platnost-zdravina-i-filament.component.html',
  styleUrls: ['./infill-pri-3d-pechat-platnost-zdravina-i-filament.component.scss'],
})
export class InfillPri3dPechatPlatnostZdravinaIFilamentComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('infill-pri-3d-pechat-platnost-zdravina-i-filament');
  }

  ngOnInit() {
    this.blogService.getPost('infill-pri-3d-pechat-platnost-zdravina-i-filament').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
