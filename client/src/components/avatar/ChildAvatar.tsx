// Shows a child's hero anywhere in the app. If the child uses the modular
// avatar system (has an avatarId), it renders the live layered composite
// (base + equipped gear). Otherwise it falls back to the classic avatar
// image, so nothing breaks for existing children.
import AvatarRenderer from "@/components/avatar/AvatarRenderer";
import { AVATAR_BY_ID, GEAR_BY_ID, type EquippedItems } from "@shared/avatar-system";
import { getAvatarImage } from "@/lib/avatars";

interface ChildLike {
  avatarId?: string | null;
  equippedGear?: EquippedItems | null;
  avatarType?: string;
  avatarUrl?: string | null;
  name?: string;
}

export default function ChildAvatar({
  child, size = 48, className = "",
}: {
  child: ChildLike; size?: number; className?: string;
}) {
  const modular = child.avatarId ? AVATAR_BY_ID[child.avatarId] : undefined;

  if (modular) {
    return (
      <div className={`overflow-hidden ${className}`} style={{ width: size, height: size }}>
        <AvatarRenderer avatar={modular} equipped={(child.equippedGear as EquippedItems) || {}} catalog={GEAR_BY_ID} size={size} />
      </div>
    );
  }

  return (
    <img
      src={child.avatarUrl || getAvatarImage(child.avatarType || "robot")}
      alt={child.name || "Hero"}
      className={`object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
