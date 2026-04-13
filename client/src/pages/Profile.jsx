import { useState, useEffect, useRef } from "react";
import axiosClient from "../api/axiosClient";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trạng thái cho Form
  const [editForm, setEditForm] = useState({
    full_name: "",
    current_password: "",
    new_password: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Trạng thái Avatar
  const [imgError, setImgError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      setUser(res.data);
      setEditForm((prev) => ({ ...prev, full_name: res.data.full_name || "" }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axiosClient.put("/auth/update-profile", editForm);
      alert("✅ Cập nhật hồ sơ thành công!");
      setEditForm((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
      }));
      fetchProfile();
      window.location.reload(); // Load lại để update Header
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.detail || "Không thể cập nhật"));
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh nhỏ hơn 2MB để hệ thống xử lý tốt nhất.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        await axiosClient.post("/auth/upload-avatar", {
          avatar_base64: base64String,
        });
        setImgError(false);
        fetchProfile();
        window.location.reload(); // Update Header
      } catch (err) {
        alert("Lỗi khi tải ảnh lên!");
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );

  return (
    <div className="py-12 font-sans text-slate-800 dark:text-white bg-[#F9FAFB] dark:bg-slate-950 min-h-[90vh] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        {/* Tiêu đề Trang */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            👤 Quản lý Hồ sơ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Tùy chỉnh thông tin cá nhân và bảo mật tài khoản của bạn.
          </p>
        </div>

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CỘT TRÁI: CARD THÔNG TIN (LUÔN HIỂN THỊ) */}
            <div className="col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                {/* Banner Gradient */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                  {user.role === "admin" && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-black px-4 py-1 rounded-full text-xs shadow-md uppercase tracking-wider">
                      Admin System
                    </div>
                  )}
                </div>

                <div className="p-8 relative flex flex-col items-center mt-[-80px]">
                  {/* Khu vực Upload Avatar */}
                  <div
                    className="relative group cursor-pointer mb-4"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border-4 border-white dark:border-slate-900 flex items-center justify-center text-5xl font-black text-indigo-600 relative overflow-hidden transition-transform duration-300 group-hover:-translate-y-2">
                      {user.avatar_url && !imgError ? (
                        <img
                          src={user.avatar_url}
                          alt="Avatar"
                          onError={() => setImgError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : user.full_name ? (
                        user.full_name.charAt(0).toUpperCase()
                      ) : (
                        "U"
                      )}

                      {/* Lớp mờ Đổi ảnh */}
                      <div className="absolute inset-0 bg-slate-900/60 hidden group-hover:flex flex-col items-center justify-center text-white backdrop-blur-sm transition-all">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-xs font-bold uppercase tracking-widest">
                          Đổi ảnh
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  {uploadingAvatar && (
                    <p className="text-xs font-bold text-indigo-500 animate-pulse mb-4">
                      Đang xử lý ảnh...
                    </p>
                  )}

                  {/* Thông tin Text */}
                  <div className="text-center w-full">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                      {user.full_name || "Chưa cập nhật tên"}
                    </h2>
                    <p className="text-indigo-500 font-medium mb-6">
                      @{user.username}
                    </p>

                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-6"></div>

                    <div className="flex flex-col gap-4 text-left w-full">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                          Email liên hệ
                        </p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                          Tài khoản bảo mật
                        </p>
                        {user.auth_provider === "google" ? (
                          <span className="inline-block bg-rose-50 dark:bg-rose-900/30 text-rose-600 px-3 py-1 rounded-lg font-bold text-xs">
                            Google OAuth
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-lg font-bold text-xs">
                            <span>🛡️</span> Mật khẩu mã hóa
                          </span>
                        )}
                      </div>
                      <div className="bg-indigo-50 dark:bg-slate-800/50 p-4 rounded-2xl mt-2 border border-indigo-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                          Số dư Token
                        </p>
                        <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                          {user.token_balance}{" "}
                          <span className="text-xl">🪙</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: FORM CHỈNH SỬA */}
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-10 h-full">
                <h3 className="font-black text-2xl mb-8 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                  Cập nhật thông tin
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                      Họ và tên hiển thị
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.full_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, full_name: e.target.value })
                      }
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-colors font-medium"
                      placeholder="Nhập tên của bạn..."
                    />
                  </div>

                  {user.auth_provider !== "google" && (
                    <div className="pt-6">
                      <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                        <span className="text-lg">🔐</span> Đổi mật khẩu{" "}
                        <span className="text-xs font-normal italic text-slate-400">
                          (Bỏ trống nếu không muốn đổi)
                        </span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="password"
                          placeholder="Mật khẩu HIỆN TẠI"
                          value={editForm.current_password}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              current_password: e.target.value,
                            })
                          }
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-colors font-medium"
                        />
                        <input
                          type="password"
                          placeholder="Mật khẩu MỚI"
                          value={editForm.new_password}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              new_password: e.target.value,
                            })
                          }
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 dark:text-white transition-colors font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="w-full md:w-auto px-10 py-4 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-1"
                    >
                      {editLoading ? "ĐANG LƯU..." : "💾 LƯU THAY ĐỔI"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
