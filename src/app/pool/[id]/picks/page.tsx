export default function PicksPlaceholder() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-green-900">Pick Submission Coming Soon</h2>
      <p className="mt-2 text-sm text-green-600">
        Pick submission will be available in the next update.
      </p>
    </div>
  );
}
