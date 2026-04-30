"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pmBus } from "@/lib/events";
import { API_BASE_URL, API_PREFIX } from "@/lib/config";

export type VoicePipelineState = "idle" | "listening" | "processing" | "speaking" | "error";
export type VoiceInputMode = "continuous" | "push-to-talk";

export interface ConversationMessage {
  id: string;
  speaker: "user" | "ai";
  text: string;
  timestamp: number;
}

export interface UseVoicePipelineReturn {
  state: VoicePipelineState;
  isActive: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  inputMode: VoiceInputMode;
  setInputMode: (mode: VoiceInputMode) => void;
  sendTextDirect: (text: string) => void;
  interimTranscript: string;
  userTranscript: string;
  messages: ConversationMessage[];
  isTTSSpeaking: boolean;
  stopTTS: () => void;
}

/**
 * useVoicePipeline — Browser-native voice pipeline for Neuact PM.
 *
 * Uses Web Speech API (SpeechRecognition) for STT and SpeechSynthesis for TTS.
 * Flow: User speaks → STT → orchestrate API → TTS speaks response.
 */
export function useVoicePipeline(): UseVoicePipelineReturn {
  const [state, setState] = useState<VoicePipelineState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<VoiceInputMode>("push-to-talk");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessingRef = useRef(false);
  const messageIdRef = useRef(0);
  const shouldRestartRef = useRef(false);

  const addMessage = useCallback(
    (speaker: "user" | "ai", text: string) => {
      const msg: ConversationMessage = {
        id: `msg-${++messageIdRef.current}-${Date.now()}`,
        speaker,
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev.slice(-49), msg]);
      return msg;
    },
    []
  );

  // Process transcript through Layer 2 orchestrator
  const processTranscript = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      isProcessingRef.current = true;
      setState("processing");
      addMessage("user", text);

      // Emit to event bus
      pmBus.emit({
        type: "TRANSCRIPT_UPDATE",
        transcript: { role: "user", text, isFinal: true },
      });

      try {
        const res = await fetch(`${API_BASE_URL}${API_PREFIX}/projects/orchestrate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text }),
        });

        if (!res.ok) throw new Error(`API returned ${res.status}`);

        const data = await res.json();
        const resultCount = data.results?.length ?? 0;
        const intent = data.intent || "general";

        // Build voice response
        let voiceResponse = "";
        if (intent === "overdue_tasks" && resultCount > 0) {
          voiceResponse = `You have ${resultCount} overdue task${resultCount > 1 ? "s" : ""}. `;
          const first = data.results[0];
          voiceResponse += `The most urgent is "${first.title}", due ${first.due_date}.`;
        } else if (intent === "project_status" && resultCount > 0) {
          voiceResponse = `You have ${resultCount} active project${resultCount > 1 ? "s" : ""}. `;
          data.results.forEach((p: { name: string; progress: number }) => {
            voiceResponse += `${p.name} is at ${p.progress}% progress. `;
          });
        } else if (intent === "milestone_query" && resultCount > 0) {
          voiceResponse = `${resultCount} upcoming milestone${resultCount > 1 ? "s" : ""}. `;
          const first = data.results[0];
          voiceResponse += `Next up: "${first.name}", due ${first.due_date}.`;
        } else if (resultCount > 0) {
          voiceResponse = `Found ${resultCount} result${resultCount > 1 ? "s" : ""} for your query about ${intent.replace(/_/g, " ")}.`;
        } else {
          voiceResponse = "No results found for that query. Try asking about project status, overdue tasks, or milestones.";
        }

        addMessage("ai", voiceResponse);

        // Emit RAG result
        pmBus.emit({
          type: "RAG_RESULT",
          result: { domain: "tasks", rawData: data, timestamp: Date.now() },
        });

        // Speak response using Web Speech API
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(voiceResponse);
          utterance.rate = 1.1;
          utterance.pitch = 1.0;
          setIsTTSSpeaking(true);
          setState("speaking");

          utterance.onend = () => {
            setIsTTSSpeaking(false);
            isProcessingRef.current = false;
            setState(shouldRestartRef.current ? "listening" : "idle");
          };
          utterance.onerror = () => {
            setIsTTSSpeaking(false);
            isProcessingRef.current = false;
            setState(shouldRestartRef.current ? "listening" : "idle");
          };

          speechSynthesis.speak(utterance);
        } else {
          isProcessingRef.current = false;
          setState(shouldRestartRef.current ? "listening" : "idle");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to process";
        setError(msg);
        addMessage("ai", `Error: ${msg}`);
        isProcessingRef.current = false;
        setState("error");
      }
    },
    [addMessage]
  );

  // Initialize SpeechRecognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final.trim()) {
        setUserTranscript(final.trim());
        processTranscript(final.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.error("[VoicePipeline] Recognition error:", event.error);
      setError(`Recognition error: ${event.error}`);
      setState("error");
    };

    recognition.onend = () => {
      // Auto-restart in continuous mode if we're still supposed to be listening
      if (shouldRestartRef.current && !isProcessingRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    return recognition;
  }, [processTranscript]);

  const start = useCallback(() => {
    setError(null);
    setInterimTranscript("");
    setUserTranscript("");
    shouldRestartRef.current = true;

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setState("listening");
      } catch {
        // Already started
        setState("listening");
      }
    }
  }, [initRecognition]);

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped
      }
    }
    setState("idle");
    setInterimTranscript("");
  }, []);

  const stopTTS = useCallback(() => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    setIsTTSSpeaking(false);
    isProcessingRef.current = false;
    setState(shouldRestartRef.current ? "listening" : "idle");
  }, []);

  const sendTextDirect = useCallback(
    (text: string) => {
      if (text.trim()) {
        processTranscript(text.trim());
      }
    },
    [processTranscript]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    };
  }, []);

  return {
    state,
    isActive: state !== "idle" && state !== "error",
    error,
    start,
    stop,
    inputMode,
    setInputMode,
    sendTextDirect,
    interimTranscript,
    userTranscript,
    messages,
    isTTSSpeaking,
    stopTTS,
  };
}
