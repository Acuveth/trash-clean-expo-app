import React from 'react';
import { MaterialIcons } from "@expo/vector-icons";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView,
  Alert
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from '@react-navigation/native';
import { useSelector } from "react-redux";
import { COLORS } from "../config/constants";
import { useAuth } from "../context/AuthContext";
import ShareProgress from '../components/ShareProgress';

const ProfileScreen = () => {
  const { user, logout, simpleLogout } = useAuth();
  const navigation = useNavigation();
  const { shareText } = ShareProgress();
  const { reports } = useSelector((state) => state.trash);

  const handleShare = async () => {
    try {
      await shareText();
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleViewBadges = () => {
    navigation.navigate('Achievements');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleLeaderboard = () => {
    navigation.navigate('Leaderboard');
  };

  const confirmLogout = () => {
    console.log("🟡 confirmLogout called");
    console.log("🟡 Showing alert...");
    
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => console.log("🟡 User cancelled logout")
        },
        { 
          text: "Logout", 
          onPress: () => {
            console.log("🟡 User confirmed logout - starting logout process");
            handleLogoutConfirmed();
          }, 
          style: "destructive" 
        }
      ]
    );
  };

  const handleLogoutConfirmed = async () => {
    console.log("🟡 handleLogoutConfirmed called");
    try {
      console.log("🟡 Calling simple logout function...");
      await simpleLogout();
      console.log("🟡 Simple logout function completed");
      // Navigation will be handled automatically by App.js when user becomes null
    } catch (error) {
      console.error('🟡 ProfileScreen logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const getUserLevel = (points) => {
    if (points < 100) return { level: 1, title: "Eco Beginner" };
    if (points < 500) return { level: 2, title: "Trash Hunter" };
    if (points < 1500) return { level: 3, title: "Eco Warrior" };
    if (points < 3000) return { level: 4, title: "Green Hero" };
    return { level: 5, title: "Planet Savior" };
  };

  const userLevel = getUserLevel(user?.points || 0);

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <MaterialIcons name="eco" size={50} color={COLORS.PRIMARY} />
        </View>
        <Text style={styles.userName}>{user?.name || "Eco Warrior"}</Text>
        <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
        <View style={styles.levelBadge}>
          <MaterialIcons name="stars" size={16} color={COLORS.PRIMARY} />
          <Text style={styles.levelText}>Level {userLevel.level} - {userLevel.title}</Text>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="eco" size={30} color={COLORS.SUCCESS} />
          <Text style={styles.statNumber}>{user?.points || 0}</Text>
          <Text style={styles.statLabel}>Eco Points</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="cleaning-services" size={30} color={COLORS.INFO} />
          <Text style={styles.statNumber}>{user?.totalCleanups || 0}</Text>
          <Text style={styles.statLabel}>Cleanups</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="add-location" size={30} color={COLORS.WARNING} />
          <Text style={styles.statNumber}>{user?.totalReports || 0}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
      </View>

      {/* Trash Reports Stats */}
      <View style={styles.trashStatsContainer}>
        <Text style={styles.sectionTitle}>Trash Reports Status</Text>
        <View style={styles.trashStatsRow}>
          <View style={styles.trashStatItem}>
            <MaterialIcons name="pending" size={24} color={COLORS.WARNING} />
            <Text style={styles.trashStatNumber}>
              {reports?.filter((r) => r.status === "pending").length || 0}
            </Text>
            <Text style={styles.trashStatLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.trashStatItem}>
            <MaterialIcons name="check-circle" size={24} color={COLORS.SUCCESS} />
            <Text style={styles.trashStatNumber}>
              {reports?.filter((r) => r.status === "cleaned").length || 0}
            </Text>
            <Text style={styles.trashStatLabel}>Cleaned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.trashStatItem}>
            <MaterialIcons name="delete" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.trashStatNumber}>{reports?.length || 0}</Text>
            <Text style={styles.trashStatLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
          <MaterialIcons name="edit" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.actionText}>Edit Profile</Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleViewBadges}>
          <MaterialIcons name="military-tech" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.actionText}>Achievements</Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleLeaderboard}>
          <MaterialIcons name="leaderboard" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.actionText}>Leaderboard</Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <MaterialIcons name="share" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.actionText}>Share Progress</Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
          <MaterialIcons name="settings" size={24} color={COLORS.TEXT_PRIMARY} />
          <Text style={styles.actionText}>Settings</Text>
          <MaterialIcons name="chevron-right" size={20} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>


      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
        <MaterialIcons name="logout" size={24} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Keep up the great work! 🌱</Text>
        <Text style={styles.versionText}>Trash Clean v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.SURFACE_VARIANT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 15,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE_VARIANT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  trashStatsContainer: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 15,
  },
  trashStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  trashStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  trashStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 8,
    marginBottom: 4,
  },
  trashStatLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.DIVIDER,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ERROR,
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 5,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.TEXT_DISABLED,
  },
});

export default ProfileScreen;
