type ReferenceStateProps = {
  state: "loading" | "empty" | "error";
};

const messages = {
  loading: "Loading API reference…",
  empty: "No APIs have been published yet.",
  error: "The API reference could not be loaded.",
} as const;

export function ReferenceState({ state }: ReferenceStateProps) {
  const isError = state === "error";

  return (
    <main className="reference-state" role={isError ? "alert" : undefined}>
      <section className="reference-state__card">
        <p className="reference-state__eyebrow">grounds.gg</p>
        <h1>Grounds API Reference</h1>
        {state === "loading" ? (
          <p role="status" aria-label={messages.loading}>
            {messages.loading}
          </p>
        ) : (
          <p>{messages[state]}</p>
        )}
      </section>
    </main>
  );
}
