"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import EventCard, { EventItem } from "@/components/events/EventCard";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { showSuccess } from "@/utils/toast";
import { Search } from "lucide-react";
import FilterSaveBar from "@/components/forms/FilterSaveBar.tsx";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp } from "@/lib/animations";

const initialEvents: EventItem[] = [
  {
    id: "pips-and-chills",
    title: "PIPS & CHILLS",
    organizer: "SavannaFX",
    description:
      "Kojoforex's meet and greet dubbed Pips and Chills is happening this saturday 18th October 2025 at Vida e Cafe, Abelemkpe in Accra. Come meet and greet Ghana's top trader Kojoforex in person.",
    category: "Networking",
    type: "Physical",
    priceType: "Free",
    sessions: 1,
    location: "Accra, Tanzania",
    capacity: 1000,
    registered: 1033,
    coverUrl: "/assets/placeholder.svg",
  },
];

const EventsPage: React.FC = () => {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | "Physical" | "Virtual">("all");
  const [pricingFilter, setPricingFilter] = React.useState<"all" | "Free" | "Paid">("all");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | "Networking" | "Workshop" | "Webinar">("all");

  const filtered = initialEvents.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" ? true : e.type === typeFilter;
    const matchesPricing = pricingFilter === "all" ? true : e.priceType === pricingFilter;
    const matchesCategory = categoryFilter === "all" ? true : e.category === categoryFilter;
    return matchesSearch && matchesType && matchesPricing && matchesCategory;
  });

  const handleView = (eventId: string) => {
    showSuccess("Opening event details…");
    // Replace with real event details route if available
  };

  const handleViewSessions = (eventId: string) => {
    showSuccess("Opening sessions…");
    // Replace with sessions route/modal if needed
  };

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-white text-xl md:text-2xl font-semibold">Events</h1>
                  <p className="text-slate-400 text-sm">{filtered.length} event{filtered.length !== 1 ? "s" : ""} available</p>
                </div>
              </div>
            </CardContent>
          </SavannaCard>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search events..."
                className="pl-9 bg-slate-900/60 border-slate-800 text-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Physical">Physical</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pricingFilter} onValueChange={(v) => setPricingFilter(v as typeof pricingFilter)}>
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pricing</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
              <SelectTrigger className="bg-slate-900/60 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Networking">Networking</SelectItem>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Webinar">Webinar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ScrollReveal>

        <div className="mb-6">
          <FilterSaveBar
            page="events"
            values={{ search, typeFilter, pricingFilter, categoryFilter }}
          />
        </div>

        {/* Event list */}
        <StaggerChildren className="grid grid-cols-1 gap-6">
          {filtered.map((ev) => (
            <EventCard key={ev.id} event={ev} onView={handleView} onViewSessions={handleViewSessions} />
          ))}
          {filtered.length === 0 && (
            <SavannaCard>
               <CardContent className="p-6 text-center text-slate-400">
                 No events match your filters.
               </CardContent>
            </SavannaCard>
          )}
        </StaggerChildren>
      </DashboardLayout>
    </PageTransition>
  );
};

export default EventsPage;