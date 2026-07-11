<?php

namespace App\Http\Requests;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $serviceId = $this->route('service');

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('services', 'code')->ignore($serviceId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:50'],
            'price' => ['required', 'numeric', 'gt:0'],
            'type' => ['required', Rule::in([Service::TYPE_SERVICE, Service::TYPE_PRODUCT])],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Kode jasa/produk wajib diisi.',
            'code.unique' => 'Kode jasa/produk sudah digunakan.',
            'name.required' => 'Nama jasa/produk wajib diisi.',
            'unit.required' => 'Satuan wajib diisi.',
            'price.required' => 'Harga satuan wajib diisi.',
            'price.numeric' => 'Harga satuan harus berupa angka.',
            'price.gt' => 'Harga satuan harus lebih besar dari 0.',
            'type.required' => 'Tipe wajib dipilih.',
            'type.in' => 'Tipe harus service atau product.',
        ];
    }
}
