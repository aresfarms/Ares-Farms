import PDFDocument from "pdfkit";

export function generateReportPdf(report: any) {
  const doc = new PDFDocument();

  /**
   * HEADER
   */
  doc.fontSize(18).text(report.title, { underline: true });
  doc.moveDown();

  /**
   * SUMMARY SECTION
   */
  if (report.sections?.overview) {
    doc.fontSize(12).text("Overview");
    report.sections.overview.forEach((line: string) => {
      doc.text(`- ${line}`);
    });
    doc.moveDown();
  }

  /**
   * CROPS / RECOMMENDATIONS
   */
  if (report.sections?.basicRecommendations?.crops) {
    doc.fontSize(12).text("Crop Recommendations");
    report.sections.basicRecommendations.crops.forEach(
      (item: string) => doc.text(`- ${item}`)
    );
    doc.moveDown();
  }

  /**
   * LIVESTOCK
   */
  if (report.sections?.basicRecommendations?.livestock) {
    doc.fontSize(12).text("Livestock Recommendations");
    report.sections.basicRecommendations.livestock.forEach(
      (item: string) => doc.text(`- ${item}`)
    );
    doc.moveDown();
  }

  /**
   * FINANCIAL / PAID SECTION
   */
  if (report.sections?.financialHealth) {
    doc.fontSize(12).text("Financial Health");
    const f = report.sections.financialHealth;

    doc.text(`Credit: ${f.credit}`);
    doc.text(`Liquidity: ${f.liquidity}`);
    doc.text(`Collateral: ${f.collateral}`);
    doc.moveDown();
  }

  /**
   * DISCLAIMER (CRITICAL FOR YOUR SYSTEM)
   */
  doc.fontSize(10).text(
    "AI-GENERATED REPORT — NOT LEGAL, FINANCIAL, OR REGULATORY ADVICE"
  );

  doc.end();

  return doc;
}
