import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../common/Button';
import { Star, X } from 'lucide-react-native';

interface BookingRatingModalProps {
  visible: boolean;
  bookingId: number;
  serviceName: string;
  onClose: () => void;
  onSubmit: (rating: number, review?: string) => Promise<void>;
}

export const BookingRatingModal: React.FC<BookingRatingModalProps> = ({
  visible,
  bookingId,
  serviceName,
  onClose,
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      Alert.alert('Rating Required', 'Please select at least 1 star.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(rating, review.trim() ? review.trim() : undefined);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const bgModal = isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface;
  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const secondaryText = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
  const inputBg = isDark ? tokens.colors.dark.bgSubtle : tokens.colors.light.bgSubtle;
  const borderColor = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: bgModal, borderColor }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: textColor }]}>Rate Experience</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={submitting}>
              <X size={20} color={secondaryText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.serviceSubtitle, { color: secondaryText }]}>
            How was your {serviceName} service?
          </Text>

          {/* Star selector */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                disabled={submitting}
                style={styles.starTouch}
                activeOpacity={0.7}
              >
                <Star
                  size={32}
                  color={star <= rating ? tokens.colors.brand.primary : isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle}
                  fill={star <= rating ? tokens.colors.brand.primary : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Review input */}
          <TextInput
            style={[
              styles.reviewInput,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            placeholder="Write your feedback (optional)..."
            placeholderTextColor={isDark ? tokens.colors.dark.textMuted : tokens.colors.light.textMuted}
            multiline
            numberOfLines={3}
            value={review}
            onChangeText={setReview}
            editable={!submitting}
          />

          <View style={styles.actionRow}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={onClose}
              disabled={submitting}
              style={{ flex: 1 }}
            />
            <Button
              title={submitting ? 'Submitting...' : 'Submit Rating'}
              variant="primary"
              size="md"
              onPress={handleSubmit}
              loading={submitting}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: tokens.radii.xl,
    padding: tokens.spacing.xl,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  serviceSubtitle: {
    fontSize: tokens.typography.bodySm.fontSize,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.lg,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  starTouch: {
    padding: 4,
  },
  reviewInput: {
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    padding: tokens.spacing.md,
    fontSize: tokens.typography.bodySm.fontSize,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: tokens.spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
});
