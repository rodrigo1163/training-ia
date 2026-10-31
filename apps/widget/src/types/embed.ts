import type { ChatConfig } from "./chat";

export interface EmbedConfig {
  deploymentKey: string;
  displayMode: "floating" | "inline";
  initiallyOpen: boolean;
  openDelay: number;
  mode: "test" | "public";
  chatConfig?: ChatConfig;
}
