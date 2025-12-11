import jsPDF from "jspdf";
import { Product } from "@/data/products";
import { formatIDR } from "@/lib/utils";

type ExportCatalogOptions = {
  products: Product[];
  area: string;
  selectedBrand: string;
  language: 'id' | 'en';
};

export const exportProductCatalog = async ({
  products,
  area,
  selectedBrand,
  language
}: ExportCatalogOptions) => {
  // Create PDF document in landscape orientation to match the reference image
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Add header to the page
  // Set white background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Draw header section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(51, 51, 51);
  pdf.text('baskit', 30, 20);
  
  // Draw colored squares for the logo
  const squareSize = 5;
  const logoX = 65;
  const logoY = 15;
  
  pdf.setFillColor(0, 102, 87); // Teal green - top left
  pdf.rect(logoX, logoY, squareSize, squareSize, 'F');
  
  pdf.setFillColor(242, 101, 34); // Orange - top right
  pdf.rect(logoX + squareSize + 1, logoY, squareSize, squareSize, 'F');
  
  pdf.setFillColor(140, 198, 63); // Green - bottom right
  pdf.rect(logoX + squareSize + 1, logoY + squareSize + 1, squareSize, squareSize, 'F');
  
  pdf.setFillColor(253, 187, 48); // Yellow - bottom left
  pdf.rect(logoX, logoY + squareSize + 1, squareSize, squareSize, 'F');
  
  // Add title "Distributor Catalog"
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(242, 101, 34); // Baskit orange color
  pdf.text('Distributor Catalog', 80, 20);
  
  // Add Area Distribusi
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Area Distribusi', pageWidth - 95, 15);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 102, 87); // Teal green
  pdf.setFontSize(16);
  pdf.text(area || 'Jawa Barat', pageWidth - 95, 25);
  
  // Add date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Tanggal Catalog', pageWidth - 40, 15);
  
  // Format date as DD/MM/YY
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = String(currentDate.getFullYear()).substring(2);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 102, 87); // Teal green
  pdf.text(`${day}/${month}/${year}`, pageWidth - 40, 25);
  
  // Set up grid for products
  const margin = 20;
  const productsPerRow = 4;
  const productsPerPage = 12; // 3 rows of 4 products
  const productsToExport = products;
  
  const productWidth = (pageWidth - (margin * 2) - ((productsPerRow - 1) * 10)) / productsPerRow;
  const productHeight = 85; // Fixed height for product card
  
  const startX = margin;
  let startY = 40; // Start below header
  
  let pageCount = 1;
  
  // Process all products
  for (let i = 0; i < productsToExport.length; i++) {
    // Calculate position in grid
    const col = i % productsPerRow;
    const row = Math.floor((i % productsPerPage) / productsPerRow);
    
    // Start a new page if needed
    if (i > 0 && i % productsPerPage === 0) {
      pdf.addPage();
      pageCount++;
      startY = 40;
      
      // Add header to new page
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 40, pageHeight, 'F');
      
      // Logo and title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(51, 51, 51);
      pdf.text('baskit', 30, 20);
      
      // Draw logo squares
      pdf.setFillColor(0, 102, 87);
      pdf.rect(logoX, logoY, squareSize, squareSize, 'F');
      pdf.setFillColor(242, 101, 34);
      pdf.rect(logoX + squareSize + 1, logoY, squareSize, squareSize, 'F');
      pdf.setFillColor(140, 198, 63);
      pdf.rect(logoX + squareSize + 1, logoY + squareSize + 1, squareSize, squareSize, 'F');
      pdf.setFillColor(253, 187, 48);
      pdf.rect(logoX, logoY + squareSize + 1, squareSize, squareSize, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(242, 101, 34);
      pdf.text('Distributor Catalog', 80, 20);
      
      // Area and date
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Area Distribusi', pageWidth - 95, 15);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 102, 87);
      pdf.setFontSize(16);
      pdf.text(area || 'Jawa Barat', pageWidth - 95, 25);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Tanggal Catalog', pageWidth - 40, 15);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 102, 87);
      pdf.text(`${day}/${month}/${year}`, pageWidth - 40, 25);
    }
    
    // Calculate x and y position for this product
    const x = startX + (col * (productWidth + 10));
    const y = startY + (row * (productHeight + 10));
    
    // Get product data
    const product = productsToExport[i];
    const regional = product.regions.find(r => r.area === area) || product.regions[0];
    const usedPrice = regional?.distributorPrice ?? product.distributorPrice;
    const usedMoq = regional?.moq ?? product.moq;
    const margin = product.consumerPrice > 0 ? ((product.consumerPrice - usedPrice) / product.consumerPrice) * 100 : 0;
    
    // Draw product card with baskit-specific styling
    
    // Product image area (yellow background with simulated product image)
    pdf.setFillColor(255, 250, 227); // Light yellow background
    pdf.rect(x, y, productWidth, 45, 'F');
    
    // Add product image (placeholder)
    pdf.setFillColor(253, 187, 48); // Yellow for demo product background
    pdf.rect(x + 5, y + 5, productWidth - 10, 35, 'F');
    
    // Add fake product image elements to mimic the reference image
    pdf.setFillColor(255, 255, 255, 0.3);
    pdf.rect(x + 10, y + 10, productWidth - 20, 12, 'F');
    pdf.rect(x + 10, y + 25, productWidth - 20, 12, 'F');
    
    // Brand name at top of product image
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(51, 51, 51);
    pdf.text(product.brand, x + 10, y + 10);
    
    // Product name and details
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 102, 87); // Teal green
    
    // Split long product names into multiple lines if needed
    const nameLines = pdf.splitTextToSize(product.name, productWidth - 10);
    pdf.text(nameLines, x + 5, y + 50);
    
    // Product size
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text(product.size, x + 5, y + 55 + (nameLines.length * 3));
    
    // Price information - Distributor & Konsumen
    // Left column
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Harga Distributor', x + 5, y + 63);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(0, 102, 87); // Teal green
    pdf.text(formatIDR(usedPrice), x + 5, y + 68);
    
    // Margin calculation
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Margin Distributor', x + 5, y + 73);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(0, 102, 87); // Teal green
    pdf.text(`${margin.toFixed(1)}%`, x + 5, y + 78);
    
    // Right column
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Harga Konsumen', x + (productWidth/2) + 5, y + 63);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(242, 101, 34); // Orange
    pdf.text(formatIDR(product.consumerPrice), x + (productWidth/2) + 5, y + 68);
    
    // MOQ
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Min. Qty Pesanan', x + (productWidth/2) + 5, y + 73);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.text(usedMoq.toString(), x + (productWidth/2) + 5, y + 78);
    
    // Area at bottom
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Area Distribusi', x + 5, y + 83);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(regional?.area || 'Jawa Barat', x + 50, y + 83);
  }
  
  // Add footer on every page
  const footerHeight = 15;
  
  // Go through all pages to add consistent footer
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Add a green footer bar
    pdf.setFillColor(0, 102, 87); // Teal green
    pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
    
    // Add page number
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 5);
    
    // Add website info
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('www.baskit-distributor.com', 20, pageHeight - 5);
    
    // Add disclaimer
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.text('Harga dan stok dapat berubah sewaktu-waktu', pageWidth / 2, pageHeight - 5, { align: 'center' });
  }
  
  // Create filename based on active filters and date
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let filename = `baskit-product-catalog-${timestamp}`;
  if (area) filename += '-' + area.toLowerCase().replace(/\s+/g, '-');
  if (selectedBrand) filename += '-' + selectedBrand.toLowerCase().replace(/\s+/g, '-');
  filename += '.pdf';
  
  return pdf.save(filename);
};
