/**
 * 공통 타입 정의 파일
 */

/**
 * 메모 아이템 인터페이스 정의
 */
export interface MemoItem {
  id: string;
  content: string;
  timestamp: number; // 녹음 시작 기준 경과 시간(초)
  createdAt: Date;
}

/**
 * 변환된 텍스트 결과 타입
 */
export interface TranscriptionResultType {
  text: string;
  audio_url: string;
  id: string;
  status: string;
  [key: string]: unknown;
}

/**
 * 회의 상세 정보 타입
 */
export interface DetailResultType {
  title: string;
  date: string;
  location: string;
  attendees: string[];
  host: string;
  objective: string;
  generatedText: string;
  [key: string]: unknown;
} 