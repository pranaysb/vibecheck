import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <div className="mx-auto flex max-w-md justify-center px-4 py-14 sm:py-20">
      <SignIn />
    </div>
  );
}
