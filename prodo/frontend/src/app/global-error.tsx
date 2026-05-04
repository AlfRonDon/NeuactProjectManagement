"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <button onClick={() => reset()} className="px-4 py-2 bg-blue-600 text-white rounded">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
