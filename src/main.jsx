import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Terminal,
  XCircle,
} from "lucide-react";
import { apiGroups } from "./apiSpecs";
import { sendApiRequest } from "./shared/apiClient";
import "./styles.css";

function App() {
  const [results, setResults] = useState({});
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [openOptionKey, setOpenOptionKey] = useState(null);
  const [authEncodings, setAuthEncodings] = useState(() => readAuthEncodings(apiGroups));
  const [requestOverrides, setRequestOverrides] = useState(() =>
    buildInitialRequestOverrides(apiGroups),
  );

  const totalApis = useMemo(
    () => apiGroups.reduce((count, group) => count + group.apis.length, 0),
    [],
  );

  const handleRun = async (group, api) => {
    setActiveRequestId(api.id);
    setResults((current) => ({
      ...current,
      [api.id]: { status: "running" },
    }));

    try {
      const result = await sendApiRequest(group, api, requestOverrides[api.id]);
      setResults((current) => ({
        ...current,
        [api.id]: {
          status: result.ok ? "success" : "error",
        },
      }));
    } catch {
      setResults((current) => ({
        ...current,
        [api.id]: { status: "error" },
      }));
    } finally {
      setActiveRequestId(null);
    }
  };

  const handleAuthEncodingChange = (auth, value) => {
    window.localStorage.setItem(auth.encodingStorageKey, value);
    setAuthEncodings((current) => ({
      ...current,
      [auth.encodingStorageKey]: value,
    }));
  };

  const handleQueryChange = (apiId, key, value) => {
    setOpenOptionKey(null);
    setRequestOverrides((current) => ({
      ...current,
      [apiId]: {
        ...current[apiId],
        query: {
          ...(current[apiId]?.query ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const handleResetQuery = (api) => {
    setOpenOptionKey(null);
    setRequestOverrides((current) => ({
      ...current,
      [api.id]: {
        ...(current[api.id] ?? {}),
        query: { ...(api.query ?? {}) },
      },
    }));
  };

  return (
    <main className="app-shell">
      <section className="top-bar" aria-label="service summary">
        <div>
          <p className="eyebrow">Open API Console Tester</p>
          <h1>플랫폼별 API 호출 테스트</h1>
        </div>
        <div className="summary">
          <Activity size={18} />
          <span>{apiGroups.length} platforms</span>
          <span>{totalApis} APIs</span>
        </div>
      </section>

      <section className="console-note">
        <Terminal size={20} />
        <span>버튼을 누르면 브라우저 console에 request와 response가 출력됩니다.</span>
      </section>

      <section className="group-list" aria-label="api groups">
        {apiGroups.map((group) => (
          <article className="api-group" key={group.id}>
            <header className="group-header">
              <div>
                <p>{group.name}</p>
                <span>{group.baseUrl}</span>
              </div>
              <strong>{group.apis.length}</strong>
            </header>

            {group.auth ? (
              <div className="auth-row">
                <span>{group.auth.label}</span>
                <div className="auth-controls">
                  <select
                    value={
                      authEncodings[group.auth.encodingStorageKey] ??
                      group.auth.defaultEncoding ??
                      "decoded"
                    }
                    onChange={(event) =>
                      handleAuthEncodingChange(group.auth, event.target.value)
                    }
                    aria-label="ServiceKey encoding"
                  >
                    <option value="decoded">Decoding 키</option>
                    <option value="encoded">Encoding 키</option>
                  </select>
                  <EnvKeyStatus
                    auth={group.auth}
                    encoding={
                      authEncodings[group.auth.encodingStorageKey] ??
                      group.auth.defaultEncoding ??
                      "decoded"
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="api-grid">
              {group.apis.map((api) => {
                const result = results[api.id];
                const isRunning = activeRequestId === api.id;
                const query = requestOverrides[api.id]?.query ?? {};

                return (
                  <article className="api-card" key={api.id}>
                    <button
                      className="api-button"
                      type="button"
                      onClick={() => handleRun(group, api)}
                      disabled={isRunning}
                      title={`${api.method} ${api.path}`}
                    >
                      <span className={`method method-${api.method.toLowerCase()}`}>
                        {api.method}
                      </span>
                      <span className="api-main">
                        <span>{api.name}</span>
                        <small>{api.path}</small>
                      </span>
                      <StatusIcon result={result} isRunning={isRunning} />
                    </button>

                    {Object.keys(query).length > 0 ? (
                      <div className="query-editor">
                        <div className="query-editor-header">
                          <span>Query parameters</span>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => handleResetQuery(api)}
                            title="기본값으로 되돌리기"
                            aria-label="기본값으로 되돌리기"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>

                        {Object.entries(query).map(([key, value]) => (
                          <label className="query-field" key={key}>
                            <span>
                              <strong>{key}</strong>
                              {api.parameters?.[key]?.label ? (
                                <small>{api.parameters[key].label}</small>
                              ) : null}
                            </span>
                            {api.parameters?.[key]?.options ? (
                              <OptionPicker
                                id={`${api.id}-${key}`}
                                value={value}
                                options={api.parameters[key].options}
                                isOpen={openOptionKey === `${api.id}-${key}`}
                                onToggle={() =>
                                  setOpenOptionKey((current) =>
                                    current === `${api.id}-${key}` ? null : `${api.id}-${key}`,
                                  )
                                }
                                onChange={(nextValue) =>
                                  handleQueryChange(api.id, key, nextValue)
                                }
                              />
                            ) : (
                              <input
                                value={value}
                                onChange={(event) =>
                                  handleQueryChange(api.id, key, event.target.value)
                                }
                              />
                            )}
                          </label>
                        ))}

                        {Object.entries(api.computedQuery ?? {}).map(([key, config]) => (
                          <div className="query-field query-field-readonly" key={key}>
                            <span>
                              <strong>{key}</strong>
                              <small>{config.label}</small>
                            </span>
                            <output>{computeDisplayQueryValue(config, query)}</output>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function OptionPicker({ id, value, options, isOpen, onToggle, onChange }) {
  return (
    <div className="option-picker">
      <button
        type="button"
        className="option-picker-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
      >
        <span>{value}</span>
      </button>

      {isOpen ? (
        <div className="option-picker-menu" id={`${id}-options`} role="listbox">
          {options.map((option) => (
            <button
              type="button"
              className={`option-picker-item ${option === value ? "is-selected" : ""}`}
              key={option}
              onClick={() => onChange(option)}
              role="option"
              aria-selected={option === value}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function computeDisplayQueryValue(config, query) {
  if (config.type === "decimalCoordinateFlag") {
    return hasDecimalCoordinate(query, config.sourceKeys) ? "Y" : "N";
  }

  return "";
}

function hasDecimalCoordinate(query, sourceKeys = []) {
  return sourceKeys.some((key) => String(query[key] ?? "").includes("."));
}

function buildInitialRequestOverrides(groups) {
  return groups.reduce((overrides, group) => {
    group.apis.forEach((api) => {
      overrides[api.id] = {
        query: { ...(api.query ?? {}) },
      };
    });

    return overrides;
  }, {});
}

function readAuthEncodings(groups) {
  return groups.reduce((values, group) => {
    if (group.auth?.encodingStorageKey) {
      values[group.auth.encodingStorageKey] =
        window.localStorage.getItem(group.auth.encodingStorageKey) ??
        group.auth.defaultEncoding ??
        "decoded";
    }

    return values;
  }, {});
}

function EnvKeyStatus({ auth, encoding }) {
  const envKey = auth.envKeys?.[encoding];
  const hasValue = Boolean(import.meta.env[envKey]);

  return (
    <span className={`env-status ${hasValue ? "env-status-ready" : "env-status-missing"}`}>
      {envKey}: {hasValue ? "loaded" : "missing"}
    </span>
  );
}

function StatusIcon({ result, isRunning }) {
  if (isRunning || result?.status === "running") {
    return <Loader2 className="spin status-icon" size={18} aria-label="running" />;
  }

  if (result?.status === "success") {
    return <CheckCircle2 className="status-icon success" size={18} aria-label="success" />;
  }

  if (result?.status === "error") {
    return <XCircle className="status-icon error" size={18} aria-label="error" />;
  }

  return <Play className="status-icon idle" size={18} aria-label="run" />;
}

createRoot(document.getElementById("root")).render(<App />);
