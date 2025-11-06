import { supabase } from "@/integrations/supabase/client";

type NotificationType = 'transaction' | 'role_change' | 'announcement' | 'approval_pending' | 'goal';

export const useNotifications = () => {
  const createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          related_id: relatedId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const createBulkNotifications = async (
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string
  ) => {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
    }
  };

  return {
    createNotification,
    createBulkNotifications
  };
};