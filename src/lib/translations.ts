// Language translations for the application
// This allows for easy switching between languages

export const translations = {
  id: {
    // Navbar
    home: "Beranda",
    productList: "Daftar Produk",
    about: "Tentang Baskit",
    contact: "Hubungi Kami",
    login: "Masuk",
    register: "Daftar Distributor",
    profile: "Profil",
    logout: "Keluar",
    language: "Bahasa",
    cart: "Keranjang",
    items: "Item",
    checkout: "Checkout",
    emptyCart: "Keranjang kosong",
    emptyCartMessage: "Belum ada produk di keranjang Anda",
    continueShopping: "Lanjut Belanja",
    subtotal: "Subtotal",
    total: "Total",
    remove: "Hapus",
    
    // DaftarProduk page
    pageTitle: "Daftar Produk",
    distributorPrice: "Harga Distributor",
    consumerPrice: "Harga Konsumen",
    area: "Area Distribusi",
    allAreas: "Semua Area",
    detectLocation: "Deteksi Lokasi",
    detecting: "Mendeteksi lokasi...",
    brand: "Brand",
    allBrands: "Semua Brand",
    price: "Harga",
    exportPDF: "Export PDF",
    priceInfoText: "Harga distributor akan terlihat setelah Anda masuk / mendaftar.",
    summary: "Ringkasan Ekspor",
    date: "Tanggal",
    totalProducts: "Total Produk",
    page: "Halaman",
    cartItems: "Item di Keranjang",
    learnMore: "Pelajari Lebih Lanjut",
    moq: "MOQ",
    quantity: "Kuantitas",
    marginEstimation: "Estimasi Margin",
    margin: "margin",
    addToCart: "Tambah ke Keranjang",
    loginToView: "Masuk untuk menggunakan simulasi dan melihat harga distributor.",
    viewPrice: "Lihat Harga",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    perPage: "per halaman",
    
    // Location errors
    locationNotSupported: "Geolokasi tidak didukung oleh browser Anda",
    locationDenied: "Izin lokasi ditolak. Silakan izinkan akses lokasi untuk melihat produk di area Anda.",
    locationFailed: "Gagal mendeteksi lokasi Anda. Silakan pilih area secara manual."
  },
  
  en: {
    // Navbar
    home: "Home",
    productList: "Product List",
    about: "About Baskit",
    contact: "Contact Us",
    login: "Login",
    register: "Register as Distributor",
    profile: "Profile",
    logout: "Logout",
    language: "Language",
    cart: "Cart",
    items: "Items",
    checkout: "Checkout",
    emptyCart: "Cart is empty",
    emptyCartMessage: "You haven't added any products to your cart yet",
    continueShopping: "Continue Shopping",
    subtotal: "Subtotal",
    total: "Total",
    remove: "Remove",
    
    // DaftarProduk page
    pageTitle: "Product List",
    distributorPrice: "Distributor Price",
    consumerPrice: "Consumer Price",
    area: "Distribution Area",
    allAreas: "All Areas",
    detectLocation: "Detect Location",
    detecting: "Detecting location...",
    brand: "Brand",
    allBrands: "All Brands",
    price: "Price",
    exportPDF: "Export PDF",
    priceInfoText: "Distributor prices will be visible after you login/register.",
    summary: "Export Summary",
    date: "Date",
    totalProducts: "Total Products",
    page: "Page",
    cartItems: "Cart Items",
    learnMore: "Learn More",
    moq: "MOQ",
    quantity: "Quantity",
    marginEstimation: "Margin Estimate",
    margin: "margin",
    addToCart: "Add to Cart",
    loginToView: "Login to use the simulation and view distributor prices.",
    viewPrice: "View Price",
    previous: "Previous",
    next: "Next",
    perPage: "per page",
    
    // Location errors
    locationNotSupported: "Geolocation is not supported by your browser",
    locationDenied: "Location permission denied. Please allow location access to view products in your area.",
    locationFailed: "Failed to detect your location. Please select an area manually."
  }
};

// Helper function to get text in the current language
export function getText(key: keyof typeof translations.id, lang: 'id' | 'en'): string {
  return translations[lang][key] || key;
}
