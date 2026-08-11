// Avatar artwork shared across the app.
//
// Real cartoon images live in /public/avatars (generated with Higgsfield);
// each maps 1:1 to an avatarType. A child's custom uploaded avatarUrl always
// wins over these defaults.

export const AVATAR_TYPES = [
  { id: "robot", name: "🤖 Robot Hero", description: "Tech-savvy and logical" },
  { id: "princess", name: "👑 Princess Hero", description: "Elegant and wise" },
  { id: "ninja", name: "🥷 Ninja Hero", description: "Stealthy and swift" },
  { id: "animal", name: "🦁 Animal Hero", description: "Wild and brave" },
] as const;

const AVATAR_IMAGES: Record<string, string> = {
  robot: "/avatars/robot.png",
  princess: "/avatars/princess.png",
  ninja: "/avatars/ninja.png",
  animal: "/avatars/animal.png",
};

export function getAvatarImage(type: string): string {
  return AVATAR_IMAGES[type] || AVATAR_IMAGES.robot;
}
