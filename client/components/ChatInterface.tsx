import {
  View,
  Text,
  Pressable,
  Dimensions,
  useColorScheme,
  Keyboard,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { MotiView, AnimatePresence } from 'moti';
import Markdown from 'react-native-markdown-display';
import { BlurView } from 'expo-blur';
import { Input } from '@/components/ui/input';
import { XIcon, PaperPlaneRightIcon, ChatCircleDotsIcon } from 'phosphor-react-native';
import { THEME } from '@/lib/theme';
import { MicrophoneIcon, StopIcon } from 'phosphor-react-native';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { playBase64Wav } from '@/lib/playBase64Audio';
import { makeAuthenticatedRequest } from '@/lib/authenticatedRequest';

const { width, height } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BASE_URL || 'http://localhost:3000';

// Rectangle size and position when open
const RECT_WIDTH = width * 0.9;
const RECT_HEIGHT = height * 0.9;
const RECT_TOP = (height - RECT_HEIGHT) / 2;
const RECT_LEFT = (width - RECT_WIDTH) / 2;

type Message = {
  id: number;
  type: 'user' | 'ai';
  text: string;
  sender: 'USER' | 'AGENT';
};

interface ChatInterfaceProps {
  open: boolean;
  onClose: () => void;
  onOpenScan?: () => void;
}

const TypingIndicator = ({ mode }: { mode: 'light' | 'dark' }) => {
  return (
    <View className="mb-3 w-full flex-row justify-start">
      <View
        className="flex-row items-center gap-1.5 rounded-t-2xl rounded-br-2xl rounded-bl-sm px-5 py-4"
        style={{ backgroundColor: THEME[mode].muted }}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ translateY: 0, opacity: 0.4 }}
            animate={{ translateY: -4, opacity: 1 }}
            transition={{
              type: 'timing',
              duration: 400,
              delay: i * 150,
              loop: true,
            }}
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: THEME[mode].mutedForeground,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const ChatInterface = ({ open, onClose, onOpenScan }: ChatInterfaceProps) => {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<any>(null);
  const colorscheme = useColorScheme();
  const mode: 'light' | 'dark' = colorscheme === 'dark' ? 'dark' : 'light';

  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();

  const handleMicToggle = async () => {
    if (isRecording) {
      const base64 = await stopRecording();

      if (!base64) return;

      setSending(true);

      const result = await makeAuthenticatedRequest('/ai/audio/response', {
        audio: base64,
      });

      if (result.success) {
        setInputText(result.data.transcript);
        const userMessageAudio: Message = {
          id: Date.now(),
          type: 'user',
          text: result.data.transcript,
          sender: 'USER',
        };
        setMessages((prev) => [...prev, userMessageAudio]);

        const aiMessageAudio: Message = {
          id: Date.now() + 1,
          type: 'ai',
          text: result.data.response,
          sender: 'AGENT',
        };
        setMessages((prev) => [...prev, aiMessageAudio]);

        setSending(false);
        setInputText('');
        if (result.audio) {
          playBase64Wav(result.audio);
        } else {
          console.warn('No audio response received');
        }
      }
      setSending(false);
    } else {
      setInputText('');
      startRecording();
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fetch initial messages when chat opens
  useEffect(() => {
    if (open && messages.length === 0) {
      fetchChatHistory();
    }
  }, [open]);

  const fetchChatHistory = async (cursorDate?: string) => {
    try {
      if (cursorDate) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await makeAuthenticatedRequest(
        `/ai/history${cursorDate ? `?cursor=${cursorDate}` : ''}`
      );

      if (result.success && result.data) {
        const formattedMessages: Message[] = [];

        // Process chat history (each chat contains multiple messages)
        result.data.forEach((chat: any) => {
          if (chat.messages) {
            chat.messages.forEach((msg: any) => {
              formattedMessages.push({
                id: Date.now() + Math.random(),
                type: msg.sender === 'USER' ? 'user' : 'ai',
                text: msg.message,
                sender: msg.sender,
              });
            });
          }
        });

        if (cursorDate) {
          // Append older messages when loading more
          setMessages((prev) => [...formattedMessages, ...prev]);
        } else {
          // Set initial messages
          setMessages(formattedMessages);
        }

        setCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    console.log('handleSend: sending message');

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      text: inputText.trim(),
      sender: 'USER',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSending(true);

    try {
      const result = await makeAuthenticatedRequest(
        '/ai/response?input=' + encodeURIComponent(userMessage.text)
      );

      if (result.success && result.data) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          type: 'ai',
          text: result.data,
          sender: 'AGENT',
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && cursor) {
      fetchChatHistory(cursor);
    }
  };

  const adjustedHeight = open ? RECT_HEIGHT - keyboardHeight : 0;

  const renderEmptyState = () => {
    return (
      <View className="flex-1 px-1 pt-4">
        {/* Greeting */}
        <Text
          className="mb-6 text-[64px] font-normal tracking-[-0.4rem]"
          style={{ color: THEME[mode].background }}>
          Hi binit,{`\n`}How can I help{`\n`}you today?
        </Text>

        {/* Bento cards */}
        <View className="flex-row gap-3">
          {/* Scan — blue tint */}
          <Pressable
            onPress={() => {
              onClose();
              onOpenScan?.();
            }}
            className="border-background flex-1 justify-between rounded-2xl border p-4"
            style={{
              backgroundColor: mode === 'dark' ? 'rgba(96,165,250,0.10)' : 'rgba(202,228,255,0.55)',
              minHeight: 130,
            }}>
            <Text
              className="mt-2 text-base font-semibold"
              style={{ color: THEME[mode].background }}>
              Scan
            </Text>
          </Pressable>

          {/* Ask AI — yellow tint */}
          <Pressable
            onPress={() => {
              setTimeout(() => inputRef.current?.focus(), 300);
            }}
            className="border-background flex-1 justify-between rounded-2xl border p-4"
            style={{
              backgroundColor: mode === 'dark' ? 'rgba(250,204,21,0.10)' : 'rgba(254,243,199,0.70)',
              minHeight: 130,
            }}>
            <ChatCircleDotsIcon size={32} color={THEME[mode].background} weight="regular" />
            <Text
              className="mt-2 text-base font-semibold"
              style={{ color: THEME[mode].background }}>
              Ask AI
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const mdStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: THEME[mode].foreground,
          fontSize: 14,
          lineHeight: 20,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 6,
        },
        strong: {
          fontWeight: '700',
        },
        em: {
          fontStyle: 'italic',
        },
        bullet_list: {
          marginVertical: 4,
        },
        ordered_list: {
          marginVertical: 4,
        },
        list_item: {
          marginVertical: 2,
        },
        code_inline: {
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
          borderRadius: 4,
          paddingHorizontal: 5,
          paddingVertical: 1,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          fontSize: 13,
          color: THEME[mode].foreground,
        },
        fence: {
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderRadius: 8,
          padding: 10,
          marginVertical: 6,
          borderWidth: 0,
        },
        code_block: {
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderRadius: 8,
          padding: 10,
          marginVertical: 6,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          fontSize: 13,
          color: THEME[mode].foreground,
          borderWidth: 0,
        },
        heading1: {
          fontSize: 20,
          fontWeight: '700',
          marginBottom: 6,
          color: THEME[mode].foreground,
        },
        heading2: {
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 5,
          color: THEME[mode].foreground,
        },
        heading3: {
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 4,
          color: THEME[mode].foreground,
        },
        blockquote: {
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          borderLeftWidth: 3,
          borderLeftColor: THEME[mode].mutedForeground,
          paddingHorizontal: 10,
          paddingVertical: 4,
          marginVertical: 4,
        },
        hr: {
          backgroundColor: THEME[mode].mutedForeground,
          height: 1,
          marginVertical: 8,
        },
        link: {
          color: '#3b82f6',
        },
      }),
    [mode]
  );

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';

    return (
      <View
        key={message.id}
        className={`mb-3 w-full flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
        <View
          className={`max-w-[80%] px-4 py-3 ${
            isUser
              ? 'rounded-t-2xl rounded-br-sm rounded-bl-2xl bg-blue-500'
              : 'rounded-t-2xl rounded-br-2xl rounded-bl-sm'
          }`}
          style={!isUser ? { backgroundColor: THEME[mode].muted } : undefined}>
          {isUser ? (
            <Text className="text-sm leading-5" style={{ color: '#fff' }}>
              {message.text}
            </Text>
          ) : (
            <Markdown style={mdStyles}>{message.text}</Markdown>
          )}
        </View>
      </View>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <View className="absolute inset-0" style={{ zIndex: 100 }} pointerEvents="box-none">
          {/* Backdrop blur overlay */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 350 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 0,
            }}>
            <Pressable onPress={onClose} style={{ flex: 1 }}>
              <BlurView
                intensity={40}
                tint={mode === 'dark' ? 'dark' : 'light'}
                experimentalBlurMethod="dimezisBlurView"
                style={{
                  flex: 1,
                  backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)',
                }}
              />
            </Pressable>
          </MotiView>

          {/* Chat panel */}
          <MotiView
            from={{
              width: 60,
              height: 60,
              borderRadius: 30,
              top: height - 120,
              left: width / 2 - 30,
              opacity: 0.5,
            }}
            animate={{
              width: RECT_WIDTH,
              height: adjustedHeight,
              borderRadius: 16,
              top: RECT_TOP,
              left: RECT_LEFT,
              opacity: 1,
            }}
            exit={{
              width: 60,
              height: 60,
              borderRadius: 30,
              top: height - 120,
              left: width / 2 - 30,
              opacity: 0,
            }}
            transition={{ type: 'timing', duration: 400 }}
            style={{ position: 'absolute', overflow: 'hidden', zIndex: 10 }}
            className="bg-foreground">
            {/* Chat content */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 20 }}
              transition={{ type: 'timing', duration: 300, delay: 200 }}
              className="w-full flex-1">
              <View className="flex-1">
                {/* Header with close button */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    className="font-playfair-bold-italic text-xl tracking-tighter"
                    style={{ color: THEME[mode].background }}>
                    assistant
                  </Text>
                  <Pressable onPress={onClose}>
                    <XIcon size={24} color={THEME[mode].background} weight="bold" />
                  </Pressable>
                </View>

                {/* Scrollable messages */}
                <ScrollView
                  ref={scrollViewRef}
                  className="flex-1 px-4"
                  contentContainerStyle={{ paddingTop: 52, paddingBottom: 72 }}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  onScroll={(e) => {
                    const contentOffsetY = e.nativeEvent.contentOffset.y;
                    if (contentOffsetY < 100 && hasMore && !loadingMore) {
                      handleLoadMore();
                    }
                  }}
                  scrollEventThrottle={400}>
                  {loading ? (
                    <View className="flex-1 items-center justify-center py-8">
                      <ActivityIndicator size="large" />
                    </View>
                  ) : (
                    <>
                      {loadingMore && (
                        <View className="items-center justify-center py-4">
                          <ActivityIndicator size="small" />
                        </View>
                      )}
                      {messages.length === 0 ? renderEmptyState() : messages.map(renderMessage)}
                      {sending && <TypingIndicator mode={mode} />}
                    </>
                  )}
                </ScrollView>

                {/* Input area */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}>
                  <View className="relative mb-2 w-full flex-row items-center">
                    <Input
                      ref={inputRef}
                      placeholder={isRecording ? 'Sunn Raha hu mai...' : 'Kuch Pucho...'}
                      placeholderTextColor={isRecording ? '#ef4444' : THEME[mode].mutedForeground}
                      style={{ backgroundColor: THEME[mode].input }}
                      className="h-12 flex-1 rounded-xl px-4 pr-32"
                      value={inputText}
                      onChangeText={setInputText}
                      onSubmitEditing={handleSend}
                      returnKeyType="send"
                      editable={!sending && !isRecording}
                    />
                    <View className="absolute right-2 z-20 flex-row items-center gap-1">
                      {/* Mic toggle */}
                      <Pressable
                        onPress={handleMicToggle}
                        disabled={sending}
                        className={`rounded-lg p-2 ${isRecording ? 'bg-red-500' : 'bg-blue-500'}`}>
                        {isRecording ? (
                          <StopIcon size={20} color="#fff" weight="fill" />
                        ) : (
                          <MicrophoneIcon size={20} color="#fff" weight="bold" />
                        )}
                      </Pressable>
                  
                      {/* Send */}
                      <Pressable
                        onPress={handleSend}
                        disabled={sending || inputText.trim() === ''}
                        className="rounded-lg bg-blue-500 p-2">
                        {sending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <PaperPlaneRightIcon size={20} color="#fff" weight="bold" />
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Gradient overlays */}
                <View className="pointer-events-none absolute flex h-full w-full flex-col justify-between">
                  <View className="from-foreground via-foreground h-12 w-full bg-linear-to-b to-transparent" />
                  <View className="from-foreground via-foreground h-16 w-full bg-linear-to-t to-transparent" />
                </View>
              </View>
            </MotiView>
          </MotiView>
        </View>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;
