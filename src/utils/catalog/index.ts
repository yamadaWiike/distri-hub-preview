/**
 * Catalog PDF generation utilities.
 * 
 * This module provides a function to generate a product catalog PDF using jsPDF.
 * Each product is rendered as a card with image, details, and pricing.
 * 
 * - Uses A4 portrait layout, with configurable columns and card sizes.
 * - Renders a header with logo, area, and date.
 * - Each product card displays product image, name, brand, prices, and other details.
 * - Handles multi-page catalogs and page numbering.
 * - Outputs the PDF in a new browser window.
 * 
 * Dependencies:
 *   - jsPDF
 *   - date-fns (for date formatting)
 *   - Product type from @/data/products
 */

import { jsPDF } from "jspdf";
import { format } from 'date-fns';
import { Product } from "@/data/products";

/**
 * Format a number as Indonesian Rupiah currency.
 * @param n Number to format
 * @returns Formatted string (e.g., "Rp10.000")
 */
const formatRp = (n?: number) =>
  n === undefined ? "-" : `Rp${n.toLocaleString("id-ID")}`;

const today = format(new Date(), 'dd/MM/yy');

/**
 * Generate a product catalog PDF and open it in a new browser window.
 * 
 * @param products Array of Product objects to include in the catalog
 * @param fileName Optional file name for the PDF (default: "catalog.pdf")
 */
export async function generateCatalogPDF(products: Product[], fileName = "catalog.pdf") {
  // Create jsPDF instance (A4 portrait, units = mm)
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297

  // Layout configuration
  const margin = 12; // left & right margin
  const gap = 2; // space between cards
  const cols = 4;
  const headerHeight = 25;
  const footerBottom = 12;

  // compute card width and height
  const cardWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
  const cardHeight = 90; // mm (adjust if want taller/shorter)
  const availHeight = pageHeight - margin - headerHeight - footerBottom;
  const rowsPerPage = Math.floor((availHeight + gap) / (cardHeight + gap));
  const perPage = cols * rowsPerPage;

  // style defaults
  doc.setDrawColor(200);
  doc.setLineWidth(0.35);
  doc.setFont("helvetica");

  /**
   * Render the catalog header on each page.
   * @param pageNo Current page number (1-based)
   */
  function renderHeader() {
    // Logo + Title left
    const logoUrl = '/assets/logo-full.png';
    doc.addImage(logoUrl, 'PNG', margin, margin + 3, 28, 9);

    doc.setFontSize(16);
    doc.setTextColor(242, 101, 34);
    doc.text("Distributor Catalog", margin, margin + 18);

    // Right area texts
    doc.setFontSize(9);
    doc.setTextColor(33);
    doc.text("Area Distribusi", pageWidth - margin - 52, margin + 12);
    doc.setFontSize(16);
    doc.setTextColor(0, 104, 90);

    // Please adjust the distributor name here
    doc.text("Jawa Barat", pageWidth - margin - 60, margin + 18);

    doc.setFontSize(9);
    doc.setTextColor(33);
    doc.text("Tanggal Katalog", pageWidth - margin - 28, margin + 12);
    doc.setFontSize(16);
    doc.setTextColor(0, 104, 90);
    doc.text(today, pageWidth - margin - 27, margin + 18);

    // small line under header
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.line(margin, headerHeight + margin - 2, pageWidth - margin, headerHeight + margin - 2);
  }

  /**
   * Render a single product card at the specified (x, y) position.
   * 
   * @param p Product to render
   * @param x X coordinate (mm)
   * @param y Y coordinate (mm)
   */
  function renderCard(p: Product, x: number, y: number) {
    const cardW = cardWidth;     // card width (mm)
    const cardH = cardHeight;    // card height (mm)
    const pad = 2;               // inner padding

    // ── Card Container ──────────────────────────────────────────
    doc.setLineWidth(0.4);
    doc.setDrawColor(235, 235, 235);                      // border gray-300
    doc.setFillColor(255, 255, 255);            // background white
    doc.roundedRect(x, y, cardW, cardH, 3, 3, "DF");

    // ── Product Image ───────────────────────────────
    // Please adjust the card's image styles here
    const imageH = 28;                          // image area height
    const defaultImage = '/assets/baskit-product.jpg';
    doc.setDrawColor(200, 200, 200); // light gray border
    doc.setLineWidth(0.2);
    doc.roundedRect(x + pad, y + pad, cardW - pad * 2, imageH, 3, 3, "D");
    doc.addImage(defaultImage, "JPEG", x + pad + 1, y + pad + 1, cardW - pad * 2 - 2, imageH - 2);

    // Please adjust the card's image logic here
    // if (p.imageUrl) {
    //   // Draw rounded border first
    //   doc.setDrawColor(200, 200, 200); // light gray border
    //   doc.setLineWidth(0.5);
    //   doc.roundedRect(x + pad, y + pad, cardW - pad * 2, imageH, 3, 3, "D");
    //   // Draw image inside border (slightly inset)
    //   doc.addImage(p.imageUrl, "JPEG", x + pad + 1, y + pad + 1, cardW - pad * 2 - 2, imageH - 2);
    // } else {
    //   doc.setFillColor(255, 186, 122);            // bg-orange-200
    //   doc.roundedRect(x + pad, y + pad, cardW - pad * 2, imageH, 3, 3, "F");
    // }

    // Y position for text after image
    let textY = y + pad + imageH + 5;

    // ── Brand (text-gray-500 text-xs) ────────────────
    doc.setFontSize(8);
    doc.setTextColor(107);                      // gray-500
    doc.text(p?.brand ?? "-", x + pad, textY);

    // ── Product Name (font-semibold text-sm) ─────────
    textY += 4;
    doc.setFontSize(9);
    doc.setTextColor(33);                       // gray-800
    const productTitle = `${p?.name ?? "-"} ${p?.size ?? ""}`;
    const wrappedTitle = doc.splitTextToSize(productTitle, cardW - pad * 2);
    doc.text(wrappedTitle, x + pad, textY);
    textY += wrappedTitle.length * 5;

    // ── 2-Column Detail Grid ─────────────────────────
    const colGap = 5;
    const colW = (cardW - pad * 2 - colGap) / 2;
    const leftX = x + pad;
    const rightX = x + pad + colW + colGap;
    let leftY = textY;
    let rightY = textY;

    doc.setFontSize(7);
    doc.setTextColor(107); // gray-500

    /**
     * Helper to render a 3-line block (label, value, subtext)
     * @param startX X position
     * @param startY Y position
     * @param label Label text
     * @param value Value text
     * @param sub Optional subtext
     * @returns Next Y position after block
     */
    const renderBlock = (
      startX: number,
      startY: number,
      label: string,
      value: string,
      sub?: string
    ) => {
      doc.setTextColor(107);
      doc.text(label, startX, startY);
      doc.setTextColor(33);
      doc.setFontSize(9);
      doc.text(value, startX, startY + 4);
      if (sub) {
        doc.setFontSize(7);
        doc.setTextColor(107);
        doc.text(sub, startX, startY + 8);
      }
      return startY + 14; // next block Y
    };

    // Left column
    leftY = renderBlock(leftX, leftY, "Harga Distributor", formatRp(p?.distributorPrice), "per karton");
    leftY = renderBlock(leftX, leftY, "Margin Distributor", `${p?.margin ?? "-"}%`, "Rp24.000/karton");
    leftY = renderBlock(leftX, leftY, "MOQ", `${p?.moq ?? "-"}`, "karton");

    // Right column
    rightY = renderBlock(rightX, rightY, "Harga Konsumen", formatRp(p?.consumerPrice), "per karton");
    rightY = renderBlock(rightX, rightY, "Isi Per Karton", `${p?.units ?? "-"}`, "pieces");
    rightY = renderBlock(rightX, rightY, "Area Distribusi", p?.area ?? "-");
  }

  // Loop through products and render cards, paginating as needed
  for (let i = 0; i < products.length; i++) {
    const pageIndex = Math.floor(i / perPage);
    const indexInPage = i % perPage;
    const row = Math.floor(indexInPage / cols);
    const col = indexInPage % cols;

    if (indexInPage === 0) {
      if (pageIndex > 0) doc.addPage();
      renderHeader();
    }

    // compute top-left coordinates for this card
    const startX = margin + col * (cardWidth + gap);
    const startY = margin + headerHeight + row * (cardHeight + gap);
    renderCard(products[i], startX, startY);
  }

  // If no products, still render header and an empty page
  if (products.length === 0) {
    renderHeader();
  }

  // Footer: page numbers
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Page ${p} / ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  // Save file (triggers download in browser)
  doc.save(fileName);
  //doc.output('dataurlnewwindow');
}
