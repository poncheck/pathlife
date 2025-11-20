import { format } from 'date-fns';

export interface GpxPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  elevation?: number;
  speed?: number;
}

export class GpxGenerator {
  /**
   * Generate a GPX file from an array of GPS points
   */
  static generateFromPoints(points: GpxPoint[], name: string = 'Track'): string {
    if (points.length === 0) {
      throw new Error('Cannot generate GPX from empty points array');
    }

    const sortedPoints = [...points].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    const trackPoints = sortedPoints.map(point => {
      const elevation = point.elevation !== undefined
        ? `    <ele>${point.elevation.toFixed(2)}</ele>\n`
        : '';

      const time = `    <time>${point.timestamp.toISOString()}</time>\n`;

      const extensions = point.speed !== undefined
        ? `    <extensions>\n      <speed>${point.speed.toFixed(2)}</speed>\n    </extensions>\n`
        : '';

      return `  <trkpt lat="${point.latitude.toFixed(7)}" lon="${point.longitude.toFixed(7)}">\n${elevation}${time}${extensions}  </trkpt>`;
    }).join('\n');

    const startTime = sortedPoints[0].timestamp;
    const endTime = sortedPoints[sortedPoints.length - 1].timestamp;

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
  creator="PathLife"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${this.escapeXml(name)}</name>
    <time>${startTime.toISOString()}</time>
  </metadata>
  <trk>
    <name>${this.escapeXml(name)}</name>
    <type>Track</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
  }

  /**
   * Escape special XML characters
   */
  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get a safe filename for a GPX file
   */
  static getSafeFilename(date: Date, prefix: string = 'track'): string {
    return `${prefix}-${format(date, 'yyyy-MM-dd')}.gpx`;
  }
}
