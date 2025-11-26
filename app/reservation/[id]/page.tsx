// app/reservation/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search } from "lucide-react";

export default function ReservationEditPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [formData, setFormData] = useState({
    id: "",
    sendTime: "",
    personal: "",
    personalIds: [] as string[],
    group: "",
    message: "",
    status: "",
  });

  const [sendTime, setSendTime] = useState<Date | null>(null);

  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [employees, setEmployees] = useState<
    Array<{ userId: string; userName: string }>
  >([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  // 現在時間基準, 最小時間計算
  const getMinTime = (date: Date) => {
    const now = new Date();
    const minTime = new Date(date);

    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      // 当日なら現在時間と9時で大きい方
      const nextHour = new Date();
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      minTime.setHours(Math.max(nextHour.getHours(), 9), 0, 0, 0);
    } else {
      // 今日じゃなかったら9時から
      minTime.setHours(9, 0, 0, 0);
    }
    return minTime;
  };

  const getMaxTime = (date: Date) => {
    const maxTime = new Date(date);
    maxTime.setHours(18, 0, 0, 0);
    return maxTime;
  };

  const [originalData, setOriginalData] = useState({
    personal: "",
    personalIds: [] as string[],
  });

  // ✅ 初期データ取得
  useEffect(() => {
    if (!id) return;

    async function fetchReservation() {
      try {
        const res = await fetch("/api/sheets");
        const all = await res.json();
        const target = all.find((item: any) => item.id === id);

        if (target) {
          setFormData({
            id: target.id || "",
            sendTime: target.time || "",
            personal: target.targetUser || "",
            personalIds: target.userIds || [],
            group: target.targetGroup || "",
            message: target.message || "",
            status: target.status || "",
          });

          setOriginalData({
            personal: target.targetUser || "",
            personalIds: target.userIds || [],
          });

          if (target.time) {
            setSendTime(new Date(target.time));
          }
        } else {
          alert("対象の予約が見つかりません。");
          router.push("/reservation-list");
        }
      } catch (err) {
        console.error("❌ データ取得エラー:", err);
      }
    }

    fetchReservation();
  }, [id, router]);

  // ✅ 社員選択結果を受け取る
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const data = event.data;
      if (data.type === "SELECT_EMPLOYEE") {
        setFormData((prev) => ({
          ...prev,
          personal: data.names.join("、"),
          personalIds: data.ids,
        }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ✅ 社員リスト取得
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setEmployees(data.users);
        setShowEmployeeList(true);
      } else {
        alert("社員リストを取得できませんでした");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      alert("通信エラーが発生しました");
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ✅ 社員選択/解除
  const handleSelectEmployee = (employee: {
    userId: string;
    userName: string;
  }) => {
    const ids = [...formData.personalIds];
    const names = formData.personal ? formData.personal.split("、") : [];

    const index = ids.indexOf(employee.userId);
    if (index > -1) {
      // 既に選択された社員 → 削除
      ids.splice(index, 1);
      names.splice(index, 1);
    } else {
      // 新しい社員を追加
      ids.push(employee.userId);
      names.push(employee.userName);
    }

    setFormData({
      ...formData,
      personalIds: ids,
      personal: names.join("、"),
    });
  };

  // ✅ 社員が選択されているか判定
  const isEmployeeSelected = (userId: string) => {
    return formData.personalIds.includes(userId);
  };

  // ✅ 修正送信
  // ✅ 修正版 handleSubmit
  const handleSubmit = async () => {
    try {
      // バリデーション
      if (!formData.group && !formData.personal) {
        alert("宛先を入力してください。（個人またはグループ）");
        return;
      }

      // ✅ グループ未入力で個人が空の場合は、送信前に元データを復元
      const dataToSend = {
        ...formData,
        ...(formData.group === "" && formData.personal === ""
          ? {
              personal: originalData.personal,
              personalIds: originalData.personalIds,
            }
          : {}),
      };

      const res = await fetch("/api/sheets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const result = await res.json();

      if (res.ok) {
        alert("修正が完了しました！");
        router.push("/reservation-list");
      } else {
        alert(result.error || "修正に失敗しました。");
      }
    } catch (err) {
      console.error("❌ 修正エラー:", err);
      alert("サーバー通信に失敗しました。");
    }
  };

  // ✅ 社員検索ウィンドウを開く
  const openChildWindow = () => {
    fetchEmployees();
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <main style={{ padding: "20px" }}>
        <table
          style={{
            width: "50%",
            borderCollapse: "collapse",
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          <tbody>
            {/* 送信時間 */}
            <tr>
              <th style={tdStyle}>送信時間</th>
              <td style={tdStyle}>
                <DatePicker
                  selected={sendTime}
                  onChange={(date) => {
                    setSendTime(date);
                    setFormData({
                      ...formData,
                      sendTime: date
                        ? date.toLocaleString("ja-JP", { hour12: false })
                        : "",
                    });
                  }}
                  showTimeSelect
                  timeIntervals={60}
                  dateFormat="yyyy/MM/dd HH:mm"
                  minDate={new Date()}
                  minTime={
                    sendTime ? getMinTime(sendTime) : getMinTime(new Date())
                  }
                  maxTime={
                    sendTime ? getMaxTime(sendTime) : getMaxTime(new Date())
                  }
                  placeholderText="予約時間設定"
                  customInput={
                    <input
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "8px",
                        fontSize: "16px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        boxSizing: "border-box",
                      }}
                    />
                  }
                />
              </td>
            </tr>

            {/* 個人 */}
            <tr>
              <th style={tdStyle}>個人</th>
              <td style={tdStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "60px",
                  }}
                >
                  <input
                    type="text"
                    value={formData.personal}
                    placeholder="社員を選択してください。"
                    style={inputStyle}
                    readOnly
                  />
                  <Search
                    size={20}
                    style={{ cursor: "pointer" }}
                    onClick={openChildWindow}
                  />
                  {/* ✅ 初期化ボタン追加 */}
                  <button
                    style={buttonStyleBlue}
                    onClick={() => {
                      if (
                        window.confirm(
                          "個人選択を初期化しますか？（未保存です）"
                        )
                      ) {
                        setFormData({
                          ...formData,
                          personal: "",
                          personalIds: [],
                        });
                      }
                    }}
                  >
                    初期化
                  </button>
                </div>
              </td>
            </tr>

            {/* グループ */}
            <tr>
              <th style={tdStyle}>グループ</th>
              <td style={tdStyle}>
                <input
                  type="text"
                  value={formData.group}
                  onChange={(e) =>
                    setFormData({ ...formData, group: e.target.value })
                  }
                  placeholder="チャンネルIDを入力してください。"
                  style={inputStyle}
                />
              </td>
            </tr>

            {/* メッセージ内容 */}
            <tr>
              <th style={tdStyle}>メッセージ内容</th>
              <td style={tdStyle}>
                <textarea
                  value={formData.message}
                  onChange={(e) => {
                    if (e.target.value.length <= 2000) {
                      setFormData({ ...formData, message: e.target.value });
                    }
                  }}
                  placeholder="メッセージ内容を入力してください。(最大2000文字)"
                  style={{
                    width: "100%",
                    minHeight: "400px",
                    resize: "vertical",
                    overflowY: "auto",
                    padding: "8px",
                    fontSize: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "4px",
                  }}
                >
                  {formData.message.length}/2000
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </main>

      {/* 社員リストモーダル */}
      {showEmployeeList && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              width: "400px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              padding: "20px",
            }}
          >
            {/* タイトル */}
            <h1
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "20px",
                margin: 0,
              }}
            >
              社員を選択
            </h1>

            {/* 検索バー */}
            <input
              type="text"
              placeholder="検索（名前またはID）"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              style={{
                width: "100%",
                height: "50px",
                marginBottom: "20px",
                borderRadius: "8px",
                fontSize: "16px",
                color: "#999",
                border: "1px solid #ccc",
                padding: "0 8px",
                boxSizing: "border-box",
              }}
            />

            {/* 候補リスト */}
            <div
              style={{
                overflowY: "auto",
                height: "200px",
                width: "100%",
                borderRadius: "8px",
                fontSize: "16px",
                color: "black",
                border: "1px solid #ccc",
                padding: "8px",
                boxSizing: "border-box",
                marginBottom: "20px",
              }}
            >
              {loadingEmployees ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                  }}
                >
                  読み込み中...
                </div>
              ) : employees.length > 0 ? (
                <div>
                  {employees
                    .filter((emp) => {
                      const q = employeeSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        (emp.userName || "").toLowerCase().includes(q) ||
                        (emp.userId || "").toLowerCase().includes(q)
                      );
                    })
                    .map((employee) => (
                      <label
                        key={employee.userId}
                        style={{
                          display: "block",
                          marginBottom: "8px",
                          cursor: "pointer",
                          border: "1px solid #eee",
                          borderRadius: "4px",
                          padding: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isEmployeeSelected(employee.userId)}
                            onChange={() => handleSelectEmployee(employee)}
                            style={{ cursor: "pointer", flex: "0 0 auto" }}
                          />
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <span style={{ fontSize: "14px" }}>
                              {employee.userName}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                  }}
                >
                  該当する社員がいません
                </div>
              )}
            </div>

            {/* 選択されている社員 */}
            <div
              style={{
                border: "1px solid #ccc",
                width: "100%",
                minHeight: "100px",
                marginBottom: "20px",
                borderRadius: "8px",
                fontSize: "16px",
                color: "#999",
                padding: "8px",
                boxSizing: "border-box",
                overflowY: "auto",
              }}
            >
              {formData.personalIds.length > 0 ? (
                <p style={{ margin: 0, wordBreak: "break-word" }}>
                  {formData.personal}
                </p>
              ) : (
                <p style={{ margin: 0, color: "#ccc" }}>
                  選択されている社員はいません
                </p>
              )}
            </div>

            {/* ボタン */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: "#999",
                  color: "white",
                  border: "none",
                  padding: "10px 25px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (formData.personalIds.length === 0) {
                    alert("社員を選択してください。");
                    return;
                  }
                  setShowEmployeeList(false);
                }}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "10px 25px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                完了
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        <button style={buttonStyleGreen} onClick={handleSubmit}>
          修正
        </button>
        <button
          style={buttonStyleBlue}
          onClick={() => router.push("/reservation-list")}
        >
          戻る
        </button>
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  height: "40px",
  padding: "8px",
  fontSize: "16px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  boxSizing: "border-box",
};

const buttonStyleGreen: React.CSSProperties = {
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  padding: "10px 25px",
  borderRadius: "8px",
  cursor: "pointer",
};

const buttonStyleBlue: React.CSSProperties = {
  backgroundColor: "rgb(52, 152, 219)",
  color: "white",
  border: "none",
  padding: "10px 25px",
  borderRadius: "8px",
  cursor: "pointer",
};
