// نظام إدارة قاعدة البيانات المحلية الدائمة
// Database Management System - Permanent Local Storage

class PermanentDataManager {
    constructor() {
        this.dbName = 'KAMLMembershipDB';
        this.dbVersion = 1;
        this.db = null;
        this.isInitialized = false;
        
        // جداول قاعدة البيانات
        this.stores = {
            members: 'members',
            applications: 'applications',
            renewalRequests: 'renewalRequests',
            settings: 'settings',
            backups: 'backups'
        };
        
        this.init();
    }

    // تهيئة قاعدة البيانات
    async init() {
        try {
            console.log('🔄 تهيئة قاعدة البيانات المحلية...');
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.error('❌ خطأ في فتح قاعدة البيانات:', request.error);
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    this.db = request.result;
                    this.isInitialized = true;
                    console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
                    
                    // إنشاء نسخة احتياطية تلقائية
                    this.createAutoBackup();
                    resolve(this.db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    console.log('🔧 إنشاء جداول قاعدة البيانات...');
                    
                    // جدول الأعضاء
                    if (!db.objectStoreNames.contains(this.stores.members)) {
                        const membersStore = db.createObjectStore(this.stores.members, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        membersStore.createIndex('membershipNumber', 'membershipNumber', { unique: true });
                        membersStore.createIndex('username', 'username', { unique: true });
                        membersStore.createIndex('email', 'email', { unique: false });
                        membersStore.createIndex('status', 'status', { unique: false });
                    }
                    
                    // جدول طلبات العضوية
                    if (!db.objectStoreNames.contains(this.stores.applications)) {
                        const applicationsStore = db.createObjectStore(this.stores.applications, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        applicationsStore.createIndex('status', 'status', { unique: false });
                        applicationsStore.createIndex('submissionDate', 'submissionDate', { unique: false });
                    }
                    
                    // جدول طلبات التجديد
                    if (!db.objectStoreNames.contains(this.stores.renewalRequests)) {
                        const renewalStore = db.createObjectStore(this.stores.renewalRequests, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        renewalStore.createIndex('membershipNumber', 'membershipNumber', { unique: false });
                        renewalStore.createIndex('status', 'status', { unique: false });
                    }
                    
                    // جدول الإعدادات
                    if (!db.objectStoreNames.contains(this.stores.settings)) {
                        db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                    }
                    
                    // جدول النسخ الاحتياطية
                    if (!db.objectStoreNames.contains(this.stores.backups)) {
                        const backupsStore = db.createObjectStore(this.stores.backups, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        backupsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    }
                };
            });
        } catch (error) {
            console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
            throw error;
        }
    }

    // التأكد من تهيئة قاعدة البيانات
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.init();
        }
        return this.db;
    }

    // حفظ عضو جديد
    async saveMember(memberData) {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.members], 'readwrite');
            const store = transaction.objectStore(this.stores.members);
            
            // إضافة معرف فريد وتاريخ الإنشاء
            memberData.createdAt = new Date().toISOString();
            memberData.updatedAt = new Date().toISOString();
            
            const result = await new Promise((resolve, reject) => {
                const request = store.add(memberData);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            
            console.log('✅ تم حفظ العضو بنجاح:', result);
            
            // إنشاء نسخة احتياطية بعد الحفظ
            await this.createBackup('member_added');
            
            return result;
        } catch (error) {
            console.error('❌ خطأ في حفظ العضو:', error);
            throw error;
        }
    }

    // استرجاع جميع الأعضاء
    async getAllMembers() {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.members], 'readonly');
            const store = transaction.objectStore(this.stores.members);
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    console.log('✅ تم استرجاع الأعضاء:', request.result.length);
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في استرجاع الأعضاء:', error);
            return [];
        }
    }

    // البحث عن عضو بالرقم
    async getMemberByNumber(membershipNumber) {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.members], 'readonly');
            const store = transaction.objectStore(this.stores.members);
            const index = store.index('membershipNumber');
            
            return new Promise((resolve, reject) => {
                const request = index.get(membershipNumber);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في البحث عن العضو:', error);
            return null;
        }
    }

    // تحديث بيانات عضو
    async updateMember(memberData) {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.members], 'readwrite');
            const store = transaction.objectStore(this.stores.members);
            
            memberData.updatedAt = new Date().toISOString();
            
            return new Promise((resolve, reject) => {
                const request = store.put(memberData);
                request.onsuccess = () => {
                    console.log('✅ تم تحديث العضو بنجاح');
                    this.createBackup('member_updated');
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في تحديث العضو:', error);
            throw error;
        }
    }

    // حذف عضو
    async deleteMember(memberId) {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.members], 'readwrite');
            const store = transaction.objectStore(this.stores.members);
            
            return new Promise((resolve, reject) => {
                const request = store.delete(memberId);
                request.onsuccess = () => {
                    console.log('✅ تم حذف العضو بنجاح');
                    this.createBackup('member_deleted');
                    resolve(true);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في حذف العضو:', error);
            throw error;
        }
    }

    // حفظ طلب عضوية
    async saveApplication(applicationData) {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.applications], 'readwrite');
            const store = transaction.objectStore(this.stores.applications);
            
            applicationData.submissionDate = new Date().toISOString();
            applicationData.status = 'pending';
            
            return new Promise((resolve, reject) => {
                const request = store.add(applicationData);
                request.onsuccess = () => {
                    console.log('✅ تم حفظ طلب العضوية بنجاح');
                    this.createBackup('application_added');
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في حفظ طلب العضوية:', error);
            throw error;
        }
    }

    // استرجاع جميع طلبات العضوية
    async getAllApplications() {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.applications], 'readonly');
            const store = transaction.objectStore(this.stores.applications);
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    console.log('✅ تم استرجاع طلبات العضوية:', request.result.length);
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في استرجاع طلبات العضوية:', error);
            return [];
        }
    }

    // إنشاء نسخة احتياطية
    async createBackup(reason = 'manual') {
        try {
            await this.ensureInitialized();
            
            // جمع جميع البيانات
            const members = await this.getAllMembers();
            const applications = await this.getAllApplications();
            const renewalRequests = await this.getAllRenewalRequests();
            
            const backupData = {
                timestamp: new Date().toISOString(),
                reason: reason,
                data: {
                    members,
                    applications,
                    renewalRequests
                },
                version: this.dbVersion
            };
            
            // حفظ النسخة الاحتياطية
            const transaction = this.db.transaction([this.stores.backups], 'readwrite');
            const store = transaction.objectStore(this.stores.backups);
            
            return new Promise((resolve, reject) => {
                const request = store.add(backupData);
                request.onsuccess = () => {
                    console.log('✅ تم إنشاء نسخة احتياطية بنجاح');
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
        }
    }

    // إنشاء نسخة احتياطية تلقائية
    async createAutoBackup() {
        // إنشاء نسخة احتياطية كل ساعة
        setInterval(() => {
            this.createBackup('auto');
        }, 60 * 60 * 1000); // كل ساعة
        
        // إنشاء نسخة احتياطية عند إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            this.createBackup('page_close');
        });
    }

    // تصدير البيانات
    async exportData() {
        try {
            const members = await this.getAllMembers();
            const applications = await this.getAllApplications();
            const renewalRequests = await this.getAllRenewalRequests();
            
            const exportData = {
                exportDate: new Date().toISOString(),
                version: this.dbVersion,
                data: {
                    members,
                    applications,
                    renewalRequests
                }
            };
            
            // تحويل إلى JSON وتحميل
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `kaml_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('✅ تم تصدير البيانات بنجاح');
            return true;
        } catch (error) {
            console.error('❌ خطأ في تصدير البيانات:', error);
            return false;
        }
    }

    // استيراد البيانات
    async importData(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (!importData.data) {
                throw new Error('ملف البيانات غير صحيح');
            }
            
            // مسح البيانات الحالية (اختياري)
            const confirmClear = confirm('هل تريد مسح البيانات الحالية قبل الاستيراد؟');
            if (confirmClear) {
                await this.clearAllData();
            }
            
            // استيراد الأعضاء
            if (importData.data.members) {
                for (const member of importData.data.members) {
                    delete member.id; // إزالة المعرف للسماح بإنشاء معرف جديد
                    await this.saveMember(member);
                }
            }
            
            // استيراد طلبات العضوية
            if (importData.data.applications) {
                for (const application of importData.data.applications) {
                    delete application.id;
                    await this.saveApplication(application);
                }
            }
            
            console.log('✅ تم استيراد البيانات بنجاح');
            return true;
        } catch (error) {
            console.error('❌ خطأ في استيراد البيانات:', error);
            return false;
        }
    }

    // مسح جميع البيانات
    async clearAllData() {
        try {
            await this.ensureInitialized();
            
            const storeNames = Object.values(this.stores);
            const transaction = this.db.transaction(storeNames, 'readwrite');
            
            for (const storeName of storeNames) {
                const store = transaction.objectStore(storeName);
                store.clear();
            }
            
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => {
                    console.log('✅ تم مسح جميع البيانات');
                    resolve(true);
                };
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            console.error('❌ خطأ في مسح البيانات:', error);
            return false;
        }
    }

    // استرجاع طلبات التجديد
    async getAllRenewalRequests() {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.renewalRequests], 'readonly');
            const store = transaction.objectStore(this.stores.renewalRequests);
            
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في استرجاع طلبات التجديد:', error);
            return [];
        }
    }

    // حفظ إعداد
    async saveSetting(key, value) {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.settings], 'readwrite');
            const store = transaction.objectStore(this.stores.settings);
            
            return new Promise((resolve, reject) => {
                const request = store.put({ key, value, updatedAt: new Date().toISOString() });
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في حفظ الإعداد:', error);
            return false;
        }
    }

    // استرجاع إعداد
    async getSetting(key, defaultValue = null) {
        try {
            await this.ensureInitialized();
            
            const transaction = this.db.transaction([this.stores.settings], 'readonly');
            const store = transaction.objectStore(this.stores.settings);
            
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.value : defaultValue);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ خطأ في استرجاع الإعداد:', error);
            return defaultValue;
        }
    }
}

// إنشاء مثيل عام لإدارة البيانات
window.dataManager = new PermanentDataManager();

// تصدير الكلاس للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermanentDataManager;
}

