@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<h1>Dashboard</h1>

<div class="cards-grid">
    <x-dashboard-card label="Total Companies" :value="$totalCompanies" sub="All time" />
    <x-dashboard-card label="Total Employees" :value="$totalEmployees" sub="Across all companies" />
</div>

<h2>Recently Updated Companies</h2>
<table>
    <thead>
        <tr>
            <th>Company</th>
            <th>Employees</th>
            <th>Last Updated</th>
        </tr>
    </thead>
    <tbody>
        @foreach($recentCompanies as $company)
        <tr>
            <td><a href="{{ route('companies.show', $company) }}" class="row-link">{{ $company->name }}</a></td>
            <td><span class="badge">{{ $company->employees_count }}</span></td>
            <td>{{ $company->updated_at->diffForHumans() }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endsection
