'use client';

import React, { useState, useEffect } from 'react';

/**
 * 회의 헤더 정보 인터페이스
 */
export interface MeetingHeaderInfo {
  title: string;
  date: string;
  location: string;
  attendees: string;
  host: string;
  objective: string;
}

interface MeetingHeaderProps {
  initialData?: MeetingHeaderInfo;
  onSave: (headerInfo: MeetingHeaderInfo) => void;
  forceEditMode?: boolean; // 편집 모드 강제 활성화 옵션 추가
}

/**
 * 회의 헤더 정보 입력 컴포넌트
 * 사용자가 회의 제목, 일시, 장소, 참석자, 주최자, 목적을 직접 입력할 수 있음
 */
const MeetingHeader: React.FC<MeetingHeaderProps> = ({ 
  initialData = {
    title: '새 회의',
    date: '',
    location: '',
    attendees: '',
    host: '',
    objective: ''
  }, 
  onSave,
  forceEditMode = false
}) => {
  // 초기 편집 모드 설정 - 모든 필드가 비어있거나 forceEditMode가 true면 편집 모드로 시작
  const shouldStartWithEditMode = () => {
    return forceEditMode || 
      (!initialData.title || initialData.title === '새 회의') ||
      !initialData.date || 
      !initialData.location || 
      !initialData.attendees || 
      !initialData.host || 
      !initialData.objective;
  };

  const [isEditing, setIsEditing] = useState<boolean>(shouldStartWithEditMode());
  const [headerInfo, setHeaderInfo] = useState<MeetingHeaderInfo>(initialData);

  // initialData가 변경되면 headerInfo도 업데이트
  useEffect(() => {
    setHeaderInfo(initialData);
  }, [initialData]);

  /**
   * 입력 값 변경 처리
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 저장 버튼 클릭 처리
   */
  const handleSave = () => {
    onSave(headerInfo);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {!isEditing ? (
        // 표시 모드 (읽기 전용)
        <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-2xl font-bold">{headerInfo.title}</h2>
            <button 
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition"
            >
              수정
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
            <div><span className="font-medium text-lg">회의 제목:</span> <span className="text-lg">{headerInfo.title}</span></div>
            <div><span className="font-medium text-lg">회의 일시:</span> <span className="text-lg">{headerInfo.date || '미정'}</span></div>
            <div><span className="font-medium text-lg">장소:</span> <span className="text-lg">{headerInfo.location || '미정'}</span></div>
            <div className="md:col-span-2"><span className="font-medium text-lg">참석자:</span> <span className="text-lg">{headerInfo.attendees || '미정'}</span></div>
            <div><span className="font-medium text-lg">주최자:</span> <span className="text-lg">{headerInfo.host || '미정'}</span></div>
            <div><span className="font-medium text-lg">회의 목적:</span> <span className="text-lg">{headerInfo.objective || '미정'}</span></div>
          </div>
        </div>
      ) : (
        // 편집 모드
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="mb-4">
            <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-1">회의 제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={headerInfo.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="회의 제목을 입력하세요"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="date" className="block text-lg font-medium text-gray-700 mb-1">회의 일시</label>
              <input
                type="text"
                id="date"
                name="date"
                value={headerInfo.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 2024년 6월 19일, 오전 10시"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-lg font-medium text-gray-700 mb-1">장소</label>
              <input
                type="text"
                id="location"
                name="location"
                value={headerInfo.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="회의 장소를 입력하세요"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="attendees" className="block text-lg font-medium text-gray-700 mb-1">참석자</label>
            <input
              type="text"
              id="attendees"
              name="attendees"
              value={headerInfo.attendees}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="참석자 이름을 쉼표로 구분하여 입력하세요"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="host" className="block text-lg font-medium text-gray-700 mb-1">주최자</label>
              <input
                type="text"
                id="host"
                name="host"
                value={headerInfo.host}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="주최자 이름을 입력하세요"
              />
            </div>
            
            <div>
              <label htmlFor="objective" className="block text-lg font-medium text-gray-700 mb-1">회의 목적</label>
              <input
                type="text"
                id="objective"
                name="objective"
                value={headerInfo.objective}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="회의 목적을 입력하세요"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingHeader; 