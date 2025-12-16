"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Handshake,
  Gift,
  MessageSquare,
  Trophy,
  Wrench,
  Phone,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { showSuccess } from "@/utils/toast";

const BenefitItem = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}) => (
  <Card className="bg-slate-900/60 border-slate-800">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center">
          <Icon className="text-[#f4c464]" size={18} />
        </div>
        <CardTitle className="text-white text-base">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="text-slate-400 text-sm">{desc}</CardContent>
  </Card>
);

const TradeWithSavanna: React.FC = () => {
  const handleRegister = () => {
    showSuccess("Redirecting to Exness…");
    // In a real app, replace with your referral link
    window.open("https://www.exness.com/", "_blank", "noopener,noreferrer");
  };

  const handleVerifyEmail = () => {
    showSuccess("We'll verify your email and grant access shortly.");
  };

  return (
    <DashboardLayout>
      {/* Header banner */}
      <Card className="bg-slate-900/60 border-slate-800 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#6c340e] flex items-center justify-center">
              <Handshake className="text-white" size={18} />
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-white">
              Trade With Savanna via <span className="text-red-500 italic">EXNESS</span>
            </h1>
          </div>
          <p className="text-slate-400 mt-2">
            Open a real Exness account with SavannaFX’s referral link and get lifetime access to free signals.
          </p>
        </CardContent>
      </Card>

      {/* Main content: 2-column layout */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left: Info and benefits */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="text-green-500" size={18} />
                <h2 className="text-white text-lg font-semibold">
                  Trade with Savanna — Free (Lifetime Access)
                </h2>
              </div>
              <div className="bg-slate-800/50 rounded-md p-4">
                <h3 className="text-slate-200 font-medium mb-1">Who this is for:</h3>
                <p className="text-slate-400">
                  Traders who want to join the SavannaFX ecosystem without paying upfront, and still get access to the full signal
                  experience — simply by funding their own live trading account.
                </p>
              </div>

              <div className="mt-6">
                <h3 className="text-slate-200 font-medium mb-3">What You Get:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <BenefitItem
                    icon={ShieldCheck}
                    title="Lifetime Access to VIP Signal Group"
                    desc="Normally $50/month — you save $600+ yearly."
                  />
                  <BenefitItem
                    icon={MessageSquare}
                    title="Private Telegram Group"
                    desc="Verified Exness traders — tighter community, faster updates."
                  />
                  <BenefitItem
                    icon={Trophy}
                    title="Priority Trading Competitions"
                    desc="Win real money and funded accounts."
                  />
                  <BenefitItem
                    icon={Wrench}
                    title="Early Access to Tools"
                    desc="Future bots, EAs, and strategy tools by SavannaFX."
                  />
                  <BenefitItem
                    icon={Phone}
                    title="Customer Support Line"
                    desc="Fast verification — get onboarded in less than 24hrs."
                  />
                  <BenefitItem
                    icon={CalendarClock}
                    title="Monthly Live Recaps"
                    desc="Exness-only traders performance analysis sessions."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Signup panel */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-green-500 text-2xl font-bold">FREE</div>
              <div className="text-slate-300">Lifetime Access</div>

              <div className="mt-6 text-slate-400">Don't have an account?</div>
              <Button
                className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white h-11 rounded-md"
                onClick={handleRegister}
              >
                REGISTER ON EXNESS
              </Button>

              <div className="mt-4 text-slate-400">OR</div>

              <div className="mt-3 text-slate-400">Already have an account with our referral link?</div>
              <Button
                variant="outline"
                className="mt-2 w-full h-11 rounded-md border-slate-700 text-slate-200 hover:bg-slate-800"
                onClick={handleVerifyEmail}
              >
                SUBMIT EMAIL FOR VERIFICATION
              </Button>

              <p className="text-slate-500 text-xs mt-2">Get instant access to signals</p>

              <div className="mt-6 text-left">
                <p className="text-slate-300 font-medium mb-2">Why This Is a Steal:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-slate-400">
                    <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
                    <span>
                      Zero Cost to Join — just deposit your trading funds — you keep <span className="text-slate-200">100%</span> of your money
                    </span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400">
                    <Wallet className="text-emerald-500 mt-0.5" size={16} />
                    <span>Stay 100% Liquid — premium access while staying risk-free from SavannaFX's side</span>
                  </li>
                  <li className="flex items-start gap-2 text-slate-400">
                    <Gift className="text-[#f4c464] mt-0.5" size={16} />
                    <span>Premium Experience — full SavannaFX ecosystem access without subscription fees</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TradeWithSavanna;