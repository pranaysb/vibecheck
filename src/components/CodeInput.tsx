export function CodeInput({ autoFocus = true }: { autoFocus?: boolean }) {
  return (
    <div>
      <label htmlFor="code" className="label">6-digit code</label>
      <input
        id="code"
        name="code"
        className="field h-12 text-center font-mono text-2xl tracking-[0.5em]"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        placeholder="000000"
        required
        autoFocus={autoFocus}
      />
    </div>
  );
}
