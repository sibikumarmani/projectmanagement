import { AppShell } from "@/components/layout/app-shell";
import { AgentPanel } from "@/components/agent/agent-panel";

export default function AgentPage() {
  return (
    <AppShell
      title="Data Entry Agent"
      subtitle="Use natural language to create linked PMS records. The agent can inspect existing projects and users, then create new data through the live backend services."
    >
      <AgentPanel />
    </AppShell>
  );
}
