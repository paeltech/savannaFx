import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { showSuccess, showError } from "@/utils/toast";
import type { Notification } from "@/utils/notifications";

interface UseNotificationsOptions {
  limit?: number;
  offset?: number;
  type?: string;
  unreadOnly?: boolean;
}

/**
 * Hook to fetch user's notifications with pagination and filters
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { session } = useSupabaseSession();
  const { limit = 10, offset = 0, type, unreadOnly = false } = options;

  return useQuery<Notification[]>({
    queryKey: ["notifications", session?.user?.id, limit, offset, type, unreadOnly],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("Not authenticated");

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq("notification_type", type);
      }

      if (unreadOnly) {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!session?.user?.id,
  });
}

/**
 * Hook to get unread notification count with real-time updates
 */
export function useUnreadCount() {
  const { session } = useSupabaseSession();
  const [count, setCount] = useState(0);

  const { data: initialCount } = useQuery<number>({
    queryKey: ["notifications-unread-count", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("Not authenticated");

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("read", false)
        .eq("deleted", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (initialCount !== undefined) {
      setCount(initialCount);
    }
  }, [initialCount]);

  // Real-time subscription for unread count updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          // Refetch count when notifications change
          const { count: newCount, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", session.user.id)
            .eq("read", false)
            .eq("deleted", false);

          if (!error && newCount !== null) {
            setCount(newCount);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  return count;
}

/**
 * Hook to mark a single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to mark notification as read");
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const { session } = useSupabaseSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      showSuccess("All notifications marked as read");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to mark all as read");
    },
  });
}

/**
 * Hook to delete a notification (soft delete)
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ deleted: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      showSuccess("Notification deleted");
    },
    onError: (error: Error) => {
      showError(error.message || "Failed to delete notification");
    },
  });
}

/**
 * Hook to listen for new notifications in real-time
 */
export function useNotificationListener(onNewNotification?: (notification: Notification) => void) {
  const { session } = useSupabaseSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel("new-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });

          // Call callback if provided
          if (onNewNotification) {
            onNewNotification(notification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, onNewNotification, queryClient]);
}
