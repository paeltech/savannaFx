"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Clock, PlayCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type Course = {
  id: string;
  title: string;
  author: string;
  description: string;
  level: "Beginner" | "Advanced";
  category: string;
  lessonsCount: number;
  durationMinutes: number;
  price: number; // 0 = free
  premium?: boolean;
  coverUrl: string;
};

type Props = {
  course: Course;
  enrolled?: boolean;
  onEnroll: (courseId: string) => void;
};

const CourseCard: React.FC<Props> = ({ course, enrolled, onEnroll }) => {
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const isFree = course.price === 0;

  return (
    <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
      <div className="relative">
        <img
          src={course.coverUrl}
          alt={course.title}
          className="w-full h-44 object-cover"
        />
        {/* Top overlay labels */}
        <div className="absolute top-2 left-2">
          {course.premium ? (
            <span className="px-2 py-1 text-xs rounded-full bg-purple-600 text-white">Premium</span>
          ) : (
            <span className="px-2 py-1 text-xs rounded-full bg-emerald-600 text-white">Free</span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 text-white px-2 py-1 text-xs">
          <Clock className="h-3 w-3" />
          <span>{Math.max(1, Math.round(course.durationMinutes))}m</span>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base leading-tight uppercase">
          {course.title}
        </CardTitle>
        <div className="text-slate-400 text-xs">By {course.author}</div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-slate-400 text-sm line-clamp-3">{course.description}</p>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("bg-slate-800 text-slate-200")}>{course.level}</Badge>
          <Badge variant="secondary" className={cn("bg-slate-800 text-slate-200")}>{course.category}</Badge>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">{course.lessonsCount}</span>
          </div>
          {/* CTA row */}
          <div className="flex items-center gap-2">
            {isFree ? (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onEnroll(course.id)}
              >
                Enroll Free
              </Button>
            ) : (
              <>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => onEnroll(course.id)}
                >
                  $ {course.price}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
              onClick={() => setDetailsOpen(true)}
            >
              Details
            </Button>
          </div>
        </div>

        {!isFree && (
          <div className="text-center text-xs text-slate-500 pt-2">
            Already have an account?
          </div>
        )}
      </CardContent>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{course.title}</DialogTitle>
            <DialogDescription>By {course.author}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">{course.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{course.level}</Badge>
              <Badge variant="secondary">{course.category}</Badge>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                <BookOpen className="h-3 w-3" /> {course.lessonsCount} lessons
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                <Clock className="h-3 w-3" /> {course.durationMinutes} min
              </span>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              className="border-slate-300"
              onClick={() => setDetailsOpen(false)}
            >
              Close
            </Button>
            <Button
              className={isFree ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
              onClick={() => {
                onEnroll(course.id);
                setDetailsOpen(false);
              }}
            >
              {isFree ? "Enroll Free" : `Buy • $${course.price}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CourseCard;