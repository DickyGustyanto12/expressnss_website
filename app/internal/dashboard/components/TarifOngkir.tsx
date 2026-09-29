import { useState } from "react";
import { Search, Plus, Edit, Trash2, Truck } from "lucide-react";
import Swal from "sweetalert2";

interface TarifItem {
  id: number;
  asal: string;
  tujuan: string;
  layanan: "Reguler" | "Next";
  tarif: number;
}

const TarifOngkir = () => {
  const [daftarTarif, setDaftarTarif] = useState<TarifItem[]>([
    {
      id: 1,
      asal: "Jakarta",
      tujuan: "Semarang",
      layanan: "Reguler",
      tarif: 12000,
    },
    {
      id: 2,
      asal: "Jakarta",
      tujuan: "Surabaya",
      layanan: "Next",
      tarif: 18000,
    },
    {
      id: 3,
      asal: "Jakarta",
      tujuan: "Bandung",
      layanan: "Reguler",
      tarif: 10000,
    },
    {
      id: 4,
      asal: "Semarang",
      tujuan: "Surabaya",
      layanan: "Next",
      tarif: 15000,
    },
    {
      id: 5,
      asal: "Surabaya",
      tujuan: "Jakarta",
      layanan: "Reguler",
      tarif: 14000,
    },
  ]);

  const [pencarian, setPencarian] = useState("");

  const tarifTersaring = daftarTarif.filter(
    (item) =>
      item.asal.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.tujuan.toLowerCase().includes(pencarian.toLowerCase()) ||
      item.layanan.toLowerCase().includes(pencarian.toLowerCase()),
  );

  const handleHapus = (id: number) => {
    Swal.fire({
      title: "Hapus Tarif?",
      text: "Data tarif ongkir ini akan dihapus dari sistem.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        setDaftarTarif(daftarTarif.filter((item) => item.id !== id));
        Swal.fire("Terhapus!", "Data tarif berhasil dihapus.", "success");
      }
    });
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <div className="bg-white px-5 py-3 rounded-sm shadow-sm border border-gray-200 border-t-4 border-t-[#FFCC00] shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">
            Manajemen Tarif Ongkir
          </h2>
          <p className="text-xs text-gray-500">
            Kelola daftar harga ongkos kirim antar kota untuk layanan NSS
            Express.
          </p>
        </div>
        <button
          onClick={() =>
            Swal.fire(
              "Informasi",
              "Fitur tambah tarif baru akan segera dibuka.",
              "info",
            )
          }
          className="bg-[#FFCC00] hover:bg-yellow-400 text-gray-950 font-extrabold px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Tarif Baru</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 border border-gray-200 focus-within:border-yellow-400 focus-within:bg-white transition-all max-w-md">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Cari kota asal, tujuan, atau layanan (Reguler/Next)..."
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
                <th className="px-5 py-3">Kota Asal</th>
                <th className="px-5 py-3">Kota Tujuan</th>
                <th className="px-5 py-3">Layanan</th>
                <th className="px-5 py-3">Tarif / Kg</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tarifTersaring.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    Tidak ada data tarif ongkir yang ditemukan.
                  </td>
                </tr>
              ) : (
                tarifTersaring.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-bold text-gray-900 flex items-center gap-1.5">
                      <Truck size={14} className="text-yellow-600" />
                      {item.asal}
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">
                      {item.tujuan}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                          item.layanan === "Reguler"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.layanan}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-black text-gray-950">
                      Rp {item.tarif.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() =>
                            Swal.fire(
                              "Edit",
                              `Edit tarif ID ${item.id}`,
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

export default TarifOngkir;
