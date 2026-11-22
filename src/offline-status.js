export function connectionStatusText(isOnline) {
  return isOnline
    ? 'متصل بالإنترنت · ستُحفظ الملفات المتاحة للاستخدام دون اتصال'
    : 'غير متصل · يمكنك فتح الملفات التي سبق حفظها على الجهاز';
}
