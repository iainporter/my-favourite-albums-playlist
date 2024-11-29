import { Album } from '../types/album';

export interface HtmlParser {
  parseHtml(html: string): Promise<Album[]> | Album[];
}