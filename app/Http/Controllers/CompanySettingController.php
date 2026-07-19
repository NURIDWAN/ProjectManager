<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingController extends Controller
{
    /**
     * Show the company settings form.
     */
    public function edit(): Response
    {
        $settings = CompanySetting::allSettings();

        return Inertia::render('Settings/CompanySettings', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update the company settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string|max:500',
            'company_address_2' => 'nullable|string|max:500',
            'company_phone' => 'nullable|string|max:50',
            'company_email' => 'nullable|email|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:100',
            'company_logo' => 'nullable|image|mimes:jpg,jpeg,png|max:1024',
        ]);

        // Handle logo upload
        if ($request->hasFile('company_logo')) {
            // Delete old logo
            $oldLogo = CompanySetting::get('company_logo');
            if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
                Storage::disk('public')->delete($oldLogo);
            }

            $logoPath = $request->file('company_logo')->store('company', 'public');
            CompanySetting::set('company_logo', $logoPath);
        }

        // Update text settings
        $textFields = [
            'company_name',
            'company_address',
            'company_address_2',
            'company_phone',
            'company_email',
            'bank_name',
            'bank_account_name',
            'bank_account_number',
        ];

        foreach ($textFields as $field) {
            if (array_key_exists($field, $validated)) {
                CompanySetting::set($field, $validated[$field]);
            }
        }

        CompanySetting::clearCache();

        return redirect()->back()->with('success', 'Pengaturan perusahaan berhasil diperbarui.');
    }

    /**
     * Remove the company logo.
     */
    public function removeLogo(): RedirectResponse
    {
        $logo = CompanySetting::get('company_logo');

        if ($logo && Storage::disk('public')->exists($logo)) {
            Storage::disk('public')->delete($logo);
        }

        CompanySetting::set('company_logo', '');
        CompanySetting::clearCache();

        return redirect()->back()->with('success', 'Logo berhasil dihapus.');
    }
}
