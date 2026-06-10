import { Harbor } from "@/components/harbor/harbor";
import { uiConfig } from "@/lib/config";

export default function Home() {
  return <Harbor config={uiConfig} />;
}
