"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SavannaCard from "./SavannaCard";

type Props = {
  to: string;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  iconBg?: string;
};

const DashboardTile: React.FC<Props> = ({ to, title, description, Icon, iconBg = "bg-gold" }) => {
  return (
    <Link to={to} className="block">
      <SavannaCard className="cursor-pointer">
        <CardHeader className="pb-4">
          <div className={`w-10 h-10 rounded-md ${iconBg} flex items-center justify-center mb-4`}>
            <Icon className="text-cursed-black" size={20} />
          </div>
          <CardTitle className="text-white text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-rainy-grey text-sm leading-relaxed">
          {description}
        </CardContent>
      </SavannaCard>
    </Link>
  );
};

export default DashboardTile;