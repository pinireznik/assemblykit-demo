<?php

namespace App\Http\Controllers;

use App\Models\Company;

class CompanyController extends Controller
{
    public function index()
    {
        $companies = Company::withCount('employees')
            ->orderBy('name')
            ->get();

        return view('companies.index', compact('companies'));
    }

    public function show(Company $company)
    {
        $company->load('employees');

        return view('companies.show', compact('company'));
    }
}
