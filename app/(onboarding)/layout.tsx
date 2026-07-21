import { OnboardingGate } from "@/lib/role-gate";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGate>{children}</OnboardingGate>;
}
