import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResults(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setResults(response.data);
    } catch (err) {
      console.error(err);
      setError(
        "❌ Không kết nối được đến Server. Vui lòng bật Terminal Python!",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM MỚI: DỊCH JSON THÀNH GIAO DIỆN ĐẸP ---
  const renderJsonData = (jsonString) => {
    if (!jsonString) return <p>Không có dữ liệu</p>;

    try {
      // Thử đọc chuỗi JSON
      const data = JSON.parse(jsonString);

      // Nếu có lỗi từ AI báo về
      if (data.error) {
        return (
          <div style={{ color: "#ef4444", fontWeight: "bold" }}>
            ⚠️ {data.error}
          </div>
        );
      }

      // Trả về giao diện các thẻ thông tin
      return (
        <div className="parsed-data">
          <div className="data-row">
            <strong>🌍 Quốc gia:</strong>{" "}
            <span>{data.quoc_gia || "Không xác định"}</span>
          </div>
          <div className="data-row">
            <strong>💵 Mệnh giá:</strong>{" "}
            <span>{data.menh_gia || "Không xác định"}</span>
          </div>
          <div className="data-row">
            <strong>📅 Năm phát hành:</strong>{" "}
            <span>{data.nam_phat_hanh || "Không xác định"}</span>
          </div>
          <div className="data-row">
            <strong>🏷️ Chất liệu:</strong>{" "}
            <span>{data.chat_lieu || "Không xác định"}</span>
          </div>
          <div className="data-row">
            <strong>🖼️ Mặt trước:</strong>{" "}
            <span>{data.mat_truoc || "Không xác định"}</span>
          </div>
          <div className="data-row">
            <strong>🏞️ Mặt sau:</strong>{" "}
            <span>{data.mat_sau || "Không xác định"}</span>
          </div>
        </div>
      );
    } catch (e) {
      console.error("Lỗi khi phân tích JSON:", e);
      // Nếu AI trả về câu chữ bình thường không phải chuẩn JSON thì vẫn hiện ra được
      return (
        <pre className="json-code" style={{ whiteSpace: "pre-wrap" }}>
          {jsonString}
        </pre>
      );
    }
  };

  return (
    <div>
      <style>{`
        :root, #root, html, body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 100% !important; 
          max-width: 100% !important; 
          background-color: #f3f4f6 !important; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          text-align: left !important;
        }

        .sidebar {
          position: fixed; top: 0; left: 0; 
          width: 360px; height: 100vh; 
          background-color: #1e293b; color: white; 
          padding: 30px 20px; box-sizing: border-box;
          box-shadow: 4px 0 15px rgba(0,0,0,0.1);
          z-index: 10; overflow-y: auto;
        }

        .logo-box { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155; margin-bottom: 25px; }
        .logo-box h1 { margin: 0; font-size: 24px; color: #f8fafc; }
        .logo-box p { margin: 8px 0 0 0; color: #94a3b8; font-size: 13px; }

        .upload-area {
          border: 2px dashed #475569; border-radius: 12px; padding: 30px 15px;
          text-align: center; cursor: pointer; transition: 0.3s;
          background-color: #0f172a; display: block;
        }
        .upload-area:hover { border-color: #3b82f6; background-color: #1e293b; }
        .preview-image { width: 100%; border-radius: 8px; margin-top: 15px; border: 2px solid #334155; }

        .btn-run {
          width: 100%; padding: 15px; margin-top: 25px;
          background: linear-gradient(135deg, #3b82f6, #2563eb); 
          color: white; border: none; border-radius: 10px;
          font-size: 16px; font-weight: bold; cursor: pointer; 
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .btn-run:hover:not(:disabled) { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 12px rgba(0,0,0,0.2); 
            background: linear-gradient(135deg, #60a5fa, #3b82f6);
        }
        .btn-run:disabled { background: #475569; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
        .error-alert { background: #7f1d1d; color: #fca5a5; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; font-size: 14px; }

        .main-content {
          margin-left: 360px; min-height: 100vh; padding: 40px; 
          box-sizing: border-box; width: calc(100% - 360px); 
        }

        .waiting-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: calc(100vh - 80px); background: white; border-radius: 20px;
          border: 2px dashed #cbd5e1; color: #64748b; text-align: center;
        }
        .pulse-icon { font-size: 80px; margin-bottom: 20px; animation: pulse 1.5s infinite; color: #3b82f6; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }

        .result-master {
          background: #ffffff; padding: 30px; border-radius: 16px;
          border-left: 8px solid #10b981; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
          margin-bottom: 40px;
        }
        .result-master h2 { margin: 0 0 15px 0; color: #047857; font-size: 24px; }
        
        .result-text { font-size: 16px; line-height: 1.6; color: #334155; }
        .result-text ul { padding-left: 20px; }
        .result-text li { margin-bottom: 8px; }
        .result-text strong { color: #1e293b; }

        .ai-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; }
        .ai-box { background: white; border-radius: 16px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .ai-box.nemo { border-top: 5px solid #10b981; }
        .ai-box.qwen { border-top: 5px solid #8b5cf6; }
        .ai-box.gemini { border-top: 5px solid #f59e0b; }
        .ai-box h3 { margin: 0 0 15px 0; font-size: 18px; }

        /* ========================================================= */
        /* CSS MỚI: LÀM ĐẸP CHO PHẦN THÔNG TIN TỪ JSON TRẢ VỀ */
        /* ========================================================= */
        .parsed-data {
          display: flex; flex-direction: column; gap: 12px; margin-top: 15px;
        }
        .data-row {
          background-color: #f8fafc; padding: 12px 15px; border-radius: 8px;
          border-left: 3px solid #cbd5e1; display: flex; flex-direction: column; gap: 4px;
        }
        .data-row strong {
          color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .data-row span {
          color: #0f172a; font-weight: 500; font-size: 15px; line-height: 1.4;
        }
        .json-code {
          background: #0f172a; color: #e2e8f0; padding: 20px; border-radius: 12px;
          font-family: monospace; font-size: 14px; line-height: 1.5;
          overflow-x: auto; max-height: 400px; overflow-y: auto; margin: 0;
        }
      `}</style>

      {/* ... (Phần Sidebar bên trái giữ nguyên không đổi) ... */}
      <div className="sidebar">
        <div className="logo-box">
          <h1>🕵️ GIÁM ĐỊNH AI</h1>
          <p>Nemotron Vision • Qwen-VL • Gemini</p>
        </div>

        <label className="upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {!preview ? (
            <div>
              <span
                style={{
                  fontSize: "40px",
                  display: "block",
                  marginBottom: "15px",
                }}
              >
                📁
              </span>
              <span style={{ color: "#cbd5e1", fontWeight: "500" }}>
                Tải ảnh tờ tiền lên đây
              </span>
            </div>
          ) : (
            <img src={preview} alt="Tiền" className="preview-image" />
          )}
        </label>

        {preview && (
          <button
            className="btn-run"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "⏳ ĐANG XỬ LÝ..." : "🚀 TIẾN HÀNH GIÁM ĐỊNH"}
          </button>
        )}

        {error && <div className="error-alert">{error}</div>}
      </div>

      {/* CỘT PHẢI */}
      <div className="main-content">
        {!results && !loading && (
          <div className="waiting-state">
            <span style={{ fontSize: "80px", marginBottom: "20px" }}>📊</span>
            <h2 style={{ color: "#334155", margin: "0 0 10px 0" }}>
              Khu Vực Báo Cáo Phân Tích
            </h2>
            <p>Kết quả từ các AI sẽ được hiển thị chi tiết tại đây.</p>
          </div>
        )}

        {loading && (
          <div className="waiting-state">
            <div className="pulse-icon">⚙️</div>
            <h2 style={{ color: "#3b82f6", margin: "0 0 10px 0" }}>
              Đang xử lý thông tin...
            </h2>
            <p>Xin vui lòng chờ một chút.</p>
          </div>
        )}

        {results && (
          <div style={{ animation: "fadeIn 0.5s ease-in" }}>
            <div className="result-master">
              <h2>⚖️ KẾT LUẬN GIÁM ĐỊNH CHÍNH THỨC</h2>
              <div className="result-text">
                <ReactMarkdown>{results.final_report}</ReactMarkdown>
              </div>
            </div>

            <h2
              style={{
                color: "#475569",
                fontSize: "20px",
                marginBottom: "20px",
                marginTop: "40px",
              }}
            >
              🤖 Dữ liệu phân tích chi tiết:
            </h2>

            {/* HIỂN THỊ DỮ LIỆU ĐÃ ĐƯỢC LÀM ĐẸP THAY VÌ HIỆN JSON MỘC */}
            <div className="ai-grid">
              <div className="ai-box nemo">
                <h3 style={{ color: "#059669" }}>🟢 Nemotron Vision</h3>
                {renderJsonData(results.groq)}
              </div>

              <div className="ai-box qwen">
                <h3 style={{ color: "#7c3aed" }}>🟣 Qwen-VL</h3>
                {renderJsonData(results.openrouter)}
              </div>

              <div className="ai-box gemini">
                <h3 style={{ color: "#d97706" }}>🟠 Gemini 2.5</h3>
                {renderJsonData(results.gemini)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
