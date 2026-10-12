import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-3d-printing-technologies',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './3d-printing-technologies.component.html',
  styleUrls: ['./3d-printing-technologies.component.scss'],
})
export class ThreeDPrintingTechnologiesComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('3d-printing-technologies');
  }

  ngOnInit() {
    this.blogService.getPost('3d-printing-technologies').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
