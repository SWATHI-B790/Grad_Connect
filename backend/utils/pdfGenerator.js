const PDFDocument = require("pdfkit");

/**
 * Formats a Date object into human-readable format e.g. "22 September 2026, 11:05 AM"
 */
const formatReportDateTime = (date = new Date()) => {
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return new Date().toISOString();
  }
};

/**
 * Formats a date into "DD MMM YYYY"
 */
const formatShortDate = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

/**
 * Initializes a PDFKit document configured for streaming to Express response
 */
const createReportDocument = (res, filename) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
    autoFirstPage: true,
  });

  doc.pipe(res);
  return doc;
};

/**
 * Renders the top brand header, report title, and timestamp
 */
const renderReportHeader = (doc, { title, subtitle, generatedAt = new Date() }) => {
  const startX = 40;
  const contentWidth = doc.page.width - 80;

  // Accent top colored stripe
  doc.rect(startX, 30, contentWidth, 3).fill("#2563eb");

  // Brand Name & Subtitle
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#0f172a").text("GRADCONNECT", startX, 42);
  doc
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .fillColor("#2563eb")
    .text("ADMINISTRATIVE REPORT", startX, 62, { characterSpacing: 1.2 });

  // Right-aligned generation timestamp
  const dateStr = `Generated: ${formatReportDateTime(generatedAt)}`;
  doc
    .fontSize(8.5)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(dateStr, startX, 48, { align: "right", width: contentWidth });

  // Report Main Title
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#0f172a").text(title, startX, 82);

  if (subtitle) {
    doc.fontSize(8.5).font("Helvetica").fillColor("#64748b").text(subtitle, startX, 100);
    doc.y = 116;
  } else {
    doc.y = 104;
  }

  // Divider Line
  doc
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .moveTo(startX, doc.y)
    .lineTo(startX + contentWidth, doc.y)
    .stroke();

  doc.y += 12;
};

/**
 * Renders an executive summary card row (up to 4 metric boxes)
 */
const renderSummaryCards = (doc, cards = []) => {
  if (!cards || cards.length === 0) return;

  const startX = 40;
  const totalWidth = doc.page.width - 80;
  const gap = 10;
  const cardWidth = (totalWidth - (cards.length - 1) * gap) / cards.length;
  const cardHeight = 52;
  const startY = doc.y;

  cards.forEach((card, index) => {
    const cardX = startX + index * (cardWidth + gap);

    // Box Background
    doc
      .roundedRect(cardX, startY, cardWidth, cardHeight, 6)
      .fillAndStroke("#f8fafc", "#e2e8f0");

    // Value
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(String(card.value), cardX + 10, startY + 8, { width: cardWidth - 20, align: "left" });

    // Label
    doc
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor("#64748b")
      .text(card.label.toUpperCase(), cardX + 10, startY + 28, {
        width: cardWidth - 20,
        characterSpacing: 0.5,
      });

    // Subtext (optional)
    if (card.subtext) {
      doc
        .fontSize(6.5)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text(card.subtext, cardX + 10, startY + 39, { width: cardWidth - 20 });
    }
  });

  doc.y = startY + cardHeight + 14;
};

/**
 * Renders a section heading
 */
const renderSectionTitle = (doc, title, count = null) => {
  const startX = 40;
  const contentWidth = doc.page.width - 80;

  // Check if we are near the bottom of page
  if (doc.y > doc.page.height - 90) {
    doc.addPage();
  }

  const titleText = count !== null ? `${title} (${count})` : title;

  // Small vertical accent bar
  doc.rect(startX, doc.y + 1, 3, 11).fill("#2563eb");

  doc
    .fontSize(10.5)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text(titleText, startX + 8, doc.y, { width: contentWidth - 8 });

  doc.y += 8;
};

/**
 * Renders a structured data table with automatic pagination and wrapping
 */
const renderTable = (
  doc,
  {
    headers = [],
    columnWidths = [],
    rows = [],
    emptyMessage = "No records available for this report.",
  }
) => {
  const startX = 40;
  const contentWidth = doc.page.width - 80;
  const bottomThreshold = doc.page.height - 55;

  if (rows.length === 0) {
    // Render Styled Empty State Box
    doc
      .roundedRect(startX, doc.y, contentWidth, 38, 6)
      .fillAndStroke("#f8fafc", "#e2e8f0");

    doc
      .fontSize(8.5)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(emptyMessage, startX + 12, doc.y + 13, { align: "center", width: contentWidth - 24 });

    doc.y += 48;
    return;
  }

  // Draw Table Header Function
  const drawTableHeader = () => {
    const headerHeight = 22;
    const y = doc.y;

    doc.rect(startX, y, contentWidth, headerHeight).fill("#1e293b");

    let currentX = startX;
    headers.forEach((h, idx) => {
      const w = columnWidths[idx] || 100;
      doc
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text(h.toUpperCase(), currentX + 6, y + 6, {
          width: w - 12,
          align: "left",
          characterSpacing: 0.5,
        });
      currentX += w;
    });

    doc.y = y + headerHeight;
  };

  // Initial table header
  if (doc.y > bottomThreshold - 40) {
    doc.addPage();
  }
  drawTableHeader();

  // Draw Rows
  rows.forEach((row, rowIdx) => {
    // Estimate row height based on text content
    let maxHeight = 18;
    row.forEach((cell, idx) => {
      const w = (columnWidths[idx] || 100) - 12;
      const text = cell !== null && cell !== undefined ? String(cell) : "";
      const textHeight = doc.heightOfString(text, { width: w, fontSize: 7.5 }) + 8;
      if (textHeight > maxHeight) maxHeight = textHeight;
    });

    // Check for page break
    if (doc.y + maxHeight > bottomThreshold) {
      doc.addPage();
      drawTableHeader();
    }

    const currentY = doc.y;
    const isEven = rowIdx % 2 === 0;

    // Row Background
    doc.rect(startX, currentY, contentWidth, maxHeight).fill(isEven ? "#ffffff" : "#f8fafc");

    // Row bottom separator line
    doc
      .strokeColor("#eef0f3")
      .lineWidth(0.5)
      .moveTo(startX, currentY + maxHeight)
      .lineTo(startX + contentWidth, currentY + maxHeight)
      .stroke();

    // Render cell text
    let cellX = startX;
    row.forEach((cell, idx) => {
      const w = columnWidths[idx] || 100;
      const text = cell !== null && cell !== undefined ? String(cell) : "";

      // Special rendering for Status badge in last column if matching standard status
      const isStatusCol = headers[idx]?.toLowerCase() === "status";
      if (isStatusCol) {
        const statusUpper = text.toUpperCase();
        let badgeBg = "#f1f5f9";
        let badgeColor = "#475569";

        if (statusUpper.includes("APPROV") || statusUpper === "REGISTERED" || statusUpper === "PUBLISHED") {
          badgeBg = "#ecfdf5";
          badgeColor = "#047857";
        } else if (statusUpper.includes("PENDING")) {
          badgeBg = "#fffbeb";
          badgeColor = "#b45309";
        } else if (
          statusUpper.includes("REJECT") ||
          statusUpper.includes("CANCEL") ||
          statusUpper.includes("SUSPEND")
        ) {
          badgeBg = "#fef2f2";
          badgeColor = "#b91c1c";
        }

        const badgeWidth = Math.min(w - 10, 68);
        const badgeHeight = 12;
        doc
          .roundedRect(cellX + 4, currentY + 3, badgeWidth, badgeHeight, 3)
          .fill(badgeBg);

        doc
          .fontSize(6.5)
          .font("Helvetica-Bold")
          .fillColor(badgeColor)
          .text(text, cellX + 4, currentY + 5.5, { width: badgeWidth, align: "center" });
      } else {
        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor("#334155")
          .text(text, cellX + 6, currentY + 4, {
            width: w - 12,
            align: "left",
          });
      }

      cellX += w;
    });

    doc.y = currentY + maxHeight;
  });

  doc.y += 14;
};

/**
 * Finalizes document with page numbers and bottom footer
 */
const finalizeReport = (doc) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const bottomY = doc.page.height - 30;
    const contentWidth = doc.page.width - 80;

    // Footer divider line
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(0.5)
      .moveTo(40, bottomY - 6)
      .lineTo(doc.page.width - 40, bottomY - 6)
      .stroke();

    // Footer text with page numbers
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(
        `Generated by GradConnect Admin Center   •   Page ${i + 1} of ${range.count}`,
        40,
        bottomY,
        {
          align: "center",
          width: contentWidth,
        }
      );
  }

  doc.end();
};

module.exports = {
  createReportDocument,
  renderReportHeader,
  renderSummaryCards,
  renderSectionTitle,
  renderTable,
  finalizeReport,
  formatReportDateTime,
  formatShortDate,
};
