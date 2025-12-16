"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import DashboardTile from "../components/dashboard/DashboardTile.tsx";
import {
  Handshake,
  SignalHigh,
  ActivitySquare,
  Calculator,
  CalendarDays,
  Megaphone,
  BarChart3,
  GraduationCap,
  UserSquare2,
  School,
  CalendarClock,
  CircleHelp,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <SavannaCard className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">Welcome back, Trader 👋</h2>
          <p className="text-slate-400 mt-2">
            Here's your complete navigation hub. Click any card to access that section.
          </p>
        </CardContent>
      </SavannaCard>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardTile
          to="/dashboard/trade-with-savanna"
          title="Trade With Savanna"
          description="Broker partnership"
          Icon={Handshake}
          iconBg="bg-[#6c340e]"
        />
        <DashboardTile
          to="/dashboard/signals"
          title="Signals"
          description="Premium trading signals"
          Icon={SignalHigh}
          iconBg="bg-[#697452]"
        />
        <DashboardTile
          to="/dashboard/heatmap"
          title="Currency Heatmap"
          description="Live currency strength"
          Icon={ActivitySquare}
          iconBg="bg-blue-700"
        />
        <DashboardTile
          to="/dashboard/lot-size"
          title="Lot Size Calculator"
          description="Position sizing tool"
          Icon={Calculator}
          iconBg="bg-yellow-700"
        />

        <DashboardTile
          to="/dashboard/economic-calendar"
          title="Economic Calendar"
          description="Forex news events"
          Icon={CalendarDays}
          iconBg="bg-indigo-700"
        />
        <DashboardTile
          to="/dashboard/affiliates"
          title="Affiliate Programs"
          description="Earn commissions"
          Icon={Megaphone}
          iconBg="bg-purple-700"
        />
        <DashboardTile
          to="/dashboard/sentiment"
          title="Sentiment Voting"
          description="Community market sentiment"
          Icon={BarChart3}
          iconBg="bg-teal-700"
        />
        <DashboardTile
          to="/dashboard/course"
          title="Course"
          description="The GOAT Strategy"
          Icon={GraduationCap}
          iconBg="bg-green-700"
        />

        <DashboardTile
          to="/dashboard/one-on-one"
          title="One on One"
          description="Personal coaching"
          Icon={UserSquare2}
          iconBg="bg-orange-700"
        />
        <DashboardTile
          to="/dashboard/academy"
          title="Academy"
          description="In-person training"
          Icon={School}
          iconBg="bg-emerald-700"
        />
        <DashboardTile
          to="/dashboard/booking"
          title="Booking"
          description="Schedule sessions"
          Icon={CalendarClock}
          iconBg="bg-pink-700"
        />
        <DashboardTile
          to="/dashboard/enquiry"
          title="Enquiry"
          description="Get in touch"
          Icon={CircleHelp}
          iconBg="bg-rose-700"
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;