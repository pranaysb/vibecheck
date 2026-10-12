import { SignUp } from "@clerk/nextjs";

export const metadata = { title: "Create account" };

export default function Page() {
  return (
    <div className="mx-auto flex max-w-md justify-center px-4 py-14 sm:py-20">
      <SignUp />
    </div>
  );
}
