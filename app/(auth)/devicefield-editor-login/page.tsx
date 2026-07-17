import LoginForm from "./login-form";

type DevicefieldEditorLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DevicefieldEditorLoginPage({
  searchParams,
}: DevicefieldEditorLoginPageProps) {
  const error = (await searchParams).error;

  return (
    <>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-700">
          Editor
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
          Private publishing login.
        </h1>
      </div>

      <LoginForm initialError={error} />
    </>
  );
}
