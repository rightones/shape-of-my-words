# 환경변수 설정 방법

## OpenRouter API 키 설정

1. [OpenRouter](https://openrouter.ai/keys)에서 무료 계정을 생성하고 API 키를 발급받으세요.

2. `backend` 디렉토리에 `.env` 파일을 생성하세요:

```bash
cd backend
touch .env
```

3. `.env` 파일에 다음 내용을 추가하세요:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## 무료 모델 사용

현재 설정은 무료 모델 `google/gemma-3-27b-it:free`를 사용하도록 되어 있습니다.
이 모델은 OpenRouter에서 무료로 제공되므로 별도 비용이 발생하지 않습니다.

## 환경변수 확인

서버 실행 전에 환경변수가 제대로 설정되었는지 확인하세요:

```bash
echo $OPENROUTER_API_KEY
```

또는 Python에서 확인:

```python
import os
from dotenv import load_dotenv

load_dotenv()
print(os.getenv('OPENROUTER_API_KEY'))
```
