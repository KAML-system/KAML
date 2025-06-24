#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import os
import sys
import datetime

# تحديد المنفذ والمجلد
PORT = 5002
DIRECTORY = "/home/ubuntu/secure-website"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # إضافة headers للأمان وتحسين الأداء
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        super().end_headers()
    
    def log_message(self, format, *args):
        # تسجيل مخصص للطلبات
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {format % args}")

def main():
    # التأكد من وجود المجلد
    if not os.path.exists(DIRECTORY):
        print(f"خطأ: المجلد {DIRECTORY} غير موجود")
        sys.exit(1)
    
    # تغيير المجلد الحالي
    os.chdir(DIRECTORY)
    
    # إنشاء الخادم
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🚀 تم تشغيل خادم الجمعية الكويتية للمختبرات الطبية")
        print(f"📍 العنوان: http://localhost:{PORT}")
        print(f"📁 المجلد: {DIRECTORY}")
        print(f"⏰ الوقت: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        print("للإيقاف: اضغط Ctrl+C")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 تم إيقاف الخادم بواسطة المستخدم")
        except Exception as e:
            print(f"❌ خطأ في الخادم: {e}")
        finally:
            httpd.shutdown()
            print("✅ تم إغلاق الخادم بنجاح")

if __name__ == "__main__":
    main()

