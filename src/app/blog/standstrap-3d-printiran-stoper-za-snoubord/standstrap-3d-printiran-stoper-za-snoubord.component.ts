import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-standstrap-3d-printiran-stoper-za-snoubord',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './standstrap-3d-printiran-stoper-za-snoubord.component.html',
  styleUrls: ['./standstrap-3d-printiran-stoper-za-snoubord.component.scss'],
})
export class Standstrap3dPrintiranStoperZaSnoubordComponent implements OnInit {
  /** Markdown before / after the `<!-- video -->` marker; the video sits between. */
  postContent = '';
  postContentAfterVideo = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('standstrap-3d-printiran-stoper-za-snoubord');
  }

  ngOnInit() {
    this.blogService.getPost('standstrap-3d-printiran-stoper-za-snoubord').subscribe(data => {
      // The markdown sanitizer strips <video>, so the clip lives in the template.
      [this.postContent, this.postContentAfterVideo = ''] = data.split('<!-- video -->');
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
