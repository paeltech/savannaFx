import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Inbox } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useMarkAllAsRead, useUnreadCount } from "@/hooks/use-notifications";
import NotificationItem from "./NotificationItem";
import { cn } from "@/lib/utils";

const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadCount();
  const { data: notifications, isLoading } = useNotifications({ limit: 10 });
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/dashboard/notifications");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-nero/50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-rainy-grey hover:text-white transition-colors" />
          
          {/* Unread count badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gold rounded-full flex items-center justify-center"
              >
                <span className="text-[10px] font-bold text-cursed-black px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] max-w-[calc(100vw-2rem)] bg-cursed-black border-steel-wool p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-steel-wool">
          <h2 className="text-white font-semibold text-sm">Notifications</h2>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs text-rainy-grey hover:text-white"
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-rainy-grey text-sm">Loading...</div>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="p-2 space-y-2">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    compact
                    onClose={() => setOpen(false)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-rainy-grey">
              <Inbox className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">You'll be notified about signals, events, and more</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t border-steel-wool">
            <Button
              variant="ghost"
              className="w-full h-9 text-sm text-gold hover:text-gold-dark hover:bg-nero"
              onClick={handleViewAll}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
