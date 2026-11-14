import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@training-ia/ui/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type UserAvatarProps = {
  className?: string;
  image?: string | null;
  name: string;
  showStatus?: boolean;
};

export function UserAvatar({
  className,
  image,
  name,
  showStatus = false,
}: UserAvatarProps) {
  return (
    <div className={cn("relative size-8 shrink-0", className)}>
      <Avatar className="size-full bg-muted text-xs font-semibold text-foreground">
        {image && <AvatarImage alt={name} src={image} />}
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      {showStatus && (
        <span className="absolute right-0 bottom-0 size-2 rounded-full border-2 border-card bg-chart-2" />
      )}
    </div>
  );
}
