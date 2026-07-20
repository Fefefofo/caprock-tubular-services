"use client";

import { useRef, useState } from "react";

type VoiceCommandResult = {
  transcription: string;
  matchedCommand: "log_pipe_count" | "complete_work_order" | "unknown";
  confirmation: string;
};

type Phase = "idle" | "recording" | "processing" | "complete" | "error";

export function VoiceCommandCapture() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError("");
    setResult(null);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("This browser does not support microphone recording.");
      setPhase("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", submitRecording);
      recorder.start();
      setPhase("recording");
    } catch {
      setError("Microphone access was not granted.");
      setPhase("error");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setPhase("processing");
    }
  }

  async function submitRecording() {
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const audioBlob = new Blob(chunksRef.current, { type: mimeType });
    streamRef.current?.getTracks().forEach((track) => track.stop());

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-command.webm");

      const response = await fetch("/api/voice-command", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Voice command request failed");
      }

      const data = (await response.json()) as VoiceCommandResult;
      setResult(data);
      setPhase("complete");
    } catch {
      setError("The command could not be processed. Please try again.");
      setPhase("error");
    } finally {
      mediaRecorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
    }
  }

  const isRecording = phase === "recording";
  const isProcessing = phase === "processing";

  return (
    <section className="voice-panel">
      <div className="voice-heading">
        <div>
          <p className="eyebrow">Voice command capture</p>
          <h2>Update the yard without leaving the work</h2>
          <p>
            Use the headset microphone to log inventory or update a work order.
            The server will transcribe, match, and confirm the command.
          </p>
        </div>
        <span className="phase-label">{phase}</span>
      </div>

      <div className="recorder">
        <button
          className={`record-button${isRecording ? " recording" : ""}`}
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <span className="record-icon" aria-hidden="true" />
        </button>
        <p className="recorder-instruction">
          {isRecording
            ? "Listening... tap to stop"
            : isProcessing
              ? "Transcribing and matching..."
              : "Tap to speak a command"}
        </p>
        <p className="recorder-help">Your browser will request microphone access.</p>

        {result && (
          <div className="result" aria-live="polite">
            <span>Heard</span>
            <p>“{result.transcription}”</p>
            <p className="confirmation">{result.confirmation}</p>
          </div>
        )}

        {error && (
          <div className="result error" role="alert">
            <span>Unable to process</span>
            <p>{error}</p>
          </div>
        )}
      </div>
    </section>
  );
}
