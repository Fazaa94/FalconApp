import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RaceContext = createContext(null);

const initialState = {
  status: {
    connected: false,
    race_active: false,
    battery: 0,
    progress_percent: 0,
    ts_received: null,
    track_length_m: 800,
    detection_count: 0,
    total_sensors: 5,
    falcon_detected: false,
  },
  nodes: {}, // id -> { id, lastSeen, battery, rssi, lat, lng, cameraPresent }
  messages: [], // All incoming messages with timestamps
  detections: [], // Falcon/motion detections
  selectedFalcon: null,
  races: [], // Historical race results
  currentRace: null, // Current race in progress
  analytics: null, // Falcon analytics from device
  gps: null, // GPS data from master
};

const raceReducer = (state, action) => {
  switch (action.type) {
    case 'PROCESS_NODE_MSG': {
      // Handles node_msg with nested camera_msg payload
      const { src, payload, ts_iso } = action.payload;
      let inner = null;
      try {
        inner = typeof payload === 'string' ? JSON.parse(payload) : payload;
      } catch {
        inner = payload;
      }
      if (inner && inner.type === 'camera_msg' && inner.payload === '101') {
        // Falcon detected by camera
        const splitTime = state.currentRace && state.currentRace.startTimeMs
          ? (ts_iso ? Date.parse(ts_iso) : Date.now()) - state.currentRace.startTimeMs
          : null;
        const checkpoint = {
          nodeId: src,
          ts_iso: ts_iso || new Date().toISOString(),
          splitTime,
          type: 'camera',
          payload: '101',
        };
        return {
          ...state,
          detections: [checkpoint, ...state.detections],
          currentRace: state.currentRace
            ? {
                ...state.currentRace,
                detections: [checkpoint, ...(state.currentRace.detections || [])],
                checkpoints: [checkpoint, ...(state.currentRace.checkpoints || [])],
              }
            : null,
        };
      }
      return state;
    }
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [action.payload, ...state.messages].slice(0, 200), // Keep last 200
      };

    case 'SET_STATUS':
      return {
        ...state,
        status: {
          ...state.status,
          ...action.payload,
          ts_received: action.payload.ts_received || Date.now(),
        },
      };

    case 'UPDATE_NODE':
      const existingNode = state.nodes[action.payload.id] || {};
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.payload.id]: {
            ...existingNode,
            ...action.payload,
            lastSeen: action.payload.lastSeen || Date.now(),
            // Keep history of last few updates
            updates: [
              ...(existingNode.updates || []).slice(0, 4),
              { timestamp: action.payload.lastSeen, battery: action.payload.battery, rssi: action.payload.rssi }
            ],
          },
        },
      };

    case 'ADD_DETECTION':
      return {
        ...state,
        detections: [action.payload, ...state.detections],
        currentRace: state.currentRace
          ? {
              ...state.currentRace,
              detections: [action.payload, ...state.currentRace.detections],
            }
          : null,
      };

    case 'SELECT_FALCON':
      return {
        ...state,
        selectedFalcon: action.payload,
      };

    case 'START_RACE':
      return {
        ...state,
        currentRace: {
          id: action.payload.id,
          falcon: action.payload.falcon,
          startTime: Date.now(),
          startTimeMs: action.payload.startTimeMs,
          detections: [],
          status: 'running',
          masterConnected: state.status.connected,
        },
        status: {
          ...state.status,
          race_active: true,
        },
      };

    case 'STOP_RACE':
      return {
        ...state,
        currentRace: state.currentRace
          ? {
              ...state.currentRace,
              endTime: Date.now(),
              status: 'stopped',
            }
          : null,
        status: {
          ...state.status,
          race_active: false,
        },
      };

    case 'SAVE_RACE':
      return {
        ...state,
        races: [action.payload, ...state.races],
        currentRace: null,
      };

    case 'CLEAR_DETECTIONS':
      return {
        ...state,
        detections: [],
      };

    case 'RESET_RACE':
      return {
        ...state,
        currentRace: null,
        detections: [],
        messages: [],
        status: {
          ...state.status,
          race_active: false,
        },
      };

    case 'UPDATE_ANALYTICS':
      return {
        ...state,
        analytics: action.payload,
        status: {
          ...state.status,
          progress_percent: action.payload.progress_percent || 0,
          detection_count: action.payload.detection_count || 0,
        },
      };

    case 'UPDATE_GPS':
      return {
        ...state,
        gps: action.payload,
      };

    case 'LOAD_PERSISTED_STATE':
      return action.payload;

    default:
      return state;
  }
};

export const RaceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(raceReducer, initialState);

  // Persist important state to AsyncStorage
  useEffect(() => {
    const persistState = async () => {
      try {
        const persistedData = {
          selectedFalcon: state.selectedFalcon,
          races: state.races,
        };
        await AsyncStorage.setItem('raceState', JSON.stringify(persistedData));
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    };

    persistState();
  }, [state.selectedFalcon, state.races]);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persisted = await AsyncStorage.getItem('raceState');
        if (persisted) {
          const parsed = JSON.parse(persisted);
          dispatch({
            type: 'LOAD_PERSISTED_STATE',
            payload: {
              ...initialState,
              selectedFalcon: parsed.selectedFalcon,
              races: parsed.races,
            },
          });
        }
      } catch (error) {
        console.error('Error loading persisted state:', error);
      }
    };

    loadPersistedState();
  }, []);

  const value = { state, dispatch };

  return <RaceContext.Provider value={value}>{children}</RaceContext.Provider>;
};

export const useRace = () => {
  const context = useContext(RaceContext);
  if (!context) {
    console.error('useRace must be used within a RaceProvider');
    return { state: {}, dispatch: () => {} };
  }
  return context;
};
