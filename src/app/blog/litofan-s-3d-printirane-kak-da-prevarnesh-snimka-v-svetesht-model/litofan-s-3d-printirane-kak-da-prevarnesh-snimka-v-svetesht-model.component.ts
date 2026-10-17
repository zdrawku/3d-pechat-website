import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model.component.html',
  styleUrls: ['./litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model.component.scss'],
})
export class LitofanS3dPrintiraneKakDaPrevarneshSnimkaVSveteshtModelComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model');
  }

  ngOnInit() {
    this.blogService.getPost('litofan-s-3d-printirane-kak-da-prevarnesh-snimka-v-svetesht-model').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
