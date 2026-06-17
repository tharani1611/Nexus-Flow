const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExportService {
  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'uploads', 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generates a PDF Report containing project stats and task list.
   */
  async generatePDFReport(title, tasks, stats) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `report_${Date.now()}.pdf`;
        const filePath = path.join(this.reportsDir, fileName);
        const doc = new PDFDocument({ margin: 50 });

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Header
        doc.fillColor('#4b5563').fontSize(26).text('NexusFlow', { align: 'right' });
        doc.fillColor('#1e1b4b').fontSize(20).text(title, { underline: true });
        doc.moveDown(1);

        // Date and Stats Summary
        doc.fillColor('#374151').fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown(1);

        doc.fillColor('#1e293b').fontSize(14).text('Project Summary Statistics:', { stroke: true });
        doc.fontSize(11).fillColor('#4b5563');
        doc.text(`Total Tasks: ${stats.totalTasks || 0}`);
        doc.text(`Completed Tasks: ${stats.completedTasks || 0}`);
        doc.text(`Pending Tasks: ${stats.pendingTasks || 0}`);
        doc.text(`Total Sprints: ${stats.totalSprints || 0}`);
        doc.moveDown(1.5);

        // Task Table Header
        doc.fillColor('#1e1b4b').fontSize(14).text('Task Breakdown List:');
        doc.moveDown(0.5);

        // Draw horizontal line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cbd5e1');
        doc.moveDown(0.5);

        // Table Rows
        doc.fontSize(10).fillColor('#1e293b');
        tasks.forEach((task, idx) => {
          const statusVal = task.status || 'Todo';
          const priorityVal = task.priority || 'Medium';
          const assigneeName = task.assignee ? (task.assignee.name || task.assignee.email) : 'Unassigned';
          
          doc.text(
            `${idx + 1}. [${statusVal}] - ${task.title} (Priority: ${priorityVal}, Assignee: ${assigneeName})`,
            { width: 500, align: 'left' }
          );
          if (task.description) {
            doc.fontSize(8).fillColor('#64748b').text(`Description: ${task.description.substring(0, 80)}...`);
            doc.fontSize(10).fillColor('#1e293b');
          }
          doc.moveDown(0.5);
        });

        doc.end();

        writeStream.on('finish', () => {
          resolve(`/uploads/reports/${fileName}`);
        });

        writeStream.on('error', (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generates an Excel Report containing project stats and task list.
   */
  async generateExcelReport(title, tasks, stats) {
    const fileName = `report_${Date.now()}.xlsx`;
    const filePath = path.join(this.reportsDir, fileName);

    const workbook = new ExcelJS.Workbook();
    
    // Add Stats Sheet
    const statsSheet = workbook.addWorksheet('Summary');
    statsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 15 }
    ];
    statsSheet.addRows([
      { metric: 'Report Title', value: title },
      { metric: 'Generated Date', value: new Date().toLocaleDateString() },
      { metric: 'Total Tasks', value: stats.totalTasks || 0 },
      { metric: 'Completed Tasks', value: stats.completedTasks || 0 },
      { metric: 'Pending Tasks', value: stats.pendingTasks || 0 },
      { metric: 'Total Sprints', value: stats.totalSprints || 0 }
    ]);

    // Style the first row
    statsSheet.getRow(1).font = { bold: true };

    // Add Tasks Sheet
    const taskSheet = workbook.addWorksheet('Tasks');
    taskSheet.columns = [
      { header: '#', key: 'index', width: 5 },
      { header: 'Task Title', key: 'title', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Story Points', key: 'storyPoints', width: 12 },
      { header: 'Assignee', key: 'assignee', width: 20 },
      { header: 'Due Date', key: 'dueDate', width: 15 }
    ];

    tasks.forEach((task, idx) => {
      taskSheet.addRow({
        index: idx + 1,
        title: task.title,
        description: task.description || '',
        status: task.status || 'Todo',
        priority: task.priority || 'Medium',
        storyPoints: task.storyPoints || 0,
        assignee: task.assignee ? (task.assignee.name || task.assignee.email) : 'Unassigned',
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'
      });
    });

    taskSheet.getRow(1).font = { bold: true };

    await workbook.xlsx.writeFile(filePath);
    return `/uploads/reports/${fileName}`;
  }
}

module.exports = new ExportService();
