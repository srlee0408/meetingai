'use client';

import { useState, useEffect } from 'react';
import MemoSection from './components/MemoSection';
import AudioRecorder from './components/AudioRecorder';
import TranscriptionResult from './components/TranscriptionResult';
import SummaryResult from './components/SummaryResult';
import DetailResult from './components/DetailResult';
import MeetingHeader, { MeetingHeaderInfo } from './components/MeetingHeader';
import SettingsModal, { SettingsData } from './components/SettingsModal';
// OpenAI 서비스 추가
import { generateSummary as generateAISummary, generateMeetingMinutes } from './utils/openAIService';
// 설정 서비스 추가
import { loadSettings, saveSettings } from './utils/settingsService';
// 웹훅 서비스 추가
import { sendToWebhook } from './utils/webhookService';

// 기본 회의 헤더 정보
const defaultHeaderInfo: MeetingHeaderInfo = {
  title: "새 회의",
  date: "",
  location: "",
  attendees: "",
  host: "",
  objective: ""
};

export default function MeetingPage() {
  const [headerInfo, setHeaderInfo] = useState<MeetingHeaderInfo>(defaultHeaderInfo);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [summaryResult, setSummaryResult] = useState<string | undefined>(undefined);
  const [detailResult, setDetailResult] = useState<any>(undefined);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stt' | 'summary' | 'detail'>('stt');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [forceEditMode, setForceEditMode] = useState<boolean>(true); // 처음 로드시 편집 모드 강제 활성화
  
  // 설정 관련 상태 추가
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<SettingsData>(loadSettings());
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean | null>(null);
  // 메모 초기화를 위한 상태 추가
  const [resetMemos, setResetMemos] = useState<boolean>(false);

  /**
   * 회의 초기화 함수
   * 모든 상태를 초기값으로 리셋합니다.
   */
  const handleReset = () => {
    if (window.confirm('정말 회의 내용을 초기화하시겠습니까?')) {
      setHeaderInfo(defaultHeaderInfo);
      setTranscriptionResult(null);
      setSummaryResult(undefined);
      setDetailResult(undefined);
      setErrorMessage('');
      setActiveTab('stt');
      setForceEditMode(true);
      // 메모 초기화를 위한 상태 변경
      setResetMemos(true);
      // 초기화 후 resetMemos 상태를 다시 false로 변경
      setTimeout(() => {
        setResetMemos(false);
      }, 100);
    }
  };

  /**
   * 회의 헤더 정보 저장 핸들러
   */
  const handleHeaderSave = (info: MeetingHeaderInfo) => {
    setHeaderInfo(info);
    setForceEditMode(false);
    
    // 상세 회의록 업데이트
    if (detailResult) {
      // 문자열을 배열로 변환 (쉼표로 구분)
      const attendeesArray = info.attendees
        .split(',')
        .map(item => item.trim())
        .filter(item => item);
    
      const updatedDetail = {
        ...detailResult,
        title: info.title,
        date: info.date,
        location: info.location,
        attendees: attendeesArray.length > 0 ? attendeesArray : detailResult.attendees,
        host: info.host,
        objective: info.objective
      };
      
      setDetailResult(updatedDetail);
    }
  };

  /**
   * 요약 생성 함수 (OpenAI API 사용)
   */
  const generateSummary = async () => {
    if (!transcriptionResult) return;
    
    setIsSummaryLoading(true);
    
    try {
      // 실제 API 호출 (커스텀 프롬프트 적용)
      const summary = await generateAISummary(transcriptionResult.text, settings.summaryPrompt);
      setSummaryResult(summary);
    } catch (error) {
      console.error('요약 생성 중 오류:', error);
      setErrorMessage('요약을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  /**
   * 상세 회의록 생성 함수 (OpenAI API 사용)
   */
  const generateDetail = async () => {
    if (!transcriptionResult) return;
    
    setIsDetailLoading(true);
    
    try {
      // 회의 정보 구성
      const meetingInfo = {
        title: headerInfo.title,
        date: headerInfo.date,
        participants: headerInfo.attendees.split(',').map(p => p.trim())
      };
      
      // 실제 API 호출하여 회의록 생성 (커스텀 프롬프트 적용)
      const minutesText = await generateMeetingMinutes(
        transcriptionResult.text, 
        meetingInfo,
        settings.minutesPrompt
      );
      
      // 간소화된 상세 객체 생성
      const attendeesArray = headerInfo.attendees
        .split(',')
        .map(item => item.trim())
        .filter(item => item);
        
      const customDetail = {
        title: headerInfo.title,
        date: headerInfo.date,
        location: headerInfo.location,
        attendees: attendeesArray,
        host: headerInfo.host,
        objective: headerInfo.objective,
        generatedText: minutesText
      };
      
      setDetailResult(customDetail);
    } catch (error) {
      console.error('회의록 생성 중 오류:', error);
      setErrorMessage('회의록을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  /**
   * 음성 인식 완료 후 결과 처리 함수
   * @param result Assembly AI로부터 받은 음성 인식 결과
   */
  const handleTranscriptionComplete = (result: any) => {
    setTranscriptionResult(result);
    setIsProcessing(false);
    setErrorMessage('');
  };

  /**
   * 오류 처리 함수
   * @param error 발생한 오류 메시지
   */
  const handleError = (error: string) => {
    setErrorMessage(error);
    setIsProcessing(false);
  };

  /**
   * 메모 추가 핸들러
   * @param memo 추가된 메모 데이터
   */
  const handleMemoAdd = (memo: any) => {
    console.log('새 메모 추가:', memo);
    // TODO: 메모 저장 로직 구현
  };

  /**
   * 탭 변경 시 요약본/상세본 자동 생성
   */
  useEffect(() => {
    if (activeTab === 'summary' && transcriptionResult && !summaryResult && !isSummaryLoading) {
      generateSummary();
    }
    
    if (activeTab === 'detail' && transcriptionResult && !detailResult && !isDetailLoading) {
      generateDetail();
    }
  }, [activeTab, transcriptionResult, summaryResult, detailResult, isSummaryLoading, isDetailLoading]);

  /**
   * 설정 저장 핸들러
   */
  const handleSettingsSave = (newSettings: SettingsData) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // 이미 생성된 요약이나 회의록이 있으면 프롬프트가 바뀌었음을 알림
    if (summaryResult || detailResult) {
      alert('프롬프트가 변경되었습니다. 새 프롬프트로 요약이나 회의록을 다시 생성하려면 탭을 전환하거나 초기화해주세요.');
    }
  };

  /**
   * 웹훅으로 회의 데이터 전송 함수
   */
  const handleSendToWebhook = async () => {
    if (!transcriptionResult) {
      alert('전송할 회의 내용이 없습니다. 먼저 녹음을 진행해주세요.');
      return;
    }
    
    setIsSending(true);
    setSendSuccess(null);
    
    try {
      // 웹훅으로 데이터 전송
      const success = await sendToWebhook(
        transcriptionResult.text,
        summaryResult,
        detailResult
      );
      
      setSendSuccess(success);
      
      if (success) {
        alert('외부 전송이 완료되었습니다.');
      } else {
        alert('외부 전송 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('외부 전송 중 오류:', error);
      setSendSuccess(false);
      alert('외부 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">MeetingAI</h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* 외부 전송 버튼 추가 */}
            <button 
              onClick={handleSendToWebhook} 
              className={`p-2 px-3 ${sendSuccess === true ? 'bg-green-100' : sendSuccess === false ? 'bg-red-100' : 'hover:bg-gray-100'} rounded-md flex items-center transition-colors duration-300 ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSending}
              title="외부 전송"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  <span className="text-sm">전송 중...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-sm">외부 전송</span>
                </>
              )}
            </button>
            
            {/* 새로고침 버튼 */}
            <button 
              onClick={handleReset} 
              className="p-2 rounded-full hover:bg-gray-100"
              title="회의 초기화"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* 설정 버튼 */}
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2 rounded-full hover:bg-gray-100"
              title="설정"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 container mx-auto p-4 md:p-6 bg-gray-50">
        {/* 회의 헤더 정보 (직접 입력 가능) */}
        <MeetingHeader 
          initialData={headerInfo}
          onSave={handleHeaderSave}
          forceEditMode={forceEditMode}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 녹음 패널 */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-medium text-gray-800 mb-4">녹음</h2>
            
            <AudioRecorder 
              onTranscriptionComplete={handleTranscriptionComplete}
              onError={handleError}
            />
            
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
          </div>
          
          {/* 메모 섹션 */}
          <div className="md:col-span-2">
            <MemoSection 
              isRecording={isProcessing} 
              recordingStartTime={undefined} 
              onMemoAdd={handleMemoAdd} 
              resetMemos={resetMemos}
            />
          </div>
          
        </div>
        
        {/* 결과 탭 영역 (STT / 요약 / 상세) - 녹음 후 표시 */}
        {transcriptionResult && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex border-b border-gray-200">
              <button 
                className={`px-4 py-2 ${activeTab === 'stt' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => setActiveTab('stt')}
              >
                STT
              </button>
              <button 
                className={`px-4 py-2 ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => setActiveTab('summary')}
              >
                요약
              </button>
              <button 
                className={`px-4 py-2 ${activeTab === 'detail' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => setActiveTab('detail')}
              >
                상세
              </button>
            </div>
            
            <div className="p-4">
              {activeTab === 'stt' && (
                <TranscriptionResult data={transcriptionResult} />
              )}
              {activeTab === 'summary' && (
                <SummaryResult 
                  summary={summaryResult}
                  isLoading={isSummaryLoading}
                />
              )}
              {activeTab === 'detail' && (
                <DetailResult 
                  detail={detailResult}
                  isLoading={isDetailLoading}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <span className="text-xs text-gray-500">
            © 2025 MeetingAI - PRD v0.9
          </span>
          <div className="flex space-x-4">
            <button className="text-sm text-blue-600 hover:underline">
              세션 저장
            </button>
          </div>
        </div>
      </footer>

      {/* 설정 모달 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
        initialSettings={settings}
      />
    </div>
  );
}
