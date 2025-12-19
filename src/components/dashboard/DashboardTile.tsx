"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SavannaCard from "./SavannaCard";
import { HoverLift, fadeInUp } from "@/lib/animations";
import { motion } from "framer-motion";

type Props = {
  to: string;
  title: string;
  description: string;
  Icon: React.ComponentType<any>;
  iconBg?: string;
};

const DashboardTile: React.FC<Props> = ({ to, title, description, Icon, iconBg = "bg-[#6c340e]" }) => {
  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Link to={to} className="block">
        <HoverLift>
          <SavannaCard className="transition-all duration-300 hover:border-[#f4c464]/30 cursor-pointer">
            <CardHeader className="pb-3">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center mb-3`}
              >
                <Icon className="text-white/90" size={18} />
              </motion.div>
              <CardTitle className="text-white text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-[#f4c464] text-sm leading-relaxed">
              {description}
            </CardContent>
          </SavannaCard>
        </HoverLift>
      </Link>
    </motion.div>
  );
};

export default DashboardTile;