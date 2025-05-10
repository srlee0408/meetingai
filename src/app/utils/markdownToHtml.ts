/**
 * 마크다운 텍스트를 HTML로 변환하는 유틸리티
 */
import { remark } from 'remark';
import html from 'remark-html';

/**
 * 마크다운 형식의 텍스트를 HTML로 변환합니다.
 * @param markdown - 변환할 마크다운 텍스트
 * @returns HTML 문자열
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    if (!markdown) return '';
    
    const result = await remark()
      .use(html, { sanitize: true }) // XSS 방지를 위한 HTML 단어 제거
      .process(markdown);
      
    return result.toString();
  } catch (error) {
    console.error('마크다운을 HTML로 변환하는 중 오류 발생:', error);
    return markdown; // 오류 발생 시 원본 텍스트 반환
  }
} 