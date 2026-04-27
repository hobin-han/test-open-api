export async function sendApiRequest(group, api) {
  const request = buildRequest(group, api);

  console.groupCollapsed(`[Open API Test] ${group.name} / ${api.name}`);
  console.log("request", request);

  try {
    const response = await fetch(request.url, request.options);
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    const result = {
      ok: response.ok,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      },
      body,
    };

    console.log("response", result);
    return result;
  } catch (error) {
    console.error("error", error);
    throw error;
  } finally {
    console.groupEnd();
  }
}

function buildRequest(group, api) {
  const url = new URL(api.path, ensureTrailingSlash(group.baseUrl));
  Object.entries(api.query ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
      return;
    }

    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const headers = {
    ...(group.headers ?? {}),
    ...(api.headers ?? {}),
  };

  const options = {
    method: api.method,
    headers,
  };

  if (api.body !== undefined) {
    options.body = JSON.stringify(api.body);
    options.headers = {
      "Content-Type": "application/json",
      ...headers,
    };
  }

  return {
    url: url.toString(),
    options,
  };
}

function ensureTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}
