import React, { useState } from 'react';
import { X, ShieldAlert, RefreshCw } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, targetType, targetId, onSuccess, onError }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reasons = targetType === 'post' 
    ? ['Spam / Quảng cáo quá đà', 'Nội dung phản cảm / Nhạy cảm', 'Bạo lực / Nguy hiểm', 'Ngôn từ gây thù ghét', 'Thông tin sai lệch / Lừa đảo', 'Khác']
    : ['Spam / Quấy rối', 'Tài khoản giả mạo', 'Hành vi lừa đảo', 'Ngôn từ thô tục', 'Khác'];

  // Đặt giá trị lý do mặc định nếu chưa chọn
  if (!reason && reasons.length > 0) {
    setReason(reasons[0]);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) {
      onError('Vui lòng đăng nhập để thực hiện tố cáo.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi gửi báo cáo');
      }

      onSuccess(data.message || 'Báo cáo vi phạm đã được gửi thành công.');
      onClose();
      // Reset form
      setDetails('');
    } catch (err) {
      onError(err.message || 'Gửi báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#f44336]">
            <ShieldAlert size={20} strokeWidth={2.5} />
            <h3 className="font-black text-base text-gray-900">
              {targetType === 'post' ? 'Tố cáo bài viết' : 'Tố cáo tài khoản'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Lý do tố cáo
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {reasons.map((r) => (
                <label 
                  key={r} 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[13px] font-bold cursor-pointer transition-all
                    ${reason === r 
                      ? 'border-[#f44336] bg-red-50/20 text-[#f44336]' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-gray-50/30'}`}
                >
                  <input 
                    type="radio" 
                    name="reason" 
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-[#f44336] h-4 w-4"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Chi tiết bổ sung (không bắt buộc)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Cung cấp thêm thông tin giúp ban quản trị hiểu rõ hơn hành vi vi phạm..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f44336]/20 focus:border-[#f44336] resize-none h-24 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-[14px] transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-[#f44336] hover:bg-red-600 text-white rounded-xl font-bold text-[14px] transition-colors shadow-md shadow-red-500/10 flex items-center justify-center gap-2"
            >
              {submitting && <RefreshCw size={14} className="animate-spin" />}
              Gửi báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
