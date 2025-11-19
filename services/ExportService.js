import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';

class ExportService {
  // Generate comprehensive race report
  generateRaceReport(raceResults, format = 'json') {
    const reportData = {
      reportTitle: 'Canine Racing Performance Report',
      generatedAt: new Date().toISOString(),
      totalRaces: raceResults.length,
      reportPeriod: {
        start: raceResults.length > 0 ? 
          new Date(Math.min(...raceResults.map(r => r.raceDate))).toISOString() : 'N/A',
        end: raceResults.length > 0 ? 
          new Date(Math.max(...raceResults.map(r => r.raceDate))).toISOString() : 'N/A'
      },
      races: raceResults.map(result => ({
        raceId: result.id,
        animalId: result.animalId,
        falconName: result.falconName,
        breed: result.breed,
        weight: result.weight,
        raceDistance: result.raceDistance,
        completionTime: result.completionTime,
        averageSpeed: result.averageSpeed,
        maxSpeed: result.maxSpeed,
        raceDate: result.raceDate,
        trackConditions: result.trackConditions,
        weatherConditions: result.weatherConditions,
        notes: result.notes,
        checkpoints: result.checkpoints.map(cp => ({
          checkpoint: cp.name,
          distance: `${cp.distance}m`,
          splitTime: `${cp.splitTime.toFixed(2)}s`,
          speed: cp.speed ? `${cp.speed.toFixed(2)} m/s` : 'N/A',
        })),
        performanceMetrics: {
          efficiency: (result.averageSpeed / result.completionTime * 1000).toFixed(2),
          consistency: this.calculateConsistency(result.checkpoints)
        }
      })),
      statistics: {
        fastestTime: raceResults.length > 0 ? Math.min(...raceResults.map(r => r.completionTime)) : 0,
        slowestTime: raceResults.length > 0 ? Math.max(...raceResults.map(r => r.completionTime)) : 0,
        averageTime: raceResults.length > 0 ? 
          raceResults.reduce((sum, r) => sum + r.completionTime, 0) / raceResults.length : 0,
        totalDistance: raceResults.reduce((sum, r) => sum + r.trackLength, 0),
        bestPerformingfalcon: this.getBestPerformingfalcon(raceResults),
        mostConsistentfalcon: this.getMostConsistentfalcon(raceResults)
      }
    };

    if (format === 'csv') {
      return this.convertToCSV(reportData);
    } else if (format === 'txt') {
      return this.convertToTXT(reportData);
    }

    return reportData;
  }

  calculateConsistency(checkpoints) {
    if (checkpoints.length < 2) return 'N/A';
    const speeds = checkpoints.map(cp => cp.speed).filter(s => s);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((a, b) => a + Math.pow(b - avgSpeed, 2), 0) / speeds.length;
    return (Math.sqrt(variance) / avgSpeed * 100).toFixed(1) + '%';
  }

  getBestPerformingfalcon(raceResults) {
    if (raceResults.length === 0) return 'N/A';
    const bestRace = raceResults.reduce((best, current) => 
      current.completionTime < best.completionTime ? current : best
    );
    return `${bestRace.falconName} (${bestRace.completionTime.toFixed(2)}s)`;
  }

  getMostConsistentfalcon(raceResults) {
    if (raceResults.length === 0) return 'N/A';
    const falconRaces = {};
    raceResults.forEach(race => {
      if (!falconRaces[race.falconName]) falconRaces[race.falconName] = [];
      falconRaces[race.falconName].push(race);
    });
    
    let mostConsistent = { name: '', consistency: Infinity };
    Object.entries(falconRaces).forEach(([name, races]) => {
      if (races.length > 1) {
        const times = races.map(r => r.completionTime);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
        const consistency = Math.sqrt(variance) / avg;
        if (consistency < mostConsistent.consistency) {
          mostConsistent = { name, consistency };
        }
      }
    });
    
    return mostConsistent.name || 'N/A';
  }

  convertToCSV(reportData) {
    let csv = 'Race Report - Generated on ' + new Date().toLocaleDateString() + '\n\n';
    
    // Summary Section
    csv += 'SUMMARY\n';
    csv += `Total Races,${reportData.totalRaces}\n`;
    csv += `Report Period,${reportData.reportPeriod.start} to ${reportData.reportPeriod.end}\n`;
    csv += `Fastest Time,${reportData.statistics.fastestTime.toFixed(2)}s\n`;
    csv += `Slowest Time,${reportData.statistics.slowestTime.toFixed(2)}s\n`;
    csv += `Average Time,${reportData.statistics.averageTime.toFixed(2)}s\n`;
    csv += `Best Performing falcon,${reportData.statistics.bestPerformingfalcon}\n`;
    csv += `Most Consistent falcon,${reportData.statistics.mostConsistentfalcon}\n\n`;
    
    // Detailed Races Section
    csv += 'DETAILED RACE RESULTS\n';
    csv += 'Animal ID,falcon Name,Breed,Weight,Race Distance,Completion Time (s),Average Speed (m/s),Max Speed (m/s),Race Date,Track Conditions,Weather Conditions\n';
    
    reportData.races.forEach(race => {
      csv += `"${race.animalId}","${race.falconName}","${race.breed}","${race.weight}","${race.raceDistance}",${race.completionTime.toFixed(2)},${race.averageSpeed.toFixed(2)},${race.maxSpeed?.toFixed(2) || 'N/A'},"${race.raceDate}","${race.trackConditions}","${race.weatherConditions}"\n`;
    });
    
    // Checkpoints Section
    csv += '\nCHECKPOINT DATA\n';
    csv += 'falcon Name,Checkpoint,Distance (m),Split Time (s),Speed (m/s)\n';
    
    reportData.races.forEach(race => {
      race.checkpoints.forEach(cp => {
        csv += `"${race.falconName}","${cp.checkpoint}",${cp.distance.replace('m', '')},${cp.splitTime.replace('s', '')},${cp.speed.replace(' m/s', '') || 'N/A'}\n`;
      });
    });
    
    return csv;
  }

  convertToTXT(reportData) {
    let txt = 'CANINE RACING PERFORMANCE REPORT\n';
    txt += '='.repeat(50) + '\n\n';
    
    txt += `Generated: ${new Date().toLocaleString()}\n`;
    txt += `Total Races: ${reportData.totalRaces}\n`;
    txt += `Report Period: ${new Date(reportData.reportPeriod.start).toLocaleDateString()} - ${new Date(reportData.reportPeriod.end).toLocaleDateString()}\n\n`;
    
    txt += 'PERFORMANCE STATISTICS:\n';
    txt += '-'.repeat(30) + '\n';
    txt += `Fastest Time: ${reportData.statistics.fastestTime.toFixed(2)} seconds\n`;
    txt += `Slowest Time: ${reportData.statistics.slowestTime.toFixed(2)} seconds\n`;
    txt += `Average Time: ${reportData.statistics.averageTime.toFixed(2)} seconds\n`;
    txt += `Best Performing falcon: ${reportData.statistics.bestPerformingfalcon}\n`;
    txt += `Most Consistent falcon: ${reportData.statistics.mostConsistentfalcon}\n\n`;
    
    txt += 'DETAILED RACE RESULTS:\n';
    txt += '-'.repeat(30) + '\n';
    
    reportData.races.forEach((race, index) => {
      txt += `\nRace ${index + 1}:\n`;
      txt += `  falcon: ${race.falconName} (${race.animalId})\n`;
      txt += `  Breed: ${race.breed}\n`;
      txt += `  Weight: ${race.weight}\n`;
      txt += `  Distance: ${race.raceDistance}\n`;
      txt += `  Time: ${race.completionTime.toFixed(2)} seconds\n`;
      txt += `  Avg Speed: ${race.averageSpeed.toFixed(2)} m/s\n`;
      txt += `  Max Speed: ${race.maxSpeed?.toFixed(2) || 'N/A'} m/s\n`;
      txt += `  Date: ${new Date(race.raceDate).toLocaleString()}\n`;
      txt += `  Conditions: ${race.trackConditions}, ${race.weatherConditions}\n`;
      
      if (race.checkpoints.length > 0) {
        txt += `  Checkpoints:\n`;
        race.checkpoints.forEach(cp => {
          txt += `    - ${cp.checkpoint}: ${cp.distance} in ${cp.splitTime} (${cp.speed})\n`;
        });
      }
      
      if (race.notes) {
        txt += `  Notes: ${race.notes}\n`;
      }
    });
    
    return txt;
  }

  // Export to file and share
  async exportRaceData(raceResults, format = 'json') {
    try {
      const reportData = this.generateRaceReport(raceResults, format);
      const fileExt = format === 'csv' ? 'csv' : format === 'txt' ? 'txt' : 'json';
      const fileName = `race_report_${new Date().getTime()}.${fileExt}`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      let fileContent;
      if (format === 'csv' || format === 'txt') {
        fileContent = reportData;
      } else {
        fileContent = JSON.stringify(reportData, null, 2);
      }
      
      await RNFS.writeFile(filePath, fileContent, 'utf8');
      
      // Mark races as exported
      // This would require Realm instance - you can handle this in the component
      
      return { success: true, filePath, fileName };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ExportService();