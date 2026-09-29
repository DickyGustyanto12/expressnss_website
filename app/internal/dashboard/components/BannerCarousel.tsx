import { useState } from "react";
import { Search, Plus, Edit, Trash2, ImageIcon } from "lucide-react";
import Swal from "sweetalert2";

interface BannerItem {
  id: number;
  judul: string;
  deskripsi: string;
  status: "Aktif" | "Non-aktif";
  urutan: number;
}

const BannerCarousel = () => {
  const [daftarBanner, setDaftarBanner] = useState<BannerItem[]>([
    {
      id: 1,
      judul: "Promo Diskon Ongkir Akhir Tahun",
      deskripsi:
        "Nikmati potongan harga khusus pengiriman reguler ke seluruh Nusantara.",
      status: "Aktif",
      urutan: 1,
    },
    {
      id: 2,
      judul: "Layanan Kargo & Distribusi Skala Besar",
      deskripsi:
        "Solusi aman dan cepat untuk pengiriman barang industri dan komersial.",
      status: "Aktif",
      urutan: 2,
    },
    {
      id: 3,
      judul: "Same Day Service Terpercaya",
      deskripsi:
        "Paket sampai di hari yang sama dengan jaminan ketepatan waktu.",
      status: "Non-aktif",
      urutan: 3,
    },
  ]);

  const [pencarian, setPencarian] = useState("");

  const bannerTersaring = daftarBanner.filter(
    (item) =>
      item.judul.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(pencarian.toLowerCase()),
  );

  const handleHapus = (id: number) => {
    Swal.fire({
      title: "Hapus Banner?",
      text: "Banner promosi ini akan dihapus dari carousel halaman utama.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        setDaftarBanner(daftarBanner.filter((item) => item.id !== id));
        Swal.fire(
          "Terhapus!",
          "Banner berhasil dihapus dari sistem.",
          "success",
        );
      }
    });
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">
            Manajemen Banner Carousel
          </h2>
          <p className="text-xs text-gray-500">
            Kelola gambar dan informasi promo yang tampil di beranda utama
            website.
          </p>
        </div>
        <button
          onClick={() =>
            Swal.fire(
              "Informasi",
              "Fitur tambah banner baru akan segera dibuka.",
              "info",
            )
          }
          className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Banner Baru</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all max-w-md">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Cari judul atau deskripsi banner..."
              value={pencarian}
              onChange={(e) => setPencarian(e.target.value)}
              className="w-full bg-transparent text-xs focus:outline-none text-gray-800"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-900 uppercase font-bold sticky top-0 border-b border-gray-200 z-10">
              <tr>
                <th className="px-5 py-3">Urutan</th>
                <th className="px-5 py-3">Judul Banner</th>
                <th className="px-5 py-3">Deskripsi Singkat</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bannerTersaring.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    Tidak ada data banner yang ditemukan.
                  </td>
                </tr>
              ) : (
                bannerTersaring.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-extrabold text-gray-900">
                      <span className="w-6 h-6 rounded-full bg-gray-100 border border-gray-300 inline-flex items-center justify-center text-xs">
                        {item.urutan}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900 flex items-center gap-2">
                      <ImageIcon
                        size={16}
                        className="text-yellow-600 shrink-0"
                      />
                      {item.judul}
                    </td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-xs">
                      {item.deskripsi}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                          item.status === "Aktif"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            Swal.fire(
                              "Edit",
                              `Edit banner ID ${item.id}`,
                              "info",
                            )
                          }
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleHapus(item.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-sm transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BannerCarousel;
