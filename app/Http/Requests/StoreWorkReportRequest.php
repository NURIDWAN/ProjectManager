<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkReportRequest extends FormRequest
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
     * Draft: minimal validation - save anything.
     * Submit: requires client_id, category_id, description, and at least 1 after photo.
     */
    public function rules(): array
    {
        $rules = [
            'client_id' => ['nullable', 'exists:clients,id'],
            'category_id' => ['nullable', 'exists:job_categories,id'],
            'description' => ['nullable', 'string'],
            'area' => ['nullable', 'string', 'max:255'],
            'preset_data' => ['nullable'],
            'before_photos' => ['nullable', 'array'],
            'before_photos.*' => ['file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'after_photos' => ['nullable', 'array'],
            'after_photos.*' => ['file', 'mimes:jpg,jpeg,png', 'max:2048'],
            'before_captions' => ['nullable', 'array'],
            'before_captions.*' => ['nullable', 'string', 'max:255'],
            'after_captions' => ['nullable', 'array'],
            'after_captions.*' => ['nullable', 'string', 'max:255'],
            'existing_before_photos' => ['nullable', 'array'],
            'existing_before_photos.*' => ['string'],
            'existing_after_photos' => ['nullable', 'array'],
            'existing_after_photos.*' => ['string'],
        ];

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'Klien wajib dipilih.',
            'client_id.exists' => 'Klien yang dipilih tidak valid.',
            'category_id.required' => 'Kategori pekerjaan wajib dipilih.',
            'category_id.exists' => 'Kategori pekerjaan yang dipilih tidak valid.',
            'description.required' => 'Deskripsi aktivitas wajib diisi.',
            'before_photos.*.mimes' => 'Format foto harus JPG, JPEG, atau PNG.',
            'before_photos.*.max' => 'Ukuran file maksimal 2MB.',
            'after_photos.*.mimes' => 'Format foto harus JPG, JPEG, atau PNG.',
            'after_photos.*.max' => 'Ukuran file maksimal 2MB.',
        ];
    }
}
