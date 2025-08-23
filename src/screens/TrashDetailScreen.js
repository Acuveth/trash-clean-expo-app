import React, { useState, useEffect } from 'react';
import { MaterialIcons } from "@expo/vector-icons";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator 
} from "react-native";
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from "react-redux";
import { COLORS } from "../config/constants";

const TrashDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { reportId } = route.params;
  const { reports } = useSelector((state) => state.trash);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const foundReport = reports.find(r => r.id == reportId);
    setReport(foundReport);
  }, [reportId, reports]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'cleaned': return COLORS.SUCCESS;
      case 'denied': return COLORS.ERROR;
      default: return COLORS.TEXT_SECONDARY;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'cleaned': return 'check-circle';
      case 'denied': return 'error';
      default: return 'help';
    }
  };

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading trash details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trash Report Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
          <MaterialIcons 
            name={getStatusIcon(report.status)} 
            size={20} 
            color="white" 
          />
          <Text style={styles.statusText}>
            {(report.status || 'unknown').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Photo */}
      {report.photo_url && (
        <View style={styles.photoContainer}>
          <Image 
            source={{ uri: report.photo_url }} 
            style={styles.photo}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialIcons name="delete" size={24} color={COLORS.PRIMARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Trash Type</Text>
            <Text style={styles.detailValue}>{report.trash_type || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="straighten" size={24} color={COLORS.PRIMARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Size</Text>
            <Text style={styles.detailValue}>{report.size || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="description" size={24} color={COLORS.PRIMARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>
              {report.description || 'No description provided'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={24} color={COLORS.PRIMARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {report.latitude && report.longitude 
                ? `${parseFloat(report.latitude).toFixed(6)}, ${parseFloat(report.longitude).toFixed(6)}`
                : 'Location not available'
              }
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={24} color={COLORS.PRIMARY} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Reported</Text>
            <Text style={styles.detailValue}>
              {report.created_at 
                ? new Date(report.created_at).toLocaleString()
                : 'Date unknown'
              }
            </Text>
          </View>
        </View>

        {report.status === 'denied' && report.denial_reason && (
          <View style={styles.denialContainer}>
            <MaterialIcons name="error-outline" size={24} color={COLORS.ERROR} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Denial Reason</Text>
              <Text style={[styles.detailValue, { color: COLORS.ERROR }]}>
                {report.denial_reason}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.SURFACE,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  photoContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.SURFACE,
  },
  photo: {
    width: '100%',
    height: 250,
  },
  detailsContainer: {
    marginHorizontal: 20,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  denialContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
    backgroundColor: `${COLORS.ERROR}10`,
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  detailContent: {
    flex: 1,
    marginLeft: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 22,
  },
});

export default TrashDetailScreen;
