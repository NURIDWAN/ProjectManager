export interface Permission {
    id: number;
    name: string;
}

export interface Role {
    id: number;
    name: string;
    permissions_count?: number;
    permissions?: Permission[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'admin' | 'technician';
    roles?: Role[];
}

export interface Bast {
    id: number;
    bap_id: number;
    document_number: string;
    tanggal: string;
    client_id: number;
    work_items: WorkItem[];
    pihak_pertama_1_nama: string;
    pihak_pertama_1_jabatan: string;
    pihak_pertama_2_nama: string;
    pihak_pertama_2_jabatan: string;
    pihak_kedua_1_nama: string;
    pihak_kedua_1_jabatan: string;
    pihak_kedua_2_nama: string;
    pihak_kedua_2_jabatan: string;
    created_at: string;
    updated_at: string;
    client?: {
        id: number;
        name: string;
        address?: string;
        pic_name?: string | null;
        pic_phone?: string | null;
    };
    bap?: {
        id: number;
        nomor_surat: string;
        client_id: number;
        tanggal: string;
        status: 'draft' | 'approved';
        work_report_ids: number[];
        signed_by: string | null;
    };
}

export interface WorkItem {
    no: number;
    uraian_pekerjaan: string;
    satuan: string;
    jumlah: number;
    keterangan: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
