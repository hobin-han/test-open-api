# test-open-api

Open API request/response를 브라우저에서 직접 확인하기 위한 Vite + React 웹서비스입니다.

API는 제공 플랫폼 기준으로 그룹핑되며, 각 API 버튼을 클릭하면 공통 request 로직을 통해 API를 호출하고 브라우저 console에 request/response를 출력합니다. 현재는 한국천문연구원 출몰시각 정보제공 서비스 API 호출 테스트가 등록되어 있습니다.

## 실행

```bash
npm install
npm run dev
```

공공데이터 API는 브라우저 직접 호출 시 CORS에 막힐 수 있어 Vite dev proxy를 사용합니다. 개발 서버 실행 후 화면의 request URL은 `/openapi/kasi-rise-set/...` 형태로 보이고, Vite가 `http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/...`로 전달합니다.

공공데이터포털 인증키는 `.env`에서 관리합니다. `.env.example`을 참고해 `.env`를 만들고 개발 서버를 재시작하세요.

```bash
VITE_DATA_GO_KR_SERVICE_KEY_DECODED=Decoding 인증키
VITE_DATA_GO_KR_SERVICE_KEY_ENCODED=Encoding 인증키
```

화면에서는 `Decoding 키` 또는 `Encoding 키` 방식을 선택해 테스트할 수 있습니다. `Decoding 키`는 브라우저가 query string으로 인코딩해 전송하고, `Encoding 키`는 `.env` 값을 그대로 `ServiceKey` query parameter에 붙여 전송합니다.

각 API 카드의 query parameter 입력값을 수정한 뒤 버튼을 누르면, 수정된 request 값으로 호출됩니다. 되돌리기 아이콘을 누르면 문서 기준 기본 샘플값으로 복원됩니다.

`dnYn`처럼 문서의 항목설명으로부터 결정 가능한 값은 직접 입력하지 않고 자동 계산합니다. 현재 `longitude` 또는 `latitude`에 소수점이 포함되면 `dnYn=Y`, 아니면 `dnYn=N`으로 전송합니다.

`location`처럼 문서에 제공 목록이 있는 파라미터는 직접 입력하지 않고 목록에서 선택합니다.

## API 명세 추가

플랫폼별 API 정의는 `src/apiSpecs.js`에 추가합니다.

```js
{
  id: "sample-platform",
  name: "Sample Platform",
  baseUrl: "https://api.example.com",
  headers: {
    Accept: "application/json",
  },
  auth: {
    type: "query",
    name: "ServiceKey",
    encodingStorageKey: "sample_service_key_encoding",
    defaultEncoding: "decoded",
    envKeys: {
      decoded: "VITE_SAMPLE_SERVICE_KEY_DECODED",
      encoded: "VITE_SAMPLE_SERVICE_KEY_ENCODED",
    },
    label: "ServiceKey",
  },
  apis: [
    {
      id: "sample-users",
      name: "사용자 목록",
      method: "GET",
      path: "/users",
      query: {
        page: 1,
      },
      parameters: {
        page: {
          label: "페이지",
        },
      },
    },
  ],
}
```

모든 API request/response 공통 처리는 `src/shared/apiClient.js`에서 관리합니다.
