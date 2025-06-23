# تحديث هيكل النظام المحسن

## المتطلبات الجديدة:

### 1. مسار الإدارة:
- إدخال بيانات الأعضاء القدامى
- مراجعة واعتماد طلبات الأعضاء الجدد
- عرض جميع بيانات الأعضاء
- تعديل وإدارة البيانات

### 2. مسار العضو الفردي:
- تسجيل دخول شخصي
- عرض البيانات الشخصية فقط
- تحديث البيانات مرة واحدة فقط

## هيكل قاعدة البيانات المحدث:

### جدول الأعضاء (members):
- id: معرف فريد
- membershipNumber: رقم العضوية
- firstNameAr: الاسم الأول (عربي)
- middleNameAr: الاسم الأوسط (عربي)
- lastNameAr: اسم العائلة (عربي)
- firstNameEn: الاسم الأول (إنجليزي)
- middleNameEn: الاسم الأوسط (إنجليزي)
- lastNameEn: اسم العائلة (إنجليزي)
- civilId: الرقم المدني
- email: البريد الإلكتروني
- phone: رقم الهاتف
- address: العنوان
- nationality: الجنسية
- birthDate: تاريخ الميلاد
- gender: الجنس
- degree: المؤهل العلمي
- specialization: التخصص
- workplace: جهة العمل
- position: المنصب
- experience: سنوات الخبرة
- membershipType: نوع العضوية
- status: الحالة (active, pending, rejected)
- password: كلمة المرور (مشفرة)
- canUpdateData: هل يمكن تحديث البيانات
- registrationDate: تاريخ التسجيل
- approvalDate: تاريخ الموافقة
- addedBy: مضاف بواسطة (admin/self)

### جدول طلبات العضوية (applications):
- نفس بيانات الأعضاء ولكن للطلبات المعلقة

## أنواع المستخدمين:
1. admin: الإدارة
2. member: العضو العادي

## الصفحات المطلوبة:
1. admin-add-member.html: إضافة عضو قديم
2. member-login.html: تسجيل دخول العضو
3. member-profile.html: عرض البيانات الشخصية
4. member-update.html: تحديث البيانات (مرة واحدة)
5. تحديث dashboard.html: لإدارة الأعضاء والطلبات

