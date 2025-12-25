"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarClock,
  Users,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EventItem = {
  id: string;
  title: string;
  organizer: string;
  description: string;
  category: "Networking" | "Workshop" | "Webinar" | string;
  type: "Physical" | "Virtual";
  priceType: "Free" | "Paid";
  sessions: number;
  location: string;
  capacity: number;
  registered: number;
  coverUrl: string;
};

type Props = {
  event: EventItem;
  onView: (eventId: string) => void;
  onViewSessions: (eventId: string) => void;
};

const EventCard: React.FC<Props> = ({ event, onView, onViewSessions }) => {
  const isFull = event.registered >= event.capacity;
  const progressValue = Math.min(100, Math.round((event.registered / event.capacity) * 100));

  return (
        <Card className="bg-nero overflow-hidden hover:border-gold/30">
      {/* Cover with overlay badges */}
      <div className="relative">
        <img
          src={event.coverUrl}
          alt={event.title}
          className="w-full h-52 object-cover"
        />
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <span className="px-2 py-1 text-xs rounded-full bg-gold text-cursed-black">{event.type}</span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={cn("px-2 py-1 text-xs rounded-full bg-gold text-cursed-black")}>
            {event.priceType}
          </span>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base uppercase">{event.title}</CardTitle>
        <div className="text-rainy-grey text-xs">By {event.organizer}</div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-rainy-grey text-sm line-clamp-3">{event.description}</p>

        {/* Category tag */}
        <div>
          <Badge variant="secondary" className="bg-nero text-white">{event.category}</Badge>
        </div>

        {/* Info row */}
        <div className="grid sm:grid-cols-2 gap-3 text-rainy-grey text-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-steel-wool" />
            <span>{event.sessions} session{event.sessions > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-steel-wool" />
            <span>{event.registered}/{event.capacity} attending</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-steel-wool" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-steel-wool" />
            <span>Max: {event.capacity}</span>
          </div>
        </div>

        {/* Availability + progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={cn("font-medium", isFull ? "text-gold" : "text-gold")}>
              Availability {isFull ? "• Fully booked" : "• Seats available"}
            </span>
          </div>
          <Progress value={progressValue} className={cn("h-2 rounded-md", isFull ? "[&>div]:bg-gold" : "[&>div]:bg-gold")} />
          <div className="flex items-center justify-between text-[11px] text-rainy-grey mt-2">
            <span>{event.registered} registered</span>
            <span>{event.capacity} max</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 font-semibold"
            onClick={() => onView(event.id)}
          >
            View Event
          </Button>
          <Button
            variant="outline"
            className="border-steel-wool text-rainy-grey hover:bg-nero/50 hover:border-gold/40"
            onClick={() => onViewSessions(event.id)}
          >
            Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;