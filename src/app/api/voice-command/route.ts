import { NextResponse } from "next/server";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { error: "An audio file is required." },
      { status: 400 },
    );
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio files must be smaller than 10 MB." },
      { status: 413 },
    );
  }

  // Replace this mock with a speech-to-text provider, then pass the
  // transcription through a validated command parser before mutating data.
  await new Promise((resolve) => setTimeout(resolve, 650));

  return NextResponse.json({
    transcription: "Log 120 joints of 5 1/2 inch casing in Rack B",
    matchedCommand: "log_pipe_count",
    confirmation:
      "Command matched: log pipe count. Ready to confirm 120 joints in Rack B.",
  });
}
