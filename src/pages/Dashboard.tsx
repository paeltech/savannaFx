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
  FileText,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

const Dashboard: React.FC = () => {
  const { session } = useSupabaseSession();
  const firstName = session?.user?.user_metadata?.first_name || "Trader";

  return (
    <DashboardLayout>
      <SavannaCard className="mb-6 sm:mb-8">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">
            Welcome back, {firstName} 👋
          </h2>
          <p className="text-rainy-grey mt-3 sm:mt-4 leading-relaxed text-sm sm:text-base">
            Here's your complete navigation hub. Click any card to access that section.
          </p>
        </CardContent>
      </SavannaCard>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DashboardTile
          to="/dashboard/trade-with-savanna"
          title="Trade With Savanna"
          description="Broker partnership"
          Icon={Handshake}
          iconBg="bg-gold"
        />
        <DashboardTile
          to="/dashboard/signals"
          title="Signals"
          description="Premium trading signals"
          Icon={SignalHigh}
          iconBg="bg-gold"
        />
        <DashboardTile
          to="/dashboard/trade-analysis"
          title="Trade Analysis"
          description="Daily pair analysis"
          Icon={FileText}
          iconBg="bg-gold"
        />
        <DashboardTile
          to="/dashboard/heatmap"
          title="Currency Heatmap"
          description="Live currency strength"
          Icon={ActivitySquare}
          iconBg="bg-gold"
        />
        <DashboardTile
          to="/dashboard/lot-size"
          title="Lot Size Calculator"
          description="Position sizing tool"
          Icon={Calculator}
          iconBg="bg-gold"
        />

        <DashboardTile
          to="/dashboard/economic-calendar"
          title="Economic Calendar"
          description="Forex news events"
          Icon={CalendarDays}
          iconBg="bg-gold"
        />
        <DashboardTile
          to="/dashboard/affiliates"
          title="Affiliate Programs"
          description="Earn commissions"
          Icon={Megaphone}
          iconBg="bg-gold"
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