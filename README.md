# test-open-api

Open API request/response를 브라우저에서 직접 확인하기 위한 Vite 웹서비스입니다.

API는 제공 플랫폼 기준으로 그룹핑되며, 각 API 버튼을 클릭하면 공통 request 로직을 통해 API를 호출하고 브라우저 console에 request/response를 출력합니다.

## 실행

```bash
npm install
npm run dev
```

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
  apis: [
    {
      id: "sample-users",
      name: "사용자 목록",
      method: "GET",
      path: "/users",
      query: {
        page: 1,
      },
    },
  ],
}
```

모든 API request/response 공통 처리는 `src/shared/apiClient.js`에서 관리합니다.
