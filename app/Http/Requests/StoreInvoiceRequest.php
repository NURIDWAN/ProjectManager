<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
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
            'client_id' => ['required', 'exists:clients,id'],
            'due_date' => ['nullable', 'date'],
            'work_start_date' => ['nullable', 'date', 'required_with:work_end_date'],
            'work_end_date' => ['nullable', 'date', 'required_with:work_start_date', 'after_or_equal:work_start_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'terms' => ['nullable', 'string', 'max:2000'],
            'tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.source' => ['nullable', Rule::in(['master', 'manual'])],
            'items.*.service_id' => ['nullable', 'required_unless:items.*.source,manual', 'exists:services,id'],
            'items.*.description' => ['nullable', 'required_if:items.*.source,manual', 'string', 'max:255'],
            'items.*.unit' => ['nullable', 'required_if:items.*.source,manual', 'string', 'max:50'],
            'items.*.save_to_master' => ['nullable', 'boolean'],
            'items.*.manual_type' => ['nullable', 'required_if:items.*.source,manual', Rule::in([Service::TYPE_SERVICE, Service::TYPE_PRODUCT])],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'Klien wajib dipilih.',
            'client_id.exists' => 'Klien yang dipilih tidak valid.',
            'work_start_date.required_with' => 'Tanggal mulai pekerjaan wajib diisi bersama tanggal selesai.',
            'work_start_date.date' => 'Format tanggal mulai pekerjaan tidak valid.',
            'work_end_date.required_with' => 'Tanggal selesai pekerjaan wajib diisi bersama tanggal mulai.',
            'work_end_date.date' => 'Format tanggal selesai pekerjaan tidak valid.',
            'work_end_date.after_or_equal' => 'Tanggal selesai pekerjaan tidak boleh sebelum tanggal mulai.',
            'items.required' => 'Minimal satu item invoice harus ada.',
            'items.min' => 'Minimal satu item invoice harus ada.',
            'items.*.service_id.required' => 'Jasa/produk wajib dipilih.',
            'items.*.service_id.exists' => 'Jasa/produk yang dipilih tidak valid.',
            'items.*.description.required_if' => 'Nama barang manual wajib diisi.',
            'items.*.unit.required_if' => 'Satuan barang manual wajib diisi.',
            'items.*.manual_type.required_if' => 'Jenis barang manual wajib dipilih.',
            'items.*.quantity.required' => 'Quantity wajib diisi.',
            'items.*.quantity.min' => 'Quantity harus lebih dari 0.',
            'items.*.unit_price.required' => 'Harga satuan wajib diisi.',
            'items.*.unit_price.min' => 'Harga satuan tidak boleh negatif.',
            'items.*.discount_percent.min' => 'Diskon tidak boleh negatif.',
            'items.*.discount_percent.max' => 'Diskon maksimal 100%.',
        ];
    }
}
