// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDGpAHia_wEmrhnmYjrPf1n1TrAzwEMiAI",
    authDomain: "kaml-f8f69.firebaseapp.com",
    projectId: "kaml-f8f69",
    storageBucket: "kaml-f8f69.appspot.com",
    messagingSenderId: "381072997176",
    appId: "1:381072997176:web:d0da7037b9b1e8b3b8b3b8",
    measurementId: "G-ZZSZF3X7WC"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// متغيرات عامة
let currentRequest = null;
let requestId = null;

// تحميل البيانات عند بدء الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 بدء تحميل صفحة عرض الطلب...');
    
    // الحصول على معرف الطلب من URL
    const urlParams = new URLSearchParams(window.location.search);
    requestId = urlParams.get('id');
    
    console.log('🆔 معرف الطلب من URL:', requestId);
    
    if (!requestId) {
        showError('لم يتم تحديد معرف الطلب في الرابط');
        return;
    }

    loadRequestData();
});

// تحميل بيانات الطلب
async function loadRequestData() {
    try {
        console.log('🔄 بدء تحميل البيانات للطلب:', requestId);
        showLoader(true);

        // البحث في التخزين المحلي أولاً
        console.log('🔍 البحث في localStorage...');
        const localRequests = JSON.parse(localStorage.getItem('membershipApplications') || '[]');
        console.log('📊 عدد الطلبات في localStorage:', localRequests.length);
        
        // طباعة جميع المعرفات المتاحة للتشخيص
        console.log('🆔 المعرفات المتاحة:', localRequests.map(req => req.id));
        
        const foundRequest = localRequests.find(req => 
            String(req.id) === String(requestId) || 
            req.civil_id === requestId
        );
        
        if (foundRequest) {
            console.log('✅ تم العثور على البيانات في localStorage');
            console.log('📋 بيانات الطلب:', foundRequest);
            currentRequest = { ...foundRequest, source: 'localStorage' };
            displayRequestData();
            showLoader(false);
            return;
        }

        console.log('❌ لم يتم العثور على البيانات في localStorage');
        console.log('🔍 البحث في Firebase Firestore...');
        
        // البحث في Firebase Firestore
        try {
            if (typeof db !== 'undefined' && db) {
                console.log('🔄 محاولة الاتصال بـ Firestore...');
                
                // البحث في مجموعة requests
                const requestDoc = await Promise.race([
                    db.collection('requests').doc(requestId).get(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
                ]);
                
                if (requestDoc.exists) {
                    console.log('✅ تم العثور على البيانات في Firestore (requests)');
                    currentRequest = { id: requestDoc.id, ...requestDoc.data(), source: 'firestore-requests' };
                    displayRequestData();
                    showLoader(false);
                    return;
                }
                
                // البحث في مجموعة membershipApplications كبديل
                const appDoc = await Promise.race([
                    db.collection('membershipApplications').doc(requestId).get(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
                ]);
                
                if (appDoc.exists) {
                    console.log('✅ تم العثور على البيانات في Firestore (membershipApplications)');
                    currentRequest = { id: appDoc.id, ...appDoc.data(), source: 'firestore-applications' };
                    displayRequestData();
                    showLoader(false);
                    return;
                }
                
                console.log('❌ لا توجد بيانات في Firestore للمعرف:', requestId);
            } else {
                console.log('⚠️ Firestore غير متاح');
            }
        } catch (firebaseError) {
            console.log('⚠️ خطأ في Firestore:', firebaseError.message);
        }

        // إذا لم توجد البيانات في أي مكان
        console.log('❌ لم يتم العثور على البيانات في أي مكان');
        showError(`لم يتم العثور على الطلب المحدد (${requestId})`);
        showLoader(false);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        showError('حدث خطأ أثناء تحميل بيانات الطلب');
        showLoader(false);
    }
}

// عرض بيانات الطلب
function displayRequestData() {
    if (!currentRequest) {
        console.error('❌ لا توجد بيانات للعرض');
        return;
    }

    console.log('📋 عرض البيانات:', currentRequest);

    // البيانات الشخصية
    document.getElementById('fullName').textContent = getFullName(currentRequest) || 'غير محدد';
    document.getElementById('civilId').textContent = currentRequest.civil_id || 'غير محدد';
    document.getElementById('nationality').textContent = currentRequest.nationality || 'غير محدد';
    document.getElementById('birthDate').textContent = currentRequest.birth_date || 'غير محدد';

    // بيانات الاتصال
    document.getElementById('email').textContent = currentRequest.email || 'غير محدد';
    document.getElementById('phone').textContent = currentRequest.phone || 'غير محدد';
    document.getElementById('area').textContent = currentRequest.area || 'غير محدد';

    // البيانات المهنية
    document.getElementById('qualification').textContent = currentRequest.qualification || 'غير محدد';
    document.getElementById('specialization').textContent = currentRequest.specialization || 'غير محدد';
    document.getElementById('employer').textContent = currentRequest.employer || 'غير محدد';
    document.getElementById('membershipType').textContent = currentRequest.membership_type || 'غير محدد';

    // بيانات الطلب
    document.getElementById('requestId').textContent = currentRequest.id || 'غير محدد';
    document.getElementById('submissionDate').textContent = currentRequest.submission_date || 'غير محدد';
    
    // الحالة مع التنسيق
    const statusElement = document.getElementById('status');
    const status = currentRequest.status || 'pending';
    statusElement.innerHTML = getStatusBadge(status);

    // المرفقات
    displayAttachments(currentRequest);

    // إظهار التفاصيل وأزرار الإجراءات
    document.getElementById('requestDetails').style.display = 'block';
    document.getElementById('actionButtons').style.display = 'flex';

    console.log('✅ تم عرض البيانات بنجاح');
}

// الحصول على الاسم الكامل
function getFullName(request) {
    if (request.full_name) {
        return request.full_name;
    }
    
    const parts = [];
    if (request.first_name_ar) parts.push(request.first_name_ar);
    if (request.middle_name_ar) parts.push(request.middle_name_ar);
    if (request.last_name_ar) parts.push(request.last_name_ar);
    
    return parts.length > 0 ? parts.join(' ') : null;
}

// الحصول على شارة الحالة
function getStatusBadge(status) {
    const statusMap = {
        'pending': { text: 'في انتظار المراجعة', class: 'status-pending' },
        'approved': { text: 'مقبول', class: 'status-approved' },
        'rejected': { text: 'مرفوض', class: 'status-rejected' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-pending' };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// عرض المرفقات
function displayAttachments(request) {
    const attachmentsContainer = document.getElementById('attachments');
    
    const attachments = [];
    if (request.id_card_front) attachments.push({ name: 'صورة الهوية (الوجه الأمامي)', url: request.id_card_front });
    if (request.id_card_back) attachments.push({ name: 'صورة الهوية (الوجه الخلفي)', url: request.id_card_back });
    if (request.certificate) attachments.push({ name: 'الشهادة العلمية', url: request.certificate });
    if (request.cv) attachments.push({ name: 'السيرة الذاتية', url: request.cv });
    
    if (attachments.length === 0) {
        attachmentsContainer.innerHTML = '<p style="color: #666; font-style: italic;">لا توجد مرفقات</p>';
        return;
    }
    
    let attachmentsHTML = '<div class="info-grid">';
    attachments.forEach(attachment => {
        attachmentsHTML += `
            <div class="info-item">
                <div class="info-label">${attachment.name}</div>
                <div class="info-value">
                    <a href="${attachment.url}" target="_blank" style="color: #4a6cf7; text-decoration: none;">
                        📎 عرض الملف
                    </a>
                </div>
            </div>
        `;
    });
    attachmentsHTML += '</div>';
    
    attachmentsContainer.innerHTML = attachmentsHTML;
}

// قبول الطلب
async function approveRequest() {
    if (!currentRequest) {
        showError('لا توجد بيانات طلب للموافقة عليه');
        return;
    }

    if (!confirm('هل أنت متأكد من قبول هذا الطلب؟')) {
        return;
    }

    try {
        console.log('✅ بدء عملية قبول الطلب:', requestId);
        
        // تحديث الحالة في localStorage
        const localRequests = JSON.parse(localStorage.getItem('membershipApplications') || '[]');
        const requestIndex = localRequests.findIndex(req => String(req.id) === String(requestId));
        
        if (requestIndex !== -1) {
            localRequests[requestIndex].status = 'approved';
            localRequests[requestIndex].approval_date = new Date().toISOString();
            localStorage.setItem('membershipApplications', JSON.stringify(localRequests));
            console.log('✅ تم تحديث الحالة في localStorage');
        }

        // تحديث الحالة في Firebase إذا كان متاحاً
        try {
            if (typeof db !== 'undefined' && db) {
                await db.collection('requests').doc(requestId).update({
                    status: 'approved',
                    approval_date: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ تم تحديث الحالة في Firestore');
            }
        } catch (firebaseError) {
            console.log('⚠️ لم يتم التحديث في Firestore:', firebaseError.message);
        }

        // إضافة العضو إلى قائمة الأعضاء
        addToMembers(currentRequest);

        showSuccess('تم قبول الطلب بنجاح! سيتم إشعار المتقدم بالقرار.');
        
        // تحديث العرض
        currentRequest.status = 'approved';
        displayRequestData();
        
    } catch (error) {
        console.error('❌ خطأ في قبول الطلب:', error);
        showError('حدث خطأ أثناء قبول الطلب');
    }
}

// رفض الطلب
async function rejectRequest() {
    if (!currentRequest) {
        showError('لا توجد بيانات طلب للرفض');
        return;
    }

    const reason = prompt('يرجى إدخال سبب الرفض (اختياري):');
    
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
        return;
    }

    try {
        console.log('❌ بدء عملية رفض الطلب:', requestId);
        
        // تحديث الحالة في localStorage
        const localRequests = JSON.parse(localStorage.getItem('membershipApplications') || '[]');
        const requestIndex = localRequests.findIndex(req => String(req.id) === String(requestId));
        
        if (requestIndex !== -1) {
            localRequests[requestIndex].status = 'rejected';
            localRequests[requestIndex].rejection_date = new Date().toISOString();
            if (reason) localRequests[requestIndex].rejection_reason = reason;
            localStorage.setItem('membershipApplications', JSON.stringify(localRequests));
            console.log('✅ تم تحديث الحالة في localStorage');
        }

        // تحديث الحالة في Firebase إذا كان متاحاً
        try {
            if (typeof db !== 'undefined' && db) {
                const updateData = {
                    status: 'rejected',
                    rejection_date: firebase.firestore.FieldValue.serverTimestamp()
                };
                if (reason) updateData.rejection_reason = reason;
                
                await db.collection('requests').doc(requestId).update(updateData);
                console.log('✅ تم تحديث الحالة في Firestore');
            }
        } catch (firebaseError) {
            console.log('⚠️ لم يتم التحديث في Firestore:', firebaseError.message);
        }

        showSuccess('تم رفض الطلب. سيتم إشعار المتقدم بالقرار.');
        
        // تحديث العرض
        currentRequest.status = 'rejected';
        displayRequestData();
        
    } catch (error) {
        console.error('❌ خطأ في رفض الطلب:', error);
        showError('حدث خطأ أثناء رفض الطلب');
    }
}

// إضافة العضو إلى قائمة الأعضاء
function addToMembers(request) {
    try {
        const members = JSON.parse(localStorage.getItem('members') || '[]');
        
        // التحقق من عدم وجود العضو مسبقاً
        const existingMember = members.find(member => 
            member.civil_id === request.civil_id || 
            member.email === request.email
        );
        
        if (existingMember) {
            console.log('⚠️ العضو موجود مسبقاً في قائمة الأعضاء');
            return;
        }
        
        // إنشاء بيانات العضو الجديد
        const newMember = {
            id: request.id,
            civil_id: request.civil_id,
            full_name: getFullName(request),
            email: request.email,
            phone: request.phone,
            qualification: request.qualification,
            specialization: request.specialization,
            employer: request.employer,
            area: request.area,
            membership_type: request.membership_type,
            approval_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // سنة من الآن
            status: 'active',
            username: request.email?.split('@')[0] || `member_${request.civil_id}`,
            password: 'password123' // كلمة مرور افتراضية
        };
        
        members.push(newMember);
        localStorage.setItem('members', JSON.stringify(members));
        
        console.log('✅ تم إضافة العضو الجديد إلى قائمة الأعضاء');
        
    } catch (error) {
        console.error('❌ خطأ في إضافة العضو:', error);
    }
}

// العودة إلى لوحة التحكم
function goBack() {
    window.location.href = 'dashboard.html';
}

// إظهار/إخفاء مؤشر التحميل
function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
    }
}

// إظهار رسالة خطأ
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    // إخفاء العناصر الأخرى
    showLoader(false);
    document.getElementById('requestDetails').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'none';
    
    console.error('❌ خطأ:', message);
}

// إظهار رسالة نجاح
function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        
        // إخفاء الرسالة بعد 5 ثوان
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }
    
    console.log('✅ نجح:', message);
}

