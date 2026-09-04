import clsx from "clsx";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "card-surface rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
      {...props}
    />
  );
}
