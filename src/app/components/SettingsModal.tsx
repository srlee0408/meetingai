'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: SettingsData) => void;
  initialSettings: SettingsData;
}

export interface SettingsData {
  summaryPrompt: string;
  minutesPrompt: string;
}

/**
 * 설정 모달 컴포넌트
 * 요약과 회의록 프롬프트를 수정할 수 있는 모달입니다.
 */
export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
  const [settings, setSettings] = useState<SettingsData>(initialSettings);
  
  // 초기 설정값 업데이트
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings, isOpen]);
  
  // 설정값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 저장 버튼 핸들러
  const handleSave = () => {
    onSave(settings);
    onClose();
  };
  
  // 모달이 닫혀있으면 null 반환
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 모달 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">AI 설정</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 모달 본문 */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* 요약 프롬프트 */}
            <div>
              <label htmlFor="summaryPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                요약 프롬프트
              </label>
              <textarea
                id="summaryPrompt"
                name="summaryPrompt"
                value={settings.summaryPrompt}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="요약 프롬프트를 입력하세요"
              />
              <p className="mt-1 text-xs text-gray-500">
                회의 내용을 요약할 때 사용되는 프롬프트입니다. {'{transcript}'} 부분에 회의 내용이 삽입됩니다.
              </p>
            </div>
            
            {/* 회의록 프롬프트 */}
            <div>
              <label htmlFor="minutesPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                회의록 프롬프트
              </label>
              <textarea
                id="minutesPrompt"
                name="minutesPrompt"
                value={settings.minutesPrompt}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="회의록 프롬프트를 입력하세요"
              />
              <p className="mt-1 text-xs text-gray-500">
                회의 내용을 회의록으로 변환할 때 사용되는 프롬프트입니다. {'{infoString}'} 부분에 회의 정보가, {'{transcript}'} 부분에 회의 내용이 삽입됩니다.
              </p>
            </div>
          </div>
        </div>
        
        {/* 모달 푸터 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
} 