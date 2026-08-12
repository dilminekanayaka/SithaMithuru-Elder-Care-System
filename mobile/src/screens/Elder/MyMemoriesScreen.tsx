/**
 * MyMemoriesScreen.tsx — Screen ELDER-S21 (Journaling / Memory Gallery Screen)
 * Spec: es21.txt
 *
 * Requirements (es21.txt):
 *  1. Header: Back arrow (←), Title "My Memories", Plus button (+).
 *  2. Subtitle: "Your special moments".
 *  3. 2-Column Gallery Grid (es21.txt Section 5):
 *     - Photo Memory Card: Cover Image + Title + Date (e.g. My Family, 08 Aug)
 *     - Text Memory Card: Note icon 📝 + Title + Excerpt snippet + Date (e.g. My Story, 28 Jul)
 *  4. Touch Target & Accessibility: Grid cards spaced with ≥48dp touch targets and clear semantic labels.
 *  5. Add Memory Button: [ + Add a Memory ] (≥52dp height) at bottom.
 *  6. Empty State: Heart ❤️ "Create your first memory. Save special moments, stories and photos here." + [ ADD MEMORY ]
 *  7. 100% Offline-First (Local image preview and storage).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavBar from '../../components/BottomNavBar';
import { colors, spacing, radius, elevation } from '../../theme';

export interface MemoryItem {
  id: string;
  title: string;
  dateStr: string;
  type: 'PHOTO' | 'TEXT' | 'PHOTO_TEXT';
  imageUri?: string;
  excerpt?: string;
  content?: string;
}

interface MyMemoriesProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  elderId?: string;
  onViewMemory?: (memory: { id: string; title: string; dateStr: string; content: string; imageUri?: string }) => void;
}

const formatMemoryDate = (isoDate: string): string => {
  try {
    return new Date(isoDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  } catch {
    return isoDate;
  }
};

const MyMemoriesScreen: React.FC<MyMemoriesProps> = ({ onBack, onNavigate, elderId, onViewMemory }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadMemories = async () => {
      setLoading(true);
      try {
        const { getDB } = require('../../database/db');
        const db = await getDB();
        const rows: any[] = await db.getAllAsync(
          'SELECT * FROM memories_local WHERE elder_id = ? OR elder_id = ? ORDER BY created_at DESC',
          [elderId ? String(elderId) : 'elder_default', 'elder_default']
        );

        const mapped: MemoryItem[] = rows.map((r) => ({
          id: r.id,
          title: r.title || 'Untitled Memory',
          dateStr: formatMemoryDate(r.created_at),
          type: r.image_uri ? (r.description ? 'PHOTO_TEXT' : 'PHOTO') : 'TEXT',
          imageUri: r.image_uri || undefined,
          excerpt: r.description || undefined,
          content: r.description || '',
        }));
        setMemories(mapped);
      } catch (e) {
        console.warn('Failed to load memories from SQLite:', e);
      } finally {
        setLoading(false);
      }
    };
    loadMemories();
  }, [elderId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />

      {/* ─── HEADER (es21.txt Section 1 & 2) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessible={true}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Memories</Text>

        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => onNavigate('createMemory')}
          accessible={true}
          accessibilityLabel="Add new memory"
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── SUBTITLE BANNER (es21.txt Section 2) ─── */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerTitle}>Your Special Moments</Text>
          <Text style={styles.bannerSubtitle}>Preserve your favorite memories, photos, and stories.</Text>
        </View>

        {memories.length === 0 && !loading ? (
          /* ─── 25. EMPTY STATE ─── */
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="heart-outline" size={48} color={colors.error} />
            </View>
            <Text style={styles.emptyTitle}>Create your first memory</Text>
            <Text style={styles.emptySubtitle}>Save special moments, stories and photos here.</Text>
            <TouchableOpacity
              style={styles.emptyCtaBtn}
              onPress={() => onNavigate('createMemory')}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
              <Text style={styles.emptyCtaBtnText}>ADD MEMORY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ─── 5. 2-COLUMN GALLERY GRID ─── */
          <View style={styles.gridContainer}>
            {memories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() =>
                  onViewMemory
                    ? onViewMemory({
                        id: item.id,
                        title: item.title,
                        dateStr: item.dateStr,
                        content: item.content || item.excerpt || '',
                        imageUri: item.imageUri,
                      })
                    : onNavigate('memoryDetails')
                }
                activeOpacity={0.85}
                accessible={true}
                accessibilityLabel={`Memory ${item.title}, dated ${item.dateStr}`}
              >
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={styles.textOnlyBox}>
                    <MaterialCommunityIcons name="notebook-outline" size={36} color={colors.primary} />
                    {item.excerpt && (
                      <Text style={styles.excerptText} numberOfLines={2}>
                        "{item.excerpt}"
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDate}>{item.dateStr}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── 8. ADD MEMORY BOTTOM CTA ─── */}
        {memories.length > 0 && (
          <TouchableOpacity
            style={styles.addMemoryBtn}
            onPress={() => onNavigate('createMemory')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="plus" size={22} color={colors.onPrimary} />
            <Text style={styles.addMemoryBtnText}>Add a Memory</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BottomNavBar activeTab="memories" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4 || 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.outline,
    ...elevation.e1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  addHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.s5 || 20,
    paddingTop: spacing.s4 || 16,
    paddingBottom: 110,
  },
  bannerBox: {
    marginBottom: spacing.s5 || 20,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl || 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: 12,
    ...elevation.e1,
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  textOnlyBox: {
    width: '100%',
    height: 120,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  excerptText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 6,
  },
  cardFooter: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  addMemoryBtn: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.xxl || 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    ...elevation.e3,
  },
  addMemoryBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyCtaBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onPrimary,
  },
});

export default MyMemoriesScreen;
