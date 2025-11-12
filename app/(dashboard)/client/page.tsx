"use client";

import { useCallback, useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, CheckCircle2, CloudDownload, FileText, RotateCcw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DutyDashboard from "./DutyDashboard";
import type { DutyLifecycle, DutyRecord, DutyStatus } from "@/lib/duty-store";

export default function ClientPage(): JSX.Element {
  const defaultClient = "acme-co";
  return <DutyDashboard clientId={defaultClient} />;
}
