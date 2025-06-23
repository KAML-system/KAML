// مدير بيانات Firebase
// هذا الملف يحتوي على وظائف التعامل مع قاعدة بيانات Firebase

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBKvr6ZI_M_s_hk3Ch2ivWBuY5jSI9QxDo",
  authDomain: "kaml-membership-system.firebaseapp.com",
  projectId: "kaml-membership-system",
  storageBucket: "kaml-membership-system.firebasestorage.app",
  messagingSenderId: "1083658943439",
  appId: "1:1083658943439:web:f6a17e3bbdb6cd8feab0ba",
  measurementId: "G-ZZSZF3X7WC"
};

// تهيئة Firebase
let firebaseInitialized = false;
let db = null;

// دالة لتهيئة Firebase
async function initializeFirebase() {
    if (firebaseInitialized) return;
    
    try {
        // تحميل مكتبات Firebase من CDN
        await loadFirebaseScripts();
        
        // تهيئة Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log("تم تهيئة Firebase بنجاح");
        
        // مزامنة البيانات المحلية مع Firebase
        await syncLocalDataWithFirebase();
    } catch (error) {
        console.error("خطأ في تهيئة Firebase:", error);
        alert("حدث خطأ في الاتصال بقاعدة البيانات السحابية. سيتم استخدام التخزين المحلي كاحتياطي.");
    }
}

// دالة لتحميل مكتبات Firebase من CDN
function loadFirebaseScripts() {
    return new Promise((resolve, reject) => {
        // تحميل Firebase App
        const appScript = document.createElement('script');
        appScript.src = 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js';
        appScript.onload = () => {
            // تحميل Firestore
            const firestoreScript = document.createElement('script');
            firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js';
            firestoreScript.onload = resolve;
            firestoreScript.onerror = reject;
            document.head.appendChild(firestoreScript);
        };
        appScript.onerror = reject;
        document.head.appendChild(appScript);
    });
}

// دالة لمزامنة البيانات المحلية مع Firebase
async function syncLocalDataWithFirebase() {
    try {
        // الحصول على البيانات المحلية
        const localMembers = JSON.parse(localStorage.getItem('members')) || [];
        const localApplications = JSON.parse(localStorage.getItem('membershipApplications')) || [];
        
        // التحقق من وجود بيانات في Firebase
        const membersSnapshot = await db.collection('members').get();
        const applicationsSnapshot = await db.collection('applications').get();
        
        // إذا كانت قاعدة البيانات فارغة، قم بتحميل البيانات المحلية
        if (membersSnapshot.empty && localMembers.length > 0) {
            for (const member of localMembers) {
                await db.collection('members').doc(member.id.toString()).set(member);
            }
            console.log("تم مزامنة بيانات الأعضاء مع Firebase");
        }
        
        if (applicationsSnapshot.empty && localApplications.length > 0) {
            for (const application of localApplications) {
                await db.collection('applications').doc(application.id.toString()).set(application);
            }
            console.log("تم مزامنة بيانات طلبات العضوية مع Firebase");
        }
        
        // تحديث البيانات المحلية من Firebase
        await updateLocalDataFromFirebase();
    } catch (error) {
        console.error("خطأ في مزامنة البيانات:", error);
    }
}

// دالة لتحديث البيانات المحلية من Firebase
async function updateLocalDataFromFirebase() {
    try {
        // الحصول على بيانات الأعضاء من Firebase
        const membersSnapshot = await db.collection('members').get();
        const members = [];
        membersSnapshot.forEach(doc => {
            members.push(doc.data());
        });
        
        // الحصول على بيانات طلبات العضوية من Firebase
        const applicationsSnapshot = await db.collection('applications').get();
        const applications = [];
        applicationsSnapshot.forEach(doc => {
            applications.push(doc.data());
        });
        
        // تحديث البيانات المحلية
        localStorage.setItem('members', JSON.stringify(members));
        localStorage.setItem('membershipApplications', JSON.stringify(applications));
        
        console.log("تم تحديث البيانات المحلية من Firebase");
    } catch (error) {
        console.error("خطأ في تحديث البيانات المحلية:", error);
    }
}

// دالة للحصول على جميع الأعضاء
async function getAllMembers() {
    try {
        if (!firebaseInitialized) {
            // إذا لم يتم تهيئة Firebase، استخدم البيانات المحلية
            return JSON.parse(localStorage.getItem('members')) || [];
        }
        
        const membersSnapshot = await db.collection('members').get();
        const members = [];
        membersSnapshot.forEach(doc => {
            members.push(doc.data());
        });
        
        return members;
    } catch (error) {
        console.error("خطأ في الحصول على الأعضاء:", error);
        // استخدم البيانات المحلية كاحتياطي
        return JSON.parse(localStorage.getItem('members')) || [];
    }
}

// دالة للحصول على جميع طلبات العضوية
async function getAllApplications() {
    try {
        if (!firebaseInitialized) {
            // إذا لم يتم تهيئة Firebase، استخدم البيانات المحلية
            return JSON.parse(localStorage.getItem('membershipApplications')) || [];
        }
        
        const applicationsSnapshot = await db.collection('applications').get();
        const applications = [];
        applicationsSnapshot.forEach(doc => {
            applications.push(doc.data());
        });
        
        return applications;
    } catch (error) {
        console.error("خطأ في الحصول على طلبات العضوية:", error);
        // استخدم البيانات المحلية كاحتياطي
        return JSON.parse(localStorage.getItem('membershipApplications')) || [];
    }
}

// دالة لإضافة عضو جديد
async function addMember(member) {
    try {
        // تحديث البيانات المحلية أولاً
        const members = JSON.parse(localStorage.getItem('members')) || [];
        members.push(member);
        localStorage.setItem('members', JSON.stringify(members));
        
        // إذا تم تهيئة Firebase، قم بتحديث قاعدة البيانات
        if (firebaseInitialized) {
            await db.collection('members').doc(member.id.toString()).set(member);
            console.log("تم إضافة العضو إلى Firebase");
        }
        
        return true;
    } catch (error) {
        console.error("خطأ في إضافة العضو:", error);
        return false;
    }
}

// دالة لتحديث عضو
async function updateMember(member) {
    try {
        // تحديث البيانات المحلية أولاً
        const members = JSON.parse(localStorage.getItem('members')) || [];
        const index = members.findIndex(m => m.id === member.id);
        if (index !== -1) {
            members[index] = member;
            localStorage.setItem('members', JSON.stringify(members));
        }
        
        // إذا تم تهيئة Firebase، قم بتحديث قاعدة البيانات
        if (firebaseInitialized) {
            await db.collection('members').doc(member.id.toString()).set(member);
            console.log("تم تحديث العضو في Firebase");
        }
        
        return true;
    } catch (error) {
        console.error("خطأ في تحديث العضو:", error);
        return false;
    }
}

// دالة لإضافة طلب عضوية جديد
async function addApplication(application) {
    try {
        // تحديث البيانات المحلية أولاً
        const applications = JSON.parse(localStorage.getItem('membershipApplications')) || [];
        applications.push(application);
        localStorage.setItem('membershipApplications', JSON.stringify(applications));
        
        // إذا تم تهيئة Firebase، قم بتحديث قاعدة البيانات
        if (firebaseInitialized) {
            await db.collection('applications').doc(application.id.toString()).set(application);
            console.log("تم إضافة طلب العضوية إلى Firebase");
        }
        
        return true;
    } catch (error) {
        console.error("خطأ في إضافة طلب العضوية:", error);
        return false;
    }
}

// دالة لتحديث طلب عضوية
async function updateApplication(application) {
    try {
        // تحديث البيانات المحلية أولاً
        const applications = JSON.parse(localStorage.getItem('membershipApplications')) || [];
        const index = applications.findIndex(a => a.id === application.id);
        if (index !== -1) {
            applications[index] = application;
            localStorage.setItem('membershipApplications', JSON.stringify(applications));
        }
        
        // إذا تم تهيئة Firebase، قم بتحديث قاعدة البيانات
        if (firebaseInitialized) {
            await db.collection('applications').doc(application.id.toString()).set(application);
            console.log("تم تحديث طلب العضوية في Firebase");
        }
        
        return true;
    } catch (error) {
        console.error("خطأ في تحديث طلب العضوية:", error);
        return false;
    }
}

// دالة لتصدير البيانات كملف JSON
function exportData() {
    try {
        const members = JSON.parse(localStorage.getItem('members')) || [];
        const applications = JSON.parse(localStorage.getItem('membershipApplications')) || [];
        
        const data = {
            members: members,
            applications: applications,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'membership-system-backup-' + new Date().toISOString().split('T')[0] + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        return true;
    } catch (error) {
        console.error("خطأ في تصدير البيانات:", error);
        return false;
    }
}

// دالة لاستيراد البيانات من ملف JSON
async function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        if (!data.members || !data.applications) {
            throw new Error("تنسيق البيانات غير صحيح");
        }
        
        // تحديث البيانات المحلية
        localStorage.setItem('members', JSON.stringify(data.members));
        localStorage.setItem('membershipApplications', JSON.stringify(data.applications));
        
        // إذا تم تهيئة Firebase، قم بتحديث قاعدة البيانات
        if (firebaseInitialized) {
            // حذف البيانات الحالية
            const membersSnapshot = await db.collection('members').get();
            membersSnapshot.forEach(doc => {
                doc.ref.delete();
            });
            
            const applicationsSnapshot = await db.collection('applications').get();
            applicationsSnapshot.forEach(doc => {
                doc.ref.delete();
            });
            
            // إضافة البيانات الجديدة
            for (const member of data.members) {
                await db.collection('members').doc(member.id.toString()).set(member);
            }
            
            for (const application of data.applications) {
                await db.collection('applications').doc(application.id.toString()).set(application);
            }
            
            console.log("تم تحديث قاعدة بيانات Firebase");
        }
        
        return true;
    } catch (error) {
        console.error("خطأ في استيراد البيانات:", error);
        return false;
    }
}

// دالة للنسخ الاحتياطي التلقائي إلى Firebase
async function backupToFirebase() {
    try {
        if (!firebaseInitialized) return false;
        
        const members = JSON.parse(localStorage.getItem('members')) || [];
        const applications = JSON.parse(localStorage.getItem('membershipApplications')) || [];
        
        const backupData = {
            members: members,
            applications: applications,
            timestamp: new Date().toISOString()
        };
        
        await db.collection('backups').doc(new Date().toISOString()).set(backupData);
        console.log("تم إنشاء نسخة احتياطية في Firebase");
        
        return true;
    } catch (error) {
        console.error("خطأ في النسخ الاحتياطي:", error);
        return false;
    }
}

// دالة لاستعادة النسخة الاحتياطية من Firebase
async function restoreFromFirebase(backupId) {
    try {
        if (!firebaseInitialized) return false;
        
        const backupDoc = await db.collection('backups').doc(backupId).get();
        
        if (!backupDoc.exists) {
            throw new Error("النسخة الاحتياطية غير موجودة");
        }
        
        const backupData = backupDoc.data();
        
        // تحديث البيانات المحلية
        localStorage.setItem('members', JSON.stringify(backupData.members));
        localStorage.setItem('membershipApplications', JSON.stringify(backupData.applications));
        
        // تحديث قاعدة البيانات
        // حذف البيانات الحالية
        const membersSnapshot = await db.collection('members').get();
        membersSnapshot.forEach(doc => {
            doc.ref.delete();
        });
        
        const applicationsSnapshot = await db.collection('applications').get();
        applicationsSnapshot.forEach(doc => {
            doc.ref.delete();
        });
        
        // إضافة البيانات الجديدة
        for (const member of backupData.members) {
            await db.collection('members').doc(member.id.toString()).set(member);
        }
        
        for (const application of backupData.applications) {
            await db.collection('applications').doc(application.id.toString()).set(application);
        }
        
        console.log("تم استعادة النسخة الاحتياطية من Firebase");
        
        return true;
    } catch (error) {
        console.error("خطأ في استعادة النسخة الاحتياطية:", error);
        return false;
    }
}

// دالة للحصول على قائمة النسخ الاحتياطية
async function getBackupsList() {
    try {
        if (!firebaseInitialized) return [];
        
        const backupsSnapshot = await db.collection('backups').orderBy('timestamp', 'desc').get();
        const backups = [];
        
        backupsSnapshot.forEach(doc => {
            backups.push({
                id: doc.id,
                timestamp: doc.data().timestamp,
                membersCount: doc.data().members.length,
                applicationsCount: doc.data().applications.length
            });
        });
        
        return backups;
    } catch (error) {
        console.error("خطأ في الحصول على قائمة النسخ الاحتياطية:", error);
        return [];
    }
}

// تصدير الدوال
window.firebaseDataManager = {
    initializeFirebase,
    getAllMembers,
    getAllApplications,
    addMember,
    updateMember,
    addApplication,
    updateApplication,
    exportData,
    importData,
    backupToFirebase,
    restoreFromFirebase,
    getBackupsList
};
