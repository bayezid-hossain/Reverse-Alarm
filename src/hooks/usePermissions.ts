import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  requestMultiple,
  openSettings,
} from 'react-native-permissions';

const ANDROID_BASE_PERMISSIONS = [
  PERMISSIONS.ANDROID.CAMERA,
  PERMISSIONS.ANDROID.RECORD_AUDIO,
  PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
] as const;

export function usePermissions() {
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [activityPermission, setActivityPermission] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);

  const checkPermissions = useCallback(async () => {
    const [cam, mic, act] = await Promise.all([
      check(PERMISSIONS.ANDROID.CAMERA),
      check(PERMISSIONS.ANDROID.RECORD_AUDIO),
      check(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION),
    ]);
    setCameraPermission(cam === RESULTS.GRANTED);
    setMicPermission(mic === RESULTS.GRANTED);
    setActivityPermission(act === RESULTS.GRANTED);

    if (Platform.Version >= 33) {
      const notif = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
      setNotificationPermission(notif === RESULTS.GRANTED);
    } else {
      setNotificationPermission(true);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestCamera = useCallback(async () => {
    const result = await request(PERMISSIONS.ANDROID.CAMERA);
    setCameraPermission(result === RESULTS.GRANTED);
    return result === RESULTS.GRANTED;
  }, []);

  const requestMic = useCallback(async () => {
    const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
    setMicPermission(result === RESULTS.GRANTED);
    return result === RESULTS.GRANTED;
  }, []);

  const requestActivity = useCallback(async () => {
    const result = await request(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
    setActivityPermission(result === RESULTS.GRANTED);
    return result === RESULTS.GRANTED;
  }, []);

  const requestNotification = useCallback(async () => {
    if (Platform.Version < 33) {
      setNotificationPermission(true);
      return true;
    }
    const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    setNotificationPermission(result === RESULTS.GRANTED);
    return result === RESULTS.GRANTED;
  }, []);

  // Request all permissions as a single batch then handle notification separately.
  // requestMultiple avoids Android's parallel dialog drop issue.
  const requestAll = useCallback(async () => {
    const statuses = await requestMultiple([...ANDROID_BASE_PERMISSIONS]);
    setCameraPermission(statuses[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED);
    setMicPermission(statuses[PERMISSIONS.ANDROID.RECORD_AUDIO] === RESULTS.GRANTED);
    setActivityPermission(statuses[PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION] === RESULTS.GRANTED);
    // POST_NOTIFICATIONS can't go in requestMultiple on all RN versions — do it after
    await requestNotification();
  }, [requestNotification]);

  return {
    cameraPermission,
    micPermission,
    activityPermission,
    notificationPermission,
    requestCamera,
    requestMic,
    requestActivity,
    requestNotification,
    requestAll,
    openSettings,
  };
}
