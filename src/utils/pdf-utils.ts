import { jsPDF } from "jspdf";

// Baskit brand colors
const COLORS = {
  tealGreen: [0, 104, 90], // #00685A - Primary color
  orange: [242, 101, 34],  // #F26522 - Secondary color
  lime: [140, 198, 63],    // #8CC63F - Accent color
  yellow: [253, 187, 48],  // #FDBB30 - Accent color
  lightGray: [245, 245, 245], // #F5F5F5 - Background
  mediumGray: [230, 230, 230], // #E6E6E6 - Border/divider color
  gray: [100, 100, 100],   // #646464 - Text
  darkGray: [51, 51, 51]   // #333333 - Dark text
};

type PDFHeaderOptions = {
  title?: string;
  subtitle?: string;
  area?: string;
  showDate?: boolean;
  customLogoPosition?: { x: number, y: number };
  customColors?: {
    titleColor?: [number, number, number]; // RGB values
    areaColor?: [number, number, number]; // RGB values
  };
  extraPadding?: number; // Optional extra padding below header
};

/**
 * Adds a standardized header to a PDF document
 * @param pdf - The jsPDF document to add the header to
 * @param options - Configuration options for the header
 * @returns The Y position where content should start after the header
 */
export const addPDFHeader = (pdf: jsPDF, options: PDFHeaderOptions = {}): number => {
  const {
    title = 'Baskit Document',
    subtitle,
    area = 'All Areas',
    showDate = true,
    customLogoPosition,
    customColors = {},
    extraPadding = 0
  } = options;
  
  // Get page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const isLandscape = pageWidth > pageHeight;
  
  // Set default positions with improved spacing
  const logoX = customLogoPosition?.x || 22;
  const logoY = customLogoPosition?.y || 18;
  const headerHeight = 40; // Increased height for better spacing
  
  // Set default colors
  const titleColor = customColors.titleColor || COLORS.tealGreen;
  const areaColor = customColors.areaColor || COLORS.orange;
  
  // Add clean white header background with subtle border
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(COLORS.mediumGray[0], COLORS.mediumGray[1], COLORS.mediumGray[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(0, 0, pageWidth, headerHeight, 'FD');
  
  // Draw header section - Logo text with better positioning
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
  pdf.text('baskit', logoX, logoY + 7);
  
  // Draw colored squares for the logo with better proportions and alignment
  const squareSize = 7;
  const squareGap = 1.2;
  const squaresX = logoX + 40;
  
  // Draw colored squares with slight rounding and better positioning
  const drawRoundedSquare = (x: number, y: number, color: number[]) => {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.roundedRect(x, y, squareSize, squareSize, 1, 1, 'F');
  };
  
  drawRoundedSquare(squaresX, logoY, COLORS.tealGreen); // Teal green - top left
  drawRoundedSquare(squaresX + squareSize + squareGap, logoY, COLORS.orange); // Orange - top right
  drawRoundedSquare(squaresX + squareSize + squareGap, logoY + squareSize + squareGap, COLORS.lime); // Lime - bottom right
  drawRoundedSquare(squaresX, logoY + squareSize + squareGap, COLORS.yellow); // Yellow - bottom left
  
  // Add title with better positioning and alignment
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  pdf.setFontSize(24);
  pdf.text(title, logoX + 70, logoY + 7);
  
  // Add subtitle if provided - improved positioning and styling
  if (subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text(subtitle, logoX + 70, logoY + 18);
  }
  
  // Calculate right side element positions with better spacing for responsiveness
  const rightSideX = isLandscape ? pageWidth - 110 : pageWidth - 80;
  const dateX = isLandscape ? pageWidth - 42 : pageWidth - 30;
  
  // Add Area information with improved layout and visual hierarchy
  // Area label with background for better visual separation
  pdf.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
  pdf.roundedRect(rightSideX - 3, logoY - 3, 85, 22, 2, 2, 'F');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
  pdf.text('Area Distribusi', rightSideX, logoY + 5);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(areaColor[0], areaColor[1], areaColor[2]);
  pdf.setFontSize(15);
  pdf.text(area, rightSideX, logoY + 16);
  
  // Add date if showDate is true - improved alignment and visual design
  if (showDate) {
    // Date label with background for better visual separation
    pdf.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    pdf.roundedRect(dateX - 3, logoY - 3, 28, 22, 2, 2, 'F');
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    pdf.text('Tanggal', dateX, logoY + 5);
    
    // Format date as DD/MM/YY
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = String(currentDate.getFullYear()).substring(2);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(areaColor[0], areaColor[1], areaColor[2]);
    pdf.text(`${day}/${month}/${year}`, dateX, logoY + 16);
  }
  
  // Draw a stronger separator line
  // Note: Using direct draw methods instead of setLineDash which is not in TypeScript definitions
  pdf.setDrawColor(COLORS.tealGreen[0], COLORS.tealGreen[1], COLORS.tealGreen[2]);
  pdf.setLineWidth(1.2);
  pdf.line(15, headerHeight - 3, pageWidth - 15, headerHeight - 3);
  
  // Add subtle shadow effect below header
  pdf.setFillColor(230, 230, 230, 0.5);
  pdf.rect(0, headerHeight, pageWidth, 2, 'F');
  
  // Return the Y position where content should start with optional extra padding
  return headerHeight + 5 + extraPadding;
};

/**
 * Adds a standardized footer to a PDF document
 * @param pdf - The jsPDF document to add the footer to
 * @param pageNumber - Current page number
 * @param totalPages - Total number of pages
 * @param options - Additional footer options
 */
export const addPDFFooter = (
  pdf: jsPDF, 
  pageNumber: number, 
  totalPages: number,
  options: { 
    disclaimer?: string;
    website?: string;
    showLogo?: boolean;
    customColors?: {
      footerColor?: [number, number, number]; // RGB values
    };
  } = {}
): void => {
  const { 
    disclaimer = 'Harga dan stok dapat berubah sewaktu-waktu',
    website = 'www.baskit-distributor.com',
    showLogo = true,
    customColors = {}
  } = options;
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerHeight = 20; // Increased for better spacing
  const footerY = pageHeight - footerHeight;
  
  // Set footer color - default to teal green or use custom
  const footerColor = customColors.footerColor || COLORS.tealGreen;
  
  // Add subtle shadow effect above footer
  pdf.setFillColor(200, 200, 200, 0.5);
  pdf.rect(0, footerY - 2, pageWidth, 2, 'F');
  
  // Add a footer bar with brand color and improved style
  pdf.setFillColor(footerColor[0], footerColor[1], footerColor[2]);
  pdf.rect(0, footerY, pageWidth, footerHeight, 'F');
  
  // Add small brand logo in footer if requested
  if (showLogo) {
    // Logo text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text('baskit', 15, footerY + 13);
    
    // Mini colored squares
    const squareSize = 3;
    const squareGap = 0.5;
    const squaresX = 38;
    
    const drawMiniSquare = (x: number, y: number, color: number[]) => {
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, y, squareSize, squareSize, 'F');
    };
    
    drawMiniSquare(squaresX, footerY + 8, [255, 255, 255]); // White - top left
    drawMiniSquare(squaresX + squareSize + squareGap, footerY + 8, [255, 255, 255]); // White - top right
    drawMiniSquare(squaresX + squareSize + squareGap, footerY + 8 + squareSize + squareGap, [255, 255, 255]); // White - bottom right
    drawMiniSquare(squaresX, footerY + 8 + squareSize + squareGap, [255, 255, 255]); // White - bottom left
  }
  
  // Add page number with improved positioning and styling
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 25, footerY + 13);
  
  // Add website info with improved positioning and styling
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(website, showLogo ? 50 : 20, footerY + 13);
  
  // Add disclaimer with improved positioning and styling
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text(disclaimer, pageWidth / 2, footerY + 13, { align: 'center' });
  
  // Add subtle watermark effect (very light)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255, 0.03); // Almost transparent white
  pdf.text('BASKIT', pageWidth - 60, footerY + 15);
};
