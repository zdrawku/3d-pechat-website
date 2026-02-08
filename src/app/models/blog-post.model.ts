export interface BlogPost {
  id: string;
  title: string;
  description: string;
  slug: string;
  route: string;
  date: Date;
  imageUrl?: string;
  tags?: string[];
  author?: string;
}
