<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Employee;
use App\Services\StaleCompanyFilter;

class DashboardController extends Controller
{
    public function index()
    {
        $totalCompanies = Company::count();
        $totalEmployees = Employee::count();

        $recentCompanies = Company::withCount('employees')
            ->orderBy('updated_at', 'desc')
            ->take(5)
            ->get();

        $needsAttention = (new StaleCompanyFilter)->filter(
            Company::withCount('employees')->get()
        );

        return view('dashboard', compact(
            'totalCompanies',
            'totalEmployees',
            'recentCompanies',
            'needsAttention',
        ));
    }
}
