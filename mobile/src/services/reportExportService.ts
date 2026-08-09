import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ReportData {
  elderName: string;
  guardianName?: string;
  dateRange?: string;
  elderAge?: number | null;
  bloodType?: string | null;
  reportPeriod?: string; // e.g. "July 2026"
  medicationAdherence?: number; // e.g. 85%
  totalMeds?: number;
  takenMeds?: number;
  missedMeds?: number;
  moodLogsCount?: number;
  sosAlertsCount?: number;
  notesText?: string;
  recentMoods?: { date: string; mood: string }[];
  emergencyLogs?: { date: string; phrase?: string; status: string }[];
}

export class ReportExportService {
  /**
   * Generates a Beautiful PDF Report and opens Native Share Sheet
   */
  public async generateAndSharePDF(data: ReportData): Promise<void> {
    const period = data.reportPeriod || data.dateRange || 'Current Period';
    const adherence = data.medicationAdherence ?? 0;
    const totalMeds = data.totalMeds ?? 0;
    const takenMeds = data.takenMeds ?? 0;
    const missedMeds = data.missedMeds ?? 0;
    const recentMoods = data.recentMoods || [];
    const emergencyLogs = data.emergencyLogs || [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #2C3E50; }
            .header { text-align: center; border-bottom: 3px solid #6C63FF; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 24px; font-weight: bold; color: #6C63FF; margin: 0; }
            .subtitle { font-size: 14px; color: #4A5568; margin-top: 4px; }
            .card { background: #F8F9FA; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #E2E8F0; }
            .card-title { font-size: 16px; font-weight: bold; color: #2C3E50; margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .stat-badge { background: #6C63FF; color: #FFFFFF; padding: 4px 12px; border-radius: 12px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #E2E8F0; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background-color: #F0EEFF; color: #6C63FF; }
            .footer { text-align: center; font-size: 11px; color: #BDC3C7; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">SithaMithuru Elder Care System</h1>
            <p class="subtitle">Monthly Health & Care Progress Report</p>
          </div>

          <div class="card">
            <div class="card-title">Elder Information</div>
            <div class="row"><span>Full Name:</span> <strong>${data.elderName}</strong></div>
            <div class="row"><span>Age / Blood Group:</span> <strong>${data.elderAge || 'N/A'} yrs | ${data.bloodType || 'N/A'}</strong></div>
            <div class="row"><span>Report Period:</span> <strong>${period}</strong></div>
          </div>

          <div class="card">
            <div class="card-title">Medication Adherence Summary</div>
            <div class="row"><span>Adherence Rate:</span> <span class="stat-badge">${adherence}%</span></div>
            <div class="row"><span>Total Medicines Scheduled:</span> <strong>${totalMeds}</strong></div>
            <div class="row"><span>Medicines Taken:</span> <strong>${takenMeds}</strong></div>
            <div class="row"><span>Medicines Missed:</span> <strong>${missedMeds}</strong></div>
          </div>

          <div class="card">
            <div class="card-title">Recent Mood Logs</div>
            <table>
              <thead>
                <tr><th>Date</th><th>Logged Mood</th></tr>
              </thead>
              <tbody>
                ${
                  recentMoods.length > 0
                    ? recentMoods.map((m) => `<tr><td>${m.date}</td><td>${m.mood}</td></tr>`).join('')
                    : `<tr><td colspan="2">No mood logs recorded (${data.moodLogsCount ?? 0} total logs)</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <div class="card">
            <div class="card-title">Emergency Log History</div>
            <table>
              <thead>
                <tr><th>Date</th><th>Trigger Phrase</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${
                  emergencyLogs.length > 0
                    ? emergencyLogs.map((e) => `<tr><td>${e.date}</td><td>${e.phrase || 'SOS Button'}</td><td>${e.status}</td></tr>`).join('')
                    : `<tr><td colspan="3">No emergency events triggered (${data.sosAlertsCount ?? 0} alerts)</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <div class="footer">
            Generated automatically by SithaMithuru System • Confidential Medical Document
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Failed to export PDF report:', error);
      throw error;
    }
  }
}

export const reportExporter = new ReportExportService();
