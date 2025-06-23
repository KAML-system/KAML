// نظام قاعدة البيانات السحابية الآمنة
// Firebase Cloud Database System

class CloudDataManager {
    constructor() {
        this.isInitialized = false;
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        
        // إعدادات Firebase المحدثة
        this.firebaseConfig = {
            apiKey: "AIzaSyBKh15BmMaieMO3-yQx3ittSgYQBqwNQvM",
            authDomain: "kaml-membership-system.firebaseapp.com",
            projectId: "kaml-membership-system",
            storageBucket: "kaml-membership-system.appspot.com",
            messagingSenderId: "954178920193",
            appId: "1:954178920193:web:a7e8f3d7a54b4a67d8e951"
        };
        
        this.init();
    }

    // تهيئة Firebase
    async init() {
        try {
            console.log('🔄 تهيئة قاعدة البيانات السحابية...');
            
            // تحميل Firebase SDK
            await this.loadFirebaseSDK();
            
            // تهيئة Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            
            // تهيئة Firestore
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            
            // إعدادات الأمان
            this.db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
            
            // تمكين الحفظ المحلي للعمل بدون إنترنت
            this.db.enablePersistence({
                synchronizeTabs: true
            }).catch((err) => {
                console.warn('تحذير: لا يمكن تمكين الحفظ المحلي:', err);
            });
            
            this.isInitialized = true;
            console.log('✅ تم تهيئة قاعدة البيانات السحابية بنجاح');
            
            // مراقبة حالة المصادقة
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ تم تسجيل الدخول:', user.email);
                } else {
                    console.log('❌ لم يتم تسجيل الدخول');
                }
            });
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة قاعدة البيانات السحابية:', error);
            throw error;
        }
    }

    // تحميل Firebase SDK
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            if (typeof firebase !== 'undefined') {
                resolve();
                return;
            }
            
            // تحميل Firebase Core
            const script1 = document.createElement('script');
            script1.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js';
            script1.onload = () => {
                // تحميل Firestore
                const script2 = document.createElement('script');
                script2.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js';
                script2.onload = () => {
                    // تحميل Auth
                    const script3 = document.createElement('script');
                    script3.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js';
                    script3.onload = () => resolve();
                    script3.onerror = () => reject(new Error('فشل تحميل Firebase Auth'));
                    document.head.appendChild(script3);
                };
                script2.onerror = () => reject(new Error('فشل تحميل Firebase Firestore'));
                document.head.appendChild(script2);
            };
            script1.onerror = () => reject(new Error('فشل تحميل Firebase Core'));
            document.head.appendChild(script1);
        });
    }

    // تسجيل دخول المدير
    async adminLogin(email, password) {
        try {
            await this.ensureInitialized();
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            
            // التحقق من صلاحيات المدير
            const adminDoc = await this.db.collection('admins').doc(this.currentUser.uid).get();
            if (!adminDoc.exists) {
                await this.auth.signOut();
                throw new Error('ليس لديك صلاحيات إدارية');
            }
            
            console.log('✅ تم تسجيل دخول المدير بنجاح');
            return {
                success: true,
                user: this.currentUser,
                adminData: adminDoc.data()
            };
        } catch (error) {
            console.error('❌ خطأ في تسجيل دخول المدير:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // تسجيل دخول العضو
    async memberLogin(username, password) {
        try {
            await this.ensureInitialized();
            
            // البحث عن العضو بالاسم المستخدم
            const memberQuery = await this.db.collection('members')
                .where('username', '==', username)
                .where('password', '==', password) // في الإنتاج، استخدم hash
                .get();
            
            if (memberQuery.empty) {
                throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
            }
            
            const memberDoc = memberQuery.docs[0];
            const memberData = memberDoc.data();
            
            console.log('✅ تم تسجيل دخول العضو بنجاح');
            return {
                success: true,
                member: {
                    id: memberDoc.id,
                    ...memberData
                }
            };
        } catch (error) {
            console.error('❌ خطأ في تسجيل دخول العضو:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // حفظ عضو جديد
    async saveMember(memberData) {
        try {
            await this.ensureInitialized();
            this.requireAuth();
            
            // إضافة معلومات إضافية
            memberData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            memberData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            memberData.createdBy = this.currentUser?.uid || 'system';
            
            // حفظ في Firestore
            const docRef = await this.db.collection('members').add(memberData);
            
            console.log('✅ تم حفظ العضو في السحابة بنجاح:', docRef.id);
            
            // إنشاء سجل للعملية
            await this.logActivity('member_created', {
                memberId: docRef.id,
                membershipNumber: memberData.membershipNumber
            });
            
            return {
                success: true,
                id: docRef.id
            };
        } catch (error) {
            console.error('❌ خطأ في حفظ العضو:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // استرجاع جميع الأعضاء
    async getAllMembers() {
        try {
            await this.ensureInitialized();
            
            const snapshot = await this.db.collection('members')
                .orderBy('createdAt', 'desc')
                .get();
            
            const members = [];
            snapshot.forEach(doc => {
                members.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ تم استرجاع الأعضاء من السحابة:', members.length);
            return members;
        } catch (error) {
            console.error('❌ خطأ في استرجاع الأعضاء:', error);
            return [];
        }
    }

    // البحث عن عضو بالرقم
    async getMemberByNumber(membershipNumber) {
        try {
            await this.ensureInitialized();
            
            const snapshot = await this.db.collection('members')
                .where('membershipNumber', '==', membershipNumber)
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('❌ خطأ في البحث عن العضو:', error);
            return null;
        }
    }

    // تحديث بيانات عضو
    async updateMember(memberId, updateData) {
        try {
            await this.ensureInitialized();
            this.requireAuth();
            
            updateData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            updateData.updatedBy = this.currentUser?.uid || 'system';
            
            await this.db.collection('members').doc(memberId).update(updateData);
            
            console.log('✅ تم تحديث العضو في السحابة بنجاح');
            
            await this.logActivity('member_updated', {
                memberId: memberId
            });
            
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في تحديث العضو:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // حذف عضو
    async deleteMember(memberId) {
        try {
            await this.ensureInitialized();
            this.requireAuth();
            
            await this.db.collection('members').doc(memberId).delete();
            
            console.log('✅ تم حذف العضو من السحابة بنجاح');
            
            await this.logActivity('member_deleted', {
                memberId: memberId
            });
            
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في حذف العضو:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // حفظ طلب عضوية
    async saveApplication(applicationData) {
        try {
            await this.ensureInitialized();
            
            applicationData.submissionDate = firebase.firestore.FieldValue.serverTimestamp();
            applicationData.status = 'pending';
            
            const docRef = await this.db.collection('applications').add(applicationData);
            
            console.log('✅ تم حفظ طلب العضوية في السحابة بنجاح');
            return {
                success: true,
                id: docRef.id
            };
        } catch (error) {
            console.error('❌ خطأ في حفظ طلب العضوية:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // استرجاع جميع طلبات العضوية
    async getAllApplications() {
        try {
            await this.ensureInitialized();
            
            const snapshot = await this.db.collection('applications')
                .orderBy('submissionDate', 'desc')
                .get();
            
            const applications = [];
            snapshot.forEach(doc => {
                applications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ تم استرجاع طلبات العضوية من السحابة:', applications.length);
            return applications;
        } catch (error) {
            console.error('❌ خطأ في استرجاع طلبات العضوية:', error);
            return [];
        }
    }

    // الموافقة على طلب عضوية
    async approveApplication(applicationId, membershipData) {
        try {
            await this.ensureInitialized();
            this.requireAuth();
            
            // تحديث حالة الطلب
            await this.db.collection('applications').doc(applicationId).update({
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                approvedBy: this.currentUser.uid
            });
            
            // إنشاء عضو جديد
            const memberResult = await this.saveMember(membershipData);
            
            console.log('✅ تم الموافقة على طلب العضوية بنجاح');
            return memberResult;
        } catch (error) {
            console.error('❌ خطأ في الموافقة على طلب العضوية:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // رفض طلب عضوية
    async rejectApplication(applicationId, reason) {
        try {
            await this.ensureInitialized();
            this.requireAuth();
            
            await this.db.collection('applications').doc(applicationId).update({
                status: 'rejected',
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
                rejectedBy: this.currentUser.uid,
                rejectionReason: reason
            });
            
            console.log('✅ تم رفض طلب العضوية بنجاح');
            return { success: true };
        } catch (error) {
            console.error('❌ خطأ في رفض طلب العضوية:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // تسجيل نشاط
    async logActivity(action, details) {
        try {
            await this.db.collection('activity_logs').add({
                action: action,
                details: details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userId: this.currentUser?.uid || 'anonymous',
                userEmail: this.currentUser?.email || 'unknown'
            });
        } catch (error) {
            console.error('❌ خطأ في تسجيل النشاط:', error);
        }
    }

    // مراقبة التحديثات المباشرة
    watchMembers(callback) {
        return this.db.collection('members')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const members = [];
                snapshot.forEach(doc => {
                    members.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(members);
            });
    }

    // مراقبة طلبات العضوية
    watchApplications(callback) {
        return this.db.collection('applications')
            .orderBy('submissionDate', 'desc')
            .onSnapshot((snapshot) => {
                const applications = [];
                snapshot.forEach(doc => {
                    applications.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(applications);
            });
    }

    // نسخ احتياطية تلقائية
    async createBackup() {
        try {
            const members = await this.getAllMembers();
            const applications = await this.getAllApplications();
            
            const backupData = {
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                data: {
                    members,
                    applications
                },
                createdBy: this.currentUser?.uid || 'system'
            };
            
            await this.db.collection('backups').add(backupData);
            console.log('✅ تم إنشاء نسخة احتياطية في السحابة');
        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
        }
    }

    // التأكد من التهيئة
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.init();
        }
    }

    // التأكد من المصادقة
    requireAuth() {
        if (!this.currentUser) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            console.log('✅ تم تسجيل الخروج بنجاح');
        } catch (error) {
            console.error('❌ خطأ في تسجيل الخروج:', error);
        }
    }
}

// إنشاء مثيل عام لإدارة البيانات السحابية
window.cloudDataManager = new CloudDataManager();

// تصدير الكلاس
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudDataManager;
}

