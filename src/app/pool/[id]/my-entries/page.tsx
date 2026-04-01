export default function MyEntriesPlaceholder() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-green-900">My Entries</h2>
      <p className="mt-2 text-sm text-green-600">
        Your entries will appear here after you submit picks.
      </p>
    </div>
  );
}
