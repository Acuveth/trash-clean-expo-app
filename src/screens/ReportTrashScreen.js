import React from 'react';
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { COLORS, API_BASE_URL } from "../config/constants";
import { analyzeTrashPhoto } from "../services/aiAnalysis";
import { useAuth } from "../context/AuthContext";

const ReportTrashScreen = () => {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        setHasPhoto(true);
        Alert.alert("Success", "Photo captured! Analyzing image and getting location...");
        
        // Start both location and AI analysis simultaneously
        await Promise.all([
          getCurrentLocation(),
          analyzeImage(result.assets[0].uri)
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to report trash."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocationData(location.coords);
      setHasLocation(true);
    } catch (error) {
      Alert.alert("Error", "Failed to get location");
    }
  };

  const analyzeImage = async (imageUri) => {
    try {
      setIsAnalyzing(true);
      const result = await analyzeTrashPhoto(imageUri);
      
      // Handle validation failure
      if (result.validationError) {
        Alert.alert(
          "Photo Not Suitable",
          `${result.validationError}\n\nPlease take a photo of litter/trash in outdoor public spaces (streets, parks, sidewalks, etc.)`,
          [
            { text: "Take New Photo", onPress: () => {
              setHasPhoto(false);
              setPhotoUri(null);
              setAiAnalysis(null);
            }}
          ]
        );
        return;
      }
      
      setAiAnalysis(result.analysis);
      
      if (result.success && result.analysis) {
        Alert.alert(
          "✅ Photo Approved", 
          `AI Analysis Complete:\n• Found: ${result.analysis?.trashCount || 0} items\n• Types: ${result.analysis?.trashTypes?.join(', ') || 'Unknown'}\n• Location: Outdoor public space`
        );
      } else if (result.analysis) {
        Alert.alert("Photo Approved", "Photo validated for outdoor trash reporting.");
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert("Analysis Warning", "AI analysis failed, but you can still submit the report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitReport = async () => {
    if (!hasPhoto) {
      Alert.alert("Missing Photo", "Please take a photo of the trash first.");
      return;
    }
    if (!hasLocation) {
      Alert.alert(
        "Missing Location",
        "Please allow location access to submit the report."
      );
      return;
    }

    if (!user) {
      Alert.alert("Authentication Required", "Please log in to submit reports.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'trash-report.jpg'
      });
      
      // Add all the data
      formData.append('latitude', locationData.latitude.toString());
      formData.append('longitude', locationData.longitude.toString());
      formData.append('username', user.name || user.email);
      
      // Add AI analysis data if available
      if (aiAnalysis) {
        formData.append('aiDescription', aiAnalysis?.description || 'User-submitted trash report');
        formData.append('trashCount', (aiAnalysis?.trashCount || '1').toString());
        formData.append('trashTypes', JSON.stringify(aiAnalysis?.trashTypes || ['unspecified trash']));
        formData.append('severity', aiAnalysis?.severity || 'medium');
        formData.append('locationContext', aiAnalysis?.location_context || 'user-reported location');
      } else {
        // Fallback data if AI analysis failed
        formData.append('aiDescription', 'User-submitted trash report');
        formData.append('trashCount', '1');
        formData.append('trashTypes', JSON.stringify(['unspecified trash']));
        formData.append('severity', 'medium');
        formData.append('locationContext', 'user-reported location');
      }
      
      // Add standard fields required by backend
      formData.append('description', aiAnalysis?.description || 'User-submitted trash report');
      formData.append('trashType', aiAnalysis?.trashTypes?.[0] || 'mixed');
      formData.append('size', aiAnalysis?.severity === 'high' ? 'large' : aiAnalysis?.severity === 'low' ? 'small' : 'medium');

      // Submit to backend
      const response = await fetch(`${API_BASE_URL}/trash/report`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert("Success", "Trash report submitted successfully!");
        
        // Reset form
        setHasPhoto(false);
        setHasLocation(false);
        setPhotoUri(null);
        setLocationData(null);
        setAiAnalysis(null);
      } else {
        const error = await response.json();
        Alert.alert("Submission Failed", error.message || "Please try again later.");
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert("Network Error", "Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <MaterialIcons name="report-problem" size={60} color={COLORS.PRIMARY} />
        <Text style={styles.title}>Report Trash</Text>
        <Text style={styles.subtitle}>Help clean up your community</Text>
      </View>

      <View style={styles.stepContainer}>
        <View style={[styles.step, hasPhoto && styles.completedStep]}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Take a Photo</Text>
            <Text style={styles.stepDescription}>
              Capture an image of the trash
            </Text>
          </View>
          <MaterialIcons
            name={hasPhoto ? "check-circle" : "camera-alt"}
            size={24}
            color={hasPhoto ? COLORS.SUCCESS : "#ccc"}
          />
        </View>

        <View style={[styles.step, hasLocation && styles.completedStep]}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>AI Analysis</Text>
            <Text style={styles.stepDescription}>
              {isAnalyzing ? "Analyzing image..." : 
               aiAnalysis ? `Found ${aiAnalysis?.trashCount || 0} items` : 
               "Automatic analysis with photo"}
            </Text>
          </View>
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <MaterialIcons
              name={aiAnalysis ? "check-circle" : "psychology"}
              size={24}
              color={aiAnalysis ? COLORS.SUCCESS : "#ccc"}
            />
          )}
        </View>

        <View style={[styles.step, hasLocation && styles.completedStep]}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Location</Text>
            <Text style={styles.stepDescription}>
              {hasLocation ? 
                `${locationData?.latitude.toFixed(4)}, ${locationData?.longitude.toFixed(4)}` : 
                "Automatically captured"}
            </Text>
          </View>
          <MaterialIcons
            name={hasLocation ? "check-circle" : "location-on"}
            size={24}
            color={hasLocation ? COLORS.SUCCESS : "#ccc"}
          />
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Submit Report</Text>
            <Text style={styles.stepDescription}>
              Share with the community
            </Text>
          </View>
          <MaterialIcons name="send" size={24} color="#ccc" />
        </View>
      </View>

      {/* Photo Preview */}
      {photoUri && (
        <View style={styles.photoPreview}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <Text style={styles.photoLabel}>Captured Photo</Text>
        </View>
      )}

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>🤖 AI Analysis Results</Text>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Description:</Text>
            <Text style={styles.analysisValue}>{aiAnalysis?.description || 'No description'}</Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Trash Count:</Text>
            <Text style={styles.analysisValue}>{aiAnalysis?.trashCount || 0} items</Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Types Found:</Text>
            <Text style={styles.analysisValue}>
              {(aiAnalysis?.trashTypes && Array.isArray(aiAnalysis.trashTypes)) 
                ? aiAnalysis.trashTypes.join(', ') 
                : 'Unknown'}
            </Text>
          </View>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Severity:</Text>
            <Text style={[styles.analysisValue, { 
              color: COLORS.TEXT_SECONDARY 
            }]}>
              {aiAnalysis?.severity || 'UNKNOWN'}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
        <MaterialIcons name="camera-alt" size={30} color="white" />
        <Text style={styles.photoButtonText}>
          {hasPhoto ? "Retake Photo" : "Take Photo"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!hasPhoto || !hasLocation || isSubmitting) && styles.disabledButton,
        ]}
        onPress={submitReport}
        disabled={!hasPhoto || !hasLocation || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={COLORS.TEXT_PRIMARY} />
        ) : (
          <MaterialIcons name="send" size={24} color={COLORS.TEXT_PRIMARY} />
        )}
        <Text style={styles.submitButtonText}>
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 5,
  },
  stepContainer: {
    margin: 20,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  completedStep: {
    // No background styling - removed gray background
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  stepNumberText: {
    color: "white",
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
    color: COLORS.TEXT_PRIMARY,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
  },
  photoButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  disabledButton: {
    backgroundColor: COLORS.SURFACE,
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  // Photo preview styles
  photoPreview: {
    margin: 20,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  photoLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
  },
  // AI Analysis styles
  analysisContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    marginBottom: 12,
  },
  analysisItem: {
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  analysisValue: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
});

export default ReportTrashScreen;
