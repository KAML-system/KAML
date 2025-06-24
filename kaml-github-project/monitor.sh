#!/bin/bash

# مراقب الموقع - الجمعية الكويتية للمختبرات الطبية
# يتحقق من حالة الموقع كل دقيقة ويعيد تشغيله إذا لزم الأمر

LOG_FILE="/home/ubuntu/secure-website/monitor.log"
SERVICE_NAME="kaml-website.service"
PORT=5002

# دالة كتابة السجل
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# دالة فحص الخدمة
check_service() {
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        return 0
    else
        return 1
    fi
}

# دالة فحص المنفذ
check_port() {
    if netstat -tlnp | grep -q ":$PORT "; then
        return 0
    else
        return 1
    fi
}

# دالة إعادة تشغيل الخدمة
restart_service() {
    log_message "إعادة تشغيل الخدمة..."
    sudo systemctl restart "$SERVICE_NAME"
    sleep 5
    if check_service && check_port; then
        log_message "تم إعادة تشغيل الخدمة بنجاح"
        return 0
    else
        log_message "فشل في إعادة تشغيل الخدمة"
        return 1
    fi
}

# الفحص الرئيسي
main() {
    if ! check_service; then
        log_message "الخدمة متوقفة - محاولة إعادة التشغيل"
        restart_service
    elif ! check_port; then
        log_message "المنفذ $PORT غير متاح - محاولة إعادة التشغيل"
        restart_service
    else
        log_message "الموقع يعمل بشكل طبيعي"
    fi
}

# تشغيل الفحص
main

