# دليل التطوير والتخصيص 🛠️

## 📋 فهرس المحتويات

1. [إعداد البيئة](#إعداد-البيئة)
2. [إضافة صفحة جديدة](#إضافة-صفحة-جديدة)
3. [تعديل التصميم](#تعديل-التصميم)
4. [إضافة ميزات جديدة](#إضافة-ميزات-جديدة)
5. [إدارة قاعدة البيانات](#إدارة-قاعدة-البيانات)
6. [النشر والتحديث](#النشر-والتحديث)

## 🔧 إعداد البيئة

### متطلبات التطوير:
- محرر نصوص (VS Code, Sublime Text, إلخ)
- متصفح ويب حديث
- حساب Firebase (للبيانات)
- حساب GitHub (للنشر)

### الملفات الأساسية:
```
js/
├── firebase-data-manager.js    # إدارة Firebase
├── data-manager.js            # إدارة البيانات المحلية
└── cloud-data-manager.js      # مزامنة البيانات

css/
├── styles.css                 # التنسيقات الأساسية
└── responsive.css             # التصميم المتجاوب
```

## 📄 إضافة صفحة جديدة

### الخطوة 1: إنشاء ملف HTML
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عنوان الصفحة - الجمعية الكويتية للمختبرات الطبية</title>
    
    <!-- ربط ملفات CSS -->
    <link rel="stylesheet" href="css/styles.css">
    
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js"></script>
</head>
<body>
    <!-- محتوى الصفحة -->
    
    <!-- ربط ملفات JavaScript -->
    <script src="js/firebase-data-manager.js"></script>
    <script>
        // كود JavaScript الخاص بالصفحة
    </script>
</body>
</html>
```

### الخطوة 2: إضافة الرابط في القائمة
في `index.html`، أضف رابط الصفحة الجديدة:
```html
<a href="صفحتك-الجديدة.html" class="nav-link">اسم الصفحة</a>
```

## 🎨 تعديل التصميم

### الألوان الأساسية:
```css
:root {
    --primary-color: #2c5aa0;      /* الأزرق الأساسي */
    --secondary-color: #34d399;     /* الأخضر */
    --accent-color: #f59e0b;        /* البرتقالي */
    --danger-color: #ef4444;        /* الأحمر */
    --background-color: #f8fafc;    /* خلفية فاتحة */
    --text-color: #1f2937;          /* نص داكن */
}
```

### تعديل الألوان:
```css
/* تغيير اللون الأساسي */
.btn-primary {
    background: var(--primary-color);
    border-color: var(--primary-color);
}

/* إضافة لون جديد */
.btn-custom {
    background: #your-color;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
}
```

### تعديل الخطوط:
```css
body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 16px;
    line-height: 1.6;
}
```

## ⚡ إضافة ميزات جديدة

### إضافة حقل جديد في النموذج:

#### 1. في HTML:
```html
<div class="form-group">
    <label for="newField">الحقل الجديد *</label>
    <input type="text" id="newField" name="newField" required>
</div>
```

#### 2. في JavaScript:
```javascript
// إضافة الحقل عند حفظ البيانات
const formData = {
    // الحقول الموجودة...
    newField: document.getElementById('newField').value,
    // باقي الحقول...
};
```

### إضافة دالة جديدة:
```javascript
// دالة جديدة لمعالجة البيانات
function processNewFeature(data) {
    try {
        // معالجة البيانات
        console.log('معالجة الميزة الجديدة:', data);
        
        // حفظ في قاعدة البيانات
        firebaseManager.saveData('newCollection', data);
        
        // عرض رسالة نجاح
        showSuccessMessage('تم تنفيذ الميزة بنجاح');
    } catch (error) {
        console.error('خطأ في الميزة الجديدة:', error);
        showErrorMessage('حدث خطأ أثناء تنفيذ الميزة');
    }
}
```

## 🗄️ إدارة قاعدة البيانات

### إضافة مجموعة جديدة في Firebase:
```javascript
// إضافة بيانات جديدة
async function addNewData(collectionName, data) {
    try {
        await firebaseManager.saveData(collectionName, data);
        console.log('تم حفظ البيانات بنجاح');
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
    }
}

// قراءة البيانات
async function loadNewData(collectionName) {
    try {
        await firebaseManager.loadData(collectionName);
        const data = JSON.parse(localStorage.getItem(collectionName) || '[]');
        return data;
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        return [];
    }
}
```

### تعديل هيكل البيانات:
```javascript
// إضافة حقول جديدة للبيانات الموجودة
function updateDataStructure() {
    const existingData = JSON.parse(localStorage.getItem('members') || '[]');
    
    const updatedData = existingData.map(member => ({
        ...member,
        newField: 'قيمة افتراضية', // الحقل الجديد
        updatedAt: new Date().toISOString()
    }));
    
    localStorage.setItem('members', JSON.stringify(updatedData));
}
```

## 🚀 النشر والتحديث

### تحديث الموقع على GitHub:

#### 1. تحضير الملفات:
```bash
# تأكد من أن جميع التغييرات محفوظة
# اختبر الموقع محلياً قبل النشر
```

#### 2. رفع التحديثات:
1. اذهب إلى مستودع GitHub
2. اسحب الملفات المحدثة وأفلتها
3. اكتب وصف التحديث
4. انقر "Commit changes"

#### 3. التحقق من النشر:
- انتظر 2-5 دقائق
- زر الموقع للتأكد من التحديثات

### نصائح للتطوير:

#### اختبار محلي:
```javascript
// تفعيل وضع التطوير
const isDevelopment = window.location.hostname === 'localhost';

if (isDevelopment) {
    console.log('وضع التطوير مفعل');
    // إعدادات خاصة بالتطوير
}
```

#### إدارة الأخطاء:
```javascript
// دالة عامة لإدارة الأخطاء
function handleError(error, context = '') {
    console.error(`خطأ في ${context}:`, error);
    
    // عرض رسالة للمستخدم
    showErrorMessage(`حدث خطأ: ${error.message}`);
    
    // إرسال تقرير الخطأ (اختياري)
    // sendErrorReport(error, context);
}
```

## 📱 التصميم المتجاوب

### إضافة استعلامات الوسائط:
```css
/* للأجهزة المحمولة */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .btn {
        width: 100%;
        margin-bottom: 10px;
    }
}

/* للأجهزة اللوحية */
@media (min-width: 769px) and (max-width: 1024px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
```

## 🔐 الأمان

### حماية البيانات الحساسة:
```javascript
// تشفير البيانات الحساسة
function encryptSensitiveData(data) {
    // استخدم مكتبة تشفير مناسبة
    return btoa(JSON.stringify(data)); // تشفير بسيط للمثال
}

// فك تشفير البيانات
function decryptSensitiveData(encryptedData) {
    return JSON.parse(atob(encryptedData));
}
```

### التحقق من الصلاحيات:
```javascript
// التحقق من صلاحيات المستخدم
function checkUserPermissions(requiredRole) {
    const userRole = localStorage.getItem('userRole');
    
    if (userRole !== requiredRole) {
        showErrorMessage('ليس لديك صلاحية للوصول لهذه الصفحة');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}
```

## 📞 الحصول على المساعدة

إذا واجهت أي مشاكل أو احتجت مساعدة في التطوير:

1. راجع ملف `README.md` للمعلومات الأساسية
2. تحقق من console المتصفح للأخطاء
3. تأكد من اتصال Firebase
4. اختبر الميزات خطوة بخطوة

---

© 2025 دليل التطوير - نظام إدارة العضوية

