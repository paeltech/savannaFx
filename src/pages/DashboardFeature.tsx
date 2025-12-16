"use client";

import React from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { Button } from "@/components/ui/button";

const friendlyTitle = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const DashboardFeature: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const title = section ? friendlyTitle(section) : "Section";

  return (
    <DashboardLayout>
      <SavannaCard>
        <CardContent className="p-6 space-y-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">{title}</h2>
          <p className="text-slate-400">
            This is a placeholder page for {title}. We can plug in real data and tools here.
          </p>
          <div className="flex gap-3">
            <Link to="/dashboard">
              <Button variant="outline" className="border-slate-700 text-slate-200">Back to Dashboard</Button>
            </Link>
            <Button className="bg-[#697452] hover:bg-[#697452]/90 text-white">Open Tool</Button>
          </div>
        </CardContent>
      </SavannaCard>
    </DashboardLayout>
  );
};

export default DashboardFeature;