import { ArrowRight, Bell, Check, ChevronDown, CircleHelp, Clock3, Edit3, FileText, Folder, Home, Image, Menu, MoreHorizontal, Play, Plus, ReceiptText, Search, Send, Settings, ShoppingBag, Sparkles, Store, TrendingUp, Upload, Video, WandSparkles } from "lucide-react";
import type { IconName } from "@/lib/tools";

export function Brand({ compact = false }: { compact?: boolean }) { return <span className="brand"><i><span /></i>{!compact && <b>FlowMoa</b>}</span>; }

const icons = { home: Home, video: Video, edit: Edit3, store: Store, receipt: ReceiptText, youtube: Play, sparkles: Sparkles, wand: WandSparkles, send: Send, check: Check, arrow: ArrowRight, chevron: ChevronDown, more: MoreHorizontal, play: Play, search: Search, bell: Bell, help: CircleHelp, settings: Settings, folder: Folder, upload: Upload, clock: Clock3, image: Image, file: FileText, plus: Plus, trend: TrendingUp };

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) { const Component = icons[name]; return <Component aria-hidden="true" width={size} height={size} strokeWidth={1.8} />; }

export { Menu, ShoppingBag };
