import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { useEffect, useState } from "react";

import { ReferenceState } from "./components/ReferenceState";
import {
  loadApiSources,
  type ScalarSource,
} from "./registry/load-registry";

type LoadState = "loading" | "ready" | "error";

export function App() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [sources, setSources] = useState<ScalarSource[]>([]);

  useEffect(() => {
    let active = true;

    void loadApiSources()
      .then((loadedSources) => {
        if (!active) {
          return;
        }

        setSources(loadedSources);
        setLoadState("ready");
      })
      .catch(() => {
        if (active) {
          setLoadState("error");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loadState === "loading") {
    return <ReferenceState state="loading" />;
  }

  if (loadState === "error") {
    return <ReferenceState state="error" />;
  }

  if (sources.length === 0) {
    return <ReferenceState state="empty" />;
  }

  return (
    <ApiReferenceReact
      configuration={{
        title: "Grounds API Reference",
        sources,
        pathRouting: { basePath: "/docs" },
        hideClientButton: true,
        hideDownloadButton: false,
        showSidebar: true,
      }}
    />
  );
}
