import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useRef } from 'react';
import { Trash2, Send } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { formatAmount } from '@/utils/format';
import { TagPill } from '@/components/ui/color-pill';
import { formatTime } from './types';
import type { TransactionRow } from '@/hooks/use-transactions';
import type { CommentRow } from '@/hooks/use-comments';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface TransactionDetailModalProps {
  detailTx: TransactionRow | null;
  onClose: () => void;
  onEdit: (tx: TransactionRow) => void;
  myId: string;
  comments: CommentRow[];
  commentsLoading: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onCommentSend: () => void;
  onCommentDelete: (commentId: string) => void;
  isCommentSending: boolean;
  resolveTagLabel: (
    tag: 'me' | 'partner' | 'together',
    creatorId: string,
  ) => string;
}

export function TransactionDetailModal({
  detailTx,
  onClose,
  onEdit,
  myId,
  comments,
  commentsLoading,
  commentText,
  onCommentTextChange,
  onCommentSend,
  onCommentDelete,
  isCommentSending,
  resolveTagLabel,
}: TransactionDetailModalProps) {
  const insets = useSafeAreaInsets();
  const commentScrollRef = useRef<ScrollView>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderRelease: (_, g) => {
        if (g.dy > 60 || g.vy > 0.8) onClose();
      },
    }),
  ).current;

  return (
    <Modal
      visible={!!detailTx}
      animationType='slide'
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1 justify-end'
      >
        <TouchableOpacity
          className='flex-1'
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          className='bg-white rounded-t-3xl'
          style={{
            maxHeight: SCREEN_HEIGHT * 0.45,
            paddingBottom: Math.max(insets.bottom, 24),
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          <View
            className='items-center pt-3 pb-1'
            {...panResponder.panHandlers}
          >
            <View className='w-10 h-1 rounded-full bg-brown/20' />
          </View>

          <View className='px-6 pt-3 pb-4' {...panResponder.panHandlers}>
            <View className='flex-row items-start justify-between'>
              <View className='flex-1'>
                {detailTx && (
                  <TagPill
                    tag={detailTx.tag}
                    label={resolveTagLabel(detailTx.tag, detailTx.user_id)}
                    className='self-start px-2.5 py-1 mb-2'
                  />
                )}
                <Text className='font-ibm-bold text-base text-brown'>
                  {detailTx?.memo ?? detailTx?.categories?.name ?? '내역'}
                </Text>
                <Text
                  className={`font-ibm-bold text-lg mt-0.5 ${detailTx?.type === 'expense' ? 'text-peach-dark' : 'text-olive-dark'}`}
                >
                  {detailTx?.type === 'expense' ? '-' : '+'}
                  {formatAmount(detailTx?.amount ?? 0)}원
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (detailTx) {
                    onClose();
                    onEdit(detailTx);
                  }
                }}
              >
                <Text className='font-ibm-semibold text-xs text-neutral-600'>
                  수정
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            ref={commentScrollRef}
            className='px-6'
            style={{ flexGrow: 0, maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
          >
            {commentsLoading ? (
              <View className='py-4 items-center'>
                <ActivityIndicator color={Colors.butter} />
              </View>
            ) : (
              <View className='gap-2 py-3'>
                {comments.map(c => {
                  const isMine = c.user_id === myId;
                  return (
                    <View
                      key={c.id}
                      className={`flex-row ${isMine ? 'flex-row-reverse' : ''}`}
                    >
                      <View
                        className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <View
                          className={`rounded-2xl px-3 py-2 ${isMine ? 'bg-butter' : 'bg-white'}`}
                          style={{
                            shadowColor: Colors.brown,
                            shadowOpacity: 0.05,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 1 },
                          }}
                        >
                          <Text className='font-ibm-regular text-sm text-brown'>
                            {c.content}
                          </Text>
                        </View>
                        <View className='flex-row items-center gap-2 mt-1'>
                          <Text className='font-ibm-regular text-[10px] text-brown/30'>
                            {formatTime(c.created_at)}
                          </Text>
                          {isMine && (
                            <TouchableOpacity
                              onPress={() => onCommentDelete(c.id)}
                              hitSlop={{
                                top: 6,
                                bottom: 6,
                                left: 6,
                                right: 6,
                              }}
                            >
                              <Trash2
                                size={12}
                                color={Colors.brown + '40'}
                                strokeWidth={2}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View className='flex-row items-center gap-3 px-6 pt-4'>
            <View className='flex-1 bg-neutral-100 rounded-2xl px-4 py-3'>
              <TextInput
                className='font-ibm-regular text-sm text-brown'
                placeholder='댓글을 입력하세요'
                placeholderTextColor={Colors.brown + '40'}
                value={commentText}
                onChangeText={onCommentTextChange}
                maxLength={200}
                returnKeyType='send'
                onSubmitEditing={onCommentSend}
              />
            </View>
            <TouchableOpacity
              onPress={onCommentSend}
              disabled={!commentText.trim() || isCommentSending}
              className='w-10 h-10 rounded-full bg-butter items-center justify-center'
              activeOpacity={0.7}
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              {isCommentSending ? (
                <ActivityIndicator size='small' color={Colors.brown} />
              ) : (
                <Send size={16} color={Colors.brown} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
