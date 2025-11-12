"use client";

import DutyDashboard from "./DutyDashboard";

export default function ClientPage(): JSX.Element {
  const defaultClient = "acme-co";
  return <DutyDashboard clientId={defaultClient} />;
}
