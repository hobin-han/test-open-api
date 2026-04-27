export const apiGroups = [
  {
    id: "jsonplaceholder",
    name: "JSONPlaceholder",
    baseUrl: "https://jsonplaceholder.typicode.com",
    headers: {
      Accept: "application/json",
    },
    apis: [
      {
        id: "jsonplaceholder-posts",
        name: "게시글 목록",
        method: "GET",
        path: "/posts",
      },
      {
        id: "jsonplaceholder-post-detail",
        name: "게시글 상세",
        method: "GET",
        path: "/posts/1",
      },
      {
        id: "jsonplaceholder-create-post",
        name: "게시글 생성",
        method: "POST",
        path: "/posts",
        body: {
          title: "Open API test",
          body: "request/response console check",
          userId: 1,
        },
      },
    ],
  },
  {
    id: "httpbin",
    name: "HTTPBin",
    baseUrl: "https://httpbin.org",
    headers: {
      Accept: "application/json",
    },
    apis: [
      {
        id: "httpbin-get",
        name: "Query Echo",
        method: "GET",
        path: "/get",
        query: {
          source: "vite-browser",
        },
      },
      {
        id: "httpbin-post",
        name: "Body Echo",
        method: "POST",
        path: "/post",
        body: {
          hello: "open-api",
        },
      },
    ],
  },
];
