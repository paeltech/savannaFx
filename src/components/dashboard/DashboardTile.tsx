"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SavannaCard from "./SavannaCard";

type Props = {
  to: string;
  title: string;
  description: string;
  Icon: React.ComponentType<any>;
  iconBg?: string;
};

const DashboardTile: React.FC<Props> = ({ to, title, description, Icon, iconBg = "bg-[#6c340e]" }) => {
  return (
    <Link to={to} className="block">
      <SavannaCard className="">
        <CardHeader className="pb-3">
          <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center mb-3`}>
            <Icon className="text-white/90" size={18} />
          </div>
          <CardTitle className="text-white text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-[#f4c464]/80 text-sm">
          {description}
        </CardContent>
      </SavannaCard>
    </Link>
  );
};

export default DashboardTile;