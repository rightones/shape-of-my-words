# Shape of My Words

단어들의 형태를 시각화하는 웹 애플리케이션입니다.

## 새로운 기능: 단어 비 (Word Rain)

OpenRouter API를 통해 주제별로 생성된 단어들이 비처럼 화면에 떨어지는 아름다운 애니메이션을 제공합니다.

### 주요 기능

-   **주제 선택**: 자연, 감정, 음식, 기술, 예술, 여행, 스포츠, 교육 등 8가지 주제
-   **AI 단어 생성**: OpenRouter API를 통해 주제별로 500개의 한국어 단어 생성
-   **무료 모델 사용**: `google/gemma-3-27b-it:free` 모델로 비용 부담 없이 이용
-   **단어 비 애니메이션**: Canvas를 이용한 부드러운 단어 애니메이션
-   **캐싱 시스템**: 생성된 단어들을 24시간 동안 캐시하여 빠른 재사용
-   **반응형 디자인**: 모든 디바이스에서 최적화된 경험

## 설치 및 실행

### 1. 의존성 설치

#### 백엔드

```bash
cd backend
uv sync
```

#### 프론트엔드

```bash
cd frontend
npm install
```

### 2. OpenRouter API 키 설정

1. [OpenRouter](https://openrouter.ai/keys)에서 **무료 계정**을 생성하고 API 키를 발급받으세요
2. `backend` 디렉토리에 `.env` 파일을 생성하세요:

```bash
cd backend
touch .env
```

3. `.env` 파일에 API 키를 추가하세요:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> **💡 참고**: 현재 무료 모델(`google/gemma-3-27b-it:free`)을 사용하므로 별도 비용이 발생하지 않습니다!

### 3. 서버 실행

#### 백엔드 서버 (포트 5001)

```bash
cd backend
python app.py
```

#### 프론트엔드 서버 (포트 3001)

```bash
cd frontend
npm run dev
```

### 4. 애플리케이션 접속

브라우저에서 `http://localhost:3001`로 접속하세요.

### 5. API 테스트 (선택사항)

```bash
cd backend
python test_api.py
```

## API 엔드포인트

### 단어 비 관련 API

-   `GET /topics` - 사용 가능한 주제 목록 조회
-   `GET /words/{topic_id}` - 특정 주제의 단어 생성
    -   쿼리 파라미터:
        -   `count`: 생성할 단어 개수 (기본값: 500)
        -   `use_cache`: 캐시 사용 여부 (기본값: true)
-   `DELETE /words/{topic_id}/cache` - 특정 주제의 캐시 삭제
-   `DELETE /cache` - 모든 캐시 삭제

### 기존 API

-   `POST /word-to-coordinates` - 단어의 2D 좌표 변환

### Swagger UI

API 문서는 `http://localhost:5001/apidocs/`에서 확인할 수 있습니다.

## 기술 스택

### 백엔드

-   **Flask**: 웹 프레임워크
-   **OpenRouter API**: LLM을 통한 단어 생성 (무료 모델 사용)
-   **PyTorch**: 단어 임베딩 및 PCA 변환
-   **Flask-CORS**: CORS 설정
-   **python-dotenv**: 환경변수 관리

### 프론트엔드

-   **Next.js 15**: React 프레임워크
-   **TypeScript**: 타입 안전성
-   **Tailwind CSS**: 스타일링
-   **Canvas API**: 단어 비 애니메이션

## 사용 방법

1. 애플리케이션에 접속하면 주제 선택 화면이 나타납니다
2. 원하는 주제를 클릭하세요
3. AI가 해당 주제의 단어들을 생성합니다 (최대 1분 소요)
4. 생성이 완료되면 단어들이 비처럼 떨어지는 애니메이션이 시작됩니다
5. "단어 비 멈추기/시작하기" 버튼으로 애니메이션을 제어할 수 있습니다
6. "다른 주제 선택" 버튼으로 다른 주제를 선택할 수 있습니다

## 주의사항

-   **무료 사용**: OpenRouter의 무료 모델을 사용하므로 비용이 발생하지 않습니다
-   **API 키 필수**: OpenRouter API 키가 반드시 필요합니다
-   **생성 시간**: 처음 단어 생성 시 최대 1분 정도 소요될 수 있습니다
-   **캐시 활용**: 생성된 단어들은 24시간 동안 캐시됩니다
-   **서버 실행**: 백엔드(5001)와 프론트엔드(3001) 서버가 모두 실행되어야 합니다

## 문제 해결

### API 키 관련 오류

-   OpenRouter API 키가 올바르게 설정되었는지 확인하세요
-   `.env` 파일이 `backend` 디렉토리에 있는지 확인하세요
-   환경변수 확인: `echo $OPENROUTER_API_KEY`

### 네트워크 오류

-   백엔드 서버가 포트 5001에서 실행 중인지 확인하세요
-   방화벽 설정을 확인하세요
-   `python test_api.py`로 API 상태를 확인하세요

### 단어 생성 실패

-   인터넷 연결을 확인하세요
-   OpenRouter API 서비스 상태를 확인하세요
-   무료 모델의 사용량 제한을 확인하세요

## 개발자 도구

-   **API 테스트**: `python backend/test_api.py`
-   **Swagger UI**: `http://localhost:5001/apidocs/`
-   **환경변수 가이드**: `backend/README_ENV.md`
