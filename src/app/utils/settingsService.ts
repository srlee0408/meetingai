/**
 * 앱 설정 관리를 위한 서비스
 * 로컬 스토리지를 활용해 설정값을 저장하고 불러옵니다.
 */

import { SettingsData } from '../components/SettingsModal';

// 기본 요약 프롬프트
const DEFAULT_SUMMARY_PROMPT = '당신은 회의 내용을 정확하게 요약하는 전문가입니다. 핵심 내용만 간결하게 요약해주세요. 중요한 논의 사항, 결정된 사항, 액션 아이템을 중심으로 요약해주세요. 내용 요약은 최소 500자 이상으로 요약해주세요.';

// 기본 회의록 프롬프트
const DEFAULT_MINUTES_PROMPT = `당신은 회의 내용을 전문적인 회의록으로 변환하는 비서입니다. 
다음과 같은 형식으로 회의록을 작성해주세요:

1. 회의 정보 (제목, 일자, 참가자)
2. 회의 요약
3. 주요 논의 사항 (토픽별로 구분)
4. 결정된 사항
5. 할당된 업무와 담당자

내용이 없는 섹션은 생략해도 됩니다.`;

// 로컬 스토리지 키
const SETTINGS_KEY = 'meetingai_settings';

/**
 * 설정값을 로컬 스토리지에서 로드하는 함수
 * 저장된 설정이 없을 경우 기본값을 반환합니다.
 */
export function loadSettings(): SettingsData {
  // 서버 사이드 렌더링 시 window 객체가 없으므로 예외 처리
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }
  
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('설정 로드 중 오류:', error);
  }
  
  return getDefaultSettings();
}

/**
 * 설정값을 로컬 스토리지에 저장하는 함수
 * @param settings - 저장할 설정 객체
 */
export function saveSettings(settings: SettingsData): void {
  // 서버 사이드 렌더링 시 window 객체가 없으므로 예외 처리
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('설정 저장 중 오류:', error);
  }
}

/**
 * 기본 설정값을 반환하는 함수
 */
export function getDefaultSettings(): SettingsData {
  return {
    summaryPrompt: DEFAULT_SUMMARY_PROMPT,
    minutesPrompt: DEFAULT_MINUTES_PROMPT
  };
}

/**
 * 현재 설정을 기본값으로 초기화하는 함수
 */
export function resetSettings(): SettingsData {
  const defaultSettings = getDefaultSettings();
  saveSettings(defaultSettings);
  return defaultSettings;
} 