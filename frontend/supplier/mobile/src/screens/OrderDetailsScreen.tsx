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

  // Check if user can manage orders (OWNER or MANAGER only)
  const canManageOrders = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(orderId),
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messages', orderId],
    queryFn: () => messagesApi.getMessages(undefined, orderId),
    refetchInterval: 5000,
  });

  const acceptOrderMutation = useMutation({
    mutationFn: () => ordersApi.acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      Alert.alert('Success', 'Order accepted');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept order');
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: () => ordersApi.rejectOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      Alert.alert('Success', 'Order rejected');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reject order');
    },
  });

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

  const uploadFileMutation = useMutation({
    mutationFn: (data: { file: any; body?: string; messageType: 'IMAGE' | 'FILE' | 'AUDIO' }) =>
      messagesApi.uploadFile(data.file, { body: data.body, order_id: orderId, message_type: data.messageType }),
    onSuccess: () => {
      setSelectedFile(null);
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', orderId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send file');
    },
  });

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleAcceptOrder = () => {
    Alert.alert('Accept Order', 'Accept this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => acceptOrderMutation.mutate() },
    ]);
  };

  const handleRejectOrder = () => {
    Alert.alert('Reject Order', 'Reject this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectOrderMutation.mutate() },
    ]);
  };

  const handleSendMessage = () => {
    if (selectedFile) {
      let messageType: 'IMAGE' | 'FILE' | 'AUDIO' = 'FILE';
      if (selectedFile.type?.startsWith('image/')) messageType = 'IMAGE';
      else if (selectedFile.type?.startsWith('audio/')) messageType = 'AUDIO';
      uploadFileMutation.mutate({ file: selectedFile, body: newMessage || undefined, messageType });
    } else if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions');
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
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_user_id === user?.id;
    return (
      <View key={message.id} style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
        {message.message_type === 'TEXT' && message.body && (
          <Text style={[styles.messageText, isOwn && { color: '#fff' }]}>{message.body}</Text>
        )}
        {message.message_type === 'IMAGE' && message.file_path && (
          <View>
            <Image source={{ uri: messagesApi.getDownloadUrl(message.id) }} style={styles.messageImage} />
            {message.body && <Text style={styles.imageCaption}>{message.body}</Text>}
          </View>
        )}
        {(message.message_type === 'FILE' || message.message_type === 'AUDIO') && (
          <View style={styles.fileMessage}>
            <Text style={styles.fileIcon}>{message.message_type === 'AUDIO' ? '🎵' : '📎'}</Text>
            <Text style={[styles.fileName, isOwn && { color: '#fff' }]}>{message.file_name}</Text>
          </View>
        )}
        <Text style={[styles.messageTime, isOwn && { color: '#e0e7ff' }]}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (orderLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
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
      <ScrollView style={styles.orderSection}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderTitle}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: order.status === 'PENDING' ? '#f59e0b' : order.status === 'ACCEPTED' ? '#4CAF50' : '#ef4444' }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Consumer ID:</Text>
          <Text style={styles.infoValue}>#{order.consumer_id}</Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.infoLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>${formatPrice(order.total_amount)}</Text>
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
              <Text style={styles.itemDetails}>{item.quantity} × ${formatPrice(item.price)}</Text>
              <Text style={styles.itemTotal}>${formatPrice(item.line_total)}</Text>
            </View>
          ))}
        </View>

        {order.status === 'PENDING' && canManageOrders && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAcceptOrder}
              disabled={acceptOrderMutation.isPending}
            >
              {acceptOrderMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Accept Order</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleRejectOrder}
              disabled={rejectOrderMutation.isPending}
            >
              {rejectOrderMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Reject Order</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'PENDING' && !canManageOrders && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Only Owner/Manager can accept or reject orders</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.messagesSection}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <ScrollView ref={scrollViewRef} style={styles.messagesScroll}>
          {messagesLoading ? (
            <ActivityIndicator color="#4CAF50" />
          ) : messages && messages.length > 0 ? (
            messages.map(renderMessage)
          ) : (
            <Text style={styles.noMessagesText}>No messages yet</Text>
          )}
        </ScrollView>

        <View style={styles.messageInputContainer}>
          {selectedFile && (
            <View style={styles.selectedFilePreview}>
              {selectedFile.type?.startsWith('image/') ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
              ) : (
                <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
              )}
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
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
            />

            <TouchableOpacity
              style={[styles.sendButton, (newMessage.trim() || selectedFile) && styles.sendButtonActive]}
              onPress={handleSendMessage}
              disabled={sendMessageMutation.isPending || uploadFileMutation.isPending || (!newMessage.trim() && !selectedFile)}
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#ef4444' },
  orderSection: { backgroundColor: '#fff', padding: 16, maxHeight: '50%' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  orderTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  orderDate: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  orderInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  commentBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginTop: 12 },
  commentLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#1f2937', fontStyle: 'italic' },
  itemsSection: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemName: { flex: 1, fontSize: 14, color: '#1f2937' },
  itemDetails: { fontSize: 14, color: '#6b7280', marginRight: 12 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  acceptButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#ef4444' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoBox: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginTop: 16 },
  infoText: { fontSize: 12, color: '#92400e', textAlign: 'center' },
  messagesSection: { flex: 1, backgroundColor: '#fff', padding: 16 },
  messagesScroll: { flex: 1, marginBottom: 8 },
  noMessagesText: { textAlign: 'center', color: '#6b7280', fontSize: 14, marginTop: 20 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 12, marginBottom: 8 },
  ownMessage: { alignSelf: 'flex-end', backgroundColor: '#4CAF50' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb' },
  messageText: { fontSize: 14, color: '#1f2937' },
  messageImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 4 },
  imageCaption: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  fileMessage: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileIcon: { fontSize: 20 },
  fileName: { fontSize: 14, color: '#1f2937' },
  messageTime: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  messageInputContainer: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  selectedFilePreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, marginBottom: 8 },
  previewImage: { width: 50, height: 50, borderRadius: 4 },
  selectedFileName: { flex: 1, fontSize: 12, color: '#6b7280', marginLeft: 8 },
  removeFileText: { fontSize: 18, color: '#ef4444', padding: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachButton: { padding: 8 },
  attachIcon: { fontSize: 20 },
  messageInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100 },
  sendButton: { padding: 8, borderRadius: 20, backgroundColor: '#d1d5db' },
  sendButtonActive: { backgroundColor: '#4CAF50' },
  sendIcon: { fontSize: 20, color: '#fff' },
});

