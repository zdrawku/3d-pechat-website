import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-what-is-3d-printing',
  standalone: true,
  imports: [MarkdownModule],
  templateUrl: './what-is-3d-printing.component.html',
  styleUrls: ['./what-is-3d-printing.component.scss'],
})
export class WhatIs3dPrintingComponent implements OnInit {
  postContent = '';
  
  constructor(
    private meta: Meta,
    private title: Title,
    private blogService: BlogService,
    private route: ActivatedRoute
  ) {
    this.title.setTitle('Какво представлява 3D принтирането? - Пълно ръководство 2026');
    this.meta.addTags([
      { name: 'description', content: 'Научете всичко за 3D принтирането - как работи, какви са видовете технологии, приложения и бъдещето на адитивното производство.' },
      { name: 'keywords', content: '3D принтиране, 3D принтер, адитивно производство, FDM, SLA, технология, производство' }
    ]);
  }

  ngOnInit() {
    this.blogService.getPost("what-is-3d-printing").subscribe(data => {
      this.postContent = data;
    });
  }
}
