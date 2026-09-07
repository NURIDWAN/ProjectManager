import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { PageHeader } from '@/Components/PageHeader';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader title="Profil" description="Kelola identitas akun, password, dan keamanan akses Anda." />
            }
        >
            <Head title="Profil" />

            <div className="mx-auto max-w-3xl space-y-6">
                    <div className="rounded-xl border bg-card p-5 shadow-xs sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="rounded-xl border bg-card p-5 shadow-xs sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="rounded-xl border border-destructive/20 bg-card p-5 shadow-xs sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
            </div>
        </AuthenticatedLayout>
    );
}
