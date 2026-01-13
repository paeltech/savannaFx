import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNotificationIcon,
  getNotificationColor,
  formatRelativeTime,
  type Notification,
} from "@/utils/notifications";
import { useMarkAsRead, useDeleteNotification } from "@/hooks/use-notifications";

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  onClose?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  compact = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const Icon = getNotificationIcon(notification.notification_type);
  const iconColor = getNotificationColor(notification.notification_type);

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose?.();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "group relative p-4 border border-steel-wool rounded-lg transition-all duration-200",
        notification.read ? "bg-nero" : "bg-nero/80 border-gold/30",
        notification.action_url && "cursor-pointer hover:border-gold/50 hover:bg-nero",
        compact && "p-3"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            notification.read ? "bg-cursed-black/50" : "bg-cursed-black"
          )}
        >
          <Icon className={cn(iconColor, "w-5 h-5")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "text-sm font-medium line-clamp-1",
                notification.read ? "text-rainy-grey" : "text-white"
              )}
            >
              {notification.title}
            </h3>
            
            {/* Unread indicator */}
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 bg-gold rounded-full mt-1" />
            )}
          </div>

          <p
            className={cn(
              "text-xs mt-1",
              compact ? "line-clamp-1" : "line-clamp-2",
              notification.read ? "text-rainy-grey/70" : "text-rainy-grey"
            )}
          >
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-rainy-grey/60">
              {formatRelativeTime(notification.created_at)}
            </span>

            {/* Delete button (visible on hover) */}
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-cursed-black rounded"
              aria-label="Delete notification"
            >
              <X className="w-3 h-3 text-rainy-grey hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem;
