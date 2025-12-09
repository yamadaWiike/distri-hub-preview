import { jsPDF } from "jspdf";
import { format } from 'date-fns';
import { formatRp, pxToMm, pxToPt, safeNumber, safeString } from "./Funtions";
import { ProductWithVariant } from "@/services/product-service";

/**
 * Today's date formatted as dd/MM/yy.
 */
const today = format(new Date(), 'dd/MM/yy');

// Colors
/**
 * Color palette used for PDF styling.
 */
const lightGray = '#D1D5DC';
const softGray = '#F9FAFB'
const baseDarker = '#383B46'
const baseLight = '#9B9CA1';
const primary = '#FF8B00';
const lightPrimary = '#FFC580';
const lightPeach = '#FFF4E6';
const white = '#FFFFFF';

/**
 * Path to the Baskit logo image.
 */
const logoUrl = '/assets/logo-full.png';

/**
 * Represents a price range with minimum and maximum values.
 */
type PriceRange = {
  min: number;
  max: number;
};

/**
 * Parameters required to generate the catalog PDF.
 */
type GenerateCatalogPDF = {
  products: ProductWithVariant[];
  distributionArea?: string;
  brand?: string;
  priceRange?: PriceRange;
  fileName?: string;
}

/**
 * Generates a catalog PDF from a list of products.
 * @param props - The parameters required to generate the catalog PDF.
 * @returns A Promise that resolves when the PDF generation is complete.
 */
export async function generateCatalogPDF(props: GenerateCatalogPDF) {
  const products = props.products || [];
  const distributionArea = safeString(props.distributionArea, '-');
  const brand = safeString(props.brand, '-');
  const priceRange = props.priceRange || { min: 0, max: 0 };
  const fileName = safeString(props.fileName, 'catalog.pdf');

  // Create jsPDF instance (A4 portrait, units = mm)
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297

  // Layout configuration
  const margin = pxToMm(40);
  const gap = pxToMm(20);
  const cols = 1;
  const headerHeight = pxToMm(82);
  const footerBottom = pxToMm(20);

  // compute card width and height
  const cardWidth = (pageWidth - (margin * 2));
  const cardHeight = pxToMm(360);
  const availHeight = pageHeight - margin - headerHeight - footerBottom;
  const rowsPerPage = Math.floor((availHeight + gap) / (cardHeight + gap));
  const perPage = cols * rowsPerPage;

  // style defaults
  doc.setDrawColor(200);
  doc.setLineWidth(0.35);
  doc.setFont("helvetica");

  /**
   * Renders the cover page of the catalog PDF.
   */
  function renderCoverPage() {
    let coverY = (pageHeight * 1 / 4);
    const coverX = margin;
    const coverW = pageWidth - (margin * 2);
    coverY += pxToMm(8);

    // Secret
    const secretW = pxToMm(70);
    const secretX = margin + coverW - secretW;
    doc.setDrawColor(primary);
    doc.setLineWidth(pxToMm(1));
    doc.setFillColor(white);
    doc.roundedRect(secretX, margin, secretW, pxToMm(25), pxToMm(4), pxToMm(4), "DF");
    const secretPad = pxToMm(8)
    const secretContentY = margin + (secretPad * 2);
    const secretContentX = secretX + secretPad;
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(primary);
    doc.text('RAHASIA', secretContentX, secretContentY);

    // Baskit Logo
    const logoH = pxToMm(60);
    doc.addImage(logoUrl, 'PNG', coverX, coverY, pxToMm(180), logoH);

    // Catalog
    coverY += logoH + pxToMm(60);
    doc.setFontSize(pxToPt(34));
    doc.setTextColor(primary);
    doc.text("Katalog Distributor", coverX, coverY);

    // Catalog description
    coverY += pxToMm(30);
    doc.setFontSize(pxToPt(14));
    doc.setTextColor(baseLight);
    doc.text('Katalog Resmi: Harga & Stok Terkini', coverX, coverY);

    // Divider
    coverY += pxToMm(50);
    doc.setFillColor(primary);
    doc.roundedRect(coverX, coverY, pxToMm(128), pxToMm(5), pxToMm(3), pxToMm(3), "F");

    // Distributor Area Label
    coverY += pxToMm(50);
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(baseLight);
    doc.text('Area Distribusi', coverX, coverY);

    // Brand Label
    const brandX = coverX + pxToMm(160);
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(baseLight);
    doc.text('Brand', brandX, coverY);

    // Distributor Area Value
    coverY += pxToMm(30);
    doc.setFontSize(pxToPt(18));
    doc.setTextColor(baseDarker);
    doc.text(distributionArea, coverX, coverY);

    // Distributor Brand Value
    doc.text(brand, brandX, coverY);

    // Distributor Area Label
    coverY += pxToMm(50);
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(baseLight);
    doc.text('Rentang Harga per Karton', coverX, coverY)

    coverY += pxToMm(30);
    doc.setFontSize(pxToPt(18));
    doc.setTextColor(baseDarker);
    doc.text(`${formatRp(priceRange.min)} - ${formatRp(priceRange.max)}`, coverX, coverY)
  }

  /**
   * Renders the header section on each catalog page.
   */
  function renderHeader() {
    let headerY = margin;
    const headerX = headerY;
    const headerW = pageWidth - (margin * 2);

    // Baskit Logo
    const logoH = pxToMm(40);
    doc.addImage(logoUrl, 'PNG', headerX, headerY, pxToMm(110), logoH);

    // Catalog
    headerY += logoH + pxToMm(16);
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(primary);
    doc.text("Distributor Catalog", headerX, headerY);

    // Distributor Area
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(baseDarker);
    doc.text(`Area Distribusi: ${distributionArea}`, headerX + headerW, margin, { align: "right" });
    doc.text(`Tanggal: ${today}`, headerX + headerW, margin + pxToMm(16), { align: "right" });

    // Divider
    headerY += pxToMm(8);
    doc.setFillColor(primary);
    doc.rect(headerX, headerY, headerW, pxToMm(2), "F");
  }

  /**
   * Render a single product card at the specified (x, y) position.
   * 
   * @param p Product to render
   * @param x X coordinate (mm)
   * @param y Y coordinate (mm)
   */
  function renderCard(p: ProductWithVariant, x: number, y: number) {
    const cardW = cardWidth;
    const cardH = cardHeight;
    const cardPad = pxToMm(15);
    const cardContentW = cardW - (cardPad * 2);

    const leftX = x + cardPad;
    let leftY = y + cardPad;
    const leftW = cardContentW / 2 - cardPad;

    const rightX = leftX + (cardContentW / 2);
    let rightY = leftY;
    const rightW = cardContentW / 2;

    // Divider
    doc.setDrawColor(lightGray);
    doc.setLineWidth(pxToMm(1));
    doc.setFillColor(white);
    doc.roundedRect(x, y, cardW, cardH, pxToMm(10), pxToMm(10), "DF");

    // === TOP SECTION ===
    // Product Image
    const imgH = pxToMm(72);
    const imgW = pxToMm(72);

    try {
      doc.setDrawColor(lightGray);
      doc.setLineWidth(pxToMm(0.5));
      doc.setFillColor(softGray);
      doc.roundedRect(leftX, leftY, imgW, imgH, pxToMm(10), pxToMm(10), "DF");

      if (p?.image) {
        doc.addImage(
          safeString(p.image, '/placeholder.svg'),
          "JPEG",
          leftX + 1,
          leftY + 1,
          imgW - 2,
          imgH - 2
        );
      }
    } catch {
      doc.setDrawColor(lightGray);
      doc.setLineWidth(pxToMm(0.5));
      doc.setFillColor(softGray);
      doc.roundedRect(leftX, leftY, imgW, imgH, pxToMm(10), pxToMm(10), "DF");
    }

    // Product Info
    const productInfoW = leftX + imgW + pxToMm(16);
    let productInfoY = leftY + cardPad;

    doc.setFontSize(pxToPt(14));
    doc.setTextColor(baseDarker);
    doc.text(safeString(p?.displayName, '-'), productInfoW, productInfoY);

    productInfoY += pxToMm(18);
    doc.setFontSize(pxToPt(10));
    doc.setTextColor(baseLight);
    const category = safeString(p?.category, '-');
    const categoryWidth = doc.getTextWidth(category);

    doc.text(category, productInfoW, productInfoY);
    doc.setTextColor(baseDarker);
    doc.text(`• ${safeString(p?.brand, '-')}`, productInfoW + categoryWidth + 2, productInfoY);

    productInfoY += pxToMm(18);
    doc.text(`Varian: ${safeString(p?.variantInfo?.variantName, '-')}`, productInfoW, productInfoY);

    // Divider
    leftY += imgH;
    rightY += imgH;
    leftY += pxToMm(10);
    rightY += pxToMm(10);
    doc.setFillColor(lightGray);
    doc.rect(leftX, leftY, cardContentW, pxToMm(0.5), "F");

    //=== LEFT SECTION ===
    // Packaging & Distribution
    leftY += pxToMm(20);
    doc.setTextColor(baseLight);
    doc.text('KEMASAN & DISTRIBUSI', leftX, leftY);

    leftY += pxToMm(16);
    doc.setTextColor(baseDarker);
    doc.text(`Kemasan: -`, leftX, leftY);

    leftY += pxToMm(16);
    doc.text(`SLA: -`, leftX, leftY);

    // Divider
    leftY += pxToMm(8);
    doc.setFillColor(lightGray);
    doc.rect(leftX, leftY, leftW, pxToMm(0.5), "F");

    // Area, Distributor Price & MOQ
    // Label for Area, Distributor & MOQ
    // Area
    leftY += pxToMm(18);
    doc.setTextColor(baseLight);
    doc.text('AREA', leftX, leftY);
    // Distributor Price
    const leftWOneThird = leftW / 3;
    doc.text('HARGA DISTRIBUTOR', leftX + leftWOneThird, leftY);
    // MOQ
    const moqX = leftX + leftW
    doc.text('MOQ', moqX, leftY, { align: 'right' });

    // List for Area, Distributor & MOQ
    // Area
    if (p?.regions && p.regions.length) {
      p.regions.map((region) => {
        leftY += pxToMm(16);
        doc.setTextColor(baseDarker);
        doc.text(region.area, leftX, leftY);
        // Distributor Price
        doc.text(`${safeString(safeString(region?.distributorPrice, '-'))} / ${safeString(region?.moq_uom, '-')}`, leftX + leftWOneThird, leftY);
        // MOQ
        doc.text(`${safeString(region?.moq, '-')} ${safeString(region?.price_uom, '-')}`, moqX, leftY, { align: 'right' });
      })
    }

    // Divider
    leftY += pxToMm(8);
    doc.setFillColor(lightGray);
    doc.rect(leftX, leftY, leftW, pxToMm(0.5), "F");

    // Promo
    leftY += pxToMm(14);
    doc.setDrawColor(lightPrimary);
    doc.setLineWidth(pxToMm(1));
    doc.setFillColor(lightPeach);
    doc.roundedRect(leftX, leftY, leftW, pxToMm(44), pxToMm(4), pxToMm(4), "DF");
    const promoPad = pxToMm(8)
    let promoContentY = leftY + (promoPad * 2);
    const promoContentX = leftX + promoPad;
    doc.setTextColor(primary);
    doc.text('PROGRAM PROMO', promoContentX, promoContentY);
    promoContentY += pxToMm(16);
    doc.text('-', promoContentX, promoContentY);

    //=== RIGHT SECTION ===
    // Price
    rightY += pxToMm(20);
    doc.setTextColor(baseLight);
    doc.text('HARGA', rightX, rightY);

    // Distributor
    rightY += pxToMm(16);
    doc.setTextColor(baseDarker);
    doc.setFontSize(pxToPt(12));
    doc.text('Distributor', rightX, rightY);

    rightY += pxToMm(16);
    doc.setFontSize(pxToPt(10));
    doc.text('Karton:', rightX, rightY);
    const maxRightX = rightX + rightW;
    doc.setTextColor(primary);
    doc.text(formatRp(safeNumber(p?.distributorPrice)), maxRightX, rightY, { align: "right" });

    rightY += pxToMm(16);
    doc.setTextColor(baseDarker);
    doc.text('Per Pcs:', rightX, rightY);
    doc.setTextColor(primary);
    doc.text("-", maxRightX, rightY, { align: "right" });

    // Divider
    rightY += pxToMm(8);
    doc.setFillColor(lightGray);
    doc.rect(rightX, rightY, rightW, pxToMm(0.5), "F");

    // Retail
    rightY += pxToMm(18);
    doc.setTextColor(baseDarker);
    doc.setFontSize(pxToPt(12));
    doc.text('Retail', rightX, rightY);

    rightY += pxToMm(16);
    doc.setFontSize(pxToPt(10));
    doc.text('Karton:', rightX, rightY);
    doc.text(formatRp(safeNumber(p?.retailPrice)), maxRightX, rightY, { align: "right" });

    rightY += pxToMm(16);
    doc.text('Per Pcs:', rightX, rightY);
    doc.text("-", maxRightX, rightY, { align: "right" });

    // Potential Margin
    rightY += pxToMm(10);
    doc.setDrawColor(lightGray);
    doc.setLineWidth(pxToMm(1));
    doc.setFillColor(softGray);
    const potentialMarginH = pxToMm(28)
    doc.roundedRect(rightX, rightY, rightW, potentialMarginH, pxToMm(4), pxToMm(4), "DF");
    const potentialMarginPad = pxToMm(8)
    const potentialMarginContentY = rightY + (potentialMarginPad * 2);
    const potentialMarginContentX = rightX + potentialMarginPad;
    doc.text('Potensi Margin:', potentialMarginContentX, potentialMarginContentY);
    promoContentY += pxToMm(16);
    doc.text('-', maxRightX - potentialMarginPad, potentialMarginContentY, { align: 'right' });

    // Divider
    rightY += potentialMarginH + pxToMm(8);
    doc.setFillColor(lightGray);
    doc.rect(rightX, rightY, rightW, pxToMm(0.5), "F");

    // Costomer
    rightY += pxToMm(18);
    doc.setTextColor(baseDarker);
    doc.setFontSize(pxToPt(12));
    doc.text('Konsumen', rightX, rightY);

    rightY += pxToMm(16);
    doc.setFontSize(pxToPt(10));
    doc.text('Karton:', rightX, rightY);
    doc.text(formatRp(safeNumber(p?.consumerPrice)), maxRightX, rightY, { align: "right" });

    rightY += pxToMm(16);
    doc.text('Per Pcs:', rightX, rightY);
    doc.text("-", maxRightX, rightY, { align: "right" });

    // Divider
    rightY += pxToMm(8);
    doc.setFillColor(lightGray);
    doc.rect(rightX, rightY, rightW, pxToMm(0.5), "F");

  }

  // Add Cover Page
  renderCoverPage()
  doc.addPage();

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
  for (let p = 2; p <= pageCount; p++) {

    doc.setPage(p);
    const footerY = pageHeight - (footerBottom + pxToMm(20));
    const footerX = margin;
    const footerW = pageWidth - margin;

    doc.setFontSize(pxToPt(12));
    // Secret
    doc.setDrawColor(primary);
    doc.setLineWidth(pxToMm(1));
    doc.setFillColor(white);
    doc.roundedRect(footerX, footerY - pxToMm(20), pxToMm(70), pxToMm(25), pxToMm(4), pxToMm(4), "DF");
    const secretPad = pxToMm(8)
    const secretContentY = footerY + (secretPad * 2) - pxToMm(20);
    const secretContentX = footerX + secretPad;
    doc.setTextColor(primary);
    doc.text('RAHASIA', secretContentX, secretContentY);

    // Page Number
    doc.setTextColor(baseDarker);
    doc.text(`Halaman ke ${p - 1} dari ${pageCount - 1}`, footerW, footerY, { align: "right" });

  }

  // Save file (triggers download in browser)
  doc.save(fileName);
  // doc.output('dataurlnewwindow');
  //window.open(doc.output('bloburl'), '_blank');
}
