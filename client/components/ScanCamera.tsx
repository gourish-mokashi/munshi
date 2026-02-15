import React, { useRef, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { XIcon } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import AnimatedAvatar from '@/components/AnimatedAvatar';
import { THEME } from '@/lib/theme';

interface ScanCameraProps {
  visible: boolean;
  onClose: () => void;
  onCapture?: (uri: string) => void;
}

export default function ScanCamera({
  visible,
  onClose,
  onCapture,
}: ScanCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = THEME[colorScheme];

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        onCapture?.(photo.uri);
      }
    } catch (err) {
      console.error('Capture error:', err);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          style={[StyleSheet.absoluteFill, { zIndex: 200 }]}>
          <View style={styles.container}>
            {/* Camera or permission request */}
            {!permission ? (
              <View style={styles.permissionContainer}>
                <ActivityIndicator size="large" color={theme.foreground} />
              </View>
            ) : !permission.granted ? (
              <View
                style={[
                  styles.permissionContainer,
                  { backgroundColor: theme.background },
                ]}>
                <Text
                  style={[styles.permissionText, { color: theme.foreground }]}>
                  Camera access is needed to scan products
                </Text>
                <Pressable
                  onPress={requestPermission}
                  style={[
                    styles.permissionButton,
                    { backgroundColor: theme.chart1 },
                  ]}>
                  <Text style={styles.permissionButtonText}>
                    Grant Permission
                  </Text>
                </Pressable>
              </View>
            ) : (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                mode="picture"
              />
            )}

            {/* Close button — top left */}
            <Pressable
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  top: insets.top + 12,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                },
              ]}>
              <XIcon size={24} color="#fff" weight="bold" />
            </Pressable>

            {/* Scan guide overlay */}
            <View style={styles.guideContainer} pointerEvents="none">
              <View style={styles.guideBox}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.guideText}>
                Position the product in the frame
              </Text>
            </View>

            {/* Capture button — animated avatar at bottom center */}
            <View
              style={[
                styles.captureContainer,
                { bottom: insets.bottom + 40 },
              ]}>
              <Pressable
                onPress={handleCapture}
                disabled={capturing || !permission?.granted}
                style={({ pressed }) => [
                  styles.captureButton,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                ]}>
                <View style={styles.captureOuter}>
                  {capturing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <AnimatedAvatar size={64} />
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

const CORNER_SIZE = 28;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBox: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.7)',
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.7)',
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.7)',
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.7)',
    borderBottomRightRadius: 8,
  },
  guideText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  captureContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
