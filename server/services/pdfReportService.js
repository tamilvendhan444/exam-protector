import PDFDocument from 'pdfkit';

export async function generateExamResultsPDF(exam, resultsData, stream) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('EduProctor AI Results Report', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(14).font('Helvetica').text(`Exam: ${exam.title}`, { align: 'center' });
      doc.fontSize(10).text(`Subject: ${exam.subject} | Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
      
      const deptStr = exam.department ? exam.department : 'All Departments';
      const secStr = exam.classSection ? exam.classSection : 'All Sections';
      doc.text(`Department: ${deptStr} | Class/Section: ${secStr}`, { align: 'center' });
      doc.moveDown(2);

      // Table Settings
      const tableTop = doc.y;
      const columnPositions = {
        rank: 30,
        rollNo: 70,
        name: 140,
        attempted: 290,
        marks: 360,
        penalty: 420,
        score: 480
      };

      // Table Header
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Rank', columnPositions.rank, tableTop);
      doc.text('Roll No', columnPositions.rollNo, tableTop);
      doc.text('Name', columnPositions.name, tableTop);
      doc.text('Attempted', columnPositions.attempted, tableTop);
      doc.text('Marks', columnPositions.marks, tableTop);
      doc.text('Penalty', columnPositions.penalty, tableTop);
      doc.text('Final', columnPositions.score, tableTop);

      doc.moveTo(30, tableTop + 15).lineTo(560, tableTop + 15).stroke();

      // Table Rows
      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);

      let totalScore = 0;
      let minScore = resultsData.length > 0 ? resultsData[0].finalScore : 0;
      let maxScore = resultsData.length > 0 ? resultsData[0].finalScore : 0;

      for (let i = 0; i < resultsData.length; i++) {
        const row = resultsData[i];
        
        // Add page if needed
        if (y > 750) {
          doc.addPage();
          y = 50;
        }

        doc.text(row.rank.toString(), columnPositions.rank, y);
        doc.text(row.rollNumber || 'N/A', columnPositions.rollNo, y);
        
        // Truncate name if too long
        let displayName = row.name || 'Unknown';
        if (displayName.length > 25) displayName = displayName.substring(0, 22) + '...';
        doc.text(displayName, columnPositions.name, y);
        
        doc.text(`${row.questionsAttempted}/${row.totalQuestions}`, columnPositions.attempted, y);
        doc.text(row.marksScored.toFixed(2), columnPositions.marks, y);
        doc.text(row.penalty.toFixed(2), columnPositions.penalty, y);
        doc.font('Helvetica-Bold').text(row.finalScore.toFixed(2), columnPositions.score, y).font('Helvetica');

        // Draw light gray line
        doc.strokeColor('#e2e8f0').moveTo(30, y + 12).lineTo(560, y + 12).stroke();
        doc.strokeColor('black'); // reset

        y += 20;

        totalScore += row.finalScore;
        if (row.finalScore < minScore) minScore = row.finalScore;
        if (row.finalScore > maxScore) maxScore = row.finalScore;
      }

      // Footer stats
      doc.moveDown(2);
      y = doc.y;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const avgScore = resultsData.length > 0 ? (totalScore / resultsData.length) : 0;

      doc.fontSize(12).font('Helvetica-Bold').text('Summary Statistics', 30, y);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Students: ${resultsData.length}`, 30, y + 20);
      doc.text(`Class Average: ${avgScore.toFixed(2)}`, 30, y + 35);
      doc.text(`Highest Score: ${maxScore.toFixed(2)}`, 30, y + 50);
      doc.text(`Lowest Score: ${minScore.toFixed(2)}`, 30, y + 65);

      doc.end();
      
      stream.on('finish', () => resolve(true));
      stream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}
