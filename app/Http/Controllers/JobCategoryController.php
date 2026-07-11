<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJobCategoryRequest;
use App\Models\JobCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobCategoryController extends Controller
{
    /**
     * Display a listing of job categories.
     */
    public function index(Request $request): Response
    {
        $query = JobCategory::query();

        // Search by name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->input('search') . '%');
        }

        $categories = $query->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('JobCategories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new job category.
     */
    public function create(): Response
    {
        return Inertia::render('JobCategories/Create');
    }

    /**
     * Store a newly created job category.
     */
    public function store(StoreJobCategoryRequest $request)
    {
        JobCategory::create($request->validated());

        return redirect()->route('job-categories.index')
            ->with('success', 'Kategori pekerjaan berhasil ditambahkan.');
    }

    /**
     * Display the specified job category.
     */
    public function show(JobCategory $jobCategory): Response
    {
        return Inertia::render('JobCategories/Show', [
            'category' => $jobCategory,
        ]);
    }

    /**
     * Show the form for editing the specified job category.
     */
    public function edit(JobCategory $jobCategory): Response
    {
        return Inertia::render('JobCategories/Edit', [
            'category' => $jobCategory,
        ]);
    }

    /**
     * Update the specified job category.
     */
    public function update(StoreJobCategoryRequest $request, JobCategory $jobCategory)
    {
        $jobCategory->update($request->validated());

        return redirect()->route('job-categories.index')
            ->with('success', 'Kategori pekerjaan berhasil diperbarui.');
    }

    /**
     * Remove the specified job category.
     */
    public function destroy(JobCategory $jobCategory)
    {
        // Protect deletion if category is still used in work_reports
        if ($jobCategory->workReports()->exists()) {
            return redirect()->route('job-categories.index')
                ->with('error', 'Kategori tidak dapat dihapus karena masih digunakan di laporan kerja.');
        }

        $jobCategory->delete();

        return redirect()->route('job-categories.index')
            ->with('success', 'Kategori pekerjaan berhasil dihapus.');
    }
}
