import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Hero Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>🦸‍♂️ HABIT HEROES 🦸‍♀️</Text>
            <Text style={styles.subtitle}>Transform daily habits into EPIC adventures!</Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🎮</Text>
              <Text style={styles.featureTitle}>Gamified Habits</Text>
              <Text style={styles.featureDescription}>Turn boring chores into exciting quests!</Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🏆</Text>
              <Text style={styles.featureTitle}>XP & Rewards</Text>
              <Text style={styles.featureDescription}>Level up and unlock amazing rewards!</Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.featureTitle}>Parent Dashboard</Text>
              <Text style={styles.featureDescription}>Track progress and manage rewards!</Text>
            </View>

            <View style={styles.featureCard}>
              <Text style={styles.featureEmoji}>🎯</Text>
              <Text style={styles.featureTitle}>Daily Missions</Text>
              <Text style={styles.featureDescription}>Complete habits to save the day!</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.buttonText}>🎮 Start Your Hero Journey! ⚡</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>👨‍👩‍👧‍👦 Parent Login</Text>
            </TouchableOpacity>
          </View>

          {/* Coming Soon Features */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonTitle}>🚀 Coming Soon to Mobile!</Text>
            <View style={styles.comingSoonList}>
              <Text style={styles.comingSoonItem}>📱 Push notifications for habit reminders</Text>
              <Text style={styles.comingSoonItem}>📸 Camera integration for custom avatars</Text>
              <Text style={styles.comingSoonItem}>🔒 Biometric login (Face ID/Fingerprint)</Text>
              <Text style={styles.comingSoonItem}>🌍 Offline habit tracking with sync</Text>
              <Text style={styles.comingSoonItem}>📳 Haptic feedback for achievements</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  featureEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 30,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comingSoonSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  comingSoonList: {
    alignItems: 'flex-start',
  },
  comingSoonItem: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
    paddingLeft: 10,
  },
});
