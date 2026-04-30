import AuthPageClient from "@/components/AuthPageClient";
import { Suspense } from "react";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageClient />
    </Suspense>
  );
}
