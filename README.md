
## 🔄 User Flow Platform SkillLoom

Visualisasi alur kerja utama platform SkillLoom yang menghubungkan **UMKM (Pemberi Proyek)**, **Admin/Guru (Verifikator)**, dan **Siswa (Pengerja Proyek)**.

```mermaid
flowchart TD
    %% Roles & Step 1: UMKM Post Proyek
    subgraph Step1["1. Posting Proyek"]
        A[UMKM] -->|POST /projects| B(Proyek Dibuat\nstatus: OPEN, adminApproved: false)
    end

    %% Step 2: Admin Approval
    subgraph Step2["2. Verifikasi Admin"]
        B -->|PATCH /projects/:id/approve| C(Proyek Disetujui\nadminApproved: true)
        Admin[Admin / Guru] -->|Moderasi| C
    end

    %% Step 3: Siswa Melamar
    subgraph Step3["3. Melamar Proyek"]
        Siswa[Siswa] -->|POST /applications| D(Lamaran Masuk\nstatus: PENDING)
        C -.->|Tampil di Katalog| Siswa
    end

    %% Step 4: Selection & Escrow
    subgraph Step4["4. Seleksi & Escrow"]
        D -->|PATCH /applications/:id/status| E(Lamaran Diterima\nstatus: ACCEPTED)
        A -->|POST /transactions| F(Setor Dana Escrow\nstatus: ESCROW_HELD)
        E --> F
    end

    %% Step 5: Pengerjaan & Release
    subgraph Step5["5. Eksekusi & Pencairan"]
        F -->|Proyek IN_PROGRESS| G(Siswa Mengerjakan Proyek)
        G -->|Tugas Selesai| H[UMKM Konfirmasi]
        H -->|PATCH /transactions/:id/release| I(Dana Dicairkan ke Siswa\nstatus: RELEASED & COMPLETED)
    end

    %% Step 6: Showcase
    subgraph Step6["6. Showcase Karya"]
        I -->|POST /showcases| J(Portofolio Terpublikasi)
    end

    %% Styling
    style Step1 fill:#f9f9f9,stroke:#333,stroke-width:1px
    style Step2 fill:#f9f9f9,stroke:#333,stroke-width:1px
    style Step3 fill:#f9f9f9,stroke:#333,stroke-width:1px
    style Step4 fill:#f9f9f9,stroke:#333,stroke-width:1px
    style Step5 fill:#f9f9f9,stroke:#333,stroke-width:1px
    style Step6 fill:#f9f9f9,stroke:#333,stroke-width:1px