import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from "react-redux";
import { COLORS, MAP_DEFAULTS } from "../config/constants";
import { SECRETS } from "../config/secrets";
import { fetchTrashReports } from "../store/trashSlice";

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deniedReport, setDeniedReport] = useState(null);
  const dispatch = useDispatch();
  const { reports } = useSelector((state) => state.trash);

  useEffect(() => {
    getCurrentLocation();
    dispatch(fetchTrashReports());
  }, [dispatch]);

  useEffect(() => {
    // Check for denied reports
    const denied = reports.find(r => r.status === 'denied' && r.denial_reason);
    if (denied) {
      setDeniedReport(denied);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setDeniedReport(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [reports]);

  const getCurrentLocation = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to show nearby trash reports.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      // Try to get last known location first for instant load
      let lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) {
        setLocation({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          latitudeDelta: MAP_DEFAULTS.LATITUDE_DELTA,
          longitudeDelta: MAP_DEFAULTS.LONGITUDE_DELTA,
        });
        setLoading(false);
      }

      // Then get more accurate location in background
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000, // Accept cached location up to 10 seconds old
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: MAP_DEFAULTS.LATITUDE_DELTA,
        longitudeDelta: MAP_DEFAULTS.LONGITUDE_DELTA,
      });
      if (!lastKnown) setLoading(false);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Unable to get current location");
      setLoading(false);
    }
  };

  const onMarkerPress = (report) => {
    navigation.navigate("TrashDetail", { reportId: report.id });
  };

  const refreshLocation = () => {
    setLoading(true);
    getCurrentLocation();
  };

  // Generate Google Maps HTML with markers
  const generateMapHTML = () => {
    const markers = reports.map(report => ({
      lat: parseFloat(report.latitude) || 0,
      lng: parseFloat(report.longitude) || 0,
      title: `${report.trash_type} - ${report.size}`,
      status: report.status,
      id: report.id
    }));

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          #map {
            height: 100%;
            width: 100%;
          }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function initMap() {
            const userLocation = {
              lat: ${location?.latitude || 37.7749},
              lng: ${location?.longitude || -122.4194}
            };

            const map = new google.maps.Map(document.getElementById("map"), {
              zoom: 15,
              center: userLocation,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "transit",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "road",
                  elementType: "labels.icon",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#1a1f2e" }]
                },
                {
                  featureType: "landscape",
                  elementType: "geometry",
                  stylers: [{ color: "#2a2f3e" }]
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#3a3f4e" }]
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212530" }]
                },
                {
                  featureType: "administrative",
                  elementType: "geometry",
                  stylers: [{ color: "#757575" }]
                },
                {
                  featureType: "poi.park",
                  elementType: "geometry",
                  stylers: [{ color: "#2b3638" }]
                }
              ]
            });

            // Add user location marker
            new google.maps.Marker({
              position: userLocation,
              map: map,
              title: "Your Location",
              icon: {
                url: 'data:image/svg+xml;base64,' + btoa(\`
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="${COLORS.PRIMARY}">
                    <circle cx="12" cy="12" r="8" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                \`),
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(15, 15)
              }
            });

            // Add trash location markers
            const trashMarkers = ${JSON.stringify(markers)};
            trashMarkers.forEach(marker => {
              const markerColor = marker.status === 'pending' ? '#000000' : '${COLORS.SUCCESS}';
              const markerIcon = 'data:image/svg+xml;base64,' + btoa(\`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="\${markerColor}" stroke="white" stroke-width="3"/>
                  <g transform="translate(12, 12)">
                    <path d="M6 2l1 1h4l1-1h3v2H3V2h3zm1 3v11c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V5H7zm2 2h1v7H9V7zm3 0h1v7h-1V7z" fill="white"/>
                  </g>
                </svg>
              \`);

              const trashMarker = new google.maps.Marker({
                position: { lat: marker.lat, lng: marker.lng },
                map: map,
                title: marker.title,
                icon: {
                  url: markerIcon,
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(20, 20)
                }
              });

              trashMarker.addListener('click', () => {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'markerClick',
                  reportId: marker.id,
                  markerData: marker
                }));
              });
            });
          }
        </script>
        <script async defer 
          src="https://maps.googleapis.com/maps/api/js?key=${SECRETS.GOOGLE_MAPS_API_KEY}&callback=initMap">
        </script>
      </body>
    </html>`;
  };

  // Google Maps View Component
  const GoogleMapsView = () => {
    if (!location) {
      return (
        <View style={styles.mapPlaceholder}>
          <MaterialIcons name="map" size={60} color="#ccc" />
          <Text style={styles.placeholderText}>Loading map...</Text>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: generateMapHTML() }}
          style={styles.webMap}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'markerClick' && data.reportId) {
                navigation.navigate("TrashDetail", { reportId: data.reportId });
              }
            } catch (error) {
              console.log('Error parsing WebView message:', error);
            }
          }}
        />
        
        {/* Floating action buttons */}
        <View style={styles.floatingActions}>
          <TouchableOpacity 
            style={styles.fabPrimary}
            onPress={() => navigation.navigate('Report')}
          >
            <MaterialIcons name="add-location" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.fabSecondary}
            onPress={() => navigation.navigate('Pickup')}
          >
            <MaterialIcons name="cleaning-services" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <MaterialIcons name="eco" size={60} color={COLORS.PRIMARY} />
        <ActivityIndicator
          size="large"
          color={COLORS.PRIMARY}
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Finding your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Denial Notification Banner */}
      {deniedReport && (
        <View style={styles.denialBanner}>
          <View style={styles.denialContent}>
            <MaterialIcons name="error-outline" size={24} color={COLORS.ERROR} />
            <View style={styles.denialTextContainer}>
              <Text style={styles.denialTitle}>Report Denied</Text>
              <Text style={styles.denialReason}>{deniedReport.denial_reason}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setDeniedReport(null)}
              style={styles.denialClose}
            >
              <MaterialIcons name="close" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trash Clean</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshLocation}
        >
          <MaterialIcons name="refresh" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Google Maps View */}
      <GoogleMapsView />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  denialBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ERROR,
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 15,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  denialContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  denialTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  denialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.ERROR,
    marginBottom: 2,
  },
  denialReason: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  denialClose: {
    padding: 5,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
  loader: {
    marginTop: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  header: {
    backgroundColor: COLORS.SURFACE,
    paddingTop: 70,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    position: "absolute",
    bottom: 15,
    left: 20,
  },
  refreshButton: {
    padding: 8,
  },
  // Google Maps styles
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webMap: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 105,
    right: 20,
    alignItems: 'flex-end',
  },
  fabPrimary: {
    backgroundColor: COLORS.PRIMARY,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabSecondary: {
    backgroundColor: COLORS.SURFACE,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noLocationText: {
    fontSize: 18,
    color: "#666",
    marginTop: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  statsContainer: {
    backgroundColor: COLORS.SURFACE,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.DIVIDER,
  },
});

export default HomeScreen;
