import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

// Configure foreground notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let cachedPushToken: string | null = null;

export const pushNotificationService = {
  /**
   * Configure Android notification channel and request push permissions.
   * On success, obtains Expo Push Token and registers it with Taaskr backend.
   */
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    try {
      // 1. Android Notification Channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('taaskr_default', {
          name: 'Taaskr Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E3A8A',
        });
      }

      // 2. Permission check
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[PUSH SERVICE] Push notification permissions denied by user/OS.');
        return null;
      }

      // 3. Obtain Expo Push Token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.manifest2?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      const token = tokenData.data;

      if (!token) {
        console.warn('[PUSH SERVICE] Failed to obtain Expo Push Token.');
        return null;
      }

      cachedPushToken = token;
      console.log('[PUSH SERVICE] Obtained Expo Push Token:', token);

      // 4. Register token with backend
      await api.notifications.registerPushToken(
        token,
        Platform.OS ? Platform.OS.toUpperCase() : 'ANDROID',
        'EXPO'
      );
      console.log('[PUSH SERVICE] Successfully registered push token with Taaskr backend.');
      return token;
    } catch (error: any) {
      console.warn('[PUSH SERVICE WARN] Push registration omitted (FCM unconfigured or simulator):', error?.message || error);
      return null;
    }
  },

  /**
   * Unregister/deactivate push token on logout
   */
  unregisterPushTokenAsync: async (): Promise<void> => {
    if (!cachedPushToken) return;
    try {
      await api.notifications.unregisterPushToken(cachedPushToken);
      console.log('[PUSH SERVICE] Unregistered push token on logout.');
      cachedPushToken = null;
    } catch (e: any) {
      console.warn('[PUSH SERVICE WARN] Failed to unregister push token on logout:', e?.message || e);
    }
  },

  /**
   * Add notification response listener (taps on push notifications).
   * Parses bookingId/refId and invokes callback to navigate appropriately.
   */
  addNotificationResponseListener: (onBookingSelected: (bookingId: number) => void) => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      try {
        const data = response.notification.request.content.data;
        console.log('[PUSH TAP] Notification tapped with data:', data);

        const rawBookingId = data?.bookingId || data?.refId;
        if (rawBookingId) {
          const bookingId = Number(rawBookingId);
          if (!isNaN(bookingId) && bookingId > 0) {
            onBookingSelected(bookingId);
          }
        }
      } catch (e) {
        console.error('[PUSH TAP ERROR] Failed to parse notification data:', e);
      }
    });

    return () => subscription.remove();
  }
};
