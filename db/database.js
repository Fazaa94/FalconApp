

import Realm from 'realm';

// class FalconRegistration extends Realm.Object {}
// FalconRegistration.schema = {
//   name: 'FalconRegistration',
//   primaryKey: 'id',
//   properties: {
//     id: 'string',
//     animalId: 'string',
//     falconName: 'string',
//     breed: 'string',
//     dateOfBirth: 'string',
//     weight: 'string',
//     distinguishingMarks: 'string',
//     // medicalNotes: 'string',
//     imagePath: 'string?',
//     sex: 'string',
//     spayedNeutered: 'bool',
//     trainingLevel: 'string', // beginner, intermediate, advanced
//     preferredDistance: 'string?', // favorite race distance
//     trainerNotes: 'string?', // general training observations
//     synced: { type: 'bool', default: false },
//     createdAt: 'date',
//   },
// };

// class RaceResults extends Realm.Object {}
// RaceResults.schema = {
//   name: 'RaceResults',
//   primaryKey: 'id',
//   properties: {
//     id: 'string',
//     animalId: 'string',
//     falconName: 'string',
//     breed: 'string',
//     weight: 'string',
//     raceDistance: 'string',
//     trackLength: 'int',
//     completionTime: 'double',
//     averageSpeed: 'double',
//     maxSpeed: 'double?',
//     raceDate: 'date',
//     checkpoints: 'Checkpoint[]',
//     weatherConditions: 'string?',
//     trackConditions: 'string?',
//     notes: 'string?',
//     synced: { type: 'bool', default: false },
//     syncError: 'string?',
//     createdAt: 'date',
//   },
// };

// class Checkpoint extends Realm.Object {}
// Checkpoint.schema = {
//   name: 'Checkpoint',
//   properties: {
//     id: 'string',
//     name: 'string',
//     distance: 'int',
//     splitTime: 'double',
//     speed: 'double?',
//     timestamp: 'date',
//   },
// };

// // NEW: Training Session Schema
// class TrainingSession extends Realm.Object {}
// TrainingSession.schema = {
//   name: 'TrainingSession',
//   primaryKey: 'id',
//   properties: {
//     id: 'string',
//     animalId: 'string',
//     falconName: 'string',
//     sessionType: 'string', // speed, endurance, technique, recovery
//     sessionDate: 'date',
//     duration: 'double', // in minutes
//     totalDistance: 'int', // in meters
//     focusArea: 'string', // starting, acceleration, maintaining_speed, finishing
//     trainingNotes: 'string?',
//     weatherConditions: 'string?',
//     trackConditions: 'string?',
//     trainerName: 'string?',
//     sessionRating: 'int?', // 1-5 scale
//     heartRateData: 'HeartRateData[]',
//     performanceMetrics: 'PerformanceMetrics',
//     drills: 'TrainingDrill[]',
//     synced: { type: 'bool', default: false },
//     createdAt: 'date',
//   },
// };

// // NEW: Performance Metrics for detailed analysis
// class PerformanceMetrics extends Realm.Object {}
// PerformanceMetrics.schema = {
//   name: 'PerformanceMetrics',
//   properties: {
//     id: 'string',
//     averageSpeed: 'double',
//     maxSpeed: 'double',
//     accelerationTime: 'double?', // time to reach max speed
//     decelerationPoints: 'string?', // where falcon slows down
//     consistencyScore: 'double?', // 0-100 scale
//     enduranceIndex: 'double?', // ability to maintain speed
//     recoveryTime: 'double?', // time to recover normal heart rate
//     efficiencyRating: 'double?', // energy efficiency score
//   },
// };

// // NEW: Heart Rate Monitoring
// class HeartRateData extends Realm.Object {}
// HeartRateData.schema = {
//   name: 'HeartRateData',
//   properties: {
//     id: 'string',
//     timestamp: 'date',
//     heartRate: 'int', // BPM
//     activityLevel: 'string', // resting, warmup, active, cooldown
//   },
// };

// // NEW: Training Drills and Exercises
// class TrainingDrill extends Realm.Object {}
// TrainingDrill.schema = {
//   name: 'TrainingDrill',
//   properties: {
//     id: 'string',
//     drillName: 'string',
//     drillType: 'string', // speed, agility, strength, endurance
//     duration: 'double',
//     repetitions: 'int?',
//     distance: 'int?',
//     successRate: 'double?', // 0-100%
//     notes: 'string?',
//     improvements: 'string?',
//   },
// };

// // NEW: Training Program Schema
// class TrainingProgram extends Realm.Object {}
// TrainingProgram.schema = {
//   name: 'TrainingProgram',
//   primaryKey: 'id',
//   properties: {
//     id: 'string',
//     programName: 'string',
//     animalId: 'string',
//     falconName: 'string',
//     programType: 'string', // pre_race, maintenance, recovery, skill_development
//     startDate: 'date',
//     endDate: 'date',
//     targetGoals: 'string[]',
//     currentPhase: 'string', // base_building, intensity, tapering, recovery
//     scheduledSessions: 'ScheduledSession[]',
//     progressNotes: 'string?',
//     isActive: 'bool',
//     synced: { type: 'bool', default: false },
//     createdAt: 'date',
//   },
// };

// // NEW: Scheduled Training Sessions
// class ScheduledSession extends Realm.Object {}
// ScheduledSession.schema = {
//   name: 'ScheduledSession',
//   properties: {
//     id: 'string',
//     sessionDate: 'date',
//     sessionType: 'string',
//     focusArea: 'string',
//     plannedDuration: 'double',
//     plannedDistance: 'int',
//     status: 'string', // scheduled, completed, cancelled, postponed
//     actualSessionId: 'string?', // link to completed TrainingSession
//     notes: 'string?',
//   },
// };

// // NEW: Health and Wellness Tracking
// class HealthRecord extends Realm.Object {}
// HealthRecord.schema = {
//   name: 'HealthRecord',
//   primaryKey: 'id',
//   properties: {
//     id: 'string',
//     animalId: 'string',
//     recordDate: 'date',
//     recordType: 'string', // vet_visit, injury, medication, general_checkup
//     title: 'string',
//     description: 'string?',
//     veterinarian: 'string?',
//     diagnosis: 'string?',
//     treatment: 'string?',
//     medication: 'string?',
//     nextAppointment: 'date?',
//     restrictions: 'string?', // training restrictions
//     recoveryTimeline: 'string?',
//     attachments: 'string[]', // image paths or documents
//     synced: { type: 'bool', default: false },
//     createdAt: 'date',
//   },
// };

// // NEW: Nutrition and Diet Tracking
// class NutritionRecord extends Realm.Object {}
// NutritionRecord.schema = {
//   name: 'NutritionRecord',
//   primaryKey: 'id',
//   properties: {
//     id: 'string',
//     animalId: 'string',
//     recordDate: 'date',
//     mealType: 'string', // breakfast, lunch, dinner, snack, pre_workout, post_workout
//     foodType: 'string',
//     quantity: 'string',
//     calories: 'int?',
//     supplements: 'string?',
//     waterIntake: 'string?',
//     notes: 'string?',
//     synced: { type: 'bool', default: false },
//     createdAt: 'date',
//   },
// };

// // NEW: Performance Trends and Analytics
// class PerformanceTrend extends Realm.Object {}
// PerformanceTrend.schema = {
//   name: 'PerformanceTrend',
//   primaryKey: 'id',
//   properties: {
//     id: 'string',
//     animalId: 'string',
//     trendDate: 'date',
//     metricType: 'string', // speed, endurance, acceleration, recovery
//     currentValue: 'double',
//     previousValue: 'double',
//     trendDirection: 'string', // improving, declining, stable
//     confidenceLevel: 'double?', // statistical confidence
//     recommendations: 'string?',
//     synced: { type: 'bool', default: false },
//     createdAt: 'date',
//   },
// };
// class UserSession extends Realm.Object {}
// UserSession.schema = {
//   name: 'UserSession',
//   properties: {
//     id: 'int',
//     email: 'string',
//     isLoggedIn: 'bool',
//   },
//   primaryKey: 'id',
// };

// Update Realm configuration with all schemas

// Node schema (master/slave nodes)
class Node extends Realm.Object {}
Node.schema = {
  name: 'Node',
  primaryKey: 'nodeId',
  properties: {
    nodeId: 'string',
    masterId: 'string?',
    lastSeen: 'date?',
    lastMsg: 'string?',   // JSON string of the last parsed message
    rssi: 'double?',
    battery: 'double?',
    saved: { type: 'bool', default: false },
  },
};

// RawMessage schema (recent raw payloads for debugging)
class RawMessage extends Realm.Object {}
RawMessage.schema = {
  name: 'RawMessage',
  primaryKey: 'id',
  properties: {
    id: 'string',
    ts: 'date',
    raw: 'string',
  },
};

class FalconRegistration extends Realm.Object {}
FalconRegistration.schema = {
  name: 'FalconRegistration',
  primaryKey: 'id',
  properties: {
    id: 'string',
    animalId: 'string',
    falconName: 'string',
    weight: 'string',
    imagePath: 'string?',
    synced: { type: 'bool', default: false },
    createdAt: 'date',
  },
};

class RaceResults extends Realm.Object {}
RaceResults.schema = {
  name: 'RaceResults',
  primaryKey: 'id',
  properties: {
    id: 'string',
    animalId: 'string',
    falconName: 'string',
    breed: 'string',
    weight: 'string',
    raceDistance: 'string',
    trackLength: 'int',
    completionTime: 'double',
    averageSpeed: 'double',
    maxSpeed: 'double?',
    raceDate: 'date',
    checkpoints: 'Checkpoint[]',
    weatherConditions: 'string?',
    trackConditions: 'string?',
    notes: 'string?',
    synced: { type: 'bool', default: false },
    syncError: 'string?',
    createdAt: 'date',
  },
};

class Checkpoint extends Realm.Object {}
Checkpoint.schema = {
  name: 'Checkpoint',
  properties: {
    id: 'string',
    name: 'string',
    distance: 'int',
    splitTime: 'double',
    speed: 'double?',
    timestamp: 'date',
  },
};

// Training Session Schema
class TrainingSession extends Realm.Object {}
TrainingSession.schema = {
  name: 'TrainingSession',
  primaryKey: 'id',
  properties: {
    id: 'string',
    falconId: 'string',
    animalId: 'string',
    falconName: 'string',
    sessionType: 'string', // speed, endurance, technique, recovery
    sessionDate: 'date',
    duration: 'double', // in minutes
    totalDistance: 'int', // in meters
    focusArea: 'string', // starting, acceleration, maintaining_speed, finishing
    trainingNotes: 'string?',
    weatherConditions: 'string?',
    trackConditions: 'string?',
    trainerName: 'string?',
    sessionRating: 'int?', // 1-5 scale
    heartRateData: 'HeartRateData[]',
    performanceMetrics: 'PerformanceMetrics',
    drills: 'TrainingDrill[]',
    synced: { type: 'bool', default: false },
    createdAt: 'date',
  },
};

// Performance Metrics for detailed analysis
class PerformanceMetrics extends Realm.Object {}
PerformanceMetrics.schema = {
  name: 'PerformanceMetrics',
  properties: {
    id: 'string',
    averageSpeed: 'double',
    maxSpeed: 'double',
    accelerationTime: 'double?', // time to reach max speed
    decelerationPoints: 'string?', // where falcon slows down
    consistencyScore: 'double?', // 0-100 scale
    enduranceIndex: 'double?', // ability to maintain speed
    recoveryTime: 'double?', // time to recover normal heart rate
    efficiencyRating: 'double?', // energy efficiency score
  },
};

// Heart Rate Monitoring
class HeartRateData extends Realm.Object {}
HeartRateData.schema = {
  name: 'HeartRateData',
  properties: {
    id: 'string',
    timestamp: 'date',
    heartRate: 'int', // BPM
    activityLevel: 'string', // resting, warmup, active, cooldown
  },
};

// Training Drills and Exercises
class TrainingDrill extends Realm.Object {}
TrainingDrill.schema = {
  name: 'TrainingDrill',
  properties: {
    id: 'string',
    drillName: 'string',
    drillType: 'string', // speed, agility, strength, endurance
    duration: 'double',
    repetitions: 'int?',
    distance: 'int?',
    successRate: 'double?', // 0-100%
    notes: 'string?',
    improvements: 'string?',
  },
};

// Training Program Schema
class TrainingProgram extends Realm.Object {}
TrainingProgram.schema = {
  name: 'TrainingProgram',
  primaryKey: 'id',
  properties: {
    id: 'string',
    programName: 'string',
    animalId: 'string',
    falconName: 'string',
    programType: 'string', // pre_race, maintenance, recovery, skill_development
    startDate: 'date',
    endDate: 'date',
    targetGoals: 'string[]',
    currentPhase: 'string', // base_building, intensity, tapering, recovery
    scheduledSessions: 'ScheduledSession[]',
    progressNotes: 'string?',
    isActive: 'bool',
    synced: { type: 'bool', default: false },
    createdAt: 'date',
  },
};

// Scheduled Training Sessions
class ScheduledSession extends Realm.Object {}
ScheduledSession.schema = {
  name: 'ScheduledSession',
  properties: {
    id: 'string',
    sessionDate: 'date',
    sessionType: 'string',
    focusArea: 'string',
    plannedDuration: 'double',
    plannedDistance: 'int',
    status: 'string', // scheduled, completed, cancelled, postponed
    actualSessionId: 'string?', // link to completed TrainingSession
    notes: 'string?',
  },
};

// Health and Wellness Tracking
class HealthRecord extends Realm.Object {}
HealthRecord.schema = {
  name: 'HealthRecord',
  primaryKey: 'id',
  properties: {
    id: 'string',
    animalId: 'string',
    recordDate: 'date',
    recordType: 'string', // vet_visit, injury, medication, general_checkup
    title: 'string',
    description: 'string?',
    veterinarian: 'string?',
    diagnosis: 'string?',
    treatment: 'string?',
    medication: 'string?',
    nextAppointment: 'date?',
    restrictions: 'string?', // training restrictions
    recoveryTimeline: 'string?',
    attachments: 'string[]', // image paths or documents
    synced: { type: 'bool', default: false },
    createdAt: 'date',
  },
};

// Nutrition and Diet Tracking
class NutritionRecord extends Realm.Object {}
NutritionRecord.schema = {
  name: 'NutritionRecord',
  primaryKey: 'id',
  properties: {
    id: 'string',
    animalId: 'string',
    recordDate: 'date',
    mealType: 'string', // breakfast, lunch, dinner, snack, pre_workout, post_workout
    foodType: 'string',
    quantity: 'string',
    calories: 'int?',
    supplements: 'string?',
    waterIntake: 'string?',
    notes: 'string?',
    synced: { type: 'bool', default: false },
    createdAt: 'date',
  },
};

// Performance Trends and Analytics
class PerformanceTrend extends Realm.Object {}
PerformanceTrend.schema = {
  name: 'PerformanceTrend',
  primaryKey: 'id',
  properties: {
    id: 'string',
    animalId: 'string',
    trendDate: 'date',
    metricType: 'string', // speed, endurance, acceleration, recovery
    currentValue: 'double',
    previousValue: 'double',
    trendDirection: 'string', // improving, declining, stable
    confidenceLevel: 'double?', // statistical confidence
    recommendations: 'string?',
    synced: { type: 'bool', default: false },
    createdAt: 'date',
  },
};

class UserSession extends Realm.Object {}
UserSession.schema = {
  name: 'UserSession',
  properties: {
    id: 'int',
    email: 'string',
    isLoggedIn: 'bool',
  },
  primaryKey: 'id',
};
const realm = new Realm({
  schema: [
    Node,
    RawMessage,
    FalconRegistration,
    RaceResults,
    Checkpoint,
    TrainingSession,
    PerformanceMetrics,
    HeartRateData,
    TrainingDrill,
    TrainingProgram,
    ScheduledSession,
    HealthRecord,
    NutritionRecord,
    PerformanceTrend,
    UserSession,
  ],
  schemaVersion: 8,
  migration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion < 8) {
      // Add falconId to TrainingSession objects if missing
      const oldObjects = oldRealm.objects('TrainingSession');
      const newObjects = newRealm.objects('TrainingSession');
      for (let i = 0; i < newObjects.length; i++) {
        if (typeof newObjects[i].falconId === 'undefined') {
          newObjects[i].falconId = '';
        }
      }
    }
  },
});

export default realm;

