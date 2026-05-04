"use client";

import { useEffect, useRef, useState } from "react";
import { useVoicePipeline } from "./useVoicePipeline";
import { Mic, Square, Send } from "lucide-react";

export default function VoiceControlBar() {
  const {
    state,
    isActive,
    error,
    start,
    stop,
    inputMode,
    setInputMode,
    sendTextDirect,
    interimTranscript,
    userTranscript,
    isTTSSpeaking,
    stopTTS,
    messages,
  } = useVoicePipeline();

  const [textInput, setTextInput] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const shiftSpaceHeldRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keyboard: Shift+Space for push-to-talk / toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in input
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (e.code === "Space" && e.shiftKey) {
        e.preventDefault();
        if (inputMode === "push-to-talk") {
          if (!shiftSpaceHeldRef.current) {
            shiftSpaceHeldRef.current = true;
            if (!isActive) start();
          }
        } else {
          if (isActive) stop();
          else start();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        shiftSpaceHeldRef.current = false;
        if (inputMode === "push-to-talk" && isActive) {
          e.preventDefault();
          stop();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isActive, start, stop, inputMode]);

  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isProcessing = state === "processing";
  const isError = state === "error";

  const statusText = isListening
    ? interimTranscript || userTranscript || "Listening..."
    : isSpeaking
      ? "Speaking..."
      : isProcessing
        ? "Thinking..."
        : isError
          ? error || "Error"
          : inputMode === "push-to-talk"
            ? "Hold Shift+Space to speak"
            : "Click mic or Shift+Space";

  const pillBorder = isListening
    ? "border-blue-500/40"
    : isSpeaking
      ? "border-purple-500/40"
      : isProcessing
        ? "border-yellow-500/30"
        : isError
          ? "border-bad-solid/30"
          : "border-white/[0.06]";

  const pillShadow = isListening
    ? "shadow-[0_0_20px_rgba(59,130,246,0.15)]"
    : isSpeaking
      ? "shadow-[0_0_20px_rgba(168,85,247,0.15)]"
      : isProcessing
        ? "shadow-[0_0_20px_rgba(234,179,8,0.1)]"
        : "shadow-lg";

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendTextDirect(textInput.trim());
      setTextInput("");
    }
  };

  return (
    <>
      <style>{`
        @keyframes pillFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }
        @keyframes waveBar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes micGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
        }
      `}</style>

      {/* Transcript panel — slides up from bottom */}
      {showTranscript && messages.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[500px] max-h-[300px] bg-black/60 backdrop-blur-2xl rounded-lg border border-white/10 overflow-hidden z-40">
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-widest text-white/40">
              Conversation
            </span>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-xs text-white/30 hover:text-white/60"
            >
              Close
            </button>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto max-h-[240px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-xs leading-relaxed ${
                  msg.speaker === "user"
                    ? "text-blue-300"
                    : "text-purple-300"
                }`}
              >
                <span className="text-[9px] uppercase font-bold tracking-wider text-white/30 mr-2">
                  {msg.speaker === "user" ? "You" : "AI"}
                </span>
                {msg.text}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Voice control pill — fixed at bottom center */}
      <div
        className={`
          fixed bottom-4 left-1/2 z-50
          bg-black/40 backdrop-blur-2xl rounded-full border
          ${pillBorder} ${pillShadow}
          px-1.5 py-1 flex items-center gap-2
          transition-all duration-300
          animate-[pillFloat_3s_ease-in-out_infinite]
        `}
      >
        {/* Mic button */}
        <button
          onClick={isActive ? stop : start}
          onMouseDown={
            inputMode === "push-to-talk" && !isActive
              ? () => start()
              : undefined
          }
          onMouseUp={
            inputMode === "push-to-talk" && isActive
              ? () => stop()
              : undefined
          }
          className={`
            relative w-7 h-7 rounded-full flex items-center justify-center shrink-0
            transition-all duration-200
            ${
              isListening
                ? "bg-blue-500 shadow-blue-500/50"
                : isSpeaking
                  ? "bg-purple-500 shadow-purple-500/50"
                  : isProcessing
                    ? "bg-yellow-500/80 shadow-yellow-500/30"
                    : isError
                      ? "bg-bad-solid shadow-bad-solid/30"
                      : "bg-white/[0.08] hover:bg-white/[0.14]"
            }
          `}
          style={
            isListening
              ? { animation: "micGlow 1.5s ease-in-out infinite" }
              : undefined
          }
        >
          {!isProcessing && (
            <Mic className="w-3.5 h-3.5 text-white" />
          )}
          {isProcessing && (
            <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
          )}
        </button>

        {/* Waveform bars — when listening */}
        {isListening && (
          <div className="flex items-center gap-[2px] h-4 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full bg-blue-400/80 origin-center"
                style={{
                  animation: `waveBar 0.6s ease-in-out ${i * 0.07}s infinite alternate`,
                  height: `${4 + Math.sin(i * 1.1) * 6 + 4}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Status text */}
        <div className="flex items-center gap-1.5 min-w-0 pr-0.5">
          <span
            className={`text-sm leading-none truncate max-w-[200px] ${
              isListening
                ? "text-blue-300"
                : isSpeaking
                  ? "text-purple-300"
                  : isProcessing
                    ? "text-yellow-300"
                    : isError
                      ? "text-bad-fg"
                      : "text-white/40"
            }`}
          >
            {isListening && (interimTranscript || userTranscript)
              ? `"${(interimTranscript || userTranscript).slice(-50)}"`
              : statusText}
          </span>

          {!isListening && !isSpeaking && !isProcessing && (
            <>
              <span className="text-white/15 text-[9px]">&middot;</span>
              <span className="text-[9px] text-white/25 shrink-0">
                Shift+Space
              </span>
            </>
          )}
        </div>

        {/* Stop TTS */}
        {isTTSSpeaking && (
          <button
            onClick={stopTTS}
            className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 transition-colors shrink-0 leading-none"
          >
            Stop
          </button>
        )}

        {/* Mode toggle */}
        <button
          onClick={() =>
            setInputMode(
              inputMode === "continuous" ? "push-to-talk" : "continuous"
            )
          }
          className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono shrink-0 leading-none transition-colors ${
            inputMode === "push-to-talk"
              ? "text-blue-400/60 hover:text-blue-300 hover:bg-blue-500/10"
              : "text-white/25 hover:text-white/50 hover:bg-white/5"
          }`}
          title={
            inputMode === "continuous"
              ? "Switch to push-to-talk"
              : "Switch to continuous"
          }
        >
          {inputMode === "continuous" ? "CONT" : "PTT"}
        </button>

        {/* Transcript toggle */}
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-1.5 h-1.5 rounded-full bg-white/20 hover:bg-white/40 shrink-0 transition-colors"
          title="Toggle transcript"
        />
      </div>

    </>
  );
}
