import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';
import { IgxButtonModule, IgxIconModule } from 'igniteui-angular';
import { SeoService } from '../../services/seo.service';
import { RelatedContentComponent } from '../../shared/related-content/related-content.component';

@Component({
  selector: 'app-izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish',
  standalone: true,
  imports: [MarkdownModule, IgxButtonModule, IgxIconModule, RelatedContentComponent],
  templateUrl: './izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish.component.html',
  styleUrls: ['./izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish.component.scss'],
})
export class IzglazhdaneNaPlaPri3dPrintiraneRaboteshtiMetodiZaGladakFinishComponent implements OnInit {
  postContent = '';

  constructor(
    private blogService: BlogService,
    private router: Router,
    private seoService: SeoService
  ) {
    this.seoService.applyBlogPostSeo('izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish');
  }

  ngOnInit() {
    this.blogService.getPost('izglazhdane-na-pla-pri-3d-printirane-raboteshti-metodi-za-gladak-finish').subscribe(data => {
      this.postContent = data;
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }
}
