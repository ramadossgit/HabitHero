import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onBlur, placeholder, defaultValue, ...props }, ref) => {
    const [originalPlaceholder] = React.useState(placeholder || "");
    const [originalValue] = React.useState(defaultValue || "");
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Clear the input value on focus
      if (e.target.value === originalValue || e.target.value === originalPlaceholder) {
        e.target.value = "";
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Restore original value on blur if empty
      if (e.target.value.trim() === "") {
        e.target.value = originalValue as string;
      }
      onBlur?.(e);
    };

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={setRefs}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
