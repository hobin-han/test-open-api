export async function sendApiRequest(group, api, overrides = {}) {
  const request = buildRequest(group, api, overrides);

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

    console.log({
      request: {
        url: maskSensitiveQueryParams(request.url),
        method: request.options.method,
      },
      response: extractRiseSetTimes(body),
    });

    return result;
  } catch (error) {
    console.error({
      request: {
        url: maskSensitiveQueryParams(request.url),
        method: request.options.method,
      },
      error,
    });
    throw error;
  }
}

function buildRequest(group, api, overrides) {
  const url = buildUrl(group.baseUrl, api.path);
  const query = {
    ...(api.query ?? {}),
    ...(overrides.query ?? {}),
  };
  appendComputedQueryParams(query, api.computedQuery);
  appendQueryParams(url, query);
  appendAuthParams(url, group.auth);

  const headers = {
    ...(group.headers ?? {}),
    ...(api.headers ?? {}),
    ...(overrides.headers ?? {}),
  };

  const options = {
    method: api.method,
    headers,
  };

  const body = overrides.body ?? api.body;

  if (body !== undefined) {
    options.body = JSON.stringify(body);
    options.headers = {
      "Content-Type": "application/json",
      ...headers,
    };
  }

  return {
    url: url.toString(),
    targetUrl: group.targetBaseUrl ? joinUrl(group.targetBaseUrl, api.path) : undefined,
    options,
  };
}

function buildUrl(baseUrl, path) {
  if (isAbsoluteUrl(baseUrl)) {
    return new URL(joinUrl(baseUrl, path));
  }

  return new URL(joinUrl(baseUrl, path), window.location.origin);
}

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(url);
}

function appendQueryParams(url, query) {
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => appendQueryParam(url, key, item));
      return;
    }

    appendQueryParam(url, key, value);
  });
}

function appendComputedQueryParams(query, computedQuery = {}) {
  Object.entries(computedQuery).forEach(([key, config]) => {
    if (config.type === "decimalCoordinateFlag") {
      query[key] = hasDecimalCoordinate(query, config.sourceKeys) ? "Y" : "N";
    }
  });
}

function hasDecimalCoordinate(query, sourceKeys = []) {
  return sourceKeys.some((key) => String(query[key] ?? "").includes("."));
}

function appendQueryParam(url, key, value) {
  if (value !== undefined && value !== null && value !== "") {
    url.searchParams.set(key, value);
  }
}

function appendAuthParams(url, auth) {
  if (!auth || auth.type !== "query") {
    return;
  }

  const encoding = window.localStorage.getItem(auth.encodingStorageKey) ?? auth.defaultEncoding;
  const value = readAuthValue(auth, encoding);

  if (encoding === "encoded") {
    appendRawQueryParam(url, auth.name, value);
    return;
  }

  appendQueryParam(url, auth.name, value);
}

function readAuthValue(auth, encoding) {
  const envKey = auth.envKeys?.[encoding];
  return envKey ? (import.meta.env[envKey] ?? "") : "";
}

function appendRawQueryParam(url, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  url.search = url.search
    ? `${url.search}&${key}=${value}`
    : `?${key}=${value}`;
}

function maskSensitiveQueryParams(url) {
  const parsedUrl = new URL(url);

  if (parsedUrl.searchParams.has("ServiceKey")) {
    parsedUrl.searchParams.set("ServiceKey", "***");
  }

  return parsedUrl.toString();
}

function extractRiseSetTimes(body) {
  if (typeof body === "string") {
    return extractRiseSetTimesFromXml(body);
  }

  return extractRiseSetTimesFromJson(body);
}

function extractRiseSetTimesFromXml(xmlText) {
  const document = new DOMParser().parseFromString(xmlText, "application/xml");
  const items = Array.from(document.querySelectorAll("item"));

  if (items.length === 0) {
    return {
      sunrise: getXmlText(document, "sunrise"),
      sunset: getXmlText(document, "sunset"),
    };
  }

  return items.map((item) => ({
    sunrise: getXmlText(item, "sunrise"),
    sunset: getXmlText(item, "sunset"),
  }));
}

function extractRiseSetTimesFromJson(value) {
  if (!value || typeof value !== "object") {
    return {
      sunrise: undefined,
      sunset: undefined,
    };
  }

  if ("sunrise" in value || "sunset" in value) {
    return {
      sunrise: value.sunrise,
      sunset: value.sunset,
    };
  }

  if (Array.isArray(value)) {
    return value.flatMap(extractRiseSetTimesFromJson);
  }

  return Object.values(value).flatMap(extractRiseSetTimesFromJson);
}

function getXmlText(root, selector) {
  return root.querySelector(selector)?.textContent ?? undefined;
}
