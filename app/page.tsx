import { Dashboard } from "@/components/dashboard";
import { config } from "@/lib/config";

export default function Home() {
  return <Dashboard config={config} />;
}
