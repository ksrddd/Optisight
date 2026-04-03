# 🛡️ คู่มือการใช้งาน OptiSight Prototype
ยินดีต้อนรับสู่โปรเจกต์ **OptiSight – Intelligent Centralized Monitoring Dashboard**

ไฟล์นี้สรุปรายละเอียดทั้งหมดเกี่ยวกับหน้าจอและฟีเจอร์ต่างๆ ของแพลตฟอร์ม Software-as-a-Service (SaaS) ตัวนี้ ที่ทำหน้าที่เป็นศูนย์กลางรวบรวม วิเคราะห์ และแสดงผลจากระบบ IT ต่างๆ ในองค์กรขนาดใหญ่ (ธนาคาร, FinTech) เพื่อแก้ปัญหาเรื่อง Data Silos ที่ทำให้เกิดความล่าช้าในการตัดสินใจ

OptiSight เป็น **“เครื่องมือสนับสนุน (Support Tool)”** ที่ช่วยให้ IT Ops, SOC, และ Infra Team ทำงานได้แม่นยำและเร็วขึ้น

---

## 🏗️ ฟังก์ชันและหน้าใช้งานหลัก (Core Modules)

### 1. 📊 หน้า Dashboard (Main - IT Ops & Management)
*   **เป้าหมาย**: เพื่อแสดงภาพรวมของระบบทั้งหมดแบบ real-time ให้ทีม **IT Operations** เห็นภาพตรงกัน
*   **ฟีเจอร์สำคัญ**:
    *   **Live Metrics Ticker**: แถบตัวเลขไหลบนสุด แสดงธุรกรรม (Transactions) และ Data Flow ในระบบแบงก์กิ้ง/FinTech
    *   **Network & Performance Grid**: ควบรวมสถิติจากหลากแผนก (Uptime, Alerts, Logs) ไว้ในหน้าเดียว (Centralized Visibility)
    *   **Revenue & Traffic Flow**: กราฟเส้นแสดงพัฒนาการของการใช้งานระบบ IT และ Business Flow อย่างชัดเจน
    *   **AI Predictive Analysis (Proactive Mode)**: การวิเคราะห์เชิงคาดการณ์โดย AI ที่ประเมินโอกาสเกิดปัญหาส่วงหน้า (เช่น Storage ใกล้เต็ม หรือ API ทะลุ Limit) ช่วยเปลี่ยนกระบวนการทำงานแบบ Reactive ให้เป็น Proactive

### 2. 🔌 หน้า Data Sources & Integrations (Integration-ready)
*   **เป้าหมาย**: ศูนย์รวมการตั้งค่าดึงข้อมูลจากแพลตฟอร์มอื่น สื่อถึงความเป็น "One Unified Platform"
*   **ฟีเจอร์สำคัญ**:
    *   **API Connectors Grid**: แสดงไอคอนและสถานะแบบรวบยอดว่ามีการเชื่อมต่อข้อมูลจาก Cloud (AWS, Azure), Legacy Database (Oracle), หรือ Security Tools (Splunk, Firewalls) อยู่กี่ระบบพร้อมกัน
    *   **Ingestion Status**: โชว์สถานะ Connected / Syncing ให้วิศวกรตรวจสอบ Data Pipeline ได้ทันที

### 3. 🚨 หน้า Alerts (Smart Alerts)
*   **เป้าหมาย**: ค้นหาและลดผลกระทบเมื่อเกิดความผิดปกติด้วยระบบแจ้งเตือนอัจฉริยะแบบแยกแผนก
*   **ฟีเจอร์สำคัญ**:
    *   **Cross-team Anomalies**: แจ้งเตือนสาเหตุของปัญหาให้ถูกทีมทันที ไม่ว่าจะเป็นเรื่องของ Hacking ส่งไปให้ SOC หรือ Latency Spike ส่งให้ IT Ops 
    *   **Authorize Diagnostics**: สามารถสั่ง Run Diagnostics เพื่อช่วยวิเคราะห์หา Root Cause ได้ทันที

### 4. 🛡️ หน้า Security (SOC Team)
*   **เป้าหมาย**: ศูนย์เฝ้าระวังป้องกัน Hacking และ Risk Analysis เฉพาะทางสำหรับแผนก Security
*   **ฟีเจอร์สำคัญ**:
    *   **Live Threat Intelligence Feed**: ตารางดูข้อมูล IP ผู้ไม่หวังดีและการเชื่อมต่อแบบ Real-time
    *   **Anomaly Block Counter**: นับจำนวนการโจมตีหรือตรวจสอบสิทธิ์ที่พยายามเข้ามาและถูกสกัดกั้น

### 5. 📜 หน้า System Logs (Data / Infrastructure Team)
*   **เป้าหมาย**: ตรวจสอบและบันทึกข้อมูลย้อนหลัง และดู Data Flow แบบเจาะลึก
*   **ฟีเจอร์สำคัญ**:
    *   **Real-time Centralized Logging**: ศูนย์รวม log จากเซิร์ฟเวอร์ย่อยทุกตัวมารวมในที่เดียว (Console View) ช่วยวิเคราะห์และแก้ไขบั๊กเชิงลึก

### 6. 🔐 หน้า Access Control (Role-based Access Control)
*   **เป้าหมาย**: บริหารจัดการทีมงานองค์กรขนาดใหญ่ และกำหนดสิทธิ์การดูข้อมูล (RBAC)
*   **ฟีเจอร์สำคัญ**:
    *   **User Directory**: รวมรายชื่อพนักงานทั้งหมด หน้าที่รับผิดชอบ (Global Admin, SOC Analyst, IT Ops) และสิทธิ์การใช้แพลตฟอร์ม
    *   **Permission Management**: ควบคุมได้ว่าพนักงานคนไหนเข้าถึงเมนูส่วนใดได้บ้าง ทำให้รักษาความลับของหน่วยงานได้อย่างสมบูรณ์

### 7. 📄 หน้า Export Reports (Reporting)
*   **เป้าหมาย**: ระบบสร้างรายงานอัตโนมัติเพื่อวิเคราะห์ผลย้อนหลัง
*   **ฟีเจอร์สำคัญ**:
    *   สร้างสรุปผลทั้งในมุม Network Performance ประจำสัปดาห์ หรือ Threat Assessment เสนอระดับบริหาร

### 8. 💎 หน้า Subscription & Billing (SaaS Monetization)
*   **เป้าหมาย**: จัดการแผนการใช้งานและการชำระเงินสำหรับลูกค้าองค์กร
*   **ฟีเจอร์สำคัญ**:
    *   **Tiered Pricing**: แผนการใช้งาน 3 ระดับ (Starter, Pro, Enterprise) พร้อมรายละเอียดฟีเจอร์ที่แตกต่างกัน
    *   **Payment Gateway Interface**: หน้าสำหรับจัดการการชำระเงินเพื่อรองรับการขยายตัวของธุรกิจ

### 9. ⚙️ หน้า Settings & Profile
*   **เป้าหมาย**: ตั้งค่าส่วนตัวของผู้ใช้งานและระบบเบื้องต้น
*   **ฟีเจอร์สำคัญ**:
    *   การจัดการข้อมูลส่วนตัว (Profile Management) และความปลอดภัยของบัญชี

---

## 🚀 เทคโนโลยีและสถาปัตยกรรม (Tech Stack)
*   **Frontend**: Nuxt 4 (Nuxt Core), Vue 3 (Composition API), Tailwind CSS (Custom Dark Premium Theme)
*   **Backend**: Node.js with Express v5, TypeScript
*   **Database & ORM**: Prisma ORM with SQLite (Local development)
*   **Real-time Communication**: Socket.io (Server & Client)
*   **Security**: JWT Authentication, Bcryptjs, Helmet, Rate Limiting
*   **Icons**: Lucide Vue Next
*   **SaaS Prototype Status**: พร้อมสำหรับการทำ Pilot Project และการขยายผลสู่ระบบ Production จริง
