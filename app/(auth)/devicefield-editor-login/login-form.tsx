type LoginFormProps = { initialError?: string };

export default function LoginForm({ initialError }: LoginFormProps) {
  return (
    <form action="/auth/sign-in" method="post">
      {initialError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {initialError}
        </div>
      )}
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </span>
          <input
            className="form-input w-full py-2"
            type="email"
            name="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </span>
          <input
            className="form-input w-full py-2"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-6 flex w-full items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Sign in
      </button>
    </form>
  );
}
