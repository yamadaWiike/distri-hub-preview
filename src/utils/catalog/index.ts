import { jsPDF } from "jspdf";
import { format } from 'date-fns';
import { formatRp, pxToMm, pxToPt, safeNumber, safeString } from "./Funtions";
import { ProductWithVariant } from "@/services/product-service";
import { getImageUrl, getImageUrlAsync } from "@/lib/s3-upload";

/**
 * Convert image URL to base64 data URL for PDF compatibility
 */
async function imageToBase64(url: string): Promise<string | null> {
  try {
    // Skip if already a data URL
    if (url.startsWith('data:')) {
      return url;
    }
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      mode: 'cors', // Try CORS first
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`❌ Failed to fetch image: ${url} - ${response.status} ${response.statusText}`);
      // Try to provide more specific error info
      if (response.status === 403) {
        console.warn('  → Access forbidden - possible CORS or permissions issue');
      } else if (response.status === 404) {
        console.warn('  → Image not found - URL may be incorrect');
      }
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      console.warn(`❌ Response is not an image: ${url} - content-type: ${contentType}`);
      return null;
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;

        resolve(result);
      };
      reader.onerror = () => {
        console.warn('Failed to convert image to base64:', url);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Image fetch timeout:', url);
    } else {
      console.warn('Error converting image to base64:', url, error);
    }
    return null;
  }
}

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
  lang?: 'id' | 'en';
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
  const lang: 'id' | 'en' = (props.lang === 'en' || props.lang === 'id') ? props.lang : 'id';
  const TT = {
    secret: lang === 'id' ? 'RAHASIA' : 'CONFIDENTIAL',
    coverTitle: lang === 'id' ? 'Katalog Distributor' : 'Distributor Catalog',
    coverSubtitle: lang === 'id' ? 'Katalog Resmi: Harga & Stok Terkini' : 'Official Catalog: Latest Prices & Stock',
    areaLabel: lang === 'id' ? 'Area Distribusi' : 'Distribution Area',
    brandLabel: lang === 'id' ? 'Brand' : 'Brand',
    priceRangeLabel: lang === 'id' ? 'Rentang Harga per Karton' : 'Price Range per Carton',
    headerTitle: lang === 'id' ? 'Katalog Distributor' : 'Distributor Catalog',
    headerArea: lang === 'id' ? 'Area Distribusi' : 'Distribution Area',
    headerDate: lang === 'id' ? 'Tanggal' : 'Date',
    packagingSection: lang === 'id' ? 'KEMASAN & DISTRIBUSI' : 'PACKAGING & DISTRIBUTION',
    packagingUnknown: lang === 'id' ? 'Kemasan: -' : 'Packaging: -',
    sla: lang === 'id' ? 'SLA: 7-14 hari' : 'SLA: 7-14 days',
    area: lang === 'id' ? 'AREA' : 'AREA',
    distributorPriceLabel: lang === 'id' ? 'HARGA DISTRIBUTOR' : 'DISTRIBUTOR PRICE',
    moqLabel: lang === 'id' ? 'MOQ' : 'MOQ',
    variant: lang === 'id' ? 'Varian' : 'Variant',
    priceSection: lang === 'id' ? 'HARGA' : 'PRICE',
    distributor: lang === 'id' ? 'Distributor' : 'Distributor',
    cartonLabel: lang === 'id' ? 'Karton:' : 'Carton:',
    perPiece: lang === 'id' ? 'Per Pcs:' : 'Per Piece:',
    retail: lang === 'id' ? 'Retail' : 'Retail',
    potentialMargin: lang === 'id' ? 'Potensi Margin:' : 'Potential Margin:',
    consumer: lang === 'id' ? 'Konsumen' : 'Consumer',
    footerPageLabel: lang === 'id' ? 'Halaman ke' : 'Page',
    footerOfLabel: lang === 'id' ? 'dari' : 'of'
  } as const;

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
  doc.text(TT.secret, secretContentX, secretContentY);

    // Baskit Logo
    const logoH = pxToMm(60);
    doc.addImage(logoUrl, 'PNG', coverX, coverY, pxToMm(180), logoH);

    // Catalog
    coverY += logoH + pxToMm(60);
    doc.setFontSize(pxToPt(34));
    doc.setTextColor(primary);
    doc.text("Katalog Distributor", coverX, coverY);
  doc.text(TT.coverTitle, coverX, coverY);

    // Catalog description
    coverY += pxToMm(30);
    doc.setFontSize(pxToPt(14));
    doc.setTextColor(baseLight);
    doc.text('Katalog Resmi: Harga & Stok Terkini', coverX, coverY);
  doc.text(TT.coverSubtitle, coverX, coverY);

    // Divider
    coverY += pxToMm(50);
    doc.setFillColor(primary);
    doc.roundedRect(coverX, coverY, pxToMm(128), pxToMm(5), pxToMm(3), pxToMm(3), "F");

    // Distributor Area Label
    coverY += pxToMm(50);
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(baseLight);
    doc.text('Area Distribusi', coverX, coverY);
  doc.text(TT.areaLabel, coverX, coverY);

    // Brand Label
    const brandX = coverX + pxToMm(160);
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(baseLight);
    doc.text('Brand', brandX, coverY);
  doc.text(TT.brandLabel, brandX, coverY);

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
  doc.text(TT.priceRangeLabel, coverX, coverY)

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
  doc.text(TT.headerTitle, headerX, headerY);

    // Distributor Area
    doc.setFontSize(pxToPt(12));
    doc.setTextColor(baseDarker);
    doc.text(`Area Distribusi: ${distributionArea}`, headerX + headerW, margin, { align: "right" });
      doc.text(`${TT.headerArea}: ${distributionArea}`, headerX + headerW, margin, { align: "right" });
    doc.text(`Tanggal: ${today}`, headerX + headerW, margin + pxToMm(16), { align: "right" });
  doc.text(`${TT.headerDate}: ${today}`, headerX + headerW, margin + pxToMm(16), { align: "right" });

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
  async function renderCard(p: ProductWithVariant, x: number, y: number) {
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

      if (p?.image_url || p?.image) {
        // Prefer explicit image_url; fallback to image field
        let imageUrl = p.image_url || p.image;

        // If the source looks like an S3 key or S3 URL, resolve a presigned URL for reliable access
        const looksLikeS3 = !!imageUrl && (
          !imageUrl.startsWith('http') ||
          imageUrl.includes('amazonaws.com')
        );
        if (looksLikeS3 && imageUrl) {
          try {
            const presigned = await getImageUrlAsync(imageUrl);
            if (presigned) {
              imageUrl = presigned;
            }
          } catch (_) {
            // Fall back to original imageUrl on failure
          }
        } else if (!p.image_url && p.image && !p.image.startsWith('http')) {
          // Non-http keys in non-S3 scenario (dev local keys)
          const s3Url = getImageUrl(p.image);
          if (s3Url) imageUrl = s3Url;
        }

        // Skip invalid URLs
        if (!imageUrl || imageUrl === '/placeholder.svg' || imageUrl === 'null' || imageUrl.trim() === '') {
          console.warn('Skipping invalid image URL for product:', p.name, imageUrl);
        } else {
          // Convert image to base64 for PDF compatibility
          const base64Image = await imageToBase64(imageUrl);
          
          if (base64Image) {
            // Determine image format from URL or data URL
            const imageFormat = imageUrl.toLowerCase().includes('.png') || base64Image.includes('data:image/png') ? 'PNG' : 
                               imageUrl.toLowerCase().includes('.gif') || base64Image.includes('data:image/gif') ? 'GIF' : 'JPEG';
            

            
            doc.addImage(
              base64Image,
              imageFormat,
              leftX + 1,
              leftY + 1,
              imgW - 2,
              imgH - 2
            );
          } else {
            console.warn('❌ Failed to convert image to base64 for product:', p.name, imageUrl);
          }
        }
      } else {
        console.warn('No image found for product:', p.name);
      }
    } catch (error) {
      console.error('Failed to add product image to PDF for:', p?.name || 'unknown product', {
        imageUrl: p?.image_url || p?.image,
        error: error
      });
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
  doc.text(TT.packagingSection, leftX, leftY);

    leftY += pxToMm(16);
    doc.setTextColor(baseDarker);
    doc.text(`Kemasan: -`, leftX, leftY);
  doc.text(TT.packagingUnknown, leftX, leftY);

    leftY += pxToMm(16);
    doc.text(`SLA: 7-14 hari`, leftX, leftY);
  doc.text(TT.sla, leftX, leftY);

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
      doc.text(TT.area, leftX, leftY);
    // Distributor Price
    const leftWOneThird = leftW / 3;
    doc.text('HARGA DISTRIBUTOR', leftX + leftWOneThird, leftY);
      doc.text(TT.distributorPriceLabel, leftX + leftWOneThird, leftY);
    // MOQ
    const moqX = leftX + leftW
    doc.text('MOQ', moqX, leftY, { align: 'right' });
  doc.text(TT.moqLabel, moqX, leftY, { align: 'right' });
  doc.text(`${TT.variant}: ${safeString(p?.variantInfo?.variantName, '-')}`, productInfoW, productInfoY);

    // List for Area, Distributor & MOQ
    // Area
    if (p?.regions && p.regions.length) {
      p.regions.map((region) => {
        leftY += pxToMm(16);
        doc.setTextColor(baseDarker);
        doc.text(region.area, leftX, leftY);
        // Distributor Price (paired with MOQ UOM for clarity)
        doc.text(`${safeString(safeString(region?.distributorPrice, '-'))} / ${safeString(region?.moq_uom, '-')}`, leftX + leftWOneThird, leftY);
        // MOQ should display value with its own UOM, not price UOM
        doc.text(`${safeString(region?.moq, '-')} ${safeString(region?.moq_uom, '-')}`, moqX, leftY, { align: 'right' });
      })
    }

    // Divider
    leftY += pxToMm(8);
    doc.setFillColor(lightGray);
    doc.rect(leftX, leftY, leftW, pxToMm(0.5), "F");

    // Promo (hidden)
    // leftY += pxToMm(14);
    // doc.setDrawColor(lightPrimary);
    // doc.setLineWidth(pxToMm(1));
    // doc.setFillColor(lightPeach);
    // doc.roundedRect(leftX, leftY, leftW, pxToMm(44), pxToMm(4), pxToMm(4), "DF");
    // const promoPad = pxToMm(8)
    // let promoContentY = leftY + (promoPad * 2);
    // const promoContentX = leftX + promoPad;
    // doc.setTextColor(primary);
    // doc.text('PROGRAM PROMO', promoContentX, promoContentY);
    // promoContentY += pxToMm(16);
    // doc.text('-', promoContentX, promoContentY);

    //=== RIGHT SECTION ===
    // Price
    rightY += pxToMm(20);
    doc.setTextColor(baseLight);
    doc.text('HARGA', rightX, rightY);
  doc.text(TT.priceSection, rightX, rightY);

    // Distributor (use selected area price for consistency)
    const selectedRegion = Array.isArray(p?.regions)
      ? (p.regions.find(r => safeString(r.area, '-') === distributionArea) || p.regions[0])
      : undefined;
    const distributorPricePerCarton = safeNumber(selectedRegion?.distributorPrice ?? p?.distributorPrice);
    // Distributor
    rightY += pxToMm(16);
    doc.setTextColor(baseDarker);
    doc.setFontSize(pxToPt(12));
    // Single localized label
    doc.text(TT.distributor, rightX, rightY);
  //doc.text(TT.cartonLabel, rightX, rightY);

    rightY += pxToMm(16);
    doc.setFontSize(pxToPt(10));
    doc.text(TT.cartonLabel, rightX, rightY);
    const maxRightX = rightX + rightW;
    doc.setTextColor(primary);
    doc.text(formatRp(distributorPricePerCarton), maxRightX, rightY, { align: "right" });

    rightY += pxToMm(16);
    doc.setTextColor(baseDarker);
    // Single localized label
    doc.text(TT.perPiece, rightX, rightY);
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
    // Single localized label
    doc.text(TT.retail, rightX, rightY);
  //doc.text(TT.perPiece, rightX, rightY);

    rightY += pxToMm(16);
    doc.setFontSize(pxToPt(10));
    doc.text(TT.cartonLabel, rightX, rightY);
    doc.text(formatRp(safeNumber(p?.retailPrice)), maxRightX, rightY, { align: "right" });

    rightY += pxToMm(16);
    doc.text(TT.perPiece, rightX, rightY);
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
    // Single localized label to avoid duplicate rendering
    doc.text(TT.potentialMargin, potentialMarginContentX, potentialMarginContentY);
      doc.text(`${margin.toFixed(1)}%`, maxRightX - potentialMarginPad, potentialMarginContentY, { align: 'right' });

    // Divider
    rightY += potentialMarginH + pxToMm(8);
    doc.setFillColor(lightGray);
    doc.rect(rightX, rightY, rightW, pxToMm(0.5), "F");

    // Costomer
    rightY += pxToMm(18);
    doc.setTextColor(baseDarker);
    doc.setFontSize(pxToPt(12));
    doc.text('Konsumen', rightX, rightY);
  doc.text(TT.consumer, rightX, rightY);

    rightY += pxToMm(16);
    doc.setFontSize(pxToPt(10));
    doc.text(TT.cartonLabel, rightX, rightY);
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
  console.log(`Starting to render ${products.length} products to PDF...`);
  
  for (let i = 0; i < products.length; i++) {
    const pageIndex = Math.floor(i / perPage);
    const indexInPage = i % perPage;
    const row = Math.floor(indexInPage / cols);
    const col = indexInPage % cols;

    if (indexInPage === 0) {
      if (pageIndex > 0) doc.addPage();
      renderHeader();
    }

    // Show progress
    if (i % 10 === 0) {
      console.log(`Processing product ${i + 1} of ${products.length}...`);
    }

    // compute top-left coordinates for this card
    const startX = margin + col * (cardWidth + gap);
    const startY = margin + headerHeight + row * (cardHeight + gap);
    await renderCard(products[i], startX, startY);
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
    doc.text(`${TT.footerPageLabel} ${p - 1} ${TT.footerOfLabel} ${pageCount - 1}`, footerW, footerY, { align: "right" });

  }

  // Save file (triggers download in browser)
  doc.save(fileName);
  console.log('PDF generation completed:', fileName);
}
