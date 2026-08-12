import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { apiFetch } from "../services/api";
import { colors } from '../theme';

interface ConnectScreenProps {
  onBack: () => void;
  token: string;
  userRole: "Elder" | "Guardian";
}

const RELATIONSHIP_TYPES = [
  "Son", "Daughter", "Spouse", "Grandchild",
  "Sibling", "Caregiver", "Friend", "Doctor", "Other"
];

const ConnectScreen: React.FC<ConnectScreenProps> = ({
  onBack,
  token,
  userRole,
}) => {
  const [inviteToken, setInviteToken] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);

  // Connection selections
  const [relationship, setRelationship] = useState("Son");
  const [permissionLevel, setPermissionLevel] = useState<"Primary" | "Secondary">("Primary");

  // Incoming Requests List
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await apiFetch("/connection/pending", token);
      if (data.success) {
        setPendingRequests(data.requests || []);
      }
    } catch (error: any) {
      console.log("Fetch pending connection requests error:", error.message);
    } finally {
      setLoadingRequests(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const data = await apiFetch("/connection/invite", token, { method: "POST" });
      if (data.success) {
        setGeneratedCode(data.token);
        Toast.show({ type: "success", text1: "Invitation Code Generated" });
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleValidateCode = async () => {
    if (!inviteToken.trim()) {
      Toast.show({ type: "error", text1: "Please enter code" });
      return;
    }
    setValidating(true);
    try {
      const data = await apiFetch("/connection/validate", token, {
        method: "POST",
        body: JSON.stringify({
          token: inviteToken.trim(),
          relationship,
          permissionLevel,
        }),
      });
      if (data.success) {
        Toast.show({
          type: "success",
          text1: "Request Sent!",
          text2: "Waiting for target user to accept connection request.",
        });
        setInviteToken("");
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to Connect", text2: error.message });
    } finally {
      setValidating(false);
    }
  };

  const handleRespond = async (requestId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const data = await apiFetch(`/connection/respond/${requestId}`, token, {
        method: "PUT",
        body: JSON.stringify({ action }),
      });
      if (data.success) {
        Toast.show({
          type: "success",
          text1: action === "ACCEPT" ? "Connected successfully" : "Connection request declined",
        });
        fetchPendingRequests();
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to Respond", text2: error.message });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hi! Connect with me on SithaMithuru Elder Care App.\n\nUse invitation code: ${generatedCode}\n\nOr click this link to connect automatically:\nhttps://sithamithuru.app/connect?code=${generatedCode}\n(Deep link: sithamithuru://connect?code=${generatedCode})`,
      });
    } catch (error: any) {
      console.log("Share error:", error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingRequests();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >

        {/* Pending Requests Section */}
        <Text style={styles.sectionTitle}>Pending Requests</Text>
        <View style={styles.card}>
          {loadingRequests ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
          ) : pendingRequests.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 10 }}>
              <MaterialCommunityIcons name="link-off" size={32} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          ) : (
            pendingRequests.map((req) => (
              <View key={req.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>{req.name}</Text>
                  <Text style={styles.requestDetail}>
                    Relationship: {req.relationship_type} • Role: {req.role}
                  </Text>
                </View>
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.error }]}
                    onPress={() => handleRespond(req.id, "REJECT")}
                    accessibilityLabel={`Reject connection from ${req.name}`}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="close" size={18} color={colors.onPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleRespond(req.id, "ACCEPT")}
                    accessibilityLabel={`Accept connection from ${req.name}`}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="check" size={18} color={colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Section 1: Generate Code */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Generate Invitation</Text>
          <Text style={styles.description}>
            Generate an invitation code to share. The other user can scan or enter it to connect.
          </Text>

          {generatedCode ? (
            <View style={styles.generatedBox}>
              <Text style={styles.codeText}>{generatedCode}</Text>
              <Text style={styles.expiryText}>Expires in 15 minutes</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare} accessibilityLabel="Share code" accessibilityRole="button">
                <MaterialCommunityIcons name="share-variant" size={20} color={colors.onPrimary} />
                <Text style={styles.shareBtnText}>Share Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleGenerateCode}
              disabled={generating}
              accessibilityLabel="Generate invitation code"
              accessibilityRole="button"
            >
              {generating ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
                  <Text style={styles.primaryBtnText}>Generate Invitation Code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Section 2: Enter Code */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Enter Invitation Code</Text>
          <Text style={styles.description}>
            Enter the code generated by the other account to connect instantly.
          </Text>

          <TextInput
            style={styles.input}
            value={inviteToken}
            onChangeText={setInviteToken}
            placeholder="SM-XXXX-YYYY"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="characters"
            accessibilityLabel="Invitation code input"
          />

          {/* Relationship settings */}
          <Text style={styles.subTitle}>Select Relationship</Text>
          <View style={styles.rowWrapper}>
            {RELATIONSHIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, relationship === type && styles.chipActive]}
                onPress={() => setRelationship(type)}
                accessibilityLabel={`Relationship ${type}`}
                accessibilityRole="button"
                accessibilityState={{ selected: relationship === type }}
              >
                <Text style={[styles.chipText, relationship === type && styles.chipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Permissions Settings */}
          <Text style={styles.subTitle}>Permission Level</Text>
          <View style={styles.permissionRow}>
            <TouchableOpacity
              style={[styles.permissionBtn, permissionLevel === "Primary" && styles.permissionBtnActive]}
              onPress={() => setPermissionLevel("Primary")}
              accessibilityLabel="Primary permission level"
              accessibilityRole="button"
              accessibilityState={{ selected: permissionLevel === "Primary" }}
            >
              <Text style={[styles.permissionBtnText, permissionLevel === "Primary" && styles.permissionBtnTextActive]}>
                Primary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.permissionBtn, permissionLevel === "Secondary" && styles.permissionBtnActive]}
              onPress={() => setPermissionLevel("Secondary")}
              accessibilityLabel="Secondary permission level"
              accessibilityRole="button"
              accessibilityState={{ selected: permissionLevel === "Secondary" }}
            >
              <Text style={[styles.permissionBtnText, permissionLevel === "Secondary" && styles.permissionBtnTextActive]}>
                Secondary
              </Text>
            </TouchableOpacity>
          </View>

          {/* FIX: Primary button color unified to #6C63FF */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleValidateCode}
            disabled={validating}
            accessibilityLabel="Submit code and connect"
            accessibilityRole="button"
          >
            {validating ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
                <Text style={styles.primaryBtnText}>Submit Code & Connect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { padding: 8, minWidth: 48, minHeight: 48, justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text.primary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  primaryBtn: {
    // FIX: Unified brand primary #6C63FF instead of #007AFF or #34C759
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    minHeight: 52,
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  generatedBox: {
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1.5,
  },
  expiryText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginVertical: 8,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
  },
  shareBtnText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background,
    marginBottom: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 10,
  },
  rowWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    minHeight: 44,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  permissionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  permissionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
    alignItems: "center",
    backgroundColor: colors.surface,
    minHeight: 48,
    justifyContent: "center",
  },
  permissionBtnActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  permissionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.secondary,
  },
  permissionBtnTextActive: {
    color: colors.primary,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  requestInfo: {
    flex: 1,
    paddingRight: 10,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text.primary,
  },
  requestDetail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  btnGroup: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: "600",
    marginTop: 6,
  },
});

export default ConnectScreen;
