# English Freetalk App 🎤

영어 회화 연습을 위한 AI 기반 프리토킹 앱입니다.

## 주요 기능

- **AI 대화 파트너**: Gemini API를 사용한 자연스러운 영어 대화
- **음성 인식**: 마이크로 영어 말하기 연습
- **TTS (Text-to-Speech)**: AI가 영어로 대답
- **수준별 제안 문장**: 5세/10세/20세 수준의 응답 예시
- **이미지 업로드**: 사진을 보며 대화 연습

## 프로젝트 구조

```
english-freetalk-project/
├── index.html          # 메인 HTML 파일
├── css/
│   └── style.css       # 스타일시트
├── js/
│   ├── config.js       # 설정 및 API 키 관리
│   ├── speech.js       # 음성 인식 및 TTS 모듈
│   ├── gemini-api.js   # Gemini API 통신 모듈
│   ├── ui.js           # UI 조작 모듈
│   └── app.js          # 메인 앱 로직
├── start-server.bat    # Windows 서버 실행 스크립트
├── start-server.ps1    # PowerShell 서버 실행 스크립트
└── README.md           # 이 파일그리고 
```

## 시작하기

### 1. Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. API 키 복사

### 2. 로컬 서버 실행 (권장)

⚠️ **중요**: 로컬 파일(`file://`)로 열면 매번 마이크 권한을 요청합니다.
로컬 서버로 실행하면 한 번만 허용하면 됩니다.

#### 방법 1: Python이 있는 경우
```bash
# 프로젝트 폴더에서 실행
python -m http.server 8000
```
또는 `start-server.bat` 더블클릭

#### 방법 2: VS Code Live Server
1. VS Code에서 "Live Server" 확장 설치
2. `index.html` 우클릭 → "Open with Live Server"

#### 방법 3: Node.js
```bash
npx serve .
```

### 3. 브라우저에서 접속

```
http://localhost:8000
```

## 모듈 설명

### config.js
- API URL, 음성 설정 등 전역 설정
- API 키 저장/불러오기 기능

### speech.js
- `SpeechModule`: 음성 인식 및 TTS 처리
- 마이크 권한 요청
- 음성 → 텍스트 변환
- 텍스트 → 음성 변환

### gemini-api.js
- `GeminiAPI`: Gemini API 통신
- AI 응답 생성
- Fallback 응답 (API 실패 시)

### ui.js
- `UI`: DOM 조작 및 화면 업데이트
- 대화 표시, 제안 문장 표시
- 마이크 버튼 상태 관리

### app.js
- `App`: 메인 앱 로직
- 대화 흐름 제어
- 전역 함수 (HTML에서 호출)

## 커스터마이징

### 음성 설정 변경
`js/config.js`에서 수정:
```javascript
TTS_RATE: 0.95,    // 말하기 속도 (0.1 ~ 10)
TTS_PITCH: 1.1,    // 음높이 (0 ~ 2)
```

### 대화 스타일 변경
`js/gemini-api.js`의 프롬프트 수정:
```javascript
const prompt = `You are a friendly...`
```

### UI 스타일 변경
`css/style.css`에서 색상, 폰트 등 수정

## 배포

### Vercel (추천)
1. [vercel.com](https://vercel.com) 접속
2. 프로젝트 폴더 드래그 앤 드롭
3. 생성된 URL로 접속

### Netlify
1. [netlify.com](https://netlify.com) 접속
2. 프로젝트 폴더 드래그 앤 드롭

## 문제 해결

### 마이크가 작동하지 않아요
- Chrome 브라우저 사용 (Safari, Firefox는 제한적)
- HTTPS 또는 localhost로 접속
- 브라우저 설정에서 마이크 권한 확인

### AI가 똑같은 말만 해요
- API 키가 올바른지 확인
- 브라우저 개발자 도구(F12) → Console에서 오류 확인
- API 사용량 제한 확인

### 매번 마이크 권한을 요청해요
- `file://` 대신 `http://localhost`로 접속
- `start-server.bat` 또는 Live Server 사용

## 라이선스

MIT License

## 기여

Pull Request 환영합니다!
