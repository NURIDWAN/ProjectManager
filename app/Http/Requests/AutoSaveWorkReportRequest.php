<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AutoSaveWorkReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Autosave: everything is nullable so a partial form can always be saved.
     * Photo files are NOT accepted here - photos are uploaded immediately
     * via the dedicated draft photo endpoints.
     */
    public function rules(): array
    {
        return [
            'id' => ['nullable', 'integer', 'exists:work_reports,id'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'category_id' => ['nullable', 'exists:job_categories,id'],
            'description' => ['nullable', 'string'],
            'area' => ['nullable', 'string', 'max:255'],
            'preset_data' => ['nullable'],
            // Map of photo_id => caption for existing draft photos
            'photo_captions' => ['nullable', 'array'],
            'photo_captions.*' => ['nullable', 'string', 'max:255'],
            // Map of photo_id => new unit index, used to re-associate AC unit photos
            // after entries are added/removed (missing ids = photo was removed)
            'ac_photo_remap' => ['nullable', 'array'],
            'ac_photo_remap.*' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'existing_before_photos' => ['nullable', 'array'],
            'existing_after_photos' => ['nullable', 'array'],
            'existing_before_photos.*' => ['integer'],
            'existing_after_photos.*' => ['integer'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'client_id.exists' => 'Klien yang dipilih tidak valid.',
            'category_id.exists' => 'Kategori pekerjaan yang dipilih tidak valid.',
            'id.exists' => 'Draft laporan tidak ditemukan.',
        ];
    }
}
