<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    /**
     * Display a listing of clients with search functionality.
     */
    public function index(Request $request): Response
    {
        $query = Client::query();

        // Search by name or NPWP
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('npwp', 'like', "%{$search}%");
            });
        }

        // Filter by active status if specified
        if ($request->has('is_active') && $request->input('is_active') !== '') {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $clients = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => [
                'search' => $request->input('search', ''),
                'is_active' => $request->input('is_active', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new client.
     */
    public function create(): Response
    {
        return Inertia::render('Clients/Create');
    }

    /**
     * Store a newly created client in storage.
     */
    public function store(StoreClientRequest $request): RedirectResponse
    {
        Client::create($request->validated());

        return Redirect::route('clients.index')
            ->with('success', 'Klien berhasil ditambahkan.');
    }

    /**
     * Show the form for editing the specified client.
     */
    public function edit(Client $client): Response
    {
        return Inertia::render('Clients/Edit', [
            'client' => $client,
        ]);
    }

    /**
     * Update the specified client in storage.
     */
    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        return Redirect::route('clients.index')
            ->with('success', 'Klien berhasil diperbarui.');
    }

    /**
     * Remove the specified client from storage (soft-delete).
     * Returns warning info if client has related work reports.
     */
    public function destroy(Request $request, Client $client): RedirectResponse
    {
        // Check if client has related work reports
        $hasRelations = $client->workReports()->exists();

        if ($hasRelations && !$request->boolean('confirmed')) {
            return Redirect::back()
                ->with('warning', 'Klien ini memiliki Laporan Kerja terkait. Konfirmasi penghapusan diperlukan.')
                ->with('confirm_delete', $client->id);
        }

        // Perform soft-delete
        $client->delete();

        return Redirect::route('clients.index')
            ->with('success', 'Klien berhasil dihapus.');
    }
}
