'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { formatTimestamp } from '../utils/formatTime';
import { MemoItem } from '../types';

interface MemoSectionProps {
  isRecording: boolean;
  recordingStartTime?: Date;
  onMemoAdd?: (memo: MemoItem) => void;
  resetMemos?: boolean; // 새로고침 버튼을 눌렀을 때 메모를 초기화하기 위한 플래그
}

/**
 * 회의 중 실시간 메모를 입력할 수 있는 컴포넌트
 * 노션 스타일의 UI와 단축키(Cmd/Ctrl + Enter) 지원
 * 녹음 여부와 관계없이 메모 작성 가능
 * 새로고침 시 메모 초기화 가능(resetMemos prop을 통해 제어)
 */
export default function MemoSection({ 
  isRecording, 
  recordingStartTime, 
  onMemoAdd,
  resetMemos = false
}: MemoSectionProps) {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [currentMemo, setCurrentMemo] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 메모 초기화 처리 (새로고침 버튼 클릭 시)
  useEffect(() => {
    // resetMemos가 true일 때 메모 초기화
    if (resetMemos) {
      setMemos([]);
      setCurrentMemo('');
    }
  }, [resetMemos]);
  
  // 메모 저장 함수
  const saveMemo = () => {
    if (!currentMemo.trim()) return;
    
    // 현재 시간과 녹음 시작 시간의 차이로 타임스탬프 계산
    const now = new Date();
    const timestamp = recordingStartTime && isRecording
      ? Math.floor((now.getTime() - recordingStartTime.getTime()) / 1000)
      : 0;
    
    const newMemo: MemoItem = {
      id: crypto.randomUUID(),
      content: currentMemo.trim(),
      timestamp,
      createdAt: now
    };
    
    setMemos(prev => [...prev, newMemo]);
    setCurrentMemo('');
    
    if (onMemoAdd) {
      onMemoAdd(newMemo);
    }
  };
  
  // 키보드 단축키 처리 (Cmd/Ctrl + Enter)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      saveMemo();
    }
  };
  
  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [currentMemo]);
  
  return (
    <div className="memo-section flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* 메모 섹션 헤더 */}
      <div className="memo-header flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-base font-medium text-gray-800">회의 메모</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600">
            {isRecording 
              ? '녹음 중... 타임스탬프가 자동으로 기록됩니다' 
              : '녹음 중이 아닐 때는 타임스탬프가 0으로 기록됩니다'}
          </span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            Cmd/Ctrl + Enter 저장
          </span>
        </div>
      </div>
      
      {/* 메모 리스트 영역 */}
      <div className="memo-list flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[400px] bg-white">
        {memos.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm italic">
              메모가 없습니다. 회의 중 중요한 내용을 메모하세요.
            </p>
          </div>
        )}
        
        {memos.map((memo) => (
          <div key={memo.id} className="memo-item bg-white p-3 rounded-md border border-gray-200 group hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono">
                {formatTimestamp(memo.timestamp)}
              </span>
              <span className="text-xs text-gray-500">
                {memo.createdAt.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap break-words">
              {memo.content}
            </p>
          </div>
        ))}
      </div>
      
      {/* 메모 입력 영역 */}
      <div className="memo-input-container p-3 border-t border-gray-200 bg-gray-50">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={currentMemo}
            onChange={(e) => setCurrentMemo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="회의 중 중요한 내용을 메모하세요..."
            className="w-full p-3 border border-gray-300 rounded-md resize-none min-h-[100px] bg-white text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
            rows={3}
          />
          <button
            onClick={saveMemo}
            disabled={!currentMemo.trim()}
            className="absolute bottom-3 right-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-gray-300 disabled:text-gray-500 text-sm font-medium"
          >
            저장
          </button>
        </div>
        <div className="flex justify-between mt-2 px-1">
          <span className="text-xs text-gray-500">
            {currentMemo.length > 0 ? `${currentMemo.length}자` : ''}
          </span>
          <span className="text-xs text-gray-500">
            Cmd/Ctrl + Enter로 저장
          </span>
        </div>
      </div>
    </div>
  );
} 