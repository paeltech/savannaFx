"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  rounded?: "lg" | "xl";
};

const SavannaCard: React.FC<Props> = ({ className, hoverable = true, rounded = "xl", ...props }) => {
  const roundedClass = rounded === "xl" ? "rounded-xl" : "rounded-lg";
  return (
    <Card
      className={cn(
        // SavannaFX dark card style
        "bg-[#1a2a23] border-[#0f1d18]/60",
        roundedClass,
        hoverable && "transition-colors hover:border-[#0f1d18]/80",
        className
      )}
      {...props}
    />
  );
};

export default SavannaCard;