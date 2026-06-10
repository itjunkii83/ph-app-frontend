import { Runner } from "@/components/runner/runner";
import { uiConfig } from "@/lib/config";

export default function PracticePage() {
  return <Runner config={uiConfig} />;
}
