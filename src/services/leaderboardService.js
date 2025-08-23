import apiClient from '../utils/apiClient';

class LeaderboardService {
  async getGlobalLeaderboard(period = 'all', limit = 50) {
    try {
      const response = await apiClient.get('/leaderboard/global', { period, limit });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      throw error;
    }
  }

  async getFriendsLeaderboard(period = 'all', limit = 50) {
    try {
      const response = await apiClient.get('/leaderboard/friends', { period, limit });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      throw error;
    }
  }

  async getUserRank(period = 'all') {
    try {
      const response = await apiClient.get('/leaderboard/my-rank', { period });
      
      // Handle the structured API response
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
      throw error;
    }
  }

  async getLeaderboardStats() {
    try {
      return await apiClient.get('/leaderboard/stats');
    } catch (error) {
      console.error('Error fetching leaderboard stats:', error);
      throw error;
    }
  }

  async addFriend(userId) {
    try {
      return await apiClient.post('/users/friends', { friendId: userId });
    } catch (error) {
      console.error('Error adding friend:', error);
      throw error;
    }
  }

  async removeFriend(userId) {
    try {
      return await apiClient.delete(`/users/friends/${userId}`);
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  // Helper function to format leaderboard position
  formatPosition(position) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  }

  // Helper function to format points
  formatPoints(points) {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    }
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  }

  // Helper function to get user level based on points
  getUserLevel(points) {
    if (points < 100) return { level: 1, title: "Eco Beginner", color: "#9E9E9E" };
    if (points < 500) return { level: 2, title: "Trash Hunter", color: "#795548" };
    if (points < 1500) return { level: 3, title: "Eco Warrior", color: "#FF9800" };
    if (points < 3000) return { level: 4, title: "Green Hero", color: "#9C27B0" };
    if (points < 5000) return { level: 5, title: "Planet Savior", color: "#3F51B5" };
    return { level: 6, title: "Eco Legend", color: "#FFD700" };
  }

  // Calculate progress to next level
  getProgressToNextLevel(points) {
    const levels = [0, 100, 500, 1500, 3000, 5000];
    const currentLevel = this.getUserLevel(points).level;
    
    if (currentLevel >= 6) {
      return { progress: 100, pointsToNext: 0, nextLevel: currentLevel };
    }
    
    const currentLevelPoints = levels[currentLevel - 1];
    const nextLevelPoints = levels[currentLevel];
    const progressPoints = points - currentLevelPoints;
    const totalNeeded = nextLevelPoints - currentLevelPoints;
    const progress = Math.min((progressPoints / totalNeeded) * 100, 100);
    
    return {
      progress: Math.round(progress),
      pointsToNext: nextLevelPoints - points,
      nextLevel: currentLevel + 1
    };
  }
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService;