import { Suspense } from "react";

import MarketDashboard from "./MarketDashboard";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MarketDashboard />
    </Suspense>
  );
}
