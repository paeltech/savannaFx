"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="bg-[#14241f] border-[#270f05]/50 hover:border-[#270f05]/80 transition-colors">
        <CardHeader className="pb-3">
          <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center mb-3`}>
            <Icon className="text-white/90" size={18} />
          </div>
          <CardTitle className="text-white text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-[#f4c464]/80 text-sm">
          {description}
        </CardContent>
      </Card>
    </Link>
  );
};

export default DashboardTile;