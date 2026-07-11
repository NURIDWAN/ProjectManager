<?php

namespace App\Http\Requests;

use App\Models\WorkReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBapRequest extends FormRequest
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
            'tanggal' => ['required', 'date'],
            'work_report_ids' => ['required', 'array', 'min:1'],
            'work_report_ids.*' => ['required', 'integer', 'exists:work_reports,id'],
        ];
    }

    /**
     * Configure the validator instance.
     * Validate that all selected work reports are "submitted" and belong to the same client.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $workReportIds = $this->input('work_report_ids', []);
            $clientId = $this->input('client_id');

            if (empty($workReportIds) || !$clientId) {
                return;
            }

            $workReports = WorkReport::whereIn('id', $workReportIds)->get();

            foreach ($workReports as $report) {
                if ($report->status !== WorkReport::STATUS_SUBMITTED) {
                    $validator->errors()->add(
                        'work_report_ids',
                        'Semua laporan kerja harus berstatus "submitted".'
                    );
                    return;
                }

                if ((int) $report->client_id !== (int) $clientId) {
                    $validator->errors()->add(
                        'work_report_ids',
                        'Semua laporan kerja harus milik klien yang sama.'
                    );
                    return;
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'Klien wajib dipilih.',
            'client_id.exists' => 'Klien yang dipilih tidak valid.',
            'tanggal.required' => 'Tanggal BAP wajib diisi.',
            'tanggal.date' => 'Format tanggal tidak valid.',
            'work_report_ids.required' => 'Minimal satu laporan kerja harus dipilih.',
            'work_report_ids.min' => 'Minimal satu laporan kerja harus dipilih.',
            'work_report_ids.*.exists' => 'Laporan kerja yang dipilih tidak valid.',
        ];
    }
}
