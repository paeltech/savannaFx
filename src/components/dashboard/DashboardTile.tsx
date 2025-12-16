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

const DashboardTile: React.FC<Props> = ({ to, title, description, Icon, iconBg = "bg-slate-700" }) => {
  return (
    <Link to={to} className="block">
      <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
        <CardHeader className="pb-3">
          <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center mb-3`}>
            <Icon className="text-white/90" size={18} />
          </div>
          <CardTitle className="text-white text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-400 text-sm">
          {description}
        </CardContent>
      </Card>
    </Link>
  );
};

export default DashboardTile;