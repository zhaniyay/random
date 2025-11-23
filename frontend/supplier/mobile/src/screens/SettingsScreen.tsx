import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuthStore } from '../stores/authStore';
import { suppliersApi } from '../lib/api';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    const trimmedText = confirmText.trim().toUpperCase();
    if (trimmedText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    if (user?.role !== 'OWNER') {
      Alert.alert('Error', 'Only OWNER can delete the supplier account');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'This will permanently delete your supplier account and all related data. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await suppliersApi.deleteAccount();
              // Logout will automatically trigger navigation to Login screen
              // because RootNavigator conditionally renders based on isAuthenticated
              await logout();
              Alert.alert('Success', 'Account deleted successfully');
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.detail || 'Failed to delete account'
              );
            } finally {
              setIsDeleting(false);
              setShowConfirm(false);
              setConfirmText('');
            }
          },
        },
      ]
    );
  };

  if (user?.role !== 'OWNER') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Account Settings</Text>
          <Text style={styles.text}>
            Only the account owner can manage account settings and delete the supplier account.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Account Settings</Text>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
          <Text style={styles.dangerText}>
            Deleting your supplier account will permanently remove:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• All staff accounts (OWNER, MANAGER, SALES)</Text>
            <Text style={styles.listItem}>• All links with consumers</Text>
            <Text style={styles.listItem}>• All products</Text>
            <Text style={styles.listItem}>• All orders and order history</Text>
            <Text style={styles.listItem}>• All complaints</Text>
            <Text style={styles.listItem}>• All messages</Text>
          </View>
          <Text style={styles.warningText}>
            This action cannot be undone!
          </Text>

          {!showConfirm ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowConfirm(true)}
            >
              <Text style={styles.deleteButtonText}>Delete Supplier Account</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmLabel}>
                Type <Text style={styles.bold}>DELETE</Text> to confirm:
              </Text>
              <TextInput
                style={styles.confirmInput}
                value={confirmText}
                onChangeText={(text) => {
                  console.log('[Settings] Confirm text changed:', text, 'Length:', text.length);
                  console.log('[Settings] Trimmed uppercase:', text.trim().toUpperCase());
                  console.log('[Settings] Matches DELETE?', text.trim().toUpperCase() === 'DELETE');
                  setConfirmText(text);
                }}
                placeholder="DELETE"
                autoCapitalize="characters"
                editable={!isDeleting}
                autoCorrect={false}
              />
              {confirmText.length > 0 && (
                <Text style={styles.debugText}>
                  You typed: "{confirmText}" (Length: {confirmText.length})
                  {confirmText.trim().toUpperCase() === 'DELETE' ? ' ✓' : ' ✗'}
                </Text>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.confirmDeleteButton,
                    confirmText.trim().toUpperCase() !== 'DELETE' && styles.confirmDeleteButtonDisabled,
                  ]}
                  onPress={() => {
                    console.log('[Settings] Delete button pressed. Confirm text:', confirmText);
                    handleDeleteAccount();
                  }}
                  disabled={isDeleting || confirmText.trim().toUpperCase() !== 'DELETE'}
                  activeOpacity={confirmText.trim().toUpperCase() === 'DELETE' ? 0.7 : 1}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmDeleteButtonText}>Confirm Delete</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowConfirm(false);
                    setConfirmText('');
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  dangerZone: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 12,
  },
  dangerText: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 12,
  },
  list: {
    marginLeft: 16,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '600',
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmContainer: {
    marginTop: 8,
  },
  confirmLabel: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '500',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
  },
  confirmInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    opacity: 1,
  },
  confirmDeleteButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  confirmDeleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
  },
});

