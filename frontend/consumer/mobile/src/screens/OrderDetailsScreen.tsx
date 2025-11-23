import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ordersApi, messagesApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { Order, Message } from '../types';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

type OrderDetailsRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper function to safely format price as string
const formatPrice = (value: number | string | null | undefined): string => {
  try {
    let numPrice: number;
    if (value === null || value === undefined) {
      numPrice = 0;
    } else if (typeof value === 'number') {
      numPrice = isNaN(value) ? 0 : value;
    } else {
      const parsed = parseFloat(String(value));
      numPrice = isNaN(parsed) ? 0 : parsed;
    }
    
    if (typeof numPrice !== 'number' || isNaN(numPrice)) {
      return '0.00';
    }
    
    return numPrice.toFixed(2);
  } catch (error) {
    console.error('[OrderDetails] Error formatting price:', { value, error });
    return '0.00';
  }
};

export default function OrderDetailsScreen() {
  const route = useRoute<OrderDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { orderId } = route.params;

  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(orderId),
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messages', orderId],
    queryFn: () => messagesApi.getMessages(undefined, orderId),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Send text message
  const sendMessageMutation = useMutation({
    mutationFn: (body: string) =>
      messagesApi.sendMessage({ body, order_id: orderId }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send message');
    },
  });

  // Upload file message
  const uploadFileMutation = useMutation({
    mutationFn: (data: { file: any; body?: string }) =>
      messagesApi.uploadFile(data.file, { body: data.body, order_id: orderId }),
    onSuccess: () => {
      setSelectedFile(null);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send file');
    },
  });

  // Cancel order
  const cancelOrderMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      Alert.alert('Success', 'Order cancelled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel order');
    },
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = () => {
    if (selectedFile) {
      uploadFileMutation.mutate({ file: selectedFile, body: newMessage || undefined });
    } else if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: `image_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/pdf',
      });
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelOrderMutation.mutate(),
        },
      ]
    );
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_user_id === user?.id;

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {message.message_type === 'TEXT' && (
          <Text style={styles.messageText}>{message.body}</Text>
        )}

        {message.message_type === 'IMAGE' && (
          <View>
            {message.file_path && (
              <Image
                source={{ uri: messagesApi.getDownloadUrl(message.id) }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            )}
            {message.body && (
              <Text style={[styles.messageText, styles.imageCaptionText]}>
                {message.body}
              </Text>
            )}
          </View>
        )}

        {(message.message_type === 'FILE' || message.message_type === 'AUDIO') && (
          <View style={styles.fileMessage}>
            <Text style={styles.fileIcon}>
              {message.message_type === 'AUDIO' ? '🎵' : '📎'}
            </Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{message.file_name}</Text>
              {message.file_size && (
                <Text style={styles.fileSize}>
                  {(message.file_size / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          </View>
        )}

        <Text style={styles.messageTime}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'ACCEPTED':
        return '#4CAF50';
      case 'REJECTED':
        return '#ef4444';
      case 'CANCELLED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  if (orderLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Order Details Section */}
      <ScrollView style={styles.orderSection}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderTitle}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Supplier ID:</Text>
          <Text style={styles.infoValue}>#{order.supplier_id}</Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>${order.total_amount}</Text>
        </View>

        {order.comment && (
          <View style={styles.commentBox}>
            <Text style={styles.commentLabel}>Comment:</Text>
            <Text style={styles.commentText}>{order.comment}</Text>
          </View>
        )}

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items:</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemName}>Product #{item.product_id}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} × ${formatPrice(item.price)}
              </Text>
              <Text style={styles.itemTotal}>${formatPrice(item.line_total)}</Text>
            </View>
          ))}
        </View>

        {order.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
            disabled={cancelOrderMutation.isPending}
          >
            {cancelOrderMutation.isPending ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Messages Section */}
      <View style={styles.messagesSection}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
        >
          {messagesLoading ? (
            <ActivityIndicator color="#4CAF50" />
          ) : messages && messages.length > 0 ? (
            messages.map(renderMessage)
          ) : (
            <Text style={styles.noMessagesText}>No messages yet</Text>
          )}
        </ScrollView>

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          {selectedFile && (
            <View style={styles.selectedFilePreview}>
              {selectedFile.type.startsWith('image/') ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
              ) : (
                <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
              )}
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => setSelectedFile(null)}
              >
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {
                Alert.alert('Upload', 'Choose file type:', [
                  { text: 'Image', onPress: handlePickImage },
                  { text: 'Document', onPress: handlePickDocument },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            >
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.messageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (newMessage.trim() || selectedFile) && styles.sendButtonActive,
              ]}
              onPress={handleSendMessage}
              disabled={
                sendMessageMutation.isPending ||
                uploadFileMutation.isPending ||
                (!newMessage.trim() && !selectedFile)
              }
            >
              {sendMessageMutation.isPending || uploadFileMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendIcon}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
  orderSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: '45%',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  commentBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#1f2937',
    fontStyle: 'italic',
  },
  itemsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesSection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 8,
  },
  noMessagesText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginTop: 20,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  imageCaptionText: {
    marginTop: 4,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  messageInputContainer: {
    marginTop: 12,
  },
  selectedFilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  removeFileButton: {
    padding: 8,
  },
  removeFileText: {
    fontSize: 18,
    color: '#ef4444',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 10,
    marginRight: 8,
  },
  attachIcon: {
    fontSize: 24,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    color: '#1f2937',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
  },
});

