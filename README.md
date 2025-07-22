
                                                                                        🌟 نظرة عامة
                                                     Node.js وExpress هذا المشروع هو تطبيق مدعوم بـ .
                                                                    MongoDB    يستخدم قاعدة البيانات .
                                                                                 لإدارة نظام مالي بسيط.
                                                         يتيح المشروع للمستخدمين إجراء تحويلات مالية
  ،                                                            تسجيل الحسابات، وتتبع الأنشطة المالية،
                             مع توفير إمكانيات إدارية للمشرفين (مثل إلغاء التحويلات وعرض التقارير).
                                                                         المشروع مصمم لتكون مرنًا وسهل 
   (Sessions).  مع التركيز على الأمان عبر الجلسات                                            
                                                                                         الميزات
                                                               التسجيل وتسجيل دخول المستخدمين.
                                                        إجراء التحويلات المالية بين المستخدمين.
                                                                عرض سجل التحويلات وتقارير مالية.
                                                 إدارة الحسابات (تفعيل/تعطيل) بواسطة المشرفين.
                                                                إلغاء التحويلات من قبل المشرفين.
                                                                  تحديث كلمة المرور للمستخدمين
                                                                                  .
                                                                       : هيكلة المشروع 

  ├── config/              # إعدادات التطبيق
  │   └── db.js            # تهيئة الاتصال بقاعدة البيانات
  ├── models/              # تعريفات النماذج (Schemas)
  │   ├── User.js          # نموذج المستخدمين
  │   └── Transaction.js   # نموذج التحويلات
  ├── routes/              # تعريف المسارات 
  │   ├── auth.js          # مسارات التوثيق (تسجيل، تسجيل دخول)
  │   └── transactions.js  # مسارات التحويلات والإدارة
  ├── server.js            # ملف التشغيل الرئيسي
  ├── .env                 # متغيرات البيئة (مثل MONGODB_URI)
  ├── package.json         # اعتماديات  المشروع وأوامر التشغيل
  └── README.md            # وثيقة المشروع 
                                                 
                                            
                                                                                      :كيفية التشغيل     
                                                                               npm install  قم بتثبيت

                                                                              أنشئ ملف .env في الجذر:
MONGODB_URI=mongodb://localhost:27017/madad
SESSION_SECRET=MySecretKey123
PORT=3000
                                                                                          شغّل الخادم

  npm start or node server.js

                                                                                   :  كيفية الاستخدام
                                                                                                         
                                                                   انشاء مستخدمين جدد
                       
[post](http://localhost:3000/api/auth/register)

{
  "username": "taleb",
  "password": "taleb123",
  "email": "taleb@example.com",
  "role": "user",
  "balance": 10000
}

admin

{
  "username": "Hussam",
  "password": "Hussam123",
  "email": "Hussam@example.com",
  "role": "admin",
  "balance": 20000
}
                                                                       تسجيل الدخول
[post](http://localhost:3000/api/auth/login)

{
  "username": "taleb",
  "password": "taleb123"
}

admin

{
  "username": "Hussam",
  "password": "Hussam123"
}
                                                                 تحويلات بين المستخدمين   
[post](http://localhost:3000/api/transactions/)


{
  "toUsername": "taleb",
  "amount": 50
}
                                                                       عرض سجل التحويلات  

[GET](http://localhost:3000/api/transactions/history)
            
                                                                       تحديث كلمة المرور 

[Put](http://localhost:3000/api/auth/update-password)

{
  "username": "Hussam",
  "currentPassword": "Hussam123",
  "newPassword": "Hussam456",
  "email": "Hussam@example.com"
}

                                                                        تفعيل/تعطيل حساب            
[put](http://localhost:3000/api/auth/toggle-account/معرف المستخدم id)

                                                                      
                                                                       عرض التقرير المالي     
[GET](http://localhost:3000/api/transactions/report)


                                                                     قائمة بجميع التحويلات  

[GET](http://localhost:3000/api/transactions/admin/all)


                                                                   قائمة بجميع المستخدمين  


[GET](http://localhost:3000/api/transactions/admin/users)


                                                             
                                                              حذف التحويلات واسترجاع المبالغ 

[PUT](http://localhost:3000/api/transactions/admin/cancel-transaction/معرف المستخدم الذي تريد استرجاع 
المبلغ منه )




                                                                              شكر وتقدير  للاستاذ حسام ولكافة اعضاء مؤسسسة مداد 
                                                                                                
                                           