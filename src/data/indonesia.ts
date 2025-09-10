export type Province = {
  id: string;
  name: string;
};

export type City = {
  id: string;
  province_id: string;
  name: string;
};

export const provinces: Province[] = [
  { id: "1", name: "Aceh" },
  { id: "2", name: "Sumatera Utara" },
  { id: "3", name: "Sumatera Barat" },
  { id: "4", name: "Riau" },
  { id: "5", name: "Jambi" },
  { id: "6", name: "Sumatera Selatan" },
  { id: "7", name: "Bengkulu" },
  { id: "8", name: "Lampung" },
  { id: "9", name: "Kepulauan Bangka Belitung" },
  { id: "10", name: "Kepulauan Riau" },
  { id: "11", name: "DKI Jakarta" },
  { id: "12", name: "Jawa Barat" },
  { id: "13", name: "Jawa Tengah" },
  { id: "14", name: "DI Yogyakarta" },
  { id: "15", name: "Jawa Timur" },
  { id: "16", name: "Banten" },
  { id: "17", name: "Bali" },
  { id: "18", name: "Nusa Tenggara Barat" },
  { id: "19", name: "Nusa Tenggara Timur" },
  { id: "20", name: "Kalimantan Barat" },
  { id: "21", name: "Kalimantan Tengah" },
  { id: "22", name: "Kalimantan Selatan" },
  { id: "23", name: "Kalimantan Timur" },
  { id: "24", name: "Kalimantan Utara" },
  { id: "25", name: "Sulawesi Utara" },
  { id: "26", name: "Sulawesi Tengah" },
  { id: "27", name: "Sulawesi Selatan" },
  { id: "28", name: "Sulawesi Tenggara" },
  { id: "29", name: "Gorontalo" },
  { id: "30", name: "Sulawesi Barat" },
  { id: "31", name: "Maluku" },
  { id: "32", name: "Maluku Utara" },
  { id: "33", name: "Papua Barat" },
  { id: "34", name: "Papua" },
];

export const cities: City[] = [
  // Jakarta
  { id: "1", province_id: "11", name: "Jakarta Pusat" },
  { id: "2", province_id: "11", name: "Jakarta Utara" },
  { id: "3", province_id: "11", name: "Jakarta Barat" },
  { id: "4", province_id: "11", name: "Jakarta Selatan" },
  { id: "5", province_id: "11", name: "Jakarta Timur" },
  { id: "6", province_id: "11", name: "Kepulauan Seribu" },
  
  // Jawa Barat
  { id: "7", province_id: "12", name: "Bandung" },
  { id: "8", province_id: "12", name: "Bekasi" },
  { id: "9", province_id: "12", name: "Bogor" },
  { id: "10", province_id: "12", name: "Cimahi" },
  { id: "11", province_id: "12", name: "Cirebon" },
  { id: "12", province_id: "12", name: "Depok" },
  { id: "13", province_id: "12", name: "Sukabumi" },
  { id: "14", province_id: "12", name: "Tasikmalaya" },
  { id: "15", province_id: "12", name: "Banjar" },
  { id: "16", province_id: "12", name: "Kabupaten Bandung" },
  { id: "17", province_id: "12", name: "Kabupaten Bandung Barat" },
  { id: "18", province_id: "12", name: "Kabupaten Bekasi" },
  { id: "19", province_id: "12", name: "Kabupaten Bogor" },
  { id: "20", province_id: "12", name: "Kabupaten Ciamis" },
  
  // Jawa Tengah
  { id: "21", province_id: "13", name: "Semarang" },
  { id: "22", province_id: "13", name: "Surakarta" },
  { id: "23", province_id: "13", name: "Pekalongan" },
  { id: "24", province_id: "13", name: "Salatiga" },
  { id: "25", province_id: "13", name: "Tegal" },
  { id: "26", province_id: "13", name: "Magelang" },
  
  // Jawa Timur
  { id: "27", province_id: "15", name: "Surabaya" },
  { id: "28", province_id: "15", name: "Malang" },
  { id: "29", province_id: "15", name: "Sidoarjo" },
  { id: "30", province_id: "15", name: "Gresik" },
  { id: "31", province_id: "15", name: "Mojokerto" },
  { id: "32", province_id: "15", name: "Pasuruan" },
  { id: "33", province_id: "15", name: "Batu" },
  { id: "34", province_id: "15", name: "Blitar" },
  { id: "35", province_id: "15", name: "Kediri" },
  { id: "36", province_id: "15", name: "Madiun" },
  { id: "37", province_id: "15", name: "Probolinggo" },
  
  // Bali
  { id: "38", province_id: "17", name: "Denpasar" },
  { id: "39", province_id: "17", name: "Kabupaten Badung" },
  { id: "40", province_id: "17", name: "Kabupaten Bangli" },
  { id: "41", province_id: "17", name: "Kabupaten Buleleng" },
  { id: "42", province_id: "17", name: "Kabupaten Gianyar" },
  { id: "43", province_id: "17", name: "Kabupaten Jembrana" },
  { id: "44", province_id: "17", name: "Kabupaten Karangasem" },
  { id: "45", province_id: "17", name: "Kabupaten Klungkung" },
  { id: "46", province_id: "17", name: "Kabupaten Tabanan" },
  
  // Banten
  { id: "47", province_id: "16", name: "Serang" },
  { id: "48", province_id: "16", name: "Tangerang" },
  { id: "49", province_id: "16", name: "Cilegon" },
  { id: "50", province_id: "16", name: "Tangerang Selatan" },
  
  // Yogyakarta
  { id: "51", province_id: "14", name: "Yogyakarta" },
  { id: "52", province_id: "14", name: "Kabupaten Bantul" },
  { id: "53", province_id: "14", name: "Kabupaten Gunungkidul" },
  { id: "54", province_id: "14", name: "Kabupaten Kulon Progo" },
  { id: "55", province_id: "14", name: "Kabupaten Sleman" },
  
  // Sumatera Utara
  { id: "56", province_id: "2", name: "Medan" },
  { id: "57", province_id: "2", name: "Binjai" },
  { id: "58", province_id: "2", name: "Pematangsiantar" },
  { id: "59", province_id: "2", name: "Tebing Tinggi" },
  { id: "60", province_id: "2", name: "Padang Sidempuan" },
  
  // Sumatera Barat
  { id: "61", province_id: "3", name: "Padang" },
  { id: "62", province_id: "3", name: "Bukittinggi" },
  { id: "63", province_id: "3", name: "Padang Panjang" },
  { id: "64", province_id: "3", name: "Payakumbuh" },
  { id: "65", province_id: "3", name: "Solok" },
];

// Helper function to get cities by province ID
export function getCitiesByProvince(provinceId: string): City[] {
  return cities.filter(city => city.province_id === provinceId);
}
