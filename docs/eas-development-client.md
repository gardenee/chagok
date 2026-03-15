# EAS Development Build에서 `No development servers found`가 뜨는 이유

`eas build --platform ios --profile development`로 만든 빌드는 앱 안에 완성된 JS 번들이 들어있는 형태가 아니다.

이 빌드는 `expo-dev-client` 기반의 개발용 클라이언트라서, 실행 시 로컬 개발 서버(Metro)에 연결되어야 한다.

그래서 아이폰에 설치는 정상적으로 되었더라도, 실행 시 연결 가능한 개발 서버가 없으면 아래 메시지가 뜬다.

```txt
No development servers found
```

---

## 왜 이런 일이 생기나

현재 프로젝트 설정은 개발 프로필에서 `developmentClient`를 사용하고 있다.

[`eas.json`](/Users/garden/Documents/chagok/eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

이 설정의 의미:

- `development` 빌드는 독립 실행형 앱이 아니다.
- 앱을 켜면 Metro 개발 서버를 찾아서 붙으려고 한다.
- 서버가 없거나 네트워크로 찾지 못하면 `No development servers found`가 뜬다.

---

## 가장 흔한 원인

### 1. Mac에서 개발 서버를 켜지 않았음

개발 빌드는 아래 명령으로 서버를 먼저 띄워야 한다.

```bash
npx expo start --dev-client
```

또는 프로젝트 스크립트로:

```bash
npm run start
```

단, 개발 빌드에 맞춰 가장 명확한 명령은 아래다.

```bash
npx expo start --dev-client
```

### 2. 아이폰이 개발 서버를 찾지 못함

서버를 켰더라도 네트워크 문제로 탐색에 실패할 수 있다.

대표적인 경우:

- Mac과 아이폰이 같은 Wi-Fi가 아님
- 회사/카페 네트워크에서 로컬 네트워크 탐색이 막힘
- VPN, 방화벽, 핫스팟 설정 때문에 Bonjour/LAN 탐색이 안 됨

이 경우에는 `tunnel` 모드로 실행해보는 것이 빠르다.

```bash
npx expo start --dev-client --tunnel
```

### 3. 기대한 빌드 타입과 실제 빌드 타입이 다름

`development` 프로필은 "설치 후 바로 단독 실행되는 테스트 앱"이 아니다.

용도는 아래처럼 나뉜다.

- `development`: 로컬 개발 서버에 붙는 개발용 클라이언트
- `preview`: 내부 배포용 테스트 빌드
- `production`: 실제 출시용 빌드

즉, "폰에 설치하고 그냥 실행되는 앱"을 기대했다면 `development`가 아니라 `preview` 또는 `production`이 맞다.

---

## 해결 방법

### 방법 1. 지금 빌드를 그대로 쓰면서 개발하기

프로젝트 루트에서:

```bash
npx expo start --dev-client
```

안 되면:

```bash
npx expo start --dev-client --tunnel
```

그 후 아이폰에서 설치된 앱을 다시 실행한다.

### 방법 2. 서버 없이 실행되는 테스트 빌드가 필요할 때

아래처럼 `preview` 빌드를 사용한다.

```bash
eas build --platform ios --profile preview
```

이 빌드는 내부 테스트 배포 용도에 더 가깝다.

---

## 빠른 점검 체크리스트

- `development` 프로필로 빌드했는가
- Mac에서 `npx expo start --dev-client`를 실행했는가
- Mac과 아이폰이 같은 네트워크에 있는가
- 안 되면 `--tunnel`로 시도했는가
- "단독 실행형 테스트 앱"이 필요한 상황은 아닌가

---

## 한 줄 정리

`No development servers found`는 보통 빌드 실패가 아니라, 개발용 클라이언트 앱이 연결할 Metro 서버를 찾지 못했다는 뜻이다.
