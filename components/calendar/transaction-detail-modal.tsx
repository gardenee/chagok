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
import { ColorPill, TagPill } from '@/components/ui/color-pill';
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
  resolveTagColor: (
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
  resolveTagColor,
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

  const isExpense = detailTx?.type === 'expense';

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
            maxHeight: SCREEN_HEIGHT * 0.55,
            paddingBottom: Math.max(insets.bottom, 24),
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -4 },
          }}
        >
          {/* 드래그 핸들 */}
          <View
            className='items-center pt-3 pb-1'
            {...panResponder.panHandlers}
          >
            <View className='w-10 h-1 rounded-full bg-brown/20' />
          </View>

          {/* 상단 정보 영역 */}
          <View className='px-6 pt-2 pb-4' {...panResponder.panHandlers}>
            {/* 타이틀(메모/카테고리명) + 수정 버튼 */}
            <View className='flex-row items-start justify-between mb-1'>
              <Text
                className='font-ibm-bold text-xl text-neutral-800 flex-1 mr-3'
                numberOfLines={2}
              >
                {detailTx?.memo ?? detailTx?.categories?.name ?? '내역'}
              </Text>
              <TouchableOpacity
                className='mt-1'
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

            <View className='flex flex-row items-center gap-2'>
              {/* 금액 */}
              <Text
                className={`font-ibm-bold text-2xl mb-3 ${isExpense ? 'text-peach-dark' : 'text-olive-dark'}`}
              >
                {isExpense ? '-' : '+'}
                {formatAmount(detailTx?.amount ?? 0)}원
              </Text>

              {/* 태그 영역: 소비주체 + 카테고리 */}
              {detailTx && (
                <View className='flex-row items-center gap-2'>
                  <TagPill
                    tag={detailTx.tag}
                    label={resolveTagLabel(detailTx.tag, detailTx.user_id)}
                    bgColor={resolveTagColor(detailTx.tag, detailTx.user_id)}
                  />
                  {detailTx.categories && (
                    <ColorPill
                      label={detailTx.categories.name}
                      color={detailTx.categories.color}
                    />
                  )}
                </View>
              )}
            </View>
          </View>

          {/* 댓글 목록 */}
          <ScrollView
            ref={commentScrollRef}
            className='px-6'
            style={{ flexGrow: 0, maxHeight: 260 }}
            showsVerticalScrollIndicator={false}
          >
            {commentsLoading ? (
              <View className='pb-4 items-center'>
                <ActivityIndicator color={Colors.butter} />
              </View>
            ) : (
              <View className='gap-2 pb-3'>
                {comments.map(c => {
                  const isMine = c.user_id === myId;
                  return (
                    <View
                      key={c.id}
                      className={`flex-row items-end gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}
                    >
                      {/* 메시지 버블 */}
                      <View
                        className={`max-w-[72%] rounded-2xl px-3 py-2 ${isMine ? 'bg-butter' : 'bg-neutral-100'}`}
                        style={{
                          shadowColor: Colors.brown,
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 1 },
                        }}
                      >
                        <Text className='font-ibm-regular text-sm text-neutral-800'>
                          {c.content}
                        </Text>
                      </View>

                      {/* 시간 + 삭제 버튼 (버블 옆, 하단 정렬) */}
                      <View
                        className={`flex-row items-center gap-1 pb-0.5 ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        {isMine && (
                          <TouchableOpacity
                            onPress={() => onCommentDelete(c.id)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Trash2
                              size={11}
                              color={Colors.neutralLight}
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        )}
                        <Text className='font-ibm-regular text-[10px] text-neutral-600'>
                          {formatTime(c.created_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* 댓글 입력 */}
          <View className='flex-row items-center gap-3 px-6 pt-3'>
            <View className='flex-1 bg-neutral-100 rounded-2xl px-4 py-3'>
              <TextInput
                className='font-ibm-regular text-sm text-brown'
                placeholder='댓글을 입력하세요'
                placeholderTextColor={Colors.neutralLight}
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
