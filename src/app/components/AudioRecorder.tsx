'use client';

import React, { useState, useRef, useEffect } from 'react';
import { uploadAudio, startTranscription, waitForTranscriptionCompletion } from '../utils/assemblyAIService';
import { TranscriptionResultType } from '../types';

/**
 * 웹 오디오 API 타입 정의 
 */
interface AudioContextWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

// 안전한 타입 체크 함수 추가
function hasWebkitAudioContext(window: Window): window is AudioContextWindow {
  return 'webkitAudioContext' in window;
}

/**
 * 오디오 녹음 상태를 나타내는 타입
 */
type RecordingState = 'inactive' | 'recording' | 'paused' | 'processing';

interface AudioRecorderProps {
  onTranscriptionComplete: (result: TranscriptionResultType) => void;
  onError: (error: string) => void;
}

/**
 * 음성 녹음 및 텍스트 변환 컴포넌트
 * 마이크를 통해 음성을 녹음하고 Assembly AI를 사용하여 텍스트로 변환
 */
const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete, onError }) => {
  // 녹음 상태 관리
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive');
  // 녹음 시간 표시를 위한 상태
  const [recordingTime, setRecordingTime] = useState<number>(0);
  // 오류 메시지 관리
  const [errorMessage, setErrorMessage] = useState<string>('');
  // 오디오 볼륨 레벨 (20개의 바를 위한 배열)
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(20));

  // 레코더 및 타이머 참조
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  /**
   * 녹음 시간을 업데이트하는 함수
   * 1초마다 호출되어 녹음 시간을 1초씩 증가시킴
   */
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState]);

  /**
   * 컴포넌트 언마운트 시 리소스 정리
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * 오디오 레벨 분석 및 시각화 함수
   */
  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    // 오디오 주파수 데이터 가져오기
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // 20개의 바에 대한 볼륨 레벨 계산
    const newLevels = Array(20).fill(0).map((_, i) => {
      // 전체 주파수 범위에서 각 바에 해당하는 부분 평균값 계산
      const start = Math.floor(i * dataArrayRef.current!.length / 20);
      const end = Math.floor((i + 1) * dataArrayRef.current!.length / 20);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += dataArrayRef.current![j];
      }
      const avg = sum / (end - start);
      // 최소 20%에서 최대 70%까지의 높이로 정규화
      return 20 + (avg / 255) * 50;
    });

    setAudioLevels(newLevels);
    
    // 다음 애니메이션 프레임 요청
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  /**
   * 녹음을 시작하는 함수
   * 사용자의 마이크에 접근하여 MediaRecorder를 초기화하고 녹음 시작
   */
  const startRecording = async () => {
    try {
      setErrorMessage('');
      // 사용자 마이크 접근 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 오디오 컨텍스트 및 분석기 초기화
      const AudioContextClass = window.AudioContext || (hasWebkitAudioContext(window) ? window.webkitAudioContext : null);
      
      if (!AudioContextClass) {
        throw new Error('이 브라우저에서는 AudioContext를 지원하지 않습니다.');
      }
      
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // 오디오 소스 연결
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      // 분석 데이터 배열 초기화
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // 오디오 분석 시작
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      
      // MediaRecorder 초기화
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // 녹음 데이터 처리
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 녹음 완료 후 처리
      mediaRecorder.onstop = async () => {
        try {
          // 오디오 분석 중지
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          setRecordingState('processing');
          
          // 녹음된 데이터로 Blob 생성
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          
          try {
            // Assembly AI에 오디오 업로드
            const audioUrl = await uploadAudio(audioBlob);
            
            // 음성 인식 작업 시작
            const transcriptId = await startTranscription(audioUrl);
            
            // 음성 인식 완료 대기 및 결과 처리
            const result = await waitForTranscriptionCompletion(transcriptId);
            
            // 음성 인식 결과 전달
            onTranscriptionComplete(result);
            setRecordingState('inactive');
            setRecordingTime(0);
          } catch (apiError) {
            const err = apiError as Error;
            let errorMsg = err.message || '음성 변환 중 오류가 발생했습니다.';
            
            // API 키 관련 오류 메시지 개선
            if (errorMsg.includes('API 키가 설정되지 않았습니다')) {
              errorMsg = 'Assembly AI API 키가 설정되지 않았습니다. 환경 변수(.env.local 파일)에 ASSEMBLY_AI_API_KEY를 추가하거나 설정을 확인해주세요.';
            }
            
            setErrorMessage(errorMsg);
            onError(errorMsg);
            setRecordingState('inactive');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '음성 변환 중 오류가 발생했습니다.';
          setErrorMessage(errorMsg);
          onError(errorMsg);
          setRecordingState('inactive');
        } finally {
          // 스트림 트랙 종료
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          
          // 오디오 컨텍스트 닫기
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
        }
      };
      
      // 녹음 시작
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setRecordingState('recording');
      setRecordingTime(0);
    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : '마이크 접근 권한이 필요합니다. 권한을 허용해주세요.';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    }
  };

  /**
   * 녹음을 중지하는 함수
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  /**
   * 시간을 포맷팅하는 함수
   * @param seconds 초 단위 시간
   * @returns 포맷팅된 시간 문자열 (MM:SS)
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg">
      <div className="flex flex-col items-center justify-center space-y-4 w-full">
        <div className="text-3xl font-mono text-blue-600">
          {formatTime(recordingTime)}
        </div>
        
        {/* 녹음 버튼 */}
        <button
          onClick={recordingState === 'inactive' ? startRecording : stopRecording}
          disabled={recordingState === 'processing'}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            recordingState === 'recording' 
              ? 'bg-red-500 hover:bg-red-600' 
              : recordingState === 'processing'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {recordingState === 'recording' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          ) : recordingState === 'processing' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
        
        <span className="text-sm text-gray-500">
          {recordingState === 'inactive' 
            ? '녹음 시작하기' 
            : recordingState === 'recording'
              ? '녹음 중...'
              : '처리 중...'}
        </span>
      </div>
      
      {/* 오디오 웨이브 시각화 */}
      {recordingState === 'recording' && (
        <div className="mt-6 w-full">
          <div className="audio-wave flex justify-center items-center h-16">
            {audioLevels.map((level, index) => (
              <div
                key={index}
                className="audio-bar bg-blue-500 w-1 mx-0.5 rounded-full"
                style={{
                  height: `${level}%`,
                  transition: 'height 0.1s ease'
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* 녹음 상태 표시 */}
      <div className="w-full mt-4">
        
        {/* 녹음 중일 때 시각적 표시 */}
        {recordingState === 'recording' && (
          <div className="w-full h-1 bg-gray-200 mt-2 rounded">
            <div 
              className="h-full bg-red-500 rounded animate-pulse" 
              style={{ width: '100%' }}
            ></div>
          </div>
        )}
      </div>
      
      {/* 오류 메시지 표시 */}
      {errorMessage && (
        <div className="mt-4 text-red-500 text-sm">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 