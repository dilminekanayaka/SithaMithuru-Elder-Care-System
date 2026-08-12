import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

interface ManageElderProps {
    onBack: () => void;
    onNavigate: (screen: string) => void;
    elderId?: string;
    token?: string;
    onEditMedication?: (med: any) => void;
    userName?: string;
    userInitials?: string;
    guardianId?: string;
}

const ManageElder: React.FC<ManageElderProps> = ({ onBack, onNavigate, userName = 'Mr. Dumidu', userInitials = 'MD' }: ManageElderProps) => {
    const [activeSegment, setActiveSegment] = useState('Profile');

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>

            {/* Black Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={onBack}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onPrimary} />
                </TouchableOpacity>

                <View style={styles.userInfo}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userRole}>Guardian</Text>
                    </View>
                    <View style={styles.profileBadge}>
                        <Text style={styles.initialsText}>{userInitials}</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Elder Dropdown Section */}
                <View style={styles.elderSelector}>
                    <Text style={styles.elderLabel}>Elder : </Text>
                    <TouchableOpacity style={styles.dropdown}>
                        <Text style={styles.dropdownText}>John De Silva</Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#000" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.title}>Manage Elder</Text>

                {/* Segmented Control */}
                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        style={[styles.segment, activeSegment === 'Profile' && styles.segmentActive]}
                        onPress={() => setActiveSegment('Profile')}
                    >
                        <Text style={[styles.segmentText, activeSegment === 'Profile' && styles.segmentTextActive]}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segment, activeSegment === 'Medications' && styles.segmentActive]}
                        onPress={() => setActiveSegment('Medications')}
                    >
                        <Text style={[styles.segmentText, activeSegment === 'Medications' && styles.segmentTextActive]}>Medications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segment, activeSegment === 'SOS' && styles.segmentActive]}
                        onPress={() => setActiveSegment('SOS')}
                    >
                        <Text style={[styles.segmentText, activeSegment === 'SOS' && styles.segmentTextActive]}>SOS</Text>
                    </TouchableOpacity>
                </View>

                {/* Basic Information Card */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Basic Information</Text>
                        <TouchableOpacity>
                            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Name</Text>
                        <Text style={styles.infoValue}>John Anderson</Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Age</Text>
                        <Text style={styles.infoValue}>72 years old</Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Blood Type</Text>
                        <Text style={styles.infoValue}>O+</Text>
                    </View>
                </View>

                {/* Medical Conditions Section */}
                <Text style={styles.sectionTitle}>Medical Conditions</Text>
                <View style={styles.tagContainer}>
                    <View style={styles.conditionTag}>
                        <Text style={styles.tagText}>High Blood Pressure</Text>
                    </View>
                    <View style={styles.conditionTag}>
                        <Text style={styles.tagText}>Type 2 Diabetes</Text>
                    </View>
                </View>

                {/* Allergies Section */}
                <Text style={styles.sectionTitle}>Allergies</Text>
                <View style={styles.tagContainer}>
                    <View style={[styles.allergyTag, { backgroundColor: colors.warningContainer }]}>
                        <Text style={[styles.tagText, { color: colors.warning }]}>Penicillin</Text>
                    </View>
                    <View style={[styles.allergyTag, { backgroundColor: colors.warningContainer }]}>
                        <Text style={[styles.tagText, { color: colors.warning }]}>Peanuts</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('guardianDashboard')}>
                    <MaterialCommunityIcons name="home-outline" size={28} color={colors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialCommunityIcons name="clock-outline" size={28} color={colors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.plusButton}>
                    <MaterialCommunityIcons name="plus" size={32} color={colors.onPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('manageElder')}>
                    <MaterialCommunityIcons name="account-cog" size={28} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialCommunityIcons name="cog-outline" size={28} color={colors.text.secondary} />
                </TouchableOpacity>
            </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 25,
        backgroundColor: '#000000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        color: colors.onPrimary,
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    userRole: {
        color: colors.text.tertiary,
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    profileBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: colors.text.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    initialsText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100,
    },
    elderSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    elderLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dropdownText: {
        fontSize: 14,
        color: '#333',
        marginRight: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 20,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        padding: 4,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },
    segment: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    segmentActive: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    segmentTextActive: {
        color: colors.onPrimary,
    },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        // Shadow
        shadowColor: colors.text.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    infoItem: {
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: 15,
    },
    tagContainer: {
        flexDirection: 'column',
        marginBottom: 20,
    },
    conditionTag: {
        backgroundColor: '#FEF5F5',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#FADBD8',
    },
    allergyTag: {
        backgroundColor: '#FDF2E9',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#FAE5D3',
    },
    tagText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.errorDark,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: 70,
        backgroundColor: colors.surface,
        borderRadius: 35,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        top: -5,
    },
});

export default ManageElder;
