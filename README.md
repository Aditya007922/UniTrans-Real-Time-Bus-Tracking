# Real-Time Transport Tracking System

A full-stack real-time bus tracking system similar to Swiggy/Zomato live delivery tracking, built with React, Node.js, Socket.IO, and Firebase.

## 🚀 Features

### Driver/Bus Panel
- **Login System**: Secure login with Bus ID and Driver Name
- **GPS Tracking**: Continuous GPS location fetching every 2 seconds
- **Real-time Updates**: Instant location broadcasting via Socket.IO
- **Live Map**: Interactive map showing current bus location
- **Status Control**: Start/Stop tracking with online/offline status
- **Speed Display**: Real-time speed monitoring

### User/Passenger Panel
- **Bus Search**: Search buses by unique Bus ID
- **Live Tracking**: Real-time bus location on map
- **Auto Updates**: No page refresh required - WebSocket powered
- **ETA Calculation**: Estimated arrival time based on speed
- **Status Monitoring**: Online/offline driver status
- **Notifications**: Alerts when bus is near

### Map Features
- **OpenStreetMap**: Free and open-source map tiles
- **Custom Markers**: Animated bus markers with pulse effect
- **Dark Mode**: Dark map tiles for night viewing
- **Smooth Animations**: Fluid marker movements
- **Responsive**: Works on mobile and desktop

## 🛠️ Tech Stack

### Frontend
- **React.js**: UI framework
- **Leaflet.js**: Interactive maps
- **React-Leaflet**: React wrapper for Leaflet
- **Tailwind CSS**: Styling
- **Socket.IO Client**: Real-time communication
- **Axios**: HTTP requests

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Socket.IO**: WebSocket server
- **Firebase Admin SDK**: Database integration
- **CORS**: Cross-origin resource sharing

### Database
- **Firebase Realtime Database**: NoSQL database for real-time sync

## 📁 Project Structure

```
Tracking system/
├── backend/
│   ├── routes/
│   │   └── busRoutes.js          # API endpoints
│   ├── server.js                 # Express server
│   ├── package.json
│   ├── .env
│   └── firebase-service-account.json
├── socket/
│   └── socketHandler.js          # Socket.IO event handlers
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── MapComponent.js   # Leaflet map component
│   │   ├── pages/
│   │   │   ├── DriverPanel.js    # Driver interface
│   │   │   └── PassengerPanel.js # Passenger interface
│   │   ├── hooks/
│   │   │   └── useSocket.js      # Socket.IO hook
│   │   ├── utils/
│   │   ├── App.js                # Main app component
│   │   ├── index.js              # Entry point
│   │   ├── index.css             # Global styles
│   │   └── App.css
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env
├── database/                     # Firebase config (optional)
├── .gitignore
└── README.md
```

## 🚀 Installation Guide

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account (for Realtime Database)

### Step 1: Clone the Repository
```bash
cd "c:/Users/vishw/OneDrive/Desktop/Tracking system"
```

### Step 2: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database
4. Set database rules to public for testing:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
5. Go to Project Settings → Service Accounts
6. Generate a new private key
7. Download the JSON file
8. Rename it to `firebase-service-account.json`
9. Place it in the `backend/` folder

### Step 3: Configure Backend

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

4. Update `firebase-service-account.json` with your Firebase credentials

### Step 4: Configure Frontend

1. Navigate to frontend folder:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎯 Running the Project

### Start Backend Server
```bash
cd backend
npm start
```
Backend will run on `http://localhost:5000`

### Start Frontend (New Terminal)
```bash
cd frontend
npm start
```
Frontend will run on `http://localhost:3000`

## 🧪 Testing Instructions

### Test 1: Driver Panel
1. Open browser to `http://localhost:3000`
2. Click "Go to Driver Panel"
3. Enter Bus ID (e.g., "BUS-001")
4. Enter Driver Name (e.g., "John Doe")
5. Click "Start Tracking"
6. Grant GPS permission when prompted
7. Observe location updates on map

### Test 2: Passenger Panel (Same Browser)
1. Open new tab to `http://localhost:3000`
2. Click "Go to Passenger Panel"
3. Enter the same Bus ID (e.g., "BUS-001")
4. Click "Track Bus"
5. Observe real-time location updates from driver

### Test 3: Two Device Simulation
**Device 1 (Driver):**
1. Open browser on Device 1
2. Go to Driver Panel
3. Login with Bus ID "BUS-001"
4. Start tracking

**Device 2 (Passenger):**
1. Open browser on Device 2
2. Go to Passenger Panel
3. Search for "BUS-001"
4. Watch live location updates

### Test 4: Real-Time Updates
1. Start tracking as driver
2. Move to a different location (or simulate movement)
3. Observe passenger panel updates instantly without refresh

## 🔌 API Endpoints

### POST /api/update-location
Update bus location
```json
{
  "busId": "BUS-001",
  "driverName": "John Doe",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "speed": 30.5,
  "status": "online"
}
```

### GET /api/bus/:id
Get specific bus information
```
GET /api/bus/BUS-001
```

### GET /api/active-buses
Get all active buses
```
GET /api/active-buses
```

### POST /api/bus-status
Update bus status
```json
{
  "busId": "BUS-001",
  "status": "offline"
}
```

## 🔌 Socket.IO Events

### Client → Server Events
- `driver-connect`: Driver connects with bus ID
- `passenger-connect`: Passenger connects to track a bus
- `location-update`: Driver sends new location
- `status-update`: Driver sends status change
- `request-location`: Passenger requests current location

### Server → Client Events
- `location-update`: Broadcast new location to passengers
- `status-update`: Broadcast status change
- `driver-online`: Notify passengers driver is online
- `driver-offline`: Notify passengers driver went offline
- `location-request`: Request driver to send location

## 📊 Database Structure

### Firebase Realtime Database
```
buses/
  ├── BUS-001/
  │   ├── busId: "BUS-001"
  │   ├── driverName: "John Doe"
  │   ├── latitude: 28.6139
  │   ├── longitude: 77.2090
  │   ├── speed: 30.5
  │   ├── status: "online"
  │   └── lastUpdated: "2024-01-01T12:00:00.000Z"
  ├── BUS-002/
  │   └── ...
  └── ...
```

## 🌐 Deployment

### Deploy Backend (Render/Railway)
1. Push code to GitHub
2. Create account on [Render](https://render.com) or [Railway](https://railway.app)
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Deploy Frontend (Firebase Hosting)
```bash
cd frontend
npm run build
firebase login
firebase init
firebase deploy
```

### Update Frontend Environment Variables
After deployment, update `.env`:
```env
REACT_APP_SOCKET_URL=https://your-backend-url.com
REACT_APP_API_URL=https://your-backend-url.com/api
```

## 🔐 Security Considerations

### For Production:
1. **Firebase Rules**: Implement proper authentication rules
2. **API Authentication**: Add JWT or API key authentication
3. **Rate Limiting**: Implement rate limiting on APIs
4. **HTTPS**: Use SSL certificates
5. **Input Validation**: Validate all user inputs
6. **CORS**: Restrict CORS to specific domains

### Firebase Security Rules Example:
```json
{
  "rules": {
    "buses": {
      "$busId": {
        ".read": "auth != null",
        ".write": "auth.uid == $busId || auth.token.admin === true"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Issue: GPS not working
- **Solution**: Enable GPS in browser settings
- **Solution**: Use HTTPS (GPS requires secure context)
- **Solution**: Check browser permissions

### Issue: Socket.IO connection failed
- **Solution**: Ensure backend is running on port 5000
- **Solution**: Check firewall settings
- **Solution**: Verify CORS configuration

### Issue: Map not loading
- **Solution**: Check internet connection
- **Solution**: Verify Leaflet CSS is loaded
- **Solution**: Check browser console for errors

### Issue: Firebase connection error
- **Solution**: Verify firebase-service-account.json
- **Solution**: Check Firebase project settings
- **Solution**: Ensure Realtime Database is enabled

## 📱 Mobile Support

The system is fully responsive and works on:
- iOS Safari
- Android Chrome
- Mobile browsers with GPS support

## 🎨 Customization

### Change Map Style
Edit `MapComponent.js` to use different tile providers:
- CartoDB Dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- CartoDB Light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- OpenStreetMap: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

### Change Bus Icon
Edit the `createBusIcon` function in `MapComponent.js` to customize the bus marker.

### Update GPS Interval
Change the GPS update interval in `DriverPanel.js` by modifying the geolocation options.

## 📄 License

This project is open source and available for educational purposes.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, Socket.IO, and Firebase**
