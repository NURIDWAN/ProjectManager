<?php

namespace App\Http\Requests;

use App\Models\Bap;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
            'bap_id' => ['required', 'exists:baps,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'exists:services,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * Configure the validator instance.
     * Validate that the BAP is approved and doesn't already have an invoice.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $bapId = $this->input('bap_id');

            if (!$bapId) {
                return;
            }

            $bap = Bap::find($bapId);

            if (!$bap) {
                return;
            }

            if ($bap->status !== Bap::STATUS_APPROVED) {
                $validator->errors()->add(
                    'bap_id',
                    'BAP harus berstatus "approved" untuk membuat invoice.'
                );
                return;
            }

            // Check if BAP already has an invoice
            if ($bap->invoice()->exists()) {
                $validator->errors()->add(
                    'bap_id',
                    'BAP ini sudah memiliki invoice.'
                );
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'bap_id.required' => 'BAP wajib dipilih.',
            'bap_id.exists' => 'BAP yang dipilih tidak valid.',
            'items.required' => 'Minimal satu item invoice harus ada.',
            'items.min' => 'Minimal satu item invoice harus ada.',
            'items.*.service_id.required' => 'Jasa/produk wajib dipilih.',
            'items.*.service_id.exists' => 'Jasa/produk yang dipilih tidak valid.',
            'items.*.quantity.required' => 'Quantity wajib diisi.',
            'items.*.quantity.min' => 'Quantity harus lebih dari 0.',
            'items.*.unit_price.required' => 'Harga satuan wajib diisi.',
            'items.*.unit_price.min' => 'Harga satuan tidak boleh negatif.',
            'items.*.discount_percent.min' => 'Diskon tidak boleh negatif.',
            'items.*.discount_percent.max' => 'Diskon maksimal 100%.',
        ];
    }
}
