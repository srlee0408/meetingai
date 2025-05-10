/**
 * 환경 변수를 안전하게 관리하는 유틸리티
 * 환경 변수가 없을 경우 오류를 발생시킴
 */

// Assembly AI API 키
export const ASSEMBLY_AI_API_KEY = process.env.ASSEMBLY_AI_API_KEY || '';

// OpenAI API 키
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// 환경 변수가 반드시 필요한 경우 사용할 헬퍼 함수
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경 변수 ${name}이(가) 설정되지 않았습니다.`);
  }
  return value;
} 