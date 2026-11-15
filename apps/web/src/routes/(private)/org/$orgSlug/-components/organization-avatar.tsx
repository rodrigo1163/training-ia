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

type OrganizationAvatarProps = {
  className?: string;
  image?: string | null;
  name: string;
};

export function OrganizationAvatar({
  className,
  image,
  name,
}: OrganizationAvatarProps) {
  return (
    <Avatar
      className={cn(
        "size-full bg-muted text-xs font-semibold text-foreground",
        className,
      )}
    >
      {image && <AvatarImage alt={name} src={image} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
