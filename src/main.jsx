import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, CheckCircle2, Loader2, Play, Terminal, XCircle } from "lucide-react";
import { apiGroups } from "./apiSpecs";
import { sendApiRequest } from "./shared/apiClient";
import "./styles.css";

function App() {
  const [results, setResults] = useState({});
  const [activeRequestId, setActiveRequestId] = useState(null);

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
      const result = await sendApiRequest(group, api);
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

            <div className="api-grid">
              {group.apis.map((api) => {
                const result = results[api.id];
                const isRunning = activeRequestId === api.id;

                return (
                  <button
                    className="api-button"
                    key={api.id}
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
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </main>
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
