/**
 * 초 단위의 타임스탬프를 'HH:MM:SS' 형식으로 변환
 * @param seconds 초 단위 시간
 * @returns 형식화된 시간 문자열 (예: '01:23:45')
 */
export function formatTimestamp(seconds: number): string {
  if (seconds < 0) return '00:00:00';
  
  // 시, 분, 초 계산
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  // 2자리 숫자로 패딩
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

/**
 * Date 객체를 'HH:MM:SS' 형식으로 변환
 * @param date Date 객체
 * @returns 형식화된 시간 문자열 (예: '13:45:30')
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 밀리초를 '분:초' 형식으로 변환 (녹음 타이머용)
 * @param ms 밀리초 단위 시간
 * @returns 형식화된 시간 문자열 (예: '05:23')
 */
export function formatRecordingTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} 