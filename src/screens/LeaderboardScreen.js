import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import {
  fetchGlobalLeaderboard,
  fetchFriendsLeaderboard,
  fetchUserRank,
  setPeriod,
  setView,
  clearError,
} from '../store/leaderboardSlice';
import leaderboardService from '../services/leaderboardService';

const LeaderboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const {
    globalLeaderboard,
    friendsLeaderboard,
    userRank,
    currentPeriod,
    currentView,
    loading,
    error,
    lastUpdated,
  } = useSelector((state) => state.leaderboard);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboardData();
  }, [currentPeriod, currentView]);

  const loadLeaderboardData = async () => {
    try {
      if (currentView === 'global') {
        dispatch(fetchGlobalLeaderboard({ period: currentPeriod }));
      } else {
        dispatch(fetchFriendsLeaderboard({ period: currentPeriod }));
      }
      dispatch(fetchUserRank({ period: currentPeriod }));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboardData();
    setRefreshing(false);
  };

  const handlePeriodChange = (period) => {
    dispatch(setPeriod(period));
  };

  const handleViewChange = (view) => {
    dispatch(setView(view));
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const isCurrentUser = item.id === user?.id;
    const userLevel = leaderboardService.getUserLevel(item.points || 0);
    const position = index + 1;

    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.positionContainer}>
          <Text style={[styles.position, isCurrentUser && styles.currentUserText]}>
            {leaderboardService.formatPosition(position)}
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: userLevel.color }]}>
              <MaterialIcons name="person" size={24} color="white" />
            </View>
          )}
          <View style={[styles.levelBadge, { backgroundColor: userLevel.color }]}>
            <Text style={styles.levelText}>{userLevel.level}</Text>
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isCurrentUser && styles.currentUserText]} numberOfLines={1}>
            {item.name || 'Anonymous User'}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={[styles.userTitle, { color: userLevel.color }]}>
            {userLevel.title}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="delete" size={14} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.statText}>{item.totalCleanups || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="report" size={14} color={COLORS.TEXT_SECONDARY} />
              <Text style={styles.statText}>{item.totalReports || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={[styles.points, isCurrentUser && styles.currentUserText]}>
            {leaderboardService.formatPoints(item.points || 0)}
          </Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>
    );
  };

  const renderUserRankCard = () => {
    if (!userRank || loading.rank) return null;

    // Use API level data if available, otherwise calculate from points
    const userLevel = userRank.level && userRank.levelColor ? {
      level: userRank.levelTier,
      title: userRank.level,
      color: userRank.levelColor
    } : leaderboardService.getUserLevel(userRank.points || 0);
    
    const progress = userRank.progressToNext ? {
      progress: userRank.progressToNext,
      pointsToNext: userRank.nextLevelThreshold - (userRank.points || 0),
      nextLevel: userRank.levelTier + 1
    } : leaderboardService.getProgressToNextLevel(userRank.points || 0);
    
    const isFallback = userRank.fallback;

    return (
      <View style={styles.userRankCard}>
        <View style={styles.userRankHeader}>
          <Text style={styles.userRankTitle}>Your Rank</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {isFallback && (
          <View style={styles.fallbackNotice}>
            <MaterialIcons name="warning" size={16} color={COLORS.WARNING} />
            <Text style={styles.fallbackText}>
              Unable to fetch current rank. Showing default values.
            </Text>
          </View>
        )}

        <View style={styles.userRankContent}>
          <View style={styles.userRankInfo}>
            <Text style={[styles.userRankPosition, isFallback && styles.fallbackValue]}>
              {userRank.globalRank ? leaderboardService.formatPosition(userRank.globalRank) : "N/A"}
            </Text>
            <Text style={styles.userRankPoints}>
              {leaderboardService.formatPoints(userRank.points || 0)} pts
            </Text>
          </View>

          <View style={styles.levelProgress}>
            <Text style={[styles.levelTitle, { color: userLevel.color }]}>
              {userLevel.title}
            </Text>
            {progress.progress < 100 && !isFallback && (
              <>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {progress.pointsToNext} points to level {progress.nextLevel}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.selectorContainer}>
      {['all', 'monthly', 'weekly'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.selectorButton,
            currentPeriod === period && styles.activeSelectorButton,
          ]}
          onPress={() => handlePeriodChange(period)}
        >
          <Text
            style={[
              styles.selectorText,
              currentPeriod === period && styles.activeSelectorText,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderViewSelector = () => (
    <View style={styles.selectorContainer}>
      {['global', 'friends'].map((view) => (
        <TouchableOpacity
          key={view}
          style={[
            styles.selectorButton,
            currentView === view && styles.activeSelectorButton,
          ]}
          onPress={() => handleViewChange(view)}
        >
          <Text
            style={[
              styles.selectorText,
              currentView === view && styles.activeSelectorText,
            ]}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const currentLeaderboard = currentView === 'global' ? globalLeaderboard : friendsLeaderboard;
  const isLoading = loading.global || loading.friends;

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Leaderboard Debug Info:');
    console.log('  - currentView:', currentView);
    console.log('  - globalLeaderboard length:', globalLeaderboard?.length || 0);
    console.log('  - friendsLeaderboard length:', friendsLeaderboard?.length || 0);
    console.log('  - currentLeaderboard length:', currentLeaderboard?.length || 0);
    console.log('  - isLoading:', isLoading);
    console.log('  - error:', error);
    console.log('  - globalLeaderboard data:', globalLeaderboard);
  }, [currentView, globalLeaderboard, friendsLeaderboard, currentLeaderboard, isLoading, error]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={COLORS.ERROR} />
        <Text style={styles.errorText}>Failed to load leaderboard</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadLeaderboardData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderUserRankCard()}
      
      <View style={styles.content}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        
        {renderPeriodSelector()}
        {renderViewSelector()}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : currentLeaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="leaderboard" size={64} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.emptyText}>
              {currentView === 'friends' 
                ? "No friends on the leaderboard yet" 
                : "No users on the leaderboard yet"
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={currentLeaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.PRIMARY]}
                tintColor={COLORS.PRIMARY}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  userRankCard: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: 20,
    marginTop: 70,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  userRankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  userRankTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRankInfo: {
    marginRight: 20,
    alignItems: 'center',
  },
  userRankPosition: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  userRankPoints: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  levelProgress: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.SURFACE_VARIANT,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    marginBottom: 15,
    padding: 4,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeSelectorButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  activeSelectorText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: COLORS.BACKGROUND,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  currentUserItem: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: `${COLORS.PRIMARY}10`,
  },
  currentUserText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  position: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.SURFACE,
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  userTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  pointsLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  fallbackNotice: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  fallbackText: {
    fontSize: 12,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  fallbackValue: {
    color: COLORS.TEXT_SECONDARY,
    opacity: 0.7,
  },
});

export default LeaderboardScreen;