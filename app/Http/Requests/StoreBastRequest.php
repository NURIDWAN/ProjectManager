<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBastRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'bap_id' => ['required', 'exists:baps,id'],
            'tanggal' => ['required', 'date'],
            'work_items' => ['required', 'array', 'min:1'],
            'work_items.*.uraian_pekerjaan' => ['required', 'string', 'max:255'],
            'work_items.*.satuan' => ['required', 'string', 'max:50'],
            'work_items.*.jumlah' => ['required', 'integer', 'min:1'],
            'work_items.*.keterangan' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        // No additional validation needed
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'bap_id.required' => 'BAP wajib dipilih.',
            'bap_id.exists' => 'BAP yang dipilih tidak valid.',
            'tanggal.required' => 'Tanggal BAST wajib diisi.',
            'tanggal.date' => 'Format tanggal tidak valid.',
            'work_items.required' => 'Uraian pekerjaan wajib diisi minimal 1 item.',
            'work_items.min' => 'Uraian pekerjaan wajib diisi minimal 1 item.',
            'work_items.*.uraian_pekerjaan.required' => 'Nama pekerjaan wajib diisi.',
            'work_items.*.satuan.required' => 'Satuan wajib diisi.',
            'work_items.*.jumlah.required' => 'Jumlah wajib diisi.',
            'work_items.*.jumlah.min' => 'Jumlah minimal 1.',
        ];
    }
}
