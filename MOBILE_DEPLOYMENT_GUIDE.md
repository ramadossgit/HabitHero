# 📱 Habit Heroes Mobile Deployment Guide

## Overview
Complete guide to deploy Habit Heroes as native iOS and Android apps using React Native + Expo.

## Prerequisites

### Required Accounts & Tools
1. **Expo Account** - Sign up at [expo.dev](https://expo.dev)
2. **Apple Developer Account** ($99/year) - For iOS App Store
3. **Google Play Console Account** ($25 one-time) - For Android Play Store
4. **EAS CLI** - Expo Application Services command line tool

### Initial Setup
```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Initialize EAS in your project
cd HabitHeroesMobile
eas build:configure
```

## Development & Testing

### Local Development with Expo Go
```bash
cd HabitHeroesMobile
npm start
# Scan QR code with Expo Go app on your phone
```

### Backend Integration
The mobile app connects to the same backend API as the web version:
- **Local Development**: Point to your Replit development URL
- **Production**: Point to your deployed Replit app URL

Update the API base URL in your mobile app configuration.

## Building for Production

### 1. Preview Builds (Development Testing)
```bash
# iOS Preview Build
eas build --platform ios --profile preview

# Android Preview Build  
eas build --platform android --profile preview
```

### 2. Production Builds
```bash
# iOS Production Build
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production
```

## iOS Deployment

### Apple Developer Setup
1. Create App Store Connect app entry
2. Configure bundle identifier: `com.habitheroes.app`
3. Set up provisioning profiles
4. Configure app metadata, screenshots, and descriptions

### App Store Submission
```bash
# Submit to App Store
eas submit --platform ios --latest
```

### Required Assets for iOS
- App Icon (1024x1024px)
- Launch Screen images
- App Store screenshots (multiple device sizes)
- App description and keywords
- Privacy policy URL

## Android Deployment

### Google Play Console Setup
1. Create new app in Play Console
2. Configure app details and content rating
3. Set up release management
4. Upload production APK/AAB

### Play Store Submission
```bash
# Submit to Google Play
eas submit --platform android --latest
```

### Required Assets for Android
- App Icon (512x512px)
- Feature graphic (1024x500px)
- Screenshots for phones and tablets
- App description and short description
- Privacy policy URL

## Configuration Files

### EAS Build Configuration (`eas.json`)
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Environment Variables
Set up environment variables for different environments:
- `API_BASE_URL` - Your Replit backend URL
- `EXPO_PUBLIC_API_URL` - Public API endpoint

## Mobile-Specific Features

### Push Notifications Setup
1. Configure Firebase Cloud Messaging (Android)
2. Set up Apple Push Notification Service (iOS)
3. Implement notification handlers in the app

### Offline Functionality
- Use AsyncStorage for local data persistence
- Implement sync mechanism when device comes online
- Cache habit data and progress locally

### Performance Optimizations
- Optimize images and assets
- Implement lazy loading for screens
- Use React Native performance best practices
- Enable Hermes JavaScript engine

## Testing Strategy

### Device Testing
1. **Expo Go**: Quick testing during development
2. **Preview Builds**: Test on actual devices before production
3. **TestFlight (iOS)**: Beta testing with real users
4. **Google Play Internal Testing**: Android beta testing

### Testing Checklist
- [ ] Authentication flow works on mobile
- [ ] All API calls function properly
- [ ] Touch interactions and gestures work
- [ ] App works on different screen sizes
- [ ] Performance is acceptable on older devices
- [ ] Offline functionality works as expected
- [ ] Push notifications are received
- [ ] Camera/photo features work correctly

## Deployment Timeline

### Week 1: Development Setup
- Set up React Native/Expo project
- Implement core authentication and API integration
- Create basic UI components for mobile

### Week 2: Feature Implementation
- Port key features from web app
- Implement mobile-specific features (camera, notifications)
- Add offline functionality and data sync

### Week 3: Testing & Polish
- Extensive testing on multiple devices
- Performance optimization
- UI/UX refinements for mobile

### Week 4: Store Submission
- Create app store assets and metadata
- Submit to App Store and Google Play
- Set up beta testing groups

### Week 5-6: Review & Launch
- Address store review feedback
- Coordinate marketing launch
- Monitor app performance and user feedback

## Ongoing Maintenance

### Over-the-Air Updates
```bash
# Deploy updates without app store approval
eas update --branch production --message "Bug fixes and improvements"
```

### Analytics & Monitoring
- Set up crash reporting (Expo Application Services)
- Implement user analytics
- Monitor app performance metrics

### Version Management
- Follow semantic versioning
- Maintain release notes
- Plan feature rollout strategy

## Cost Breakdown

### One-time Costs
- Apple Developer Account: $99/year
- Google Play Console: $25 one-time
- App Store assets creation: $200-500 (designer)

### Ongoing Costs
- Expo EAS Build: $29-99/month (depending on usage)
- Push notification services: Free tier available
- Analytics services: Free tier available

### Total Estimated Cost
- **First Year**: $400-800
- **Annual Ongoing**: $200-400

## Support & Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

### Community
- Expo Discord Community
- React Native Discord
- Stack Overflow for technical questions

---

## Next Steps

1. **Set up Expo account and EAS CLI**
2. **Configure the mobile project with proper dependencies**
3. **Implement authentication and API integration**
4. **Create mobile-optimized UI components**
5. **Test thoroughly on multiple devices**
6. **Prepare app store assets and metadata**
7. **Submit to app stores for review**

This guide provides a complete roadmap for deploying Habit Heroes as native mobile apps. The process typically takes 4-6 weeks from start to app store approval.