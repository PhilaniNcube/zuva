import { CoachGate } from "@/lib/role-gate";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoachGate>{children}</CoachGate>;
}
