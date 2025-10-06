# Frontend Application

This module contains the React web application for LanguagePeer.

## Structure

- `components/` - Reusable UI components
- `pages/` - Application pages and routing
- `hooks/` - Custom React hooks for voice and API integration
- `services/` - API client services and WebSocket connections

## Key Features

### Voice Interface
- Browser-based audio recording and playback
- Real-time audio visualization
- WebRTC integration for low-latency voice streaming
- Cross-browser compatibility for voice features

### Conversation Interface
- Chat-like interface optimized for voice interactions
- Agent personality selection and switching
- Real-time feedback display
- Progress indicators and session management

### User Experience
- Responsive design for desktop and mobile
- Accessibility features for voice-first interactions
- Offline mode support where possible
- Progressive Web App (PWA) capabilities

## Technology Stack

- **React 18** with TypeScript
- **Material-UI** or **Tailwind CSS** for styling
- **React Query** for API state management
- **WebRTC** for real-time voice communication
- **Chart.js** for progress visualization

## Development

```bash
cd src/frontend
npm install
npm run dev
```

## Build and Deploy

```bash
npm run build
npm run deploy
```

The frontend is deployed to AWS S3 with CloudFront distribution for global CDN.